import { Fragment, useCallback, useEffect, useState } from "react";
import { Text, View, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSnapshot } from "../../src/useSnapshot";
import { fetchKhutbahs, rememberKhutbahs } from "../../src/api";
import type { Khutbah } from "../../src/types";
import { Page, Card, ListRow, Divider, PressCard, Press, Reveal, Skeleton, Empty } from "../../src/ui";
import { openInApp } from "../../src/actions";
import { colors, radius, space, type as t } from "../../src/theme";

/* Media — the Live broadcast up top, then the Friday khutbah archive as a
   calendar of Fridays (newest first, straight from the CMS: publish a khutbah
   after Jumuʿah and it appears here within a minute). Tapping a Friday opens
   the full page: the video, a written summary to read or listen to, and the
   key lessons. Any extra CMS media links follow underneath. */

const CACHE_KEY = "kma-khutbahs";

const KIND_ICON: Record<string, string> = {
  video: "▶️",
  audio: "🎧",
  pdf: "📄",
  link: "🔗",
};

/** "Friday 17 July" from an ISO date. */
function fridayTitle(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

/** { day: "17", mon: "JUL" } for the date badge. */
function badgeParts(iso: string): { day: string; mon: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "–", mon: "" };
  return {
    day: String(d.getDate()),
    mon: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
  };
}

/** One Friday in the archive: date badge · Friday title · sermon title. */
function KhutbahRow({
  k,
  latest,
  last,
  onPress,
}: {
  k: Khutbah;
  latest: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const badge = badgeParts(k.dateISO);
  return (
    <>
      <Press onPress={onPress} scaleTo={0.98}>
        <View style={s.row}>
          <View style={s.badge}>
            <Text style={s.badgeDay}>{badge.day}</Text>
            <Text style={s.badgeMon}>{badge.mon}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={s.titleRow}>
              <Text style={s.rowTitle} numberOfLines={1}>
                {fridayTitle(k.dateISO) || k.date}
              </Text>
              {latest ? (
                <View style={s.latest}>
                  <Text style={s.latestText}>LATEST</Text>
                </View>
              ) : null}
            </View>
            {k.title ? (
              <Text style={s.rowSub} numberOfLines={1}>
                {k.title}
                {k.khatib ? ` · ${k.khatib}` : ""}
              </Text>
            ) : null}
          </View>
          <Text style={s.chev}>›</Text>
        </View>
      </Press>
      {!last ? <Divider /> : null}
    </>
  );
}

export default function Media() {
  const { data, offline, refresh } = useSnapshot();
  const router = useRouter();
  const links = data?.app?.mediaLinks ?? [];

  const [docs, setDocs] = useState<Khutbah[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFirst = useCallback(async () => {
    try {
      const res = await fetchKhutbahs(1);
      setDocs(res.docs);
      setPage(1);
      setHasMore(res.hasMore);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(res)).catch(() => {});
    } catch {
      // Offline: fall back to the saved first page.
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const res = JSON.parse(raw) as { docs: Khutbah[] };
          rememberKhutbahs(res.docs);
          setDocs((d) => d ?? res.docs);
          setHasMore(false);
        }
      } catch {
        /* nothing cached yet */
      }
    }
  }, []);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  async function showEarlier() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchKhutbahs(page + 1);
      setDocs((d) => [...(d ?? []), ...res.docs]);
      setPage(res.page);
      setHasMore(res.hasMore);
    } catch {
      /* keep what we have */
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <Page
      eyebrow="Watch & listen"
      title="Media"
      offline={offline}
      onRefresh={() => {
        refresh();
        loadFirst();
      }}
    >
      {/* Live streams — unchanged */}
      <PressCard onPress={() => router.push("/live" as never)} style={s.liveCard}>
        <View style={s.liveRow}>
          <View style={s.liveIcon}>
            <Text style={{ fontSize: 22 }}>📡</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.liveTitle}>Live broadcast</Text>
            <Text style={s.liveSub}>Makkah live 24/7 · Kingston Masjid when streaming</Text>
          </View>
          <Text style={s.chev}>›</Text>
        </View>
      </PressCard>

      {/* Friday khutbah archive */}
      <View style={s.secHead}>
        <Text style={s.secTitle}>Previous Friday khutbahs</Text>
        <Text style={s.secSub}>Every Friday sermon · newest first</Text>
      </View>

      {docs === null ? (
        <Card style={{ paddingVertical: 6 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.row, { opacity: 1 }]}>
              <Skeleton width={48} height={52} radius={13} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton height={15} width="55%" />
                <Skeleton height={11} width="80%" />
              </View>
            </View>
          ))}
        </Card>
      ) : docs.length ? (
        <>
          <Reveal>
            <Card style={{ paddingVertical: 4 }}>
              {docs.map((k, i) => (
                <KhutbahRow
                  key={k.slug}
                  k={k}
                  latest={i === 0}
                  last={i === docs.length - 1}
                  onPress={() => router.push(`/khutbah/${k.slug}` as never)}
                />
              ))}
            </Card>
          </Reveal>

          {hasMore ? (
            loadingMore ? (
              <View style={s.moreLoading}>
                <ActivityIndicator color={colors.goldSoft} />
              </View>
            ) : (
              <Press onPress={showEarlier} scaleTo={0.95} style={s.moreBtn}>
                <Text style={s.moreText}>Show earlier Fridays</Text>
                <Ionicons name="chevron-down" size={14} color={colors.goldSoft} />
              </Press>
            )
          ) : docs.length > 6 ? (
            <Text style={s.end}>— that's every khutbah in the archive —</Text>
          ) : null}
        </>
      ) : (
        <Card>
          <Empty text="Khutbahs will appear here after Jumuʿah — check back on Friday." />
        </Card>
      )}

      {/* Extra CMS media links, when staff have added any */}
      {links.length ? (
        <>
          <View style={s.secHead}>
            <Text style={s.secTitle}>More to watch &amp; listen</Text>
          </View>
          <Card style={{ paddingVertical: 4 }}>
            {links.map((m, i) => (
              <Fragment key={`${m.url}-${i}`}>
                <ListRow icon={KIND_ICON[m.kind] ?? "🔗"} title={m.label} onPress={() => openInApp(m.url)} />
                {i < links.length - 1 ? <Divider /> : null}
              </Fragment>
            ))}
          </Card>
        </>
      ) : null}

      <Text style={s.foot}>Links open safely inside the app</Text>
    </Page>
  );
}

