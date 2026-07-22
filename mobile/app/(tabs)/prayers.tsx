import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSnapshot } from "../../src/useSnapshot";
import { fetchMonth } from "../../src/api";
import type { MonthDay, MonthGrid } from "../../src/types";
import { Page, Card, GoldButton, Press, tap, Empty } from "../../src/ui";
import { colors, radius, space, type as t } from "../../src/theme";
import { shareTimetablePdf, printTimetable, emailTimetablePdf } from "../../src/pdf";
import {
  getBells,
  setBells,
  scheduleBells,
  cancelBells,
  PRAYER_KEYS,
  type PrayerKey,
  type DaySchedule,
} from "../../src/bells";

/* Prayers — a browsable day view (← previous / next → with a smooth slide),
   plus the FULL monthly timetable (begins + iqāmah per salah) and the on-device
   PDF (save / share / email). Months are cached so everything works offline. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** The five rows (plus sunrise) for a browsed day, from the month grid. */
function dayRowsOf(d: MonthDay) {
  return [
    { key: "fajr", en: "Fajr", ar: "الفجر", begins: d.fajrBegins, jamaah: d.fajrJamaah },
    { key: "sunrise", en: "Sunrise", ar: "الشروق", begins: d.sunrise, jamaah: null as string | null, isInfo: true },
    { key: "dhuhr", en: "Dhuhr", ar: "الظهر", begins: d.dhuhrBegins, jamaah: d.dhuhrJamaah },
    { key: "asr", en: "ʿAsr", ar: "العصر", begins: d.asrBegins, jamaah: d.asrJamaah },
    { key: "maghrib", en: "Maghrib", ar: "المغرب", begins: d.maghrib, jamaah: d.maghrib },
    { key: "isha", en: "ʿIshā", ar: "العشاء", begins: d.ishaBegins, jamaah: d.ishaJamaah },
  ];
}

function prettyDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** The five salah begin times for a day, for scheduling the bells
 *  (begin time only — never the iqāmah). */
function bellRowsOf(d: MonthDay): { key: PrayerKey; name: string; begins: string }[] {
  return [
    { key: "fajr", name: "Fajr", begins: d.fajrBegins },
    { key: "dhuhr", name: "Dhuhr", begins: d.dhuhrBegins },
    { key: "asr", name: "ʿAsr", begins: d.asrBegins },
    { key: "maghrib", name: "Maghrib", begins: d.maghrib },
    { key: "isha", name: "ʿIshā", begins: d.ishaBegins },
  ];
}

