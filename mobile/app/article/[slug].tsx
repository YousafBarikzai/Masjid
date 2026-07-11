import { Text, StyleSheet, Share } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContent } from "../../src/useContent";
import { Page, Card, Sections, GoldButton, Empty } from "../../src/ui";
import { apiBase } from "../../src/api";
import { colors, space, type as t } from "../../src/theme";

/* Native news article reader — the full post, rendered from rich text into the
   app's own typography. No web view. */

export default function Article() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { content, loading } = useContent();
  const a = content?.articles.find((x) => x.slug === slug);

  if (!a) {
    return (
      <Page title="Article" back>
        <Card>
          <Empty text={loading ? "Loading…" : "This article couldn't be found."} />
        </Card>
      </Page>
    );
  }

  const sections = a.sections.length ? a.sections : a.excerpt ? [{ body: [a.excerpt] }] : [];

  async function share() {
    await Share.share({
      title: a!.title,
      message: `${a!.title}\n\n${a!.excerpt || ""}\n\nKingston Mosque · ${apiBase}/news/${a!.slug}`,
    }).catch(() => {});
  }

  return (
    <Page eyebrow={a.date} title={a.title} back>
      <Card style={{ gap: space.md }}>
        {sections.length ? <Sections sections={sections} /> : <Text style={s.body}>{a.excerpt}</Text>}
      </Card>
      <GoldButton compact label="Share this notice" onPress={share} />
    </Page>
  );
}

const s = StyleSheet.create({
  body: { color: colors.textDim, fontSize: t.body, lineHeight: 24 },
});
