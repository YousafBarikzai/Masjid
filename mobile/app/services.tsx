import { Fragment } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useContent } from "../src/useContent";
import { useSnapshot } from "../src/useSnapshot";
import { Page, Card, Section, ListRow, Divider, Empty, Press } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";

/* Services — the native directory. Every service and information page opens
   inside the app; the dedicated tools (Donate, Qibla, Jumuʿah, Timetable) get
   a feature grid up top. Nothing here leaves the app. */

const FEATURES = [
  { icon: "💛", label: "Donate", route: "/donate" },
  { icon: "🧭", label: "Qibla", route: "/qibla" },
  { icon: "🕌", label: "Jumuʿah", route: "/jummah" },
  { icon: "🗓️", label: "Timetable", route: "/prayers" },
] as const;

export default function Services() {
  const { content, loading, refresh } = useContent();
  const { data } = useSnapshot();
  const router = useRouter();
  const services = content?.services ?? [];

  return (
    <Page eyebrow="Kingston Mosque" title="Services" subtitle="Everything the mosque offers" back onRefresh={refresh}>
      {/* Feature tools */}
      <View style={s.grid}>
        {FEATURES.map((f) => (
          <Press key={f.label} style={s.tile} scaleTo={0.94} onPress={() => router.push(f.route as never)}>
            <Text style={s.tileIcon}>{f.icon}</Text>
            <Text style={s.tileLabel}>{f.label}</Text>
          </Press>
        ))}
      </View>

      <Section title="All services & information" />
      <Card style={{ paddingVertical: 4 }}>
        {services.length ? (
          services.map((sv, i) => (
            <Fragment key={sv.slug}>
              <ListRow
                icon={sv.icon || "🕌"}
                title={sv.title}
                sub={sv.intro}
                onPress={() => router.push(`/service/${sv.slug}` as never)}
              />
              {i < services.length - 1 ? <Divider /> : null}
            </Fragment>
          ))
        ) : (
          <Empty text={loading ? "Loading services…" : "Services will appear here shortly."} />
        )}
      </Card>

      {/* Education / classes from the live feed, also native */}
      {data?.classes?.length ? (
        <>
          <Section title="Education & classes" />
          <Card style={{ paddingVertical: 4 }}>
            {data.classes.map((cl, i, arr) => (
              <Fragment key={`${cl.title}-${i}`}>
                <ListRow
                  icon={cl.icon || "📖"}
                  title={cl.title}
                  sub={cl.body}
                  onPress={() => router.push(`/service/madrasah` as never)}
                />
                {i < arr.length - 1 ? <Divider /> : null}
              </Fragment>
            ))}
          </Card>
        </>
      ) : null}

      <Text style={s.foot}>Every page opens inside the app — nothing here sends you to a browser.</Text>
    </Page>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 18,
    gap: 8,
  },
  tileIcon: { fontSize: 26 },
  tileLabel: { color: colors.text, fontSize: t.small, fontWeight: "800" },
  foot: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", marginTop: space.sm, paddingHorizontal: space.lg },
});
