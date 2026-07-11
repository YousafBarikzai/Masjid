import { Fragment } from "react";
import { Text } from "react-native";
import { useSnapshot } from "../../src/useSnapshot";
import { Page, Card, ListRow, Divider, Empty } from "../../src/ui";
import { openInApp } from "../../src/actions";

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
  const links = data?.app?.mediaLinks ?? [];
  const youtube = data?.app?.youtube;

  function open(url: string) {
    openInApp(url);
  }

  return (
    <Page eyebrow="Watch & listen" title="Media" offline={offline} onRefresh={refresh}>
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
