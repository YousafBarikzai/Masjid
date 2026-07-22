import { Text, StyleSheet, Share, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContent } from "../../src/useContent";
import { Page, Card, Sections, GoldButton, Empty, Reveal } from "../../src/ui";
import { apiBase, absUrl, recallArticle } from "../../src/api";
import { colors, radius, space } from "../../src/theme";

/* Native news article reader — the full post rendered in the app's own
   typography, with the lead image as a soft hero when the CMS has one. Works
   for any article the app has seen (cached feed or any paginated page). */

export default function Article() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { content, loading } = useContent();
  const a = recallArticle(slug) ?? content?.articles.find((x) => x.slug === slug);

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
      {a.image ? (
        <Reveal>
          <Image source={{ uri: absUrl(a.image) }} style={s.hero} resizeMode="cover" onError={() => {}} />
        </Reveal>
      ) : null}
      <Reveal delay={60}>
        <Card style={{ gap: space.md }}>
          {sections.length ? <Sections sections={sections} /> : <Text style={s.body}>{a.excerpt}</Text>}
        </Card>
      </Reveal>
      <Reveal delay={120}>
        <GoldButton compact label="Share this notice" onPress={share} />
      </Reveal>
    </Page>
  );
}

const s = StyleSheet.create({
  hero: { height: 190, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.05)" },
  body: { color: colors.textDim, fontSize: 15, lineHeight: 24 },
});
