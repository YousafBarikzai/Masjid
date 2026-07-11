import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
  Keyboard,
  Pressable,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMosques, geocode } from "../src/api";
import type { GeocodeResult, Mosque } from "../src/types";
import { Press, Reveal, tap } from "../src/ui";
import { openSheet } from "../src/actions";
import { colors, radius, space, type as t } from "../src/theme";

/* Nearby Mosques — a full-screen interactive map. Pins come from
   OpenStreetMap (community-maintained, UK-wide and beyond) via our own
   cached proxy; they refresh automatically as the map is panned or zoomed.
   Search any UK town to jump there; filter chips narrow the pins to mosques
   whose OSM record confirms the facility. Tapping a pin opens a detail card
   with distance, directions, phone and website. */

const KINGSTON: Region = { latitude: 51.4123, longitude: -0.3007, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const MAX_PINS = 350;

/* ------------------------------- Filters ---------------------------------- */

const FILTERS = [
  { key: "open", label: "Open now" },
  { key: "women", label: "Women's facilities" },
  { key: "parking", label: "Parking" },
  { key: "wheelchair", label: "Wheelchair" },
  { key: "friday", label: "Friday prayers" },
  { key: "classes", label: "Classes" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Best-effort opening_hours check for the common OSM patterns
 *  ("24/7", "Mo-Su 05:00-22:00", "Fr 12:00-14:00; Sa-Su 09:00-18:00"). */
function isOpenNow(oh: string): boolean {
  const s = (oh || "").trim();
  if (!s) return false;
  if (s === "24/7") return true;
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, matching DAYS
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const rule of s.split(";")) {
    const r = rule.trim();
    if (!r || /\boff\b/i.test(r)) continue;
    const dayPart = r.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?,?\s*)+)/);
    let applies = true;
    if (dayPart) {
      applies = false;
      for (const tok of dayPart[1].split(",")) {
        const m = tok.trim().match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?$/);
        if (!m) continue;
        const a = DAYS.indexOf(m[1]);
        const b = DAYS.indexOf(m[2] || m[1]);
        if (a <= b ? today >= a && today <= b : today >= a || today <= b) {
          applies = true;
          break;
        }
      }
    }
    if (!applies) continue;
    for (const tm of r.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)) {
      const from = +tm[1] * 60 + +tm[2];
      const to = +tm[3] * 60 + +tm[4];
      if (to >= from ? mins >= from && mins <= to : mins >= from || mins <= to) return true;
    }
  }
  return false;
}

/** Does this mosque's OSM record confirm the filtered facility? */
function matches(m: Mosque, f: FilterKey): boolean {
  const tg = m.tags || {};
  switch (f) {
    case "open":
      return isOpenNow(m.openingHours);
    case "wheelchair":
      return m.wheelchair;
    case "women":
      return tg.female === "yes" || tg.women === "yes" || /women|female|sister|ladies/i.test(tg.description || "");
    case "parking":
      return (!!tg.parking && tg.parking !== "no") || /parking/i.test(tg.description || "");
    case "friday": {
      const st = `${tg.service_times || ""} ${tg["prayer_times"] || ""} ${tg.description || ""}`;
      return /\bfr\b|friday|jum/i.test(st);
    }
    case "classes":
      return (
        tg.madrasa === "yes" ||
        /madras|school|class|education|quran|qur'an/i.test(`${m.name} ${tg.description || ""}`)
      );
  }
}

/* ------------------------------- Geometry ---------------------------------- */

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtDistance(meters: number): string {
  const mi = meters / 1609.34;
  return mi < 0.1 ? `${Math.round(meters)} m` : `${mi.toFixed(1)} mi`;
}

function openDirections(m: Mosque) {
  tap();
  const label = encodeURIComponent(m.name);
  const url =
    Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${m.lat},${m.lng}&q=${label}`
      : `geo:${m.lat},${m.lng}?q=${m.lat},${m.lng}(${label})`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://maps.google.com/?daddr=${m.lat},${m.lng}`).catch(() => {}),
  );
}

