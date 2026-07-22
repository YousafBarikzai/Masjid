import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform, Keyboard } from "react-native";
import * as Haptics from "expo-haptics";
import { subscribeToMailingList } from "../src/api";
import { Page, Card, GoldButton, Reveal } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";

/* Newsletter sign-up — joins the mosque's central mailing list (managed in
   the CMS and synced to Mailchimp). One quiet form, a clear promise, and a
   warm confirmation. */

export default function Newsletter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function join() {
    if (!emailOk || busy) return;
    Keyboard.dismiss();
    setBusy(true);
    setState("idle");
    try {
      const ok = await subscribeToMailingList(
        email.trim().toLowerCase(),
        name.trim(),
        Platform.OS === "android" ? "android" : "ios",
      );
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page eyebrow="Stay connected" title="Email updates" subtitle="News, events & Ramadan timetables — straight to your inbox" back>
      {state === "done" ? (
        <Reveal>
          <Card style={s.doneCard}>
            <Text style={s.doneIcon}>💌</Text>
            <Text style={s.doneTitle}>You're on the list</Text>
            <Text style={s.doneBody}>
              JazākAllāhu khayran — we'll keep you posted. You can unsubscribe from any email with one tap.
            </Text>
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <Card style={{ gap: space.md }}>
            <View style={s.fld}>
              <Text style={s.label}>Your name (optional)</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Aisha Khan"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <View style={s.fld}>
              <Text style={s.label}>Email address</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={join}
              />
            </View>
            {state === "error" ? (
              <Text style={s.err}>Couldn't sign you up just now — please check your connection and try again.</Text>
            ) : null}
            <GoldButton label={busy ? "Joining…" : "Join the mailing list"} onPress={join} />
            <Text style={s.small}>
              We send occasional community updates only — no spam, and your email is never shared. Unsubscribe anytime.
            </Text>
          </Card>
        </Reveal>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  fld: { gap: 6 },
  label: {
    color: colors.textFaint,
    fontSize: t.tiny,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: t.body,
  },
  err: { color: colors.danger, fontSize: t.small, lineHeight: 19 },
  small: { color: colors.textFaint, fontSize: t.tiny, lineHeight: 17, textAlign: "center" },
  doneCard: { alignItems: "center", gap: 10, paddingVertical: space.xxl },
  doneIcon: { fontSize: 40 },
  doneTitle: { color: colors.text, fontSize: t.h2, fontWeight: "800" },
  doneBody: { color: colors.textDim, fontSize: t.small, lineHeight: 21, textAlign: "center", paddingHorizontal: space.lg },
});
