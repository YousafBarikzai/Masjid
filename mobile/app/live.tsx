import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { fetchLive } from "../src/api";
import type { LiveFeed } from "../src/types";
import { YouTubePlayer } from "../src/YouTubePlayer";
import { Page, Card, Section, ListRow, Divider, GoldButton, Reveal, Skeleton } from "../src/ui";
import { openInApp } from "../src/actions";
import { colors, radius, space, type as t } from "../src/theme";

/* Live Broadcast — two streams on one page:
     · Kingston Masjid: appears automatically whenever the mosque goes live on
       YouTube (detected server-side, or via the link staff paste in the admin).
       When nothing is live, a friendly message + recent recordings show instead.
     · Makkah: the official KSA Qur'an TV stream of Masjid al-Ḥaram
       (Saudi Broadcasting Authority), live around the clock.
   The page re-checks every minute while open, so a stream that starts while
   you're reading appears by itself. */

const CHECK_EVERY_MS = 60_000;

/** Pulsing red LIVE badge. */
function LiveBadge() {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <View style={s.liveBadge}>
      <Animated.View style={[s.liveDot, { opacity: v }]} />
      <Text style={s.liveText}>LIVE</Text>
    </View>
  );
}

export default function Live() {
  const [feed, setFeed] = useState<LiveFeed | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setFeed(await fetchLive());
    } catch {
      /* keep the previous state; pull-to-refresh retries */
    }
  }, []);

  // Load now, then keep checking quietly so a stream that starts while the
  // page is open appears on its own.
  useEffect(() => {
    load();
    const timer = setInterval(load, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const kingston = feed?.kingston;
  const kingstonLive = !!kingston?.live && !!kingston.embedUrl;
  const recent = feed?.recent ?? [];

  return (
    <Page
      eyebrow="Watch live"
      title="Live Broadcast"
      subtitle="Kingston Masjid & Masjid al-Ḥaram"
      back
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {/* ------------------------- Kingston Masjid ------------------------- */}
      <Section title="Kingston Masjid" />
      {!feed ? (
        <Card style={{ gap: 12 }}>
          <Skeleton height={190} radius={radius.md} />
          <Skeleton height={14} width="55%" />
        </Card>
      ) : kingstonLive ? (
        <Reveal>
          <Card style={{ gap: space.md }}>
            <View style={s.liveHead}>
              <LiveBadge />
              <Text style={s.liveTitle} numberOfLines={2}>
                {kingston?.title || "Kingston Masjid is live now"}
              </Text>
            </View>
            <YouTubePlayer embedUrl={kingston!.embedUrl} watchUrl={kingston?.channelUrl} />
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <Card style={s.emptyCard}>
            <Text style={s.emptyIcon}>📡</Text>
            <Text style={s.emptyTitle}>No live broadcast is currently available</Text>
            <Text style={s.emptyBody}>
              Friday khutbahs, Eid prayers and special programmes are streamed here. When the masjid
              goes live, the stream appears on this page automatically.
            </Text>
            {kingston?.channelUrl ? (
              <GoldButton compact label="Visit our YouTube channel" onPress={() => openInApp(kingston.channelUrl)} />
            ) : null}
          </Card>
        </Reveal>
      )}

      {/* Recent recordings (when the server can list them) */}
      {recent.length ? (
        <>
          <Section title="Recent recordings" />
          <Card style={{ paddingVertical: 4 }}>
            {recent.map((r, i) => (
              <Fragment key={r.videoId}>
                <ListRow
                  icon="▶️"
                  title={r.title}
                  sub={r.published}
                  onPress={() => openInApp(`https://www.youtube.com/watch?v=${r.videoId}`)}
                />
                {i < recent.length - 1 ? <Divider /> : null}
              </Fragment>
            ))}
          </Card>
        </>
      ) : null}

      {/* ------------------------ Makkah, 24/7 live ------------------------ */}
      <Section title="Makkah — Masjid al-Ḥaram" />
      {!feed ? (
        <Card>
          <Skeleton height={190} radius={radius.md} />
        </Card>
      ) : (
        <Reveal delay={90}>
          <Card style={{ gap: 10 }}>
            <View style={s.liveHead}>
              <LiveBadge />
              <Text style={s.liveTitle}>Live from the Ḥaram, around the clock</Text>
            </View>
            <YouTubePlayer embedUrl={feed.makkah.embedUrl} />
            <Text style={s.attribution}>{feed.makkah.attribution}</Text>
          </Card>
        </Reveal>
      )}

      <Text style={s.foot}>
        This page checks for a live stream every minute — pull down to refresh sooner.
      </Text>
    </Page>
  );
}

const s = StyleSheet.create({
  liveHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(224,83,61,0.16)",
    borderColor: "rgba(224,83,61,0.45)",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger },
  liveText: { color: colors.text, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1 },
  liveTitle: { color: colors.text, fontSize: t.small, fontWeight: "700", flex: 1 },

  emptyCard: { alignItems: "center", gap: 10, paddingVertical: space.xl },
  emptyIcon: { fontSize: 34 },
  emptyTitle: { color: colors.text, fontSize: t.body, fontWeight: "800", textAlign: "center" },
  emptyBody: {
    color: colors.textDim,
    fontSize: t.small,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: space.md,
    marginBottom: 4,
  },

  attribution: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center" },
  foot: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingHorizontal: space.lg },
});
