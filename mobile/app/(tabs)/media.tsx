import { Fragment } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSnapshot } from "../../src/useSnapshot";
import { Page, Card, ListRow, Divider, Empty, PressCard } from "../../src/ui";
import { openInApp } from "../../src/actions";
import { colors, space, type as t } from "../../src/theme";

/* Media — khutbahs, lectures and multimedia links, managed entirely from the
   CMS (admin → Mobile App → Media links). Video/audio are third-party (YouTube,
   podcasts) so they play in the in-app browser sheet, which presents over the
   app without leaving it. */

const KIND_ICON: Record<string, string> = {
  video: "▶️",
  audio: "🎧",
  pdf: "📄",
  link: "🔗",
};

export default function Media() {
  const { data, offline, refresh } = useSnapshot();
  const router = useRouter();
  const links = data?.app?.mediaLinks ?? [];
  const youtube = data?.app?.youtube;

  function open(url: string) {
    openInApp(url);
  }

  return (
    <Page eyebrow="Watch & listen" title="Media" offline={offline} onRefresh={refresh}>
      {/* Live streams — the in-app player page */}
      <PressCard onPress={() => router.push("/live" as never)} style={s.liveCard}>
        <View style={s.liveRow}>
          <View style={s.liveIcon}>
            <Text style={{ fontSize: 22 }}>📡</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.liveTitle}>Live broadcast</Text>
            <Text style={s.liveSub}>Makkah live 24/7 · Kingston Masjid when streaming</Text>
          </View>
          <Text style={s.liveChev}>›</Text>
        </View>
      </PressCard>

      <Card style={{ paddingVertical: 4 }}>
        {youtube ? (
          <>
            <ListRow
              icon="📺"
              title="Kingston Mosque on YouTube"
              sub="Friday khutbahs, Qurʾān recitation & lectures"
              onPress={() => open(youtube)}
            />
            {links.length ? <Divider /> : null}
          </>
        ) : null}
        {links.map((m, i) => (
          <Fragment key={`${m.url}-${i}`}>
            <ListRow
              icon={KIND_ICON[m.kind] ?? "🔗"}
              title={m.label}
              onPress={() => open(m.url)}
            />
            {i < links.length - 1 ? <Divider /> : null}
          </Fragment>
        ))}
        {!youtube && links.length === 0 ? (
          <Empty text={data ? "Media links appear here once added in the admin (Mobile App → Media links)." : "Loading…"} />
        ) : null}
      </Card>
      <Text style={{ color: "rgba(244,239,226,0.4)", fontSize: 11, textAlign: "center" }}>
        Links open safely inside the app
      </Text>
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
  liveChev: { color: colors.textFaint, fontSize: 22, fontWeight: "300" },
});
