import { View, Text, StyleSheet, Share, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContent } from "../../src/useContent";
import { Page, Card, Sections, GoldButton, Empty, Reveal } from "../../src/ui";
import { openInApp } from "../../src/actions";
import { slugify } from "../../src/nav";
import { apiBase, absUrl } from "../../src/api";
import { colors, radius, space, type as t } from "../../src/theme";

/* Native event detail — Eid Prayer, Tarāwīḥ, Iʿtikāf and every other event
   opens here inside the app: tag, when & where, full description, and a
   registration button when the event has one. */

export default function EventDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { content, loading } = useContent();
  const ev =
    content?.events.find((e) => e.slug === slug) ??
    // graceful fallback: match by slugified title (older cards without slugs)
    content?.events.find((e) => slugify(e.title) === slug);

  if (!ev) {
    return (
      <Page title="Event" back>
        <Card>
          <Empty text={loading ? "Loading…" : "This event couldn't be found."} />
        </Card>
      </Page>
    );
  }

  const sections = ev.sections.length ? ev.sections : ev.summary ? [{ body: [ev.summary] }] : [];

  async function share() {
    await Share.share({
      title: ev!.title,
      message: `${ev!.title}${ev!.when ? ` — ${ev!.when}` : ""}${ev!.where ? ` at ${ev!.where}` : ""}\n\n${ev!.summary}\n\nKingston Mosque · ${apiBase}/events`,
    }).catch(() => {});
  }

  return (
    <Page eyebrow={ev.tag.toUpperCase()} title={ev.title} back>
      {ev.image ? (
        <Reveal>
          <Image source={{ uri: absUrl(ev.image) }} style={s.hero} resizeMode="cover" onError={() => {}} />
        </Reveal>
      ) : null}
      {/* when & where */}
      <Card style={s.meta}>
        {ev.when ? (
          <View style={s.metaRow}>
            <Text style={s.metaIcon}>🗓️</Text>
            <View>
              <Text style={s.metaLabel}>WHEN</Text>
              <Text style={s.metaValue}>{ev.when}</Text>
            </View>
          </View>
        ) : null}
        {ev.where ? (
          <View style={s.metaRow}>
            <Text style={s.metaIcon}>📍</Text>
            <View>
              <Text style={s.metaLabel}>WHERE</Text>
              <Text style={s.metaValue}>{ev.where}</Text>
            </View>
          </View>
        ) : null}
      </Card>

      {sections.length ? (
        <Card style={{ gap: space.md }}>
          <Sections sections={sections} />
        </Card>
      ) : null}

      {ev.registrationUrl ? <GoldButton label="Register for this event" onPress={() => openInApp(ev.registrationUrl)} /> : null}
      <GoldButton compact label="Share this event" onPress={share} />
    </Page>
  );
}

const s = StyleSheet.create({
  hero: { height: 190, borderRadius: radius.lg, backgroundColor: "rgba(255,255,255,0.05)" },
  meta: { gap: space.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaIcon: { fontSize: 22 },
  metaLabel: { color: colors.textFaint, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1.2 },
  metaValue: { color: colors.text, fontSize: t.body, fontWeight: "700", marginTop: 1 },
});
