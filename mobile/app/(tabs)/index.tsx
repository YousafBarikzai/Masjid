import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSnapshot } from "../../src/useSnapshot";
import { Page, Card, Section, tap, Empty } from "../../src/ui";
import { CountdownRing } from "../../src/CountdownRing";
import { colors, radius, space, type as t } from "../../src/theme";
import { absUrl } from "../../src/api";
import { useRouter } from "expo-router";

/* Home — the daily glance: greeting, live next-prayer ring, today's times,
   the mosque announcement, CMS-managed quick actions, events & news. */

function openLink(url: string) {
  const abs = absUrl(url);
  if (/^https?:\/\//i.test(abs)) WebBrowser.openBrowserAsync(abs).catch(() => Linking.openURL(abs));
  else Linking.openURL(abs).catch(() => {});
}

export default function Home() {
  const { data, offline, refresh } = useSnapshot();
  const router = useRouter();

  const quick = (data?.app?.quickLinks?.length
    ? data.app.quickLinks
    : [
        { icon: "💛", label: "Donate", url: data?.app?.donateUrl || "/donate" },
        { icon: "🕌", label: "Jumuʿah", url: "/jummah" },
        { icon: "🧭", label: "Qibla", url: "/qibla" },
        { icon: "📖", label: "Education", url: "/education" },
      ]
  ).slice(0, 4);

  return (
    <Page
      eyebrow={data?.date.hijri || ""}
      title={data?.app?.welcome || "As-salāmu ʿalaykum"}
      subtitle={data?.date.gregorian}
      offline={offline}
      refreshing={false}
      onRefresh={refresh}
    >
      {/* Announcement banner */}
      {data?.announcement?.enabled && data.announcement.message ? (
        <View style={s.notice}>
          <Text style={s.noticeTag}>{data.announcement.label || "Notice"}</Text>
          <Text style={s.noticeText}>{data.announcement.message}</Text>
        </View>
      ) : null}

      {/* Live countdown hero */}
      <Card style={s.hero}>
        {data ? (
          <CountdownRing rows={data.prayers} fallback={data.nextPrayer} />
        ) : (
          <Empty text="Loading prayer times…" />
        )}

        {/* Today's rows */}
        {data ? (
          <View style={s.todayRows}>
            {data.prayers
              .filter((p) => !p.isInfo)
              .map((p) => {
                const isNext =
                  !data.nextPrayer.tomorrow && p.en === data.nextPrayer.name;
                return (
                  <View key={p.key} style={[s.prow, isNext && s.prowNext]}>
                    <Text style={[s.pname, isNext && s.pnameNext]}>{p.en}</Text>
                    <Text style={[s.par, isNext && { color: "rgba(12,51,34,0.7)" }]}>{p.ar}</Text>
                    <Text style={[s.ptime, isNext && s.ptimeNext]}>{p.jamaah ?? p.begins}</Text>
                  </View>
                );
              })}
          </View>
        ) : null}
      </Card>

      {/* Jummah strip on Fridays */}
      {data?.isFriday && data.jummah?.length ? (
        <Card style={s.jummah}>
          <Text style={s.jummahTitle}>Jumuʿah today</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {data.jummah.map((j, i) => (
              <Text key={i} style={s.jummahItem}>
                {j.name ? `${j.name} ` : ""}
                <Text style={{ color: colors.goldHot, fontWeight: "800" }}>{j.khutbah}</Text>
              </Text>
            ))}
          </View>
        </Card>
      ) : null}

      {/* Quick actions (CMS-managed) */}
      <View style={s.quickRow}>
        {quick.map((q) => (
          <Pressable
            key={q.label}
            style={({ pressed }) => [s.quick, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={() => {
              tap();
              openLink(q.url);
            }}
          >
            <Text style={s.quickIcon}>{q.icon}</Text>
            <Text style={s.quickLabel} numberOfLines={1}>
              {q.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Upcoming events */}
      {data?.events?.length ? (
        <>
          <Section title="Upcoming events" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {data.events.slice(0, 6).map((e, i) => (
              <Pressable
                key={`${e.title}-${i}`}
                style={({ pressed }) => [s.eventCard, pressed && { opacity: 0.8 }]}
                onPress={() => {
                  tap();
                  openLink(e.href || "/events");
                }}
              >
                {e.tag ? <Text style={s.eventTag}>{e.tag.toUpperCase()}</Text> : null}
                <Text style={s.eventTitle} numberOfLines={2}>
                  {e.title}
                </Text>
                <Text style={s.eventBody} numberOfLines={2}>
                  {e.body}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* Latest news */}
      {data?.news?.length ? (
        <>
          <Section title="Latest news" action="All news" onAction={() => router.push("/news")} />
          {data.news.slice(0, 2).map((n, i) => (
            <Pressable
              key={n.slug ?? i}
              onPress={() => {
                tap();
                openLink(n.slug ? `/news/${n.slug}` : "/news");
              }}
            >
              <Card style={{ gap: 4 }}>
                <Text style={s.newsDate}>{n.date}</Text>
                <Text style={s.newsTitle}>{n.title}</Text>
                <Text style={s.newsBody} numberOfLines={2}>
                  {n.body}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      ) : null}
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
  noticeTag: {
    color: colors.goldSoft,
    fontSize: t.tiny,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  noticeText: { color: colors.text, fontSize: t.small, lineHeight: 19 },
  hero: { alignItems: "center", paddingVertical: space.xl },
  todayRows: { alignSelf: "stretch", marginTop: space.lg, gap: 2 },
  prow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  prowNext: { backgroundColor: colors.gold },
  pname: { color: colors.text, fontWeight: "700", fontSize: t.body, width: 86 },
  pnameNext: { color: colors.onGold },
  par: { color: colors.textFaint, fontSize: t.small, flex: 1 },
  ptime: { color: colors.text, fontWeight: "800", fontSize: t.body, fontVariant: ["tabular-nums"] },
  ptimeNext: { color: colors.onGold },
  jummah: { gap: 6 },
  jummahTitle: { color: colors.goldSoft, fontWeight: "800", fontSize: t.small, letterSpacing: 1, textTransform: "uppercase" },
  jummahItem: { color: colors.textDim, fontSize: t.body },
  quickRow: { flexDirection: "row", gap: 10 },
  quick: {
    flex: 1,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { color: colors.text, fontSize: t.tiny, fontWeight: "700" },
  eventCard: {
    width: 220,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: 6,
  },
  eventTag: { color: colors.mint, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1 },
  eventTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  eventBody: { color: colors.textFaint, fontSize: t.small, lineHeight: 18 },
  newsDate: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "700" },
  newsTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  newsBody: { color: colors.textFaint, fontSize: t.small, lineHeight: 19 },
});
