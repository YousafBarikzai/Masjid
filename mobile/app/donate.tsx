import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useContent } from "../src/useContent";
import { absUrl, createDonationSession, donationStatus } from "../src/api";
import { Page, Card, Section, GoldButton, Divider, Press, Reveal, tap, Empty } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";
import { openSheet, emailMosque } from "../src/actions";
import type { DonationCampaign } from "../src/types";

/* Donate — a modern fundraising experience:
   · CMS-managed campaigns (featured hero + cards, progress bars, images)
   · one-off / monthly toggle, preset chips + custom amount
   · secure in-app checkout (Apple Pay · Google Pay · cards) via Stripe when
     configured, with a native animated confirmation; graceful fallbacks to an
     external giving link or bank transfer otherwise. */

type Interval = "one_off" | "month";
type Outcome = null | "processing" | "success" | "incomplete";

/* Animated progress bar for campaign goals. */
function Progress({ raised, goal, thin }: { raised: number; goal: number; thin?: boolean }) {
  const frac = goal > 0 ? Math.min(raised / goal, 1) : 0;
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: frac, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [frac, v]);
  if (goal <= 0) return null;
  return (
    <View style={{ gap: 4 }}>
      <View style={[s.track, thin && { height: 5 }]}>
        <Animated.View
          style={[
            s.fill,
            { width: v.interpolate({ inputRange: [0, 1], outputRange: ["2%", "100%"] }) },
          ]}
        />
      </View>
      {!thin ? (
        <Text style={s.progressText}>
          £{raised.toLocaleString()} raised <Text style={{ color: colors.textFaint }}>of £{goal.toLocaleString()}</Text>
        </Text>
      ) : null}
    </View>
  );
}