const s = StyleSheet.create({
  liveCard: {
    borderColor: "rgba(224,83,61,0.4)",
    backgroundColor: "rgba(224,83,61,0.08)",
    paddingVertical: space.md,
  },
  liveRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  liveIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(224,83,61,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  liveSub: { color: colors.textDim, fontSize: t.small, marginTop: 1 },
  chev: { color: colors.textFaint, fontSize: 22, fontWeight: "300" },

  secHead: { marginTop: space.md, marginBottom: 2, paddingHorizontal: 2, gap: 2 },
  secTitle: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.3 },
  secSub: { color: colors.textFaint, fontSize: t.small },

  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 11 },
  badge: {
    width: 48,
    height: 52,
    borderRadius: 13,
    backgroundColor: "rgba(201,162,39,0.12)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDay: { color: colors.goldSoft, fontSize: 18, fontWeight: "800", letterSpacing: -0.5, lineHeight: 21 },
  badgeMon: { color: colors.textFaint, fontSize: 9, fontWeight: "800", letterSpacing: 1.2, marginTop: -1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  rowTitle: { color: colors.text, fontSize: t.body, fontWeight: "700", flexShrink: 1 },
  latest: {
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.55)",
    backgroundColor: "rgba(201,162,39,0.14)",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  latestText: { color: colors.goldSoft, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  rowSub: { color: colors.textFaint, fontSize: t.small, marginTop: 2 },

  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.5)",
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 2,
  },
  moreText: { color: colors.goldSoft, fontSize: t.small, fontWeight: "800" },
  moreLoading: { paddingVertical: 12, alignItems: "center" },
  end: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingVertical: 8 },

  foot: { color: "rgba(244,239,226,0.4)", fontSize: 11, textAlign: "center", marginTop: space.sm },
});
