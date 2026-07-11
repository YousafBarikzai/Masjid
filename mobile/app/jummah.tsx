import { View, Text, StyleSheet } from "react-native";
import { useContent } from "../src/useContent";
import { useSnapshot } from "../src/useSnapshot";
import { Page, Card, Section, Empty } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";

/* Native Jumuʿah times — the Friday congregations with khutbah times, doors
   and language, rendered inside the app. */

export default function Jummah() {
  const { content } = useContent();
  const { data } = useSnapshot();
  const j = content?.jummah;
  const congregations = j?.congregations ?? data?.jummah ?? [];

  return (
    <Page eyebrow="Friday prayer" title="Jumuʿah" subtitle={data?.date.gregorian} back>
      {j?.intro ? <Text style={s.intro}>{j.intro}</Text> : null}

      <Section title="Congregations" />
      {congregations.length ? (
        congregations.map((c, i) => (
          <Card key={`${c.name}-${i}`} style={s.cong}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.name}>{c.name || `Jumuʿah ${i + 1}`}</Text>
              <View style={s.meta}>
                {c.language ? <Text style={s.metaItem}>🗣️ {c.language}</Text> : null}
                {c.doors ? <Text style={s.metaItem}>🚪 Doors {c.doors}</Text> : null}
              </View>
            </View>
            <View style={s.timeBox}>
              <Text style={s.timeLabel}>KHUTBAH</Text>
              <Text style={s.time}>{c.khutbah || "—"}</Text>
            </View>
          </Card>
        ))
      ) : (
        <Card>
          <Empty text="Jumuʿah times will appear here shortly." />
        </Card>
      )}

      <Card style={s.tip}>
        <Text style={s.tipText}>
          Please arrive early — the prayer hall fills quickly for Jumuʿah. Overflow space and the women's hall are
          available. Timings update automatically from the mosque.
        </Text>
      </Card>
    </Page>
  );
}

const s = StyleSheet.create({
  intro: { color: colors.textDim, fontSize: t.body, lineHeight: 23 },
  cong: { flexDirection: "row", alignItems: "center", gap: space.md },
  name: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.2 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { color: colors.textFaint, fontSize: t.small },
  timeBox: { alignItems: "flex-end" },
  timeLabel: { color: colors.textFaint, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1 },
  time: { color: colors.goldSoft, fontSize: 26, fontWeight: "800", fontVariant: ["tabular-nums"] },
  tip: { backgroundColor: "rgba(201,162,39,0.10)", borderColor: "rgba(201,162,39,0.30)" },
  tipText: { color: colors.textDim, fontSize: t.small, lineHeight: 20 },
});