export default function Donate() {
  const { content, loading } = useContent();
  const d = content?.donation;

  const campaigns = d?.campaigns ?? [];
  const featured = campaigns.find((c) => c.featured) ?? campaigns[0];
  const others = campaigns.filter((c) => c !== featured);

  const [chosen, setChosen] = useState<DonationCampaign | null>(null);
  const [interval, setInterval_] = useState<Interval>("one_off");
  const [amount, setAmount] = useState<number | null>(25);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const toggleX = useRef(new Animated.Value(0)).current;
  const overlayV = useRef(new Animated.Value(0)).current;

  const campaign = chosen ?? featured ?? null;
  const customN = parseFloat(custom.replace(/[^0-9.]/g, ""));
  const finalAmount = custom ? (Number.isFinite(customN) ? Math.round(customN * 100) / 100 : null) : amount;
  const valid = finalAmount != null && finalAmount >= 1 && finalAmount <= 10000;

  function setInterval2(i: Interval) {
    tap();
    setInterval_(i);
    Animated.spring(toggleX, { toValue: i === "one_off" ? 0 : 1, useNativeDriver: true, speed: 30, bounciness: 7 }).start();
  }

  useEffect(() => {
    if (outcome === "success" || outcome === "incomplete") {
      overlayV.setValue(0);
      Animated.spring(overlayV, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 9 }).start();
      if (outcome === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [outcome, overlayV]);

  async function give() {
    if (!valid || !finalAmount || busy) return;
    // Campaign with its own external appeal page wins.
    if (campaign?.link) return openSheet(campaign.link);

    setBusy(true);
    try {
      if (d?.stripeEnabled) {
        const session = await createDonationSession(finalAmount, interval, campaign?.title ?? "General");
        if (session.configured && session.url && session.id) {
          setOutcome("processing");
          await openSheet(session.url); // resolves when the sheet is dismissed
          const res = await donationStatus(session.id);
          setOutcome(res.paid ? "success" : "incomplete");
          return;
        }
      }
      // Fallback: the mosque's external giving link with the choices attached.
      if (d?.donateUrl) {
        const sep = d.donateUrl.includes("?") ? "&" : "?";
        await openSheet(
          `${d.donateUrl}${sep}amount=${finalAmount}&fund=${encodeURIComponent(campaign?.title ?? "General")}${interval === "month" ? "&frequency=monthly" : ""}`,
        );
        setOutcome(null);
      }
    } catch {
      setOutcome("incomplete");
    } finally {
      setBusy(false);
    }
  }

  if (!d) {
    return (
      <Page eyebrow="Support your masjid" title="Donate" back>
        <Card>
          <Empty text={loading ? "Loading…" : "Donation details will appear here shortly."} />
        </Card>
      </Page>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <Page eyebrow="Ṣadaqah jāriyah" title="Donate" subtitle={d.heading} back>
      {/* Featured campaign hero */}
      {featured ? (
        <Reveal>
          <Press onPress={() => setChosen(featured)} style={[s.heroCard, campaign === featured && s.selected]}>
            {featured.imageUrl ? (
              <Image source={{ uri: absUrl(featured.imageUrl) }} style={s.heroImg} resizeMode="cover" onError={() => {}} />
            ) : null}
            <View style={{ gap: 8 }}>
              <View style={s.heroHead}>
                <Text style={s.heroIcon}>{featured.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroKicker}>FEATURED APPEAL</Text>
                  <Text style={s.heroTitle}>{featured.title}</Text>
                </View>
                {campaign === featured ? <Text style={s.tick}>✓</Text> : null}
              </View>
              {featured.description ? <Text style={s.heroDesc}>{featured.description}</Text> : null}
              <Progress raised={featured.raised} goal={featured.goal} />
            </View>
          </Press>
        </Reveal>
      ) : null}

      {/* Campaign list */}
      {others.length ? (
        <>
          <Section title="Choose a campaign" />
          <View style={{ gap: 10 }}>
            {others.map((c, i) => (
              <Reveal key={c.title} delay={Math.min(i, 6) * 45}>
                <Press onPress={() => setChosen(c)} style={[s.camp, campaign === c && s.selected]}>
                  <View style={s.campIcon}>
                    <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.campTitle}>{c.title}</Text>
                    {c.description ? (
                      <Text style={s.campDesc} numberOfLines={2}>
                        {c.description}
                      </Text>
                    ) : null}
                    <Progress raised={c.raised} goal={c.goal} thin />
                  </View>
                  <Text style={[s.tick, { opacity: campaign === c ? 1 : 0 }]}>✓</Text>
                </Press>
              </Reveal>
            ))}
          </View>
        </>
      ) : null}

      {/* Amount + frequency */}
      <Section title="Your donation" />
      <Card style={{ gap: space.lg }}>
        {d.monthly ? (
          <View style={s.toggle}>
            <Animated.View
              style={[
                s.togglePill,
                {
                  transform: [
                    {
                      translateX: toggleX.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) as never,
                    },
                  ],
                  left: toggleX.interpolate({ inputRange: [0, 1], outputRange: ["1%", "50%"] }) as never,
                },
              ]}
            />
            <Pressable style={s.toggleHalf} onPress={() => setInterval2("one_off")}>
              <Text style={[s.toggleText, interval === "one_off" && s.toggleTextOn]}>One-off</Text>
            </Pressable>
            <Pressable style={s.toggleHalf} onPress={() => setInterval2("month")}>
              <Text style={[s.toggleText, interval === "month" && s.toggleTextOn]}>Monthly 🔁</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={s.amounts}>
          {(d.presets ?? [10, 20, 50, 100, 250]).map((p) => {
            const on = !custom && amount === p;
            return (
              <Press
                key={p}
                scaleTo={0.92}
                onPress={() => {
                  setCustom("");
                  setAmount(p);
                }}
                style={[s.amt, on && s.amtOn]}
              >
                <Text style={[s.amtText, on && { color: colors.onGold }]}>£{p}</Text>
              </Press>
            );
          })}
        </View>

        <View style={[s.customRow, custom !== "" && s.customRowOn]}>
          <Text style={s.pound}>£</Text>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            keyboardType="decimal-pad"
            placeholder="Other amount"
            placeholderTextColor={colors.textFaint}
            style={s.customInput}
            maxLength={8}
          />
          {custom !== "" && !valid ? <Text style={s.invalid}>£1 – £10,000</Text> : null}
        </View>

        {d.giftAid ? (
          <View style={s.giftaid}>
            <Text style={s.giftaidTitle}>✓ Gift Aid</Text>
            <Text style={s.giftaidBody}>UK taxpayer? Add 25% at no extra cost — tick Gift Aid at checkout.</Text>
          </View>
        ) : null}

        <GoldButton
          label={
            busy
              ? "Preparing secure checkout…"
              : `💛  Donate${valid && finalAmount ? ` £${finalAmount}` : ""}${interval === "month" ? " monthly" : ""}${campaign ? ` · ${campaign.title}` : ""}`
          }
          onPress={give}
        />
        <View style={s.badges}>
          <Text style={s.badge}> Pay</Text>
          <Text style={s.badge}>G Pay</Text>
          <Text style={s.badge}>💳 Cards</Text>
          {interval === "month" ? <Text style={s.badge}>🔁 Direct debit-style monthly</Text> : null}
        </View>
        <Text style={s.secure}>🔒 Payments are processed securely — card details never touch the mosque's servers.</Text>
      </Card>

      {/* Bank transfer — quiet secondary route */}
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

      {/* Native outcome overlay (above the whole screen) */}
      {outcome === "success" || outcome === "incomplete" ? (
        <View style={s.overlay}>
          <Animated.View
            style={[
              s.outcomeCard,
              {
                opacity: overlayV,
                transform: [{ scale: overlayV.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
              },
            ]}
          >
            <View style={[s.outcomeBadge, outcome === "incomplete" && { backgroundColor: "rgba(224,83,61,0.15)", borderColor: "rgba(224,83,61,0.4)" }]}>
              <Text style={{ fontSize: 40 }}>{outcome === "success" ? "💛" : "🤲"}</Text>
            </View>
            <Text style={s.outcomeTitle}>
              {outcome === "success" ? "JazākAllāhu khayran" : "Payment not completed"}
            </Text>
            <Text style={s.outcomeBody}>
              {outcome === "success"
                ? `Your ${interval === "month" ? "monthly " : ""}donation${finalAmount ? ` of £${finalAmount}` : ""} to ${campaign?.title ?? "the masjid"} was received. May Allah accept it from you.`
                : "No payment was taken. You can try again whenever you're ready — it only takes a moment."}
            </Text>
            <GoldButton
              compact
              label={outcome === "success" ? "Done" : "Try again"}
              onPress={() => {
                setOutcome(null);
                if (outcome === "incomplete") give();
              }}
            />
            {outcome === "incomplete" ? (
              <Pressable onPress={() => setOutcome(null)} hitSlop={10}>
                <Text style={s.outcomeDismiss}>Not now</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}

      {busy ? (
        <View style={s.busyRow}>
          <ActivityIndicator color={colors.goldSoft} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: 10,
  },
  heroImg: { height: 140, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.05)" },
  heroHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIcon: { fontSize: 30 },
  heroKicker: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "800", letterSpacing: 1.6 },
  heroTitle: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.3 },
  heroDesc: { color: colors.textDim, fontSize: t.small, lineHeight: 20 },
  selected: { borderColor: colors.gold, borderWidth: 1.5 },
  camp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
  },
  campIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(201,162,39,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  campTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  campDesc: { color: colors.textFaint, fontSize: t.small, lineHeight: 18 },
  tick: { color: colors.gold, fontSize: 18, fontWeight: "800" },
  track: { height: 7, borderRadius: 4, backgroundColor: "rgba(244,239,226,0.10)", overflow: "hidden", marginTop: 4 },
  fill: { height: "100%", borderRadius: 4, backgroundColor: colors.gold },
  progressText: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "700" },
  toggle: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.pill,
    padding: 3,
    position: "relative",
  },
  togglePill: {
    position: "absolute",
    top: 3,
    bottom: 3,
    width: "49%",
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  toggleHalf: { flex: 1, alignItems: "center", paddingVertical: 10 },
  toggleText: { color: colors.textDim, fontWeight: "800", fontSize: t.small },
  toggleTextOn: { color: colors.onGold },
  amounts: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amt: {
    minWidth: 62,
    alignItems: "center",
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  amtOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  amtText: { color: colors.text, fontWeight: "800", fontSize: t.body },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  customRowOn: { borderColor: colors.gold },
  pound: { color: colors.goldSoft, fontSize: t.h2, fontWeight: "800" },
  customInput: { flex: 1, color: colors.text, fontSize: t.body, fontWeight: "700", paddingVertical: 13 },
  invalid: { color: colors.danger, fontSize: t.tiny, fontWeight: "700" },
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
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  badge: {
    color: colors.textDim,
    fontSize: t.tiny,
    fontWeight: "700",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  secure: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", lineHeight: 16 },
  bankRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, gap: 12 },
  bankLabel: { color: colors.textFaint, fontSize: t.small, fontWeight: "600" },
  bankValue: { color: colors.text, fontSize: t.body, fontWeight: "800", fontVariant: ["tabular-nums"] },
  ask: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700", textAlign: "center", paddingVertical: 6 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(4,13,9,0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
  },
  outcomeCard: {
    alignSelf: "stretch",
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: space.xl,
    alignItems: "center",
    gap: 12,
  },
  outcomeBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(201,162,39,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  outcomeTitle: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.3, textAlign: "center" },
  outcomeBody: { color: colors.textDim, fontSize: t.small, lineHeight: 21, textAlign: "center" },
  outcomeDismiss: { color: colors.textFaint, fontSize: t.small, fontWeight: "700", paddingVertical: 4 },
  busyRow: { position: "absolute", bottom: 30, alignSelf: "center" },
});
