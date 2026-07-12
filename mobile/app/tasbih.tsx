import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Animated, ScrollView, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { Page, Card, Reveal, Press, tap } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";
import { getTasbihPrefs, setTasbihPrefs } from "../src/prefs";

/* Tasbīḥ — a dedicated, distraction-free dhikr counter.

   Six adhkar to choose from; each keeps its OWN running count (reset only
   touches the selected one), and the last selection is remembered. One huge
   tap target increments with a soft haptic and a little pop; a gold ring
   fills with every cycle of 33 and celebrates quietly when it completes.
   Arabic is rendered by the system's Arabic face (SF Arabic on iOS) — large,
   centred, right-to-left, auto-fitting so even the long tahlīl sits
   perfectly on any screen size or Dynamic Type setting. */

const ADHKAR = [
  {
    id: "tasbih",
    name: "Tasbīḥ",
    ar: "سُبْحَانَ ٱللَّٰهِ",
    latin: "SubḥānAllāh",
    en: "Glory be to Allah",
  },
  {
    id: "tahmid",
    name: "Taḥmīd",
    ar: "ٱلْحَمْدُ لِلَّٰهِ",
    latin: "Alḥamdulillāh",
    en: "All praise is for Allah",
  },
  {
    id: "tahlil",
    name: "Tahlīl",
    ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    latin: "Lā ilāha illa-llāh",
    en: "There is no god but Allah",
  },
  {
    id: "takbir",
    name: "Takbīr",
    ar: "ٱللَّٰهُ أَكْبَرُ",
    latin: "Allāhu Akbar",
    en: "Allah is the Greatest",
  },
  {
    id: "hawqala",
    name: "Ḥawqalah",
    ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّهِ",
    latin: "Lā ḥawla wa lā quwwata illā billāh",
    en: "There is no power nor strength except through Allah",
  },
  {
    id: "tahlil-full",
    name: "Tahlīl in full",
    ar: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "Lā ilāha illa-llāhu waḥdahu lā sharīka lah, lahu-l-mulku wa lahu-l-ḥamd, wa huwa ʿalā kulli shayʾin qadīr",
    en: "None has the right to be worshipped but Allah alone, without partner; His is the dominion and His is all praise, and He is able to do all things",
  },
] as const;
type DhikrId = (typeof ADHKAR)[number]["id"];

