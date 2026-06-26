import { Text, StyleSheet, View, Pressable, Linking, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSnapshot } from "@/useSnapshot";
import { apiBase } from "@/api";
import { Page, Card, SectionTitle, Empty } from "@/ui";
import { colors } from "@/theme";
import type { CardItem } from "@/types";

function LinkCard({ item }: { item: CardItem }) {
  const url = item.href?.startsWith("http") ? item.href : `${apiBase}${item.href || ""}`;
  return (
    <Pressable onPress={() => Linking.openURL(url)}>
      <Card style={styles.linkCard}>
        <Text style={styles.icon}>{item.icon ?? "🕌"}</Text>
        <View style={styles.flex}>
          <Text style={styles.linkTitle}>
            {item.tag ? `${item.tag} · ` : ""}
            {item.title}
          </Text>
          {item.body ? <Text style={styles.linkBody}>{item.body}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Card>
    </Pressable>
  );
}

export default function MoreScreen() {
  const { data, offline, loading, refresh } = useSnapshot();

  if (!data) {
    return (
      <Page title="More">
        <View style={styles.center}>{loading ? <ActivityIndicator color={colors.green2} /> : null}</View>
      </Page>
    );
  }

  const c = data.contact;
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(c.mapsQuery)}`;

  return (
    <Page title="More" offline={offline} onRefresh={refresh}>
      <SectionTitle>Contact</SectionTitle>
      <Card>
        <Pressable style={styles.contactRow} onPress={() => Linking.openURL(c.phoneHref)}>
          <Ionicons name="call" size={20} color={colors.green2} />
          <Text style={styles.contactText}>{c.phone}</Text>
        </Pressable>
        <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${c.email}`)}>
          <Ionicons name="mail" size={20} color={colors.green2} />
          <Text style={styles.contactText}>{c.email}</Text>
        </Pressable>
        <Pressable style={styles.contactRow} onPress={() => Linking.openURL(mapsUrl)}>
          <Ionicons name="location" size={20} color={colors.green2} />
          <Text style={styles.contactText}>
            {c.address.line1}, {c.address.city} {c.address.postcode}
          </Text>
        </Pressable>
      </Card>

      <SectionTitle>Services</SectionTitle>
      {data.services.length ? data.services.map((s, i) => <LinkCard key={`s${i}`} item={s} />) : <Empty>Coming soon.</Empty>}

      <SectionTitle>Education</SectionTitle>
      {data.classes.length ? data.classes.map((s, i) => <LinkCard key={`c${i}`} item={s} />) : <Empty>Coming soon.</Empty>}

      <SectionTitle>Events</SectionTitle>
      {data.events.length ? data.events.map((s, i) => <LinkCard key={`e${i}`} item={s} />) : <Empty>No upcoming events.</Empty>}

      <Pressable style={styles.website} onPress={() => Linking.openURL(apiBase)}>
        <Text style={styles.websiteText}>Visit kingstonmosque.org</Text>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 60 },
  flex: { flex: 1 },
  linkCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 22 },
  linkTitle: { fontSize: 16, fontWeight: "600", color: colors.green },
  linkBody: { fontSize: 13, color: colors.muted, marginTop: 2 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  contactText: { fontSize: 15, color: colors.ink, flex: 1 },
  website: { alignItems: "center", paddingVertical: 18 },
  websiteText: { color: colors.green3, fontWeight: "700", fontSize: 15 },
});
