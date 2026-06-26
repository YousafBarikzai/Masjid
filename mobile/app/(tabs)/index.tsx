import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSnapshot } from "@/useSnapshot";
import { findNext, formatCountdown, londonSecondsNow } from "@/time";
import { Page, Card } from "@/ui";
import { colors } from "@/theme";

export default function HomeScreen() {
  const { data, offline, loading, refresh } = useSnapshot();
  const [now, setNow] = useState(() => new Date());

  // Tick once a second for the live countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <Page title="Kingston Mosque">
        <View style={styles.center}>
          {loading ? <ActivityIndicator color={colors.green2} /> : <Text>Couldn't load prayer times.</Text>}
        </View>
      </Page>
    );
  }

  const fajr = data.prayers.find((p) => p.key === "fajr")?.jamaah ?? "05:00";
  const next = findNext(data.prayers, fajr, londonSecondsNow(now));
  const highlightKey = next.tomorrow ? "fajr" : next.name.toLowerCase();
  const five = data.prayers.filter((p) => !p.isInfo);
  const sunrise = data.prayers.find((p) => p.key === "sunrise");

  return (
    <Page
      title="Kingston Mosque"
      subtitle={`${data.date.gregorian}${data.date.hijri ? `  ·  ${data.date.hijri}` : ""}`}
      offline={offline}
      refreshing={false}
      onRefresh={refresh}
    >
      {data.announcement ? (
        <Card style={styles.banner}>
          <Text style={styles.bannerLabel}>{data.announcement.label}</Text>
          <Text style={styles.bannerMsg}>{data.announcement.message}</Text>
        </Card>
      ) : null}

      <Card style={styles.hero}>
        <Text style={styles.heroEyebrow}>NEXT JAMĀ‘AH</Text>
        <Text style={styles.heroName}>{next.name}</Text>
        <Text style={styles.heroCountdown}>{formatCountdown(next.diffSeconds)}</Text>
        <Text style={styles.heroAt}>
          at {next.time}
          {next.tomorrow ? " (tomorrow)" : ""}
        </Text>
      </Card>

      {five.map((p) => {
        const isNext = p.key === highlightKey;
        return (
          <Card key={p.key} style={isNext ? styles.rowNext : styles.row}>
            <View style={styles.rowLeft}>
              <Text style={[styles.pname, isNext && styles.onGold]}>{p.en}</Text>
              <Text style={[styles.par, isNext && styles.onGoldSoft]}>{p.ar}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.ptime, isNext && styles.onGold]}>{p.jamaah ?? p.begins}</Text>
              <Text style={[styles.pbegins, isNext && styles.onGoldSoft]}>Begins {p.begins}</Text>
            </View>
          </Card>
        );
      })}

      {sunrise ? (
        <Text style={styles.sunrise}>
          Sunrise (Shurūq) <Text style={styles.sunriseTime}>{sunrise.begins}</Text>
        </Text>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  banner: { backgroundColor: "#fff8e6", borderColor: colors.goldSoft },
  bannerLabel: { color: colors.gold, fontWeight: "700", fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  bannerMsg: { color: colors.ink, fontSize: 15, lineHeight: 21 },

  hero: { backgroundColor: colors.green, borderColor: colors.green, alignItems: "center", paddingVertical: 22 },
  heroEyebrow: { color: colors.gold, fontSize: 12, letterSpacing: 2, fontWeight: "700" },
  heroName: { color: colors.cream, fontSize: 30, fontWeight: "700", marginTop: 4 },
  heroCountdown: { color: colors.goldSoft, fontSize: 44, fontWeight: "800", marginTop: 2, fontVariant: ["tabular-nums"] },
  heroAt: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginTop: 2 },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowNext: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.gold,
    borderColor: colors.goldSoft,
  },
  rowLeft: {},
  rowRight: { alignItems: "flex-end" },
  pname: { fontSize: 18, fontWeight: "600", color: colors.green },
  par: { fontSize: 16, color: colors.muted, marginTop: 2 },
  ptime: { fontSize: 22, fontWeight: "800", color: colors.ink, fontVariant: ["tabular-nums"] },
  pbegins: { fontSize: 12, color: colors.muted, marginTop: 2 },
  onGold: { color: "#2a2000" },
  onGoldSoft: { color: "#4a3a00" },

  sunrise: { textAlign: "center", color: colors.muted, marginTop: 6 },
  sunriseTime: { fontWeight: "700", color: colors.green2 },
});