const SIZE = 236;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Tasbih() {
  const [sel, setSel] = useState<DhikrId>("tasbih");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  const dhikr = useMemo(() => ADHKAR.find((d) => d.id === sel) ?? ADHKAR[0], [sel]);
  const count = counts[sel] ?? 0;
  // Position within the current cycle of 33: hits 33 exactly on each multiple.
  const within = count === 0 ? 0 : ((count - 1) % 33) + 1;
  const round = count === 0 ? 1 : Math.ceil(count / 33);
  const completed = Math.floor(count / 33);

  // Animation drivers: ring fill, count pop, button press, completion halo.
  const ring = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const halo = useRef(new Animated.Value(0)).current;

  // Load the saved selection + per-dhikr counts once.
  useEffect(() => {
    getTasbihPrefs().then((p) => {
      if (ADHKAR.some((d) => d.id === p.sel)) setSel(p.sel as DhikrId);
      setCounts(p.counts);
      setReady(true);
    });
  }, []);

  const persist = (nextSel: DhikrId, nextCounts: Record<string, number>) => {
    setTasbihPrefs({ sel: nextSel, counts: nextCounts }).catch(() => {});
  };

  // The ring follows the position within the current 33.
  useEffect(() => {
    Animated.timing(ring, {
      toValue: within / 33,
      duration: within === 0 ? 260 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [within, ring]);

  function bump() {
    const next = count + 1;
    const nextCounts = { ...counts, [sel]: next };
    setCounts(nextCounts);
    persist(sel, nextCounts);

    // A soft tick every count; a quiet celebration each completed 33.
    if (next % 33 === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      halo.setValue(0);
      Animated.timing(halo, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    pop.setValue(1.09);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 8 }).start();
  }

  function choose(id: DhikrId) {
    if (id === sel) return;
    tap();
    setSel(id);
    persist(id, counts);
  }

  function doReset() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const nextCounts = { ...counts, [sel]: 0 };
    setCounts(nextCounts);
    persist(sel, nextCounts);
    pop.setValue(0.92);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 10 }).start();
  }

  function reset() {
    if (count === 0) return;
    // A full round is worth protecting from a stray tap.
    if (count >= 33) {
      Alert.alert(`Reset ${dhikr.name}?`, `This clears its count of ${count}. Other adhkar keep theirs.`, [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: doReset },
      ]);
    } else {
      doReset();
    }
  }

  return (
    <Page eyebrow="Remembrance of Allah" title="Tasbīḥ" subtitle="Each dhikr keeps its own count" back>
      {/* Dhikr picker — elegant snap cards */}
      <Reveal>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pickerContent}
          style={{ marginHorizontal: -space.lg }}
        >
          {ADHKAR.map((d) => {
            const active = d.id === sel;
            const c = counts[d.id] ?? 0;
            return (
              <Press key={d.id} scaleTo={0.95} onPress={() => choose(d.id)} style={[s.chip, active && s.chipOn]}>
                <Text style={[s.chipAr, active && s.chipArOn]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  {d.ar}
                </Text>
                <Text style={[s.chipName, active && s.chipNameOn]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  {d.name}
                  {c > 0 ? `  ·  ${c}` : ""}
                </Text>
              </Press>
            );
          })}
        </ScrollView>
      </Reveal>

      {/* The active dhikr, beautifully set */}
      <Reveal delay={40}>
        <Card style={s.verse}>
          <Text
            style={s.verseAr}
            adjustsFontSizeToFit
            numberOfLines={3}
            minimumFontScale={0.55}
            maxFontSizeMultiplier={1.5}
          >
            {dhikr.ar}
          </Text>
          <Text style={s.verseLatin} maxFontSizeMultiplier={1.6}>
            {dhikr.latin}
          </Text>
          <Text style={s.verseEn} maxFontSizeMultiplier={1.6}>
            {dhikr.en}
          </Text>
        </Card>
      </Reveal>

      {/* The counter — one huge, joyful tap target */}
      <Reveal delay={80} style={{ alignItems: "center", gap: space.md }}>
        <View style={s.counterWrap}>
          {/* completion halo */}
          <Animated.View
            pointerEvents="none"
            style={[
              s.halo,
              {
                opacity: halo.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
                transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
              },
            ]}
          />
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(244,239,226,0.12)" strokeWidth={STROKE} fill="none" />
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colors.gold}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${CIRC}`}
              strokeDashoffset={ring.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] })}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <Pressable
              onPress={bump}
              disabled={!ready}
              onPressIn={() =>
                Animated.spring(pressScale, { toValue: 0.965, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
              }
              onPressOut={() =>
                Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 7 }).start()
              }
              style={s.counterBtn}
              accessibilityRole="button"
              accessibilityLabel={`Count ${dhikr.latin}. Current count ${count}.`}
            >
              <Animated.Text
                style={[s.count, { transform: [{ scale: pop }] }]}
                maxFontSizeMultiplier={1.2}
                allowFontScaling
              >
                {count}
              </Animated.Text>
              <Text style={s.withinText} maxFontSizeMultiplier={1.4}>
                {within} of 33
              </Text>
            </Pressable>
          </Animated.View>
        </View>
        <Text style={s.tapHint} maxFontSizeMultiplier={1.6}>
          Tap anywhere on the circle to count
        </Text>
      </Reveal>

      {/* Round summary + reset (only the selected dhikr) */}
      <Reveal delay={120}>
        <Card style={s.footRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.roundTitle} maxFontSizeMultiplier={1.5}>
              Round {round}
            </Text>
            <Text style={s.roundSub} maxFontSizeMultiplier={1.5}>
              {completed === 0 ? "Complete 33 to finish a round" : `${completed} round${completed === 1 ? "" : "s"} of 33 completed`}
            </Text>
          </View>
          <Press onPress={reset} scaleTo={0.94} style={[s.resetBtn, count === 0 && { opacity: 0.35 }]}>
            <Text style={s.resetText} maxFontSizeMultiplier={1.4}>
              Reset
            </Text>
          </Press>
        </Card>
      </Reveal>
    </Page>
  );
}

const s = StyleSheet.create({
  pickerContent: { gap: 9, paddingHorizontal: space.lg },
  chip: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 3,
    maxWidth: 210,
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipAr: { color: colors.goldSoft, fontSize: 17, writingDirection: "rtl" },
  chipArOn: { color: colors.onGold },
  chipName: { color: colors.textFaint, fontSize: t.tiny, fontWeight: "800", letterSpacing: 0.4 },
  chipNameOn: { color: "rgba(12,51,34,0.75)" },

  verse: { alignItems: "center", gap: 8, paddingVertical: space.xl },
  verseAr: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 54,
    textAlign: "center",
    writingDirection: "rtl",
    paddingHorizontal: 4,
  },
  verseLatin: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700", textAlign: "center" },
  verseEn: { color: colors.textFaint, fontSize: t.small, textAlign: "center", lineHeight: 19, paddingHorizontal: space.md },

  counterWrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center", marginTop: 4 },
  halo: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.gold,
  },
  counterBtn: {
    width: SIZE - STROKE * 2 - 14,
    height: SIZE - STROKE * 2 - 14,
    borderRadius: (SIZE - STROKE * 2 - 14) / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  count: {
    color: colors.text,
    fontSize: 62,
    fontWeight: "800",
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
  },
  withinText: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700", marginTop: -2 },
  tapHint: { color: colors.textFaint, fontSize: t.tiny },

  footRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 14 },
  roundTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  roundSub: { color: colors.textFaint, fontSize: t.small, marginTop: 1 },
  resetBtn: {
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: colors.glass,
  },
  resetText: { color: colors.goldSoft, fontSize: t.small, fontWeight: "800" },
});
