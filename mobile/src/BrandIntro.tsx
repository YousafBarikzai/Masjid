import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect, Defs, LinearGradient as SvgGrad, Stop } from "react-native-svg";
import { colors } from "./theme";

/* The living splash. Continues seamlessly from the static native splash
   (same emerald ground, same gold KMA monogram) and brings it to life:
   the gateway pillars rise in sequence, the wordmark fades up, a light
   sweep crosses the mark, then the whole layer lifts away to reveal Home.
   Plays once per cold start (~2.2s) and never blocks interaction after. */

const BAR = 34; // monogram bar width
const GAP = 20;
const H = 132; // pillar height
const W = BAR * 3 + GAP * 2;

export function BrandIntro({ onDone }: { onDone: () => void }) {
  const [gone, setGone] = useState(false);
  const p1 = useRef(new Animated.Value(0)).current; // pillars rise
  const p2 = useRef(new Animated.Value(0)).current;
  const p3 = useRef(new Animated.Value(0)).current;
  const lintel = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rise = (v: Animated.Value, delay: number) =>
      Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.sequence([
      Animated.parallel([rise(p1, 0), rise(p2, 120), rise(p3, 240), rise(lintel, 420)]),
      Animated.parallel([
        Animated.timing(word, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.delay(240),
      Animated.timing(lift, { toValue: 1, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setGone(true);
      onDone();
    });
  }, [p1, p2, p3, lintel, word, sweep, lift, onDone]);

  if (gone) return null;

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        s.root,
        {
          opacity: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }],
        },
      ]}
    >
      <LinearGradient
        colors={["#0d3423", "#081f15", "#05130c"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.center}>
        <View style={{ width: W, height: H }}>
          {/* pillar I */}
          <Animated.View style={[s.bar, { left: 0 }, rise(p1)]}>
            <Pillar />
          </Animated.View>
          {/* gateway pillars */}
          <Animated.View style={[s.bar, { left: BAR + GAP }, rise(p2)]}>
            <Pillar />
          </Animated.View>
          <Animated.View style={[s.bar, { left: (BAR + GAP) * 2 }, rise(p3)]}>
            <Pillar />
          </Animated.View>
          {/* lintel joining the gateway */}
          <Animated.View
            style={[
              s.lintel,
              {
                opacity: lintel,
                transform: [{ scaleX: lintel.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
              },
            ]}
          >
            <Pillar horizontal />
          </Animated.View>
          {/* light sweep */}
          <Animated.View
            style={[
              s.sweepWrap,
              {
                opacity: sweep.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] }),
                transform: [
                  { translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-W * 0.8, W * 0.8] }) },
                  { rotate: "18deg" },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(255,246,214,0.55)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

        <Animated.View style={[s.word, rise(word)]}>
          <Text style={s.w1}>KINGSTON</Text>
          <Text style={s.w2}>MUSLIM</Text>
          <Text style={s.w3}>ASSOCIATION</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/** One gold gradient bar of the monogram. */
function Pillar({ horizontal }: { horizontal?: boolean }) {
  const w = horizontal ? BAR * 2 + GAP + BAR : BAR;
  const h = horizontal ? BAR : H;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGrad id="g" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e8d59a" />
          <Stop offset="1" stopColor="#c9a227" />
        </SvgGrad>
      </Defs>
      <Rect width={w} height={h} fill="url(#g)" rx={2} />
    </Svg>
  );
}

const s = StyleSheet.create({
  root: { zIndex: 99, elevation: 99 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 34 },
  bar: { position: "absolute", top: 0, width: BAR, height: H },
  lintel: { position: "absolute", top: 0, left: BAR + GAP, width: BAR * 2 + GAP, height: BAR },
  sweepWrap: { position: "absolute", top: -12, bottom: -12, width: 60 },
  word: { alignItems: "center", gap: 4 },
  w1: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: 7 },
  w2: { color: colors.goldSoft, fontSize: 20, fontWeight: "800", letterSpacing: 7 },
  w3: { color: "rgba(244,239,226,0.55)", fontSize: 12, fontWeight: "600", letterSpacing: 6 },
});
