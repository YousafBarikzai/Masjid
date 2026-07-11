import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContent } from "../../src/useContent";
import { useSnapshot } from "../../src/useSnapshot";
import { Page, Card, Sections, GoldButton, Empty } from "../../src/ui";
import { colors, space, type as t } from "../../src/theme";
import { callMosque, emailMosque } from "../../src/actions";

/* Native detail screen for any mosque service or information page. Renders the
   structured content (intro, sections, bullets) and turns the page's call-to-
   action into native tap-to-call / tap-to-email — no web view. */

export default function ServiceDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { content, loading } = useContent();
  const { data } = useSnapshot();
  const svc = content?.services.find((s) => s.slug === slug);
  const c = data?.contact ?? content?.contact;

  if (!svc) {
    return (
      <Page title="Service" back>
        <Card>
          <Empty text={loading ? "Loading…" : "This page couldn't be found."} />
        </Card>
      </Page>
    );
  }

  return (
    <Page eyebrow={`${svc.icon}  Service`} title={svc.title} back>
      <Card style={{ gap: space.lg }}>
        <Text style={s.intro}>{svc.intro}</Text>
        {svc.sections.length ? <Sections sections={svc.sections} /> : null}
      </Card>

      {svc.cta ? (
        <Card style={{ gap: space.md }}>
          {svc.cta.heading ? <Text style={s.ctaHeading}>{svc.cta.heading}</Text> : null}
          {svc.cta.body ? <Text style={s.ctaBody}>{svc.cta.body}</Text> : null}
          <View style={{ flexDirection: "row", gap: 10 }}>
            {c?.phoneHref ? (
              <View style={{ flex: 1 }}>
                <GoldButton compact label="📞  Call the mosque" onPress={() => callMosque(c.phoneHref)} />
              </View>
            ) : null}
          </View>
          {c?.email ? (
            <Text style={s.email} onPress={() => emailMosque(c.email, `Enquiry — ${svc.title}`)}>
              ✉️  {c.email}
            </Text>
          ) : null}
        </Card>
      ) : null}
    </Page>
  );
}

const s = StyleSheet.create({
  intro: { color: colors.text, fontSize: t.h2 * 0.82, lineHeight: 26, fontWeight: "600" },
  ctaHeading: { color: colors.goldSoft, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.2 },
  ctaBody: { color: colors.textDim, fontSize: t.body, lineHeight: 23 },
  email: { color: colors.goldSoft, fontSize: t.body, fontWeight: "700", textAlign: "center", paddingVertical: 4 },
});
