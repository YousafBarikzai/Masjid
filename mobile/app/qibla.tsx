import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle, Line, Path, G, Text as SvgText } from "react-native-svg";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Page, Card, GoldButton } from "../src/ui";
import { colors, space, type as t } from "../src/theme";

/* Qibla compass.

   Heading: expo-location's watchHeadingAsync — the platform's own fused,
   tilt-compensated compass (Core Location on iOS), far more reliable than raw
   magnetometer math. We use trueHeading (declination-corrected) when the OS
   provides it, falling back to magnetic heading (the ~1° difference in the UK
   is immaterial for prayer direction).

   Bearing: the great-circle bearing to the Kaʿbah (21.4225°N, 39.8262°E),
   computed from the device's location. If location is unavailable we use
   Kingston upon Thames (51.4123°N, 0.3007°W) → 119° from true north, clearly
   labelled — correct for anyone at or near the mosque. */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const KAABA = { lat: 21.4225, lng: 39.8262 };
const KINGSTON = { lat: 51.4123, lng: -0.3007 };

function qiblaBearing(lat: number, lng: number): number {
  const φ1 = lat * RAD;
  const φ2 = KAABA.lat * RAD;
  const Δλ = (KAABA.lng - lng) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * DEG + 360) % 360;
}

const KINGSTON_BEARING = qiblaBearing(KINGSTON.lat, KINGSTON.lng); // ≈ 118.9°

export default function Qibla() {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState(0);
  const [bearing, setBearing] = useState(KINGSTON_BEARING);
  const [usingDefault, setUsingDefault] = useState(true);
  const [denied, setDenied] = useState(false);
  const rot = useRef(new Animated.Value(0)).current;
  const last = useRef(0);
  const wasAligned = useRef(false);

  // Platform compass heading + best-effort precise location.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let active = true;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (status !== "granted") {
        setDenied(true);
        return;
      }
      sub = await Location.watchHeadingAsync((h) => {
        if (!active) return;
        const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        setHeading(deg);
        setAccuracy(h.accuracy);
      });
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        setBearing(qiblaBearing(loc.coords.latitude, loc.coords.longitude));
        setUsingDefault(false);
      } catch {
        /* keep the Kingston default, clearly labelled */
      }
    })();
    return () => {
      active = false;
      sub?.remove();
    };
  }, []);

  // Smooth shortest-path dial rotation (dial turns so its N follows the world).
  useEffect(() => {
    if (heading == null) return;
    let next = -heading;
    const diff = next - last.current;
    if (diff > 180) next -= 360;
    else if (diff < -180) next += 360;
    last.current = next;
    Animated.timing(rot, { toValue: next, duration: 140, easing: Easing.linear, useNativeDriver: true }).start();
  }, [heading, rot]);

  const spin = rot.interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] });
  const delta = heading == null ? null : Math.abs(((bearing - heading + 540) % 360) - 180);
  const aligned = delta != null && delta < 5;

  // A single success haptic the moment alignment is reached.
  useEffect(() => {
    if (aligned && !wasAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    wasAligned.current = aligned;
  }, [aligned]);

  return (
    <Page eyebrow="Facing the Kaʿbah" title="Qibla" subtitle="Hold your phone flat, top edge forward" back>
      <Card style={s.card}>
        <View style={s.compassWrap}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={272} height={272} viewBox="0 0 272 272">
              {/* dial */}
              <Circle cx="136" cy="136" r="128" stroke={colors.glassBorder} strokeWidth="2" fill="rgba(255,255,255,0.03)" />
              {Array.from({ length: 72 }).map((_, i) => {
                const major = i % 9 === 0;
                const a = i * 5 * RAD;
                const r1 = 128;
                const r2 = major ? 114 : 121;
                return (
                  <Line
                    key={i}
                    x1={136 + r1 * Math.sin(a)}
                    y1={136 - r1 * Math.cos(a)}
                    x2={136 + r2 * Math.sin(a)}
                    y2={136 - r2 * Math.cos(a)}
                    stroke={major ? colors.goldSoft : colors.line}
                    strokeWidth={major ? 2 : 1}
                  />
                );
              })}
              {["N", "E", "S", "W"].map((d, i) => {
                const a = i * 90 * RAD;
                return (
                  <SvgText
                    key={d}
                    x={136 + 97 * Math.sin(a)}
                    y={136 - 97 * Math.cos(a) + 6}
                    fill={d === "N" ? colors.gold : colors.textFaint}
                    fontSize="16"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {d}
                  </SvgText>
                );
              })}
              {/* qiblah needle at the bearing */}
              <G rotation={bearing} origin="136, 136">
                <Line x1="136" y1="136" x2="136" y2="34" stroke={aligned ? colors.mint : colors.gold} strokeWidth="4" strokeLinecap="round" />
                <Path d="M136 18 l13 24 h-26 z" fill={aligned ? colors.mint : colors.gold} />
                <Circle cx="136" cy="136" r="7" fill={aligned ? colors.mint : colors.gold} />
              </G>
            </Svg>
          </Animated.View>
          {/* fixed forward marker (where the phone points) */}
          <View style={s.forward} pointerEvents="none">
            <View style={[s.forwardTip, aligned && { borderBottomColor: colors.mint }]} />
          </View>
          <Text style={s.kaaba}>🕋</Text>
        </View>

        {denied ? (
          <View style={{ gap: 12, alignItems: "center" }}>
            <Text style={s.hint}>
              The compass needs location access (it's how iOS provides the heading). From Kingston Mosque the
              qiblah is {Math.round(KINGSTON_BEARING)}° from north — roughly south-east.
            </Text>
            <GoldButton compact label="Allow location access" onPress={() => Location.requestForegroundPermissionsAsync()} />
          </View>
        ) : heading == null ? (
          <Text style={s.hint}>Starting the compass…</Text>
        ) : (
          <>
            <Text style={[s.deg, aligned && { color: colors.mint }]}>
              {aligned ? "Facing the qiblah ✓" : `${Math.round(bearing)}° ${usingDefault ? "· Kingston" : ""}`}
            </Text>
            <Text style={s.hint}>
              {aligned
                ? "You are aligned with the Kaʿbah"
                : "Turn until the needle meets the marker at the top"}
            </Text>
            {accuracy > 25 ? (
              <Text style={s.cal}>Compass needs calibrating — move your phone in a figure-of-8</Text>
            ) : null}
          </>
        )}
      </Card>

      <Text style={s.note}>
        Keep away from magnets, metal and cases with magnetic clasps. The bearing is calculated for your exact
        location{usingDefault ? " (currently using Kingston upon Thames: 119° from north)" : ""}.
      </Text>
    </Page>
  );
}

const s = StyleSheet.create({
  card: { alignItems: "center", gap: space.md, paddingVertical: space.xl },
  compassWrap: { width: 272, height: 272, alignItems: "center", justifyContent: "center" },
  forward: { position: "absolute", top: -4, alignItems: "center" },
  forwardTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.text,
  },
  kaaba: { position: "absolute", fontSize: 30 },
  deg: { color: colors.gold, fontSize: 30, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -0.5 },
  hint: { color: colors.textDim, fontSize: t.small, textAlign: "center", paddingHorizontal: space.lg, lineHeight: 20 },
  cal: { color: colors.danger, fontSize: t.tiny, fontWeight: "700", textAlign: "center" },
  note: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", lineHeight: 17, paddingHorizontal: space.md },
});
