import { Text, StyleSheet, ActivityIndicator, View, Pressable, Linking } from "react-native";
import { useSnapshot } from "@/useSnapshot";
import { apiBase } from "@/api";
import { Page, Card, Empty } from "@/ui";
import { colors } from "@/theme";

export default function NewsScreen() {
  const { data, offline, loading, refresh } = useSnapshot();

  return (
    <Page title="News & Announcements" offline={offline} onRefresh={refresh}>
      {!data ? (
        <View style={styles.center}>{loading ? <ActivityIndicator color={colors.green2} /> : null}</View>
      ) : data.news.length === 0 ? (
        <Empty>No news right now. Check back soon.</Empty>
      ) : (
        data.news.map((n, i) => {
          const url = n.slug ? `${apiBase}/news/${n.slug}` : `${apiBase}/news`;
          return (
            <Pressable key={`${n.slug ?? n.title}-${i}`} onPress={() => Linking.openURL(url)}>
              <Card>
                <Text style={styles.date}>{n.date}</Text>
                <Text style={styles.title}>{n.title}</Text>
                {n.body ? <Text style={styles.body}>{n.body}</Text> : null}
                <Text style={styles.read}>Read more →</Text>
              </Card>
            </Pressable>
          );
        })
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 60 },
  date: { color: colors.gold, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  title: { color: colors.green, fontSize: 18, fontWeight: "700", marginTop: 4 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 20, marginTop: 6 },
  read: { color: colors.green3, fontWeight: "600", marginTop: 10 },
});
