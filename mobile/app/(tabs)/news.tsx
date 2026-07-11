import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSnapshot } from "../../src/useSnapshot";
import { useContent } from "../../src/useContent";
import { fetchArticles, absUrl } from "../../src/api";
import type { ArticleContent } from "../../src/types";
import { Page, Card, Press, Reveal, Skeleton, Empty, GoldButton } from "../../src/ui";
import { colors, radius, space, type as t } from "../../src/theme";

/* News — the mosque announcement pinned on top, then EVERY article from the
   CMS, ten at a time with Load More. Cards carry the lead image when one is
   set; tapping opens the native reader and returning restores this list
   exactly where it was (the tab stays mounted beneath the pushed screen). */

export default function News() {
  const { data, offline, refresh: refreshSnapshot } = useSnapshot();
  const { content, refresh: refreshContent } = useContent();
  const router = useRouter();

  const [docs, setDocs] = useState<ArticleContent[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFirst = useCallback(async () => {
    try {
      const res = await fetchArticles(1);
      setDocs(res.docs);
      setPage(1);
      setHasMore(res.hasMore);
      setTotalDocs(res.totalDocs);
    } catch {
      /* offline: fall back to the cached content feed below */
    }
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchArticles(page + 1);
      setDocs((d) => [...(d ?? []), ...res.docs]);
      setPage(res.page);
      setHasMore(res.hasMore);
      setTotalDocs(res.totalDocs);
    } catch {
      /* keep what we have */
    } finally {
      setLoadingMore(false);
    }
  }

  // Live list → cached feed → nothing yet.
  const list = docs ?? content?.articles ?? null;

  return (
    <Page
      eyebrow="Kingston Mosque"
      title="News & notices"
      offline={offline}
      onRefresh={() => {
        refreshSnapshot();
        refreshContent();
        loadFirst();
      }}
    >
      {data?.announcement?.enabled && data.announcement.message ? (
        <Reveal>
          <View style={s.notice}>
            <Text style={s.noticeTag}>{data.announcement.label || "Notice"}</Text>
            <Text style={s.noticeText}>{data.announcement.message}</Text>
          </View>
        </Reveal>
      ) : null}

      {list === null ? (
        // First-ever load: calm breathing placeholders, no spinner.
        <>
          {[0, 1, 2].map((i) => (
            <Card key={i} style={{ gap: 10 }}>
              <Skeleton height={148} radius={12} />
              <Skeleton width={90} height={10} />
              <Skeleton height={18} width="80%" />
              <Skeleton height={12} />
            </Card>
          ))}
        </>
      ) : list.length ? (
        <>
          {list.map((n, i) => (
            <Reveal key={n.slug || i} delay={Math.min(i, 6) * 55}>
              <Press
                style={s.cardPress}
                onPress={() => n.slug && router.push(`/article/${n.slug}` as never)}
              >
                <Card style={{ gap: 6, overflow: "hidden" }}>
                  {n.image ? (
                    <Image
                      source={{ uri: absUrl(n.image) }}
                      style={s.thumb}
                      resizeMode="cover"
                      // Missing/broken images fail silently — the card still works.
                      onError={() => {}}
                    />
                  ) : null}
                  <Text style={s.date}>{n.date}</Text>
                  <Text style={s.title}>{n.title}</Text>
                  {n.excerpt ? (
                    <Text style={s.body} numberOfLines={3}>
                      {n.excerpt}
                    </Text>
                  ) : null}
                  <Text style={s.more}>Read more →</Text>
                </Card>
              </Press>
            </Reveal>
          ))}

          {hasMore ? (
            loadingMore ? (
              <View style={s.loadingMore}>
                <ActivityIndicator color={colors.goldSoft} />
              </View>
            ) : (
              <GoldButton compact label={`Load more · ${list.length} of ${totalDocs}`} onPress={loadMore} />
            )
          ) : list.length > 3 ? (
            <Text style={s.end}>— you're all caught up —</Text>
          ) : null}
        </>
      ) : (
        <Card>
          <Empty text="No news yet — check back soon." />
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
  cardPress: { marginBottom: 2 },
  thumb: {
    height: 150,
    borderRadius: radius.md,
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  date: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "700" },
  title: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.2 },
  body: { color: colors.textDim, fontSize: t.small, lineHeight: 20 },
  more: { color: colors.goldSoft, fontSize: t.small, fontWeight: "800", marginTop: 2 },
  loadingMore: { paddingVertical: 14, alignItems: "center" },
  end: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingVertical: 10 },
});
