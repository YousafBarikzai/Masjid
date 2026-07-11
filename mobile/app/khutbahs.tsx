import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchKhutbahs, rememberKhutbahs, absUrl } from "../src/api";
import type { Khutbah } from "../src/types";
import { Page, Card, Press, Reveal, Skeleton, Empty, GoldButton } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";

/* Khutbah Archive — every Friday sermon, newest first, as cinematic cards:
   full-bleed video thumbnail with a floating play button, then the date,
   khatib, title and a short preview. Ten at a time with Load More; the first
   page is cached so the archive opens instantly (and works offline). */

const CACHE_KEY = "kma-khutbahs";

export default function Khutbahs() {
  const router = useRouter();

  const [docs, setDocs] = useState<Khutbah[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadFirst = useCallback(async () => {
    try {
      const res = await fetchKhutbahs(1);
      setDocs(res.docs);
      setPage(1);
      setHasMore(res.hasMore);
      setTotalDocs(res.totalDocs);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(res)).catch(() => {});
    } catch {
      // Offline: show the saved first page if we have one.
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const res = JSON.parse(raw) as { docs: Khutbah[]; hasMore: boolean; totalDocs: number };
          rememberKhutbahs(res.docs);
          setDocs((d) => d ?? res.docs);
          setHasMore(false);
          setTotalDocs(res.totalDocs);
        }
      } catch {
        /* nothing cached yet */
      }
    }
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  async function refresh() {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchKhutbahs(page + 1);
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

  return (
    <Page
      eyebrow="Friday sermons"
      title="Khutbah Archive"
      subtitle="Watch, read or listen — every week"
      back
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {docs === null ? (
        <>
          {[0, 1, 2].map((i) => (
            <Card key={i} style={{ gap: 10, padding: 0, overflow: "hidden" }}>
              <Skeleton height={176} radius={0} />
              <View style={{ padding: space.lg, gap: 8 }}>
                <Skeleton width={140} height={10} />
                <Skeleton height={18} width="85%" />
                <Skeleton height={12} />
              </View>
            </Card>
          ))}
        </>
      ) : docs.length ? (
        <>
          {docs.map((k, i) => (
            <Reveal key={k.slug} delay={Math.min(i, 6) * 55}>
              <Press style={s.cardPress} onPress={() => router.push(`/khutbah/${k.slug}` as never)}>
                <Card style={s.card}>
                  {/* Thumbnail with floating play button */}
                  <View style={s.thumbWrap}>
                    {k.thumbnail ? (
                      <Image source={{ uri: absUrl(k.thumbnail) }} style={s.thumb} resizeMode="cover" onError={() => {}} />
                    ) : (
                      <View style={[s.thumb, s.thumbFallback]}>
                        <Text style={{ fontSize: 40 }}>🕌</Text>
                      </View>
                    )}
                    <View style={s.thumbShade} />
                    {k.videoId ? (
                      <View style={s.play}>
                        <Ionicons name="play" size={22} color={colors.onGold} style={{ marginLeft: 3 }} />
                      </View>
                    ) : null}
                  </View>

                  <View style={s.body}>
                    <Text style={s.meta}>
                      {k.date}
                      {k.khatib ? `  ·  ${k.khatib}` : ""}
                    </Text>
                    <Text style={s.title}>{k.title}</Text>
                    {k.excerpt ? (
                      <Text style={s.excerpt} numberOfLines={2}>
                        {k.excerpt}
                      </Text>
                    ) : null}
                    <View style={s.watchRow}>
                      <Text style={s.watch}>{k.videoId ? "Watch the khutbah" : "Read the khutbah"}</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.goldSoft} />
                    </View>
                  </View>
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
              <GoldButton compact label={`Load more · ${docs.length} of ${totalDocs}`} onPress={loadMore} />
            )
          ) : docs.length > 3 ? (
            <Text style={s.end}>— that's every khutbah in the archive —</Text>
          ) : null}
        </>
      ) : (
        <Card>
          <Empty text="Khutbahs will appear here after Jumuʿah — check back on Friday." />
        </Card>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  cardPress: { marginBottom: 2 },
  card: { padding: 0, overflow: "hidden", gap: 0 },
  thumbWrap: { height: 176 },
  thumb: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(255,255,255,0.05)" },
  thumbFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  thumbShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,31,21,0.18)",
  },
  play: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  body: { padding: space.lg, gap: 6 },
  meta: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "800", letterSpacing: 0.4 },
  title: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.3, lineHeight: 26 },
  excerpt: { color: colors.textDim, fontSize: t.small, lineHeight: 20 },
  watchRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  watch: { color: colors.goldSoft, fontSize: t.small, fontWeight: "800" },
  loadingMore: { paddingVertical: 14, alignItems: "center" },
  end: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingVertical: 10 },
});