export default function Prayers() {
  const { data, offline, refresh } = useSnapshot();
  const now = new Date();
  const [month, setMonth] = useState(monthKey(now.getFullYear(), now.getMonth() + 1));
  const [grid, setGrid] = useState<MonthGrid | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    // Cached copy first (offline support), then refresh from the CMS.
    try {
      const cached = await AsyncStorage.getItem(`kma-month-${m}`);
      if (cached) setGrid(JSON.parse(cached) as MonthGrid);
    } catch {
      /* ignore */
    }
    try {
      const fresh = await fetchMonth(m);
      // The API snaps to the timetable's year if we asked for a different one.
      if (fresh.days.length === 0 && fresh.year && !m.startsWith(String(fresh.year))) {
        const snapped = `${fresh.year}-${m.slice(5)}`;
        setMonth(snapped);
        return;
      }
      setGrid(fresh);
      AsyncStorage.setItem(`kma-month-${m}`, JSON.stringify(fresh)).catch(() => {});
    } catch {
      /* keep cached */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const year = grid?.year ?? now.getFullYear();
  const todayISO = data?.date.iso;

  /* ── Day browser: ← / → across days (and month boundaries) ─────────────── */
  const [dayISO, setDayISO] = useState<string | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const selectedISO = dayISO ?? todayISO ?? grid?.days[0]?.date ?? null;
  const selectedDay = grid?.days.find((d) => d.date === selectedISO) ?? null;

  function animateDay(dir: 1 | -1, apply: () => void) {
    Animated.timing(slide, {
      toValue: -dir,
      duration: 110,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      apply();
      slide.setValue(dir);
      Animated.timing(slide, { toValue: 0, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  }

  function stepDay(dir: 1 | -1) {
    if (!grid || !selectedISO) return;
    tap();
    const idx = grid.days.findIndex((d) => d.date === selectedISO);
    const nextIdx = idx + dir;
    if (idx === -1) return;
    if (nextIdx >= 0 && nextIdx < grid.days.length) {
      animateDay(dir, () => setDayISO(grid.days[nextIdx].date));
      return;
    }
    // Cross a month boundary: jump month, then land on its first/last day.
    const m = parseInt(month.slice(5), 10) + dir;
    if (m < 1 || m > 12) return;
    const targetMonth = monthKey(year, m);
    animateDay(dir, () => {
      setDayISO(dir === 1 ? `${targetMonth}-01` : `${targetMonth}-31`);
      setMonth(targetMonth);
    });
  }

  // When the month data arrives after a boundary jump, snap "-31" to the real
  // last day of the month.
  useEffect(() => {
    if (!grid || !dayISO) return;
    if (dayISO.endsWith("-31") && !grid.days.some((d) => d.date === dayISO)) {
      const inMonth = grid.days.filter((d) => d.date.startsWith(grid.month));
      if (inMonth.length) setDayISO(inMonth[inMonth.length - 1].date);
    }
  }, [grid, dayISO]);

  const isToday = selectedISO === todayISO;

  /* ── Prayer bells: a per-salah beep when that prayer begins ────────────── */
  const [bells, setBellsState] = useState<PrayerKey[]>([]);

  useEffect(() => {
    getBells().then(setBellsState);
  }, []);

  // Gather the coming days' begin times from the cached current + next month,
  // independent of whichever month is being viewed, so the bell schedule is
  // always anchored to today going forward.
  const collectDays = useCallback(async (): Promise<DaySchedule[]> => {
    const days: DaySchedule[] = [];
    const d0 = new Date();
    const thisMonth = monthKey(d0.getFullYear(), d0.getMonth() + 1);
    const nextY = d0.getMonth() + 1 === 12 ? d0.getFullYear() + 1 : d0.getFullYear();
    const nextM = d0.getMonth() + 1 === 12 ? 1 : d0.getMonth() + 2;
    for (const k of [thisMonth, monthKey(nextY, nextM)]) {
      try {
        const raw = await AsyncStorage.getItem(`kma-month-${k}`);
        if (raw) {
          const g = JSON.parse(raw) as MonthGrid;
          for (const d of g.days) days.push({ dateISO: d.date, prayers: bellRowsOf(d) });
        }
      } catch {
        /* ignore */
      }
    }
    // Fallback: at least today's five, from the snapshot.
    if (!days.length && data?.date.iso) {
      days.push({
        dateISO: data.date.iso,
        prayers: data.prayers
          .filter((p) => !p.isInfo && (PRAYER_KEYS as readonly string[]).includes(p.key))
          .map((p) => ({ key: p.key as PrayerKey, name: p.en, begins: p.begins })),
      });
    }
    return days;
  }, [data]);

  // Keep the rolling schedule fresh whenever new month data lands.
  useEffect(() => {
    (async () => {
      const enabled = await getBells();
      if (enabled.length) {
        const days = await collectDays();
        if (days.length) scheduleBells(days, enabled).catch(() => {});
      }
    })();
  }, [grid, collectDays]);

  /** Persist + (re)schedule a new bell selection; revert if permission is denied. */
  const applyBells = useCallback(
    async (next: PrayerKey[], prev: PrayerKey[]) => {
      setBellsState(next);
      await setBells(next);
      if (!next.length) {
        await cancelBells();
        return;
      }
      const ok = await scheduleBells(await collectDays(), next);
      if (!ok) {
        setBellsState(prev);
        await setBells(prev);
        Alert.alert(
          "Turn on notifications",
          "To hear a beep at prayer times, allow notifications for Kingston Masjid in your device Settings.",
        );
      }
    },
    [collectDays],
  );

  function toggleBell(key: PrayerKey, name: string) {
    tap();
    const prev = bells;
    if (prev.includes(key)) {
      // Switching off needs no ceremony.
      applyBells(prev.filter((k) => k !== key), prev).catch(() => {});
      return;
    }
    // Switching on: confirm the simple-beep notification first.
    Alert.alert(
      `${name} notification`,
      `Would you like a simple beep on your phone when ${name} begins?`,
      [
        { text: "Not now", style: "cancel" },
        { text: "Yes, notify me", onPress: () => applyBells([...prev, key], prev).catch(() => {}) },
      ],
    );
  }

  // All three PDF actions build the same branded PDF on-device from `grid`.
  async function doShare() {
    if (!grid) return;
    try {
      await shareTimetablePdf(grid);
    } catch {
      Alert.alert("Couldn't create the PDF", "Please try again in a moment.");
    }
  }
  async function doPrint() {
    if (!grid) return;
    try {
      await printTimetable(grid);
    } catch {
      /* user cancelled */
    }
  }
  async function doEmail() {
    if (!grid) return;
    try {
      const ok = await emailTimetablePdf(grid);
      if (!ok) {
        Alert.alert(
          "No email set up",
          "Add an email account in your device settings, or use “Share PDF” and pick Mail.",
        );
      }
    } catch {
      Alert.alert("Couldn't create the PDF", "Please try again in a moment.");
    }
  }

  // A single "PDF" button opens the native options: save/print or share.
  // (Emailing has its own dedicated button next to this one.)
  function openPdfMenu() {
    tap();
    if (!grid) return;
    const options = ["Save / Print PDF", "Share PDF", "Cancel"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2, title: "Prayer timetable PDF" },
        (i) => {
          if (i === 0) doPrint();
          else if (i === 1) doShare();
        },
      );
    } else {
      Alert.alert("Prayer timetable PDF", undefined, [
        { text: "Save / Print PDF", onPress: doPrint },
        { text: "Share PDF", onPress: doShare },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  return (
    <Page
      eyebrow="Prayer times"
      title="Timetable"
      subtitle={data?.date.gregorian}
      offline={offline}
      onRefresh={() => {
        refresh();
        load(month);
      }}
    >
      {/* Day browser: ← date → with a smooth slide between days */}
      {selectedDay || data ? (
        <Card style={{ gap: 2 }}>
          <View style={s.dayNav}>
            <Press onPress={() => stepDay(-1)} style={s.dayBtn} scaleTo={0.9}>
              <Ionicons name="chevron-back" size={20} color={colors.goldSoft} />
            </Press>
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <Text style={s.dayTitle}>{selectedISO ? prettyDate(selectedISO) : "Today"}</Text>
              {isToday ? (
                <View style={s.todayChip}>
                  <Text style={s.todayChipText}>TODAY · {data?.date.hijri ?? ""}</Text>
                </View>
              ) : (
                <Pressable onPress={() => { tap(); setDayISO(todayISO ?? null); }} hitSlop={8}>
                  <Text style={s.backToToday}>Back to today</Text>
                </Pressable>
              )}
            </View>
            <Press onPress={() => stepDay(1)} style={s.dayBtn} scaleTo={0.9}>
              <Ionicons name="chevron-forward" size={20} color={colors.goldSoft} />
            </Press>
          </View>

          <Animated.View
            style={{
              opacity: slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
              transform: [{ translateX: slide.interpolate({ inputRange: [-1, 1], outputRange: [-36, 36] }) }],
            }}
          >
            <View style={s.headRow}>
              <Text style={[s.hCell, { flex: 1.2, textAlign: "left" }]}>Prayer</Text>
              <Text style={s.hCell}>Begins</Text>
              <Text style={s.hCell}>Iqāmah</Text>
              <View style={s.bellCol} />
            </View>
            {(selectedDay ? dayRowsOf(selectedDay) : data?.prayers ?? []).map((p) => {
              const isNext = !!data && isToday && !data.nextPrayer.tomorrow && p.en === data.nextPrayer.name;
              const bellKey = (PRAYER_KEYS as readonly string[]).includes(p.key) ? (p.key as PrayerKey) : null;
              const bellOn = !!bellKey && bells.includes(bellKey);
              return (
                <View key={p.key} style={[s.tRow, isNext && s.tRowNext, p.isInfo && { opacity: 0.55 }]}>
                  <View style={{ flex: 1.2, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                    <Text style={[s.tName, isNext && { color: colors.onGold }]}>{p.en}</Text>
                    <Text style={[s.tAr, isNext && { color: "rgba(12,51,34,0.65)" }]}>{p.ar}</Text>
                  </View>
                  <Text style={[s.tCell, isNext && { color: colors.onGold }]}>{p.begins}</Text>
                  <Text style={[s.tCell, s.tCellBold, isNext && { color: colors.onGold }]}>{p.jamaah ?? "—"}</Text>
                  <View style={s.bellCol}>
                    {bellKey ? (
                      <Pressable
                        hitSlop={10}
                        onPress={() => toggleBell(bellKey, p.en)}
                        accessibilityLabel={`${bellOn ? "Disable" : "Enable"} the ${p.en} bell`}
                        style={({ pressed }) => [s.bellBtn, bellOn && s.bellBtnOn, pressed && { transform: [{ scale: 0.88 }] }]}
                      >
                        <Ionicons
                          name={bellOn ? "notifications" : "notifications-outline"}
                          size={15}
                          color={bellOn ? colors.onGold : isNext ? "rgba(12,51,34,0.45)" : colors.textFaint}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
            <Text style={s.bellHint}>Tap a bell for a beep when that prayer begins</Text>
          </Animated.View>
        </Card>
      ) : (
        <Card>
          <Empty text="Loading prayer times…" />
        </Card>
      )}

      {/* Actions — the timetable PDF is generated inside the app */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <GoldButton compact label="⬇︎  Get PDF" onPress={openPdfMenu} />
        </View>
        <Pressable
          style={({ pressed }) => [s.outlineBtn, pressed && { opacity: 0.8 }]}
          onPress={doEmail}
        >
          <Text style={s.outlineBtnText}>Email me the PDF</Text>
        </Pressable>
      </View>

      {/* Month picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {MONTHS.map((m, i) => {
          const key = monthKey(year, i + 1);
          const active = key === month;
          return (
            <Pressable
              key={m}
              onPress={() => {
                tap();
                setMonth(key);
              }}
              style={[s.monthChip, active && s.monthChipActive]}
            >
              <Text style={[s.monthChipText, active && { color: colors.onGold }]}>{m}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Month grid */}
      <Card style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
        <View style={[s.gRow, s.gHead]}>
          <Text style={[s.gDay, s.gHeadText]}>{MONTHS[parseInt(month.slice(5), 10) - 1]}</Text>
          {["Fajr", "Dhuhr", "ʿAsr", "Magh.", "ʿIshā"].map((h) => (
            <Text key={h} style={[s.gCell, s.gHeadText]}>
              {h}
            </Text>
          ))}
        </View>
        {loading && !grid ? (
          <Empty text="Loading month…" />
        ) : (
          (grid?.days ?? []).map((d) => {
            const isFri = d.weekday.startsWith("Fri");
            const isToday = d.date === todayISO;
            return (
              <View key={d.date} style={[s.gRow, isFri && s.gFri, isToday && s.gToday]}>
                <Text style={[s.gDay, isToday && { color: colors.goldHot }]}>
                  {parseInt(d.date.slice(8), 10)} {d.weekday.slice(0, 2)}
                </Text>
                <Text style={s.gCell}>{d.fajrJamaah}</Text>
                <Text style={s.gCell}>{d.dhuhrJamaah}</Text>
                <Text style={s.gCell}>{d.asrJamaah}</Text>
                <Text style={s.gCell}>{d.maghrib}</Text>
                <Text style={s.gCell}>{d.ishaJamaah}</Text>
              </View>
            );
          })
        )}
        <Text style={s.gNote}>Jamāʿah (iqāmah) times shown · Maghrib is at sunset</Text>
      </Card>
    </Page>
  );
}

const s = StyleSheet.create({
  dayNav: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(201,162,39,0.12)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  dayTitle: { color: colors.text, fontSize: t.body, fontWeight: "800", letterSpacing: -0.2 },
  todayChip: {
    backgroundColor: "rgba(201,162,39,0.16)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  todayChipText: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1 },
  backToToday: { color: colors.mint, fontSize: t.tiny, fontWeight: "800", letterSpacing: 0.4 },
  headRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.line },
  hCell: {
    flex: 1,
    textAlign: "right",
    color: colors.textFaint,
    fontSize: t.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: radius.sm,
  },
  tRowNext: { backgroundColor: colors.gold },
  tName: { color: colors.text, fontWeight: "700", fontSize: t.body },
  tAr: { color: colors.textFaint, fontSize: t.small },
  tCell: { flex: 1, textAlign: "right", color: colors.textDim, fontSize: t.body, fontVariant: ["tabular-nums"] },
  tCellBold: { color: colors.text, fontWeight: "800" },
  bellCol: { width: 34, alignItems: "flex-end" },
  bellBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,239,226,0.07)",
  },
  bellBtnOn: { backgroundColor: colors.gold },
  bellHint: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingTop: 8 },
  outlineBtn: {
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { color: colors.goldSoft, fontWeight: "800", fontSize: t.small },
  monthChip: {
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  monthChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  monthChipText: { color: colors.textDim, fontWeight: "800", fontSize: t.small },
  gRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  gHead: { borderBottomWidth: 1, borderColor: colors.line, marginBottom: 2 },
  gHeadText: { color: colors.textFaint, fontWeight: "800", fontSize: t.tiny, textTransform: "uppercase", letterSpacing: 0.5 },
  gFri: { backgroundColor: "rgba(201,162,39,0.10)" },
  gToday: { backgroundColor: "rgba(62,207,142,0.12)" },
  gDay: { width: 52, color: colors.textDim, fontSize: t.small, fontWeight: "700" },
  gCell: { flex: 1, textAlign: "center", color: colors.text, fontSize: t.small, fontVariant: ["tabular-nums"] },
  gNote: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingVertical: 8 },
});
