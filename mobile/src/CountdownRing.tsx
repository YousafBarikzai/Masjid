import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, type as t } from "./theme";
import { londonSecondsNow, toMinutes, findNext } from "./time";
import type { PrayerRow, NextPrayer } from "./types";

/* The Home hero: a live gold progress ring around the next jamāʿah countdown.
   The ring fills as the interval between the previous and next prayer elapses;
   the numbers tick every second, entirely on-device. */

const SIZE = 200;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

function fmt(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${p(h)}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function CountdownRing({
  rows,
  fallback,
}: {
  rows: PrayerRow[];
  fallback: NextPrayer;
}) {
  const [now, setNow] = useState(() => londonSecondsNow());

  useEffect(() => {
    const id = setInterval(() => setNow(londonSecondsNow()), 1000);
    return () => clearInterval(id);
  }, []);

  // Recompute next prayer locally so it stays live between feed refreshes.
  const tomorrowFajr = fallback.tomorrow ? fallback.time : rows.find((r) => r.key === "fajr")?.jamaah || "05:00";
  const next = findNext(rows, tomorrowFajr, now);

  // Interval start = previous prayer's jamāʿah (or midnight); ring = elapsed share.
  const jamaahSecs = rows
    .filter((r) => r.jamaah && !r.isInfo)
    .map((r) => toMinutes(r.jamaah as string) * 60)
    .sort((a, b) => a - b);
  const target = next.tomorrow ? toMinutes(next.time) * 60 + 86400 : toMinutes(next.time) * 60;
  const prev = [...jamaahSecs].reverse().find((s) => s <= now) ?? 0;
  const total = Math.max(target - prev, 1);
  const done = Math.min(Math.max(now - prev, 0), total);
  const frac = done / total;

  return (
    <View style={s.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="rgba(230,200,121,0.16)"
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke={colors.gold}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={CIRC * (1 - frac)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={s.center}>
        <Text style={s.label}>NEXT JAMĀʿAH</Text>
        <Text style={s.name}>{next.name}</Text>
        <Text style={s.count}>{fmt(next.diffSeconds)}</Text>
        <Text style={s.at}>
          at {next.time}
          {next.tomorrow ? " tomorrow" : ""}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center" },
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
