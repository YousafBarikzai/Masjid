import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSnapshot } from "@/useSnapshot";
import { Page, Card } from "@/ui";
import { colors } from "@/theme";

export default function PrayersScreen() {
  const { data, offline, loading, refresh } = useSnapshot();

  return (
    <Page
      title="Prayer Times"
      subtitle={data ? `${data.date.gregorian}${data.date.hijri ? `  ·  ${data.date.hijri}` : ""}` : undefined}
      offline={offline}
      onRefresh={refresh}
    >
      {!data ? (
        <View style={styles.center}>
          {loading ? <ActivityIndicator color={colors.green2} /> : <Text>Couldn't load prayer times.</Text>}
        </View>
      ) : (
        <Card style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.colName]}>Prayer</Text>
            <Text style={[styles.th, styles.colTime]}>Begins</Text>
            <Text style={[styles.th, styles.colTime]}>Jamā‘ah</Text>
          </View>
          {data.prayers.map((p) => (
            <View key={p.key} style={styles.tr}>
              <View style={styles.colName}>
                <Text style={styles.name}>{p.en}</Text>
                <Text style={styles.ar}>{p.ar}</Text>
              </View>
              <Text style={[styles.time, styles.colTime]}>{p.begins}</Text>
              <Text style={[styles.time, styles.colTime]}>{p.isInfo ? "—" : p.jamaah ?? "—"}</Text>
            </View>
          ))}
        </Card>
      )}
      <Text style={styles.note}>
        Times follow the mosque's official timetable and update automatically. Please arrive a few
        minutes before jamā‘ah.
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  table: { paddingVertical: 4 },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  thead: { borderBottomWidth: 1.5, borderBottomColor: colors.green3 },
  th: { fontSize: 12, fontWeight: "700", color: colors.green, letterSpacing: 0.5, textTransform: "uppercase" },
  colName: { flex: 1.4 },
  colTime: { flex: 1, textAlign: "right" },
  name: { fontSize: 17, fontWeight: "600", color: colors.ink },
  ar: { fontSize: 15, color: colors.muted, marginTop: 1 },
  time: { fontSize: 17, color: colors.ink, fontVariant: ["tabular-nums"] },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
});