/* -------------------------------- Marker ----------------------------------- */

/* A custom-view marker MUST keep tracksViewChanges on until its content (the
   emoji pin) has actually laid out — otherwise react-native-maps snapshots an
   empty view and the pin never appears on iOS. So we render with tracking on,
   then switch it off a beat later for smooth panning, and briefly turn it back
   on whenever the selected state changes the pin's look. */
function MosqueMarker({ mosque, selected, onPress }: { mosque: Mosque; selected: boolean; onPress: () => void }) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const timer = setTimeout(() => setTracks(false), 700);
    return () => clearTimeout(timer);
  }, [selected]);
  return (
    <Marker
      coordinate={{ latitude: mosque.lat, longitude: mosque.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracks}
      onPress={onPress}
    >
      <View style={[s.pin, selected && s.pinSel]}>
        <Text style={s.pinIcon}>🕌</Text>
      </View>
    </Marker>
  );
}

/* -------------------------------- Screen ----------------------------------- */

export default function Mosques() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selected, setSelected] = useState<Mosque | null>(null);
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  const seen = useRef(new Map<string, Mosque>());
  const regionRef = useRef<Region>(KINGSTON);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Fetch pins for a region, merging with what we've already seen so pins
     don't vanish while panning. Prune the farthest when the set grows big. */
  const load = useCallback(async (region: Region) => {
    setLoading(true);
    try {
      const radius = Math.min(30000, Math.max(1500, (region.latitudeDelta * 111320) / 2));
      const found = await fetchMosques(region.latitude, region.longitude, radius);
      for (const m of found) seen.current.set(m.id, m);
      if (seen.current.size > MAX_PINS) {
        const sorted = [...seen.current.values()].sort(
          (a, b) =>
            haversine(region.latitude, region.longitude, a.lat, a.lng) -
            haversine(region.latitude, region.longitude, b.lat, b.lng),
        );
        seen.current = new Map(sorted.slice(0, MAX_PINS).map((m) => [m.id, m]));
      }
      setMosques([...seen.current.values()]);
    } catch {
      /* offline / rate-limited — keep whatever pins we already have */
    } finally {
      setLoading(false);
    }
  }, []);

  // First load: Kingston immediately, then jump to the user if they allow it.
  useEffect(() => {
    load(KINGSTON);
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const here = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setUserLoc(here);
        mapRef.current?.animateToRegion(
          { latitude: here.lat, longitude: here.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 },
          650,
        );
      } catch {
        /* stay on Kingston */
      }
    })();
  }, [load]);

  function onRegionChange(region: Region) {
    regionRef.current = region;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(region), 550);
  }

  async function submitSearch() {
    const query = q.trim();
    if (query.length < 2) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      setResults(await geocode(query));
    } finally {
      setSearching(false);
    }
  }

  function goToResult(r: GeocodeResult) {
    tap();
    setResults([]);
    setQ(r.name.split(",")[0]);
    mapRef.current?.animateToRegion(
      { latitude: r.lat, longitude: r.lng, latitudeDelta: 0.08, longitudeDelta: 0.08 },
      650,
    );
  }

  async function locateMe() {
    tap();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const here = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setUserLoc(here);
      mapRef.current?.animateToRegion(
        { latitude: here.lat, longitude: here.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        600,
      );
    } catch {
      /* nothing to do */
    }
  }

  function toggleFilter(f: FilterKey) {
    tap();
    setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  const visible = useMemo(
    () => (filters.length ? mosques.filter((m) => filters.every((f) => matches(m, f))) : mosques),
    [mosques, filters],
  );

  const origin = userLoc ?? { lat: KINGSTON.latitude, lng: KINGSTON.longitude };
  const selectedDist = selected ? haversine(origin.lat, origin.lng, selected.lat, selected.lng) : 0;
  const selectedOpen = selected?.openingHours ? isOpenNow(selected.openingHours) : null;

  return (
    <View style={s.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={KINGSTON}
        onRegionChangeComplete={onRegionChange}
        onPress={() => {
          setSelected(null);
          setResults([]);
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        userInterfaceStyle="dark"
      >
        {visible.map((m) => (
          <MosqueMarker
            key={m.id}
            mosque={m}
            selected={selected?.id === m.id}
            onPress={() => {
              tap();
              setSelected(m);
            }}
          />
        ))}
      </MapView>

      {/* ---- Floating header: back, search, filters ---- */}
      <View style={[s.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={s.topRow}>
          <Press style={s.backChip} scaleTo={0.9} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.goldSoft} />
          </Press>
          <View style={s.search}>
            <Ionicons name="search" size={16} color={colors.textFaint} />
            <TextInput
              style={s.searchInput}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={submitSearch}
              placeholder="Search any UK town or city…"
              placeholderTextColor={colors.textFaint}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searching ? (
              <ActivityIndicator size="small" color={colors.gold} />
            ) : q ? (
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setQ("");
                  setResults([]);
                }}
              >
                <Ionicons name="close-circle" size={16} color={colors.textFaint} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {results.length ? (
          <Reveal style={s.results}>
            {results.map((r, i) => (
              <Press key={`${r.lat}-${r.lng}`} scaleTo={0.98} onPress={() => goToResult(r)}>
                <View style={[s.resultRow, i < results.length - 1 && s.resultDivider]}>
                  <Ionicons name="location-outline" size={15} color={colors.goldSoft} />
                  <Text style={s.resultText} numberOfLines={1}>
                    {r.name}
                  </Text>
                </View>
              </Press>
            ))}
          </Reveal>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.chips}
          contentContainerStyle={s.chipsContent}
        >
          {FILTERS.map((f) => {
            const on = filters.includes(f.key);
            return (
              <Press key={f.key} scaleTo={0.93} onPress={() => toggleFilter(f.key)}>
                <View style={[s.chip, on && s.chipOn]}>
                  <Text style={[s.chipText, on && s.chipTextOn]}>{f.label}</Text>
                </View>
              </Press>
            );
          })}
        </ScrollView>
        {filters.length ? (
          <Text style={s.filterNote}>Showing mosques whose OpenStreetMap record confirms this</Text>
        ) : null}
      </View>

      {/* ---- Locate-me button ---- */}
      <Press style={[s.fab, { bottom: (selected ? 236 : 96) + insets.bottom }]} scaleTo={0.9} onPress={locateMe}>
        <Ionicons name="navigate" size={20} color={colors.onGold} />
      </Press>

      {/* ---- Bottom: count pill or selected-mosque card ---- */}
      {selected ? (
        <Reveal style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHead}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.sheetName} numberOfLines={2}>
                {selected.name}
              </Text>
              <Text style={s.sheetSub} numberOfLines={2}>
                {fmtDistance(selectedDist)} away
                {selected.address ? ` · ${selected.address}` : ""}
              </Text>
            </View>
            <Pressable hitSlop={10} onPress={() => setSelected(null)} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={colors.textFaint} />
            </Pressable>
          </View>

          {(selectedOpen != null || selected.wheelchair) && (
            <View style={s.badges}>
              {selectedOpen != null ? (
                <View style={[s.badge, selectedOpen ? s.badgeOk : s.badgeOff]}>
                  <Text style={[s.badgeText, { color: selectedOpen ? colors.mint : colors.textDim }]}>
                    {selectedOpen ? "Open now" : "Closed now"}
                  </Text>
                </View>
              ) : null}
              {selected.wheelchair ? (
                <View style={[s.badge, s.badgeOk]}>
                  <Text style={[s.badgeText, { color: colors.mint }]}>♿ Wheelchair accessible</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={s.actions}>
            <Press style={[s.actionBtn, s.actionPrimary]} scaleTo={0.95} onPress={() => openDirections(selected)}>
              <Ionicons name="navigate-outline" size={16} color={colors.onGold} />
              <Text style={s.actionPrimaryText}>Directions</Text>
            </Press>
            {selected.phone ? (
              <Press
                style={s.actionBtn}
                scaleTo={0.95}
                onPress={() => {
                  tap();
                  Linking.openURL(`tel:${selected.phone.replace(/\s+/g, "")}`).catch(() => {});
                }}
              >
                <Ionicons name="call-outline" size={16} color={colors.goldSoft} />
                <Text style={s.actionText}>Call</Text>
              </Press>
            ) : null}
            {selected.website ? (
              <Press
                style={s.actionBtn}
                scaleTo={0.95}
                onPress={() => {
                  tap();
                  openSheet(selected.website).catch(() => {});
                }}
              >
                <Ionicons name="globe-outline" size={16} color={colors.goldSoft} />
                <Text style={s.actionText}>Website</Text>
              </Press>
            ) : null}
          </View>
        </Reveal>
      ) : (
        <View style={[s.countWrap, { bottom: insets.bottom + 34 }]} pointerEvents="none">
          <View style={s.count}>
            {loading ? <ActivityIndicator size="small" color={colors.gold} /> : null}
            <Text style={s.countText}>
              {loading && !visible.length
                ? "Finding mosques…"
                : `${visible.length} mosque${visible.length === 1 ? "" : "s"} shown`}
            </Text>
          </View>
        </View>
      )}

      <Text style={[s.attribution, { bottom: insets.bottom + 8 }]}>Mosque data © OpenStreetMap contributors</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  pinSel: { borderColor: colors.mint, transform: [{ scale: 1.18 }] },
  pinIcon: { fontSize: 15 },

  top: { position: "absolute", top: 0, left: 0, right: 0, paddingHorizontal: space.md },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(8,31,21,0.92)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: "rgba(8,31,21,0.92)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: t.small, paddingVertical: 0 },

  results: {
    marginTop: 8,
    marginLeft: 52,
    backgroundColor: "rgba(8,31,21,0.96)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  resultDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  resultText: { color: colors.text, fontSize: t.small, flex: 1 },

  chips: { marginTop: 10, flexGrow: 0 },
  chipsContent: { gap: 8, paddingRight: space.md },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(8,31,21,0.9)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.textDim, fontSize: t.tiny, fontWeight: "700" },
  chipTextOn: { color: colors.onGold },
  filterNote: {
    color: colors.text,
    fontSize: t.tiny,
    marginTop: 6,
    paddingHorizontal: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 4,
  },

  fab: {
    position: "absolute",
    right: space.lg,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },

  sheet: {
    position: "absolute",
    left: space.md,
    right: space.md,
    bottom: 0,
    backgroundColor: "rgba(8,31,21,0.97)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.md,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  sheetHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  sheetName: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.3 },
  sheetSub: { color: colors.textDim, fontSize: t.small, marginTop: 3 },

  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1 },
  badgeOk: { backgroundColor: "rgba(62,207,142,0.12)", borderColor: "rgba(62,207,142,0.35)" },
  badgeOff: { backgroundColor: "rgba(244,239,226,0.06)", borderColor: colors.line },
  badgeText: { fontSize: t.tiny, fontWeight: "700" },

  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    flexGrow: 1,
  },
  actionPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
  actionPrimaryText: { color: colors.onGold, fontSize: t.small, fontWeight: "800" },
  actionText: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700" },

  countWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  count: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(8,31,21,0.92)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countText: { color: colors.textDim, fontSize: t.tiny, fontWeight: "700" },

  attribution: {
    position: "absolute",
    left: space.md,
    color: "rgba(244,239,226,0.55)",
    fontSize: 9,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowRadius: 3,
  },
});
