import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { useContent } from "../src/useContent";
import { Page, Card, Section, GoldButton, Divider, tap, Empty } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";
import { openInApp, emailMosque } from "../src/actions";

/* Native Donate — pick a fund and amount inside the app; the secure card
   checkout opens in the in-app browser sheet only at the final step (the
   compliant way to take charitable donations). Bank transfer details are shown
   natively for those who prefer it. */

export default function Donate() {
  const { content, loading } = useContent();
  const d = content?.donation;
  const [fund, setFund] = useState(0);
  const [amount, setAmount] = useState<number | null>(null);

  if (!d) {
    return (
      <Page eyebrow="Support your masjid" title="Donate" back>
        <Card>
          <Empty text={loading ? "Loading…" : "Donation details will appear here shortly."} />
        </Card>
      </Page>
    );
  }

  const cat = d.categories[fund];

  function give() {
    if (!d?.donateUrl) return;
    tap();
    // Pass the chosen fund + amount to the giving page where supported.
    const params: string[] = [];
    if (cat) params.push(`fund=${encodeURIComponent(cat.title)}`);
    if (amount) params.push(`amount=${amount}`);
    const sep = d.donateUrl.includes("?") ? "&" : "?";
    openInApp(params.length ? `${d.donateUrl}${sep}${params.join("&")}` : d.donateUrl);
  }

  return (
    <Page eyebrow="Ṣadaqah jāriyah" title="Donate" subtitle={d.heading} back>
      {d.body ? <Text style={s.lede}>{d.body}</Text> : null}

      <Section title="Choose a fund" />
      <View style={{ gap: 10 }}>
        {d.categories.map((c, i) => {
          const on = i === fund;
          return (
            <Pressable
              key={c.title}
              onPress={() => {
                tap();
                setFund(i);
              }}
              style={[s.fund, on && s.fundOn]}
            >
              <Text style={s.fundIcon}>{c.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.fundTitle, on && { color: colors.onGold }]}>{c.title}</Text>
                <Text style={[s.fundBody, on && { color: "rgba(12,51,34,0.75)" }]} numberOfLines={2}>
                  {c.body}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {d.presets?.length ? (
        <>
          <Section title="Amount" />
          <View style={s.amounts}>
            {d.presets.map((p) => {
              const on = amount === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    tap();
                    setAmount(on ? null : p);
                  }}
                  style={[s.amt, on && s.amtOn]}
                >
                  <Text style={[s.amtText, on && { color: colors.onGold }]}>£{p}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {d.giftAid ? (
        <View style={s.giftaid}>
          <Text style={s.giftaidTitle}>✓ Gift Aid</Text>
          <Text style={s.giftaidBody}>
            UK taxpayers can add 25% at no extra cost — you'll be able to tick Gift Aid at checkout.
          </Text>
        </View>
      ) : null}

      {d.donateUrl ? (
        <GoldButton
          label={amount ? `💛  Give £${amount}${cat ? ` · ${cat.title}` : ""}` : "💛  Continue to secure checkout"}
          onPress={give}
        />
      ) : null}
      <Text style={s.secure}>🔒 Card, Apple Pay & Google Pay · opens securely inside the app</Text>

      {/* Bank transfer — fully native */}
      {d.bank?.length ? (
        <>
          <Section title="Prefer a bank transfer?" />
          <Card style={{ paddingVertical: 6 }}>
            {d.bank.map((b, i) => (
              <View key={b.label}>
                <View style={s.bankRow}>
                  <Text style={s.bankLabel}>{b.label}</Text>
                  <Text style={s.bankValue}>{b.value}</Text>
                </View>
                {i < d.bank.length - 1 ? <Divider /> : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {content?.contact?.email ? (
        <Text style={s.ask} onPress={() => emailMosque(content.contact.email, "Donation enquiry")}>
          Questions about giving or Zakāt? Email the office →
        </Text>
      ) : null}
    </Page>
  );
}

const s = StyleSheet.create({
  lede: { color: colors.textDim, fontSize: t.body, lineHeight: 23 },
  fund: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
  },
  fundOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  fundIcon: { fontSize: 24 },
  fundTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  fundBody: { color: colors.textFaint, fontSize: t.small, lineHeight: 18, marginTop: 2 },
  amounts: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amt: {
    minWidth: 66,
    alignItems: "center",
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  amtOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  amtText: { color: colors.text, fontWeight: "800", fontSize: t.body },
  giftaid: {
    backgroundColor: "rgba(62,207,142,0.10)",
    borderColor: "rgba(62,207,142,0.35)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    gap: 3,
  },
  giftaidTitle: { color: colors.mint, fontWeight: "800", fontSize: t.small },
  giftaidBody: { color: colors.textDim, fontSize: t.small, lineHeight: 19 },
  secure: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center" },
  bankRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, gap: 12 },
  bankLabel: { color: colors.textFaint, fontSize: t.small, fontWeight: "600" },
  bankValue: { color: colors.text, fontSize: t.body, fontWeight: "800", fontVariant: ["tabular-nums"] },
  ask: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700", textAlign: "center", paddingVertical: 6 },
});
