import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors, type as t } from "./theme";
import { londonSecondsNow, toMinutes, findNext } from "./time";
import type { PrayerRow, NextPrayer } from "./types";

/* The Home hero — a living dial in the splash screen's language:
   · a layered dial (fine tick marks + inner depth ring) for a 3D feel
   · a gold gradient arc that sweeps smoothly (animated, not stepped)
   · a glow layer under the arc and a breathing dot at its head
   · a calm entrance: the ring scales/fades in, the arc draws itself
   The numbers tick every second, entirely on-device. */

const SIZE = 216;
const STROKE = 11;
const R = (SIZE - STROKE) / 2 - 6;
const CIRC = 2 * Math.PI * R;
const RAD = Math.PI / 180;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function fmt(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function CountdownRing({ rows, fallback }: { rows: PrayerRow[]; fallback: NextPrayer }) {
  const [now, setNow] = useState(() => londonSecondsNow());
  const progress = useRef(new Animated.Value(0)).current; // 0..1 of the interval
  const entrance = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setNow(londonSecondsNow()), 1000);
    return () => clearInterval(id);
  }, []);

  // Entrance: scale + fade, then the arc draws in.
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [entrance, breathe]);

  // Recompute next prayer locally so it stays live between feed refreshes.
  const tomorrowFajr = fallback.tomorrow ? fallback.time : rows.find((r) => r.key === "fajr")?.jamaah || "05:00";
  const next = findNext(rows, tomorrowFajr, now);

  const jamaahSecs = rows
    .filter((r) => r.jamaah && !r.isInfo)
    .map((r) => toMinutes(r.jamaah as string) * 60)
    .sort((a, b) => a - b);
  const target = next.tomorrow ? toMinutes(next.time) * 60 + 86400 : toMinutes(next.time) * 60;
  const prev = [...jamaahSecs].reverse().find((s) => s <= now) ?? 0;
  const total = Math.max(target - prev, 1);
  const done = Math.min(Math.max(now - prev, 0), total);
  const frac = done / total;

  // Glide the arc to each new fraction (1s linear ≈ continuous sweep).
  useEffect(() => {
    Animated.timing(progress, { toValue: frac, duration: 1000, easing: Easing.linear, useNativeDriver: false }).start();
  }, [frac, progress]);

  const dash = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] });
  const headDeg = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          opacity: entrance,
          transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
        },
      ]}
    >
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <LinearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f3dd8f" />
            <Stop offset="1" stopColor="#c9a227" />
          </LinearGradient>
        </Defs>

        {/* dial: fine minute ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = i * 6 * RAD;
          const r1 = R + 9;
          const r2 = i % 15 === 0 ? R + 2 : R + 6;
          return (
            <Circle
              key={i}
              cx={SIZE / 2 + ((r1 + r2) / 2) * Math.sin(a)}
              cy={SIZE / 2 - ((r1 + r2) / 2) * Math.cos(a)}
              r={i % 15 === 0 ? 1.6 : 0.8}
              fill={i % 15 === 0 ? "rgba(232,213,154,0.55)" : "rgba(244,239,226,0.18)"}
            />
          );
        })}

        {/* depth: inner shadow ring + track */}
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE / 2 - 3} stroke="rgba(0,0,0,0.28)" strokeWidth={1.5} fill="rgba(255,255,255,0.025)" />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(230,200,121,0.14)" strokeWidth={STROKE} fill="none" />

        {/* glow under-arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="rgba(201,162,39,0.28)"
          strokeWidth={STROKE + 7}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        {/* main gradient arc */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="url(#arc)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={dash}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>

      {/* head dot riding the arc (rotating overlay — native-driver friendly) */}
      <Animated.View pointerEvents="none" style={[s.headWrap, { transform: [{ rotate: headDeg }] }]}>
        <View style={s.headGlow} />
        <View style={s.headDot} />
      </Animated.View>

      {/* breathing halo behind the numbers */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.halo,
          {
            opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.22] }),
            transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.06] }) }],
          },
        ]}
      />

      <View style={s.center}>
        <Text style={s.label}>NEXT JAMĀʿAH</Text>
        <Text style={s.name}>{next.name}</Text>
        <Text style={s.count}>{fmt(next.diffSeconds)}</Text>
        <Text style={s.at}>
          at {next.time}
          {next.tomorrow ? " tomorrow" : ""}
        </Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center" },
  headWrap: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
  },
  headGlow: {
    position: "absolute",
    top: STROKE / 2 + 6 - (STROKE / 2 + 4),
    width: (STROKE / 2 + 4) * 2,
    height: (STROKE / 2 + 4) * 2,
    borderRadius: STROKE / 2 + 4,
    backgroundColor: "rgba(243,221,143,0.28)",
  },
  headDot: {
    position: "absolute",
    top: STROKE / 2 + 6 - (STROKE / 2 + 0.5),
    width: (STROKE / 2 + 0.5) * 2,
    height: (STROKE / 2 + 0.5) * 2,
    borderRadius: STROKE / 2 + 0.5,
    backgroundColor: "#f3dd8f",
  },
  halo: {
    position: "absolute",
    width: SIZE * 0.62,
    height: SIZE * 0.62,
    borderRadius: SIZE,
    backgroundColor: colors.gold,
  },
  label: { color: colors.goldSoft, fontSize: 9.5, fontWeight: "800", letterSpacing: 2 },
  name: { color: colors.text, fontSize: t.h1, fontWeight: "800", marginTop: 2 },
  count: {
    color: colors.goldHot,
    fontSize: 30,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  at: { color: colors.textDim, fontSize: t.small, marginTop: 2 },
});
