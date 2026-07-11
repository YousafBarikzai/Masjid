import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Platform } from "react-native";
import Svg, { Circle, Line, Path, G, Text as SvgText } from "react-native-svg";
import { Magnetometer } from "expo-sensors";
import * as Location from "expo-location";
import { useContent } from "../src/useContent";
import { Page, Card, GoldButton } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";

/* Native Qibla compass. Uses the device magnetometer for heading and GPS for
   the great-circle bearing to the Kaʿbah — computed entirely on-device, works
   anywhere, no web view. The dial rotates so the gold marker always points to
   the qiblah; a haptic-free "aligned" state confirms when you're facing it. */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function qiblaBearing(lat: number, lng: number, kLat: number, kLng: number) {
  const φ1 = lat * RAD;
  const φ2 = kLat * RAD;
  const Δλ = (kLng - lng) * RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * DEG + 360) % 360;
}

export default function Qibla() {
  const { content } = useContent();
  const [heading, setHeading] = useState<number | null>(null);
  const [qibla, setQibla] = useState<number | null>(null);
  const [status, setStatus] = useState<"init" | "denied" | "ready" | "nolocation">("init");
  const rot = useRef(new Animated.Value(0)).current;
  const lastDeg = useRef(0);

  // Magnetometer → compass heading (0 = North).
  useEffect(() => {
    Magnetometer.setUpdateInterval(90);
    const sub = Magnetometer.addListener((m) => {
      let angle = Math.atan2(m.y, m.x) * DEG;
      angle = (angle + 360) % 360;
      // Device x/y axes → map so 0° points North (approx; good enough for qiblah).
      const h = (360 - angle + 90) % 360;
      setHeading(h);
    });
    return () => sub.remove();
  }, []);

  // Location → qiblah bearing.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (perm !== "granted") return setStatus("denied");
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        const k = content?.qibla ?? { kaabaLat: 21.4225, kaabaLng: 39.8262 };
        setQibla(qiblaBearing(loc.coords.latitude, loc.coords.longitude, k.kaabaLat, k.kaabaLng));
        setStatus("ready");
      } catch {
        if (active) setStatus("nolocation");
      }
    })();
    return () => {
      active = false;
    };
  }, [content]);

  // Rotate the dial so the qiblah marker points up when the phone faces it.
  const dialTarget = heading == null ? 0 : -heading;
  useEffect(() => {
    // shortest-path rotation to avoid a 359°→0° spin
    let next = dialTarget;
    const diff = next - lastDeg.current;
    if (diff > 180) next -= 360;
    else if (diff < -180) next += 360;
    lastDeg.current = next;
    Animated.timing(rot, { toValue: next, duration: 120, easing: Easing.linear, useNativeDriver: true }).start();
  }, [dialTarget, rot]);

  const spin = rot.interpolate({ inputRange: [-360, 360], outputRange: ["-360deg", "360deg"] });
  const diff = heading != null && qibla != null ? Math.abs(((qibla - heading + 540) % 360) - 180) : null;
  const aligned = diff != null && diff < 4;

  return (
    <Page eyebrow="Facing the Kaʿbah" title="Qibla" subtitle="Point the top of your phone" back>
      <Card style={s.card}>
        <View style={s.compassWrap}>
          {/* rotating dial */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={260} height={260} viewBox="0 0 260 260">
              <Circle cx="130" cy="130" r="122" stroke={colors.glassBorder} strokeWidth="2" fill="none" />
              <Circle cx="130" cy="130" r="122" stroke={aligned ? colors.mint : "transparent"} strokeWidth="3" fill="none" />
              {/* tick marks */}
              {Array.from({ length: 72 }).map((_, i) => {
                const major = i % 9 === 0;
                const a = i * 5 * RAD;
                const r1 = 122;
                const r2 = major ? 108 : 116;
                return (
                  <Line
                    key={i}
                    x1={130 + r1 * Math.sin(a)}
                    y1={130 - r1 * Math.cos(a)}
                    x2={130 + r2 * Math.sin(a)}
                    y2={130 - r2 * Math.cos(a)}
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
                    x={130 + 92 * Math.sin(a)}
                    y={130 - 92 * Math.cos(a) + 6}
                    fill={d === "N" ? colors.gold : colors.textFaint}
                    fontSize="15"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {d}
                  </SvgText>
                );
              })}
              {/* qiblah marker (Kaʿbah) at the bearing angle on the dial */}
              {qibla != null ? (
                <G rotation={qibla} origin="130, 130">
                  <Line x1="130" y1="130" x2="130" y2="24" stroke={colors.gold} strokeWidth="3" />
                  <Path d="M130 12 l11 20 h-22 z" fill={colors.gold} />
                  <SvgText x="130" y="52" fill={colors.onGold} fontSize="13" fontWeight="800" textAnchor="middle">
                    🕋
                  </SvgText>
                </G>
              ) : null}
            </Svg>
          </Animated.View>
          {/* fixed phone-forward indicator */}
          <View style={s.forward} pointerEvents="none">
            <View style={[s.forwardTip, aligned && { borderBottomColor: colors.mint }]} />
          </View>
        </View>

        {status === "ready" && qibla != null ? (
          <>
            <Text style={[s.deg, aligned && { color: colors.mint }]}>{Math.round(qibla)}°</Text>
            <Text style={s.hint}>
              {aligned ? "Aligned — you are facing the qiblah" : "Turn until the gold marker points to the top"}
            </Text>
          </>
        ) : status === "denied" ? (
          <View style={{ gap: 10, alignItems: "center" }}>
            <Text style={s.hint}>Location access is needed to find the qiblah direction from where you are.</Text>
            <GoldButton compact label="Allow location" onPress={() => Location.requestForegroundPermissionsAsync()} />
          </View>
        ) : status === "nolocation" ? (
          <Text style={s.hint}>Couldn't read your location. Move somewhere with a clearer signal and reopen Qibla.</Text>
        ) : (
          <Text style={s.hint}>Finding your location…</Text>
        )}
      </Card>

      <Text style={s.note}>
        Hold the phone flat and away from metal or magnets. Calibrate by moving it in a figure-8 if the compass drifts.
        {Platform.OS === "android" ? " Accuracy depends on your device's magnetometer." : ""}
      </Text>
    </Page>
  );
}

const s = StyleSheet.create({
  card: { alignItems: "center", gap: space.md, paddingVertical: space.xl },
  compassWrap: { width: 260, height: 260, alignItems: "center", justifyContent: "center" },
  forward: { position: "absolute", top: -2, alignItems: "center" },
  forwardTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.text,
  },
  deg: { color: colors.gold, fontSize: 40, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -1 },
  hint: { color: colors.textDim, fontSize: t.small, textAlign: "center", paddingHorizontal: space.lg, lineHeight: 20 },
  note: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", lineHeight: 17, paddingHorizontal: space.md },
});
