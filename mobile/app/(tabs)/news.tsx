import { View, Text, StyleSheet, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSnapshot } from "../../src/useSnapshot";
import { Page, Card, tap, Empty } from "../../src/ui";
import { colors, radius, space, type as t } from "../../src/theme";
import { absUrl } from "../../src/api";

/* News — the mosque announcement pinned on top, then the latest articles.
   Tapping opens the full article in the in-app browser. */

export default function News() {
  const { data, offline, refresh } = useSnapshot();

  return (
    <Page eyebrow="Kingston Mosque" title="News & notices" offline={offline} onRefresh={refresh}>
      {data?.announcement?.enabled && data.announcement.message ? (
        <View style={s.notice}>
          <Text style={s.noticeTag}>{data.announcement.label || "Notice"}</Text>
          <Text style={s.noticeText}>{data.announcement.message}</Text>
        </View>
      ) : null}

      {data?.news?.length ? (
        data.news.map((n, i) => (
          <Pressable
            key={n.slug ?? i}
            onPress={() => {
              tap();
              WebBrowser.openBrowserAsync(absUrl(n.slug ? `/news/${n.slug}` : "/news")).catch(() => {});
            }}
          >
            <Card style={{ gap: 5 }}>
              <Text style={s.date}>{n.date}</Text>
              <Text style={s.title}>{n.title}</Text>
              <Text style={s.body} numberOfLines={3}>
                {n.body}
              </Text>
              <Text style={s.more}>Read more →</Text>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <Empty text={data ? "No news yet — check back soon." : "Loading news…"} />
        </Card>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  notice: {
    backgroundColor: "rgba(201,162,39,0.15)",
    borderColor: "rgba(201,162,39,0.45)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: 4,
  },
  noticeTag: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase" },
  noticeText: { color: colors.text, fontSize: t.small, lineHeight: 19 },
  date: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "700" },
  title: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.2 },
  body: { color: colors.textDim, fontSize: t.small, lineHeight: 20 },
  more: { color: colors.goldSoft, fontSize: t.small, fontWeight: "800", marginTop: 2 },
});
