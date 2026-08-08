import { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Page, Card, Section, GoldButton, tap } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";
import {
  nikahApply, nikahBrowse, nikahDecide, nikahExpressInterest, nikahInterests, nikahLogin, nikahMe, nikahProfile,
  type NikahCard, type NikahInterestVM, type NikahMe, type NikahProfileFull,
} from "../src/api";

/* Nikah Matrimonial Service — the native journey. Same central backend as
   the website: apply in confidence, sign in, browse anonymous profiles of
   the opposite gender, express structured interest, and let the Nikah team
   manage introductions. No messaging, no photos, no contact details — ever. */

const TOKEN_KEY = "kma-nikah-token";

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={[s.chip, on && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
      <Text style={[s.chipText, on && s.chipTextOn]}>{on ? "✓ " : ""}{label}</Text>
    </Pressable>
  );
}

function Input(props: { value: string; onChange: (v: string) => void; placeholder?: string; secure?: boolean; keyboard?: "default" | "email-address" | "phone-pad" | "numeric"; multiline?: boolean }) {
  return (
    <TextInput
      style={[s.input, props.multiline && { minHeight: 70, textAlignVertical: "top" }]}
      value={props.value}
      onChangeText={props.onChange}
      placeholder={props.placeholder}
      placeholderTextColor={colors.textFaint}
      secureTextEntry={props.secure}
      keyboardType={props.keyboard}
      autoCapitalize={props.keyboard === "email-address" ? "none" : "sentences"}
      multiline={props.multiline}
    />
  );
}

function Facts({ c }: { c: NikahCard }) {
  const facts = [
    c.age ? `${c.age} yrs` : null, c.area || null, c.ethnicity || null, c.maritalStatus || null,
    c.hasChildren ? "Has children" : null, c.practising || null, c.education || null,
    c.profession || null, c.willingToRelocate ? "Open to relocating" : null,
  ].filter(Boolean) as string[];
  return (
    <View style={s.facts}>
      {facts.map((x) => (
        <View key={x} style={s.fact}><Text style={s.factText}>{x}</Text></View>
      ))}
    </View>
  );
}

type Mode = "intro" | "apply" | "login" | "account";

export default function Nikah() {
  const [mode, setMode] = useState<Mode>("intro");
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<NikahMe | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((tk) => {
      if (tk) {
        setToken(tk);
        nikahMe(tk).then((d) => {
          if (d.ok && d.me) { setMe(d.me); setMode("account"); }
          else AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
        }).catch(() => {});
      }
    });
  }, []);

  /* ------------------------------ Apply form ------------------------------ */
  const [f, setF] = useState<Record<string, any>>({
    firstName: "", surname: "", gender: "", dateOfBirth: "", telephone: "", email: "",
    townCity: "", ethnicity: "", languages: "", maritalStatus: "", practising: "",
    aboutMe: "", faithNotes: "", lookingFor: "", essentials: "",
    waliName: "", waliPhone: "", password: "",
    consentAccurate: false, consentTerms: false, consentProcess: false,
  });
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const [step, setStep] = useState(0);
  const APPLY_STEPS = ["About you", "Faith & about", "Looking for", "Wali & account"];

  function nextStep() {
    setMsg("");
    if (step === 0) {
      if (!f.firstName.trim() || !f.surname.trim()) return setMsg("Please enter your full name.");
      if (!f.gender) return setMsg("Please select male or female.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dateOfBirth)) return setMsg("Enter your date of birth as YYYY-MM-DD.");
      if (String(f.telephone).replace(/\D/g, "").length < 10) return setMsg("Enter a valid phone number.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return setMsg("Enter a valid email address.");
    }
    if (step === 1 && !f.maritalStatus) return setMsg("Please select your marital status.");
    setStep(step + 1);
  }

  async function submitApply() {
    setMsg("");
    if (f.gender === "female" && (!f.waliName.trim() || !f.waliPhone.trim()))
      return setMsg("Please provide your wali / family representative's name and number.");
    if (String(f.password).length < 8) return setMsg("Choose a password of at least 8 characters.");
    if (!f.consentAccurate || !f.consentTerms || !f.consentProcess) return setMsg("Please confirm the three declarations.");
    setBusy(true);
    try {
      const d = await nikahApply({
        source: Platform.OS === "ios" ? "ios" : "android",
        ...f,
        wali: { name: f.waliName, phone: f.waliPhone },
        consents: { accurate: true, terms: true, process: true },
      });
      if (d.ok) {
        setMode("login");
        setMsg("Application received, JazakAllahu Khairan — we'll email you at every step. You can sign in now to track it.");
      } else setMsg(d.error || Object.values(d.errors || {})[0] || "Something went wrong.");
    } catch {
      setMsg("Could not reach the server — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  /* -------------------------------- Login --------------------------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function doLogin() {
    setBusy(true);
    setMsg("");
    try {
      const d = await nikahLogin(email.trim(), password);
      if (d.ok && d.token && d.me) {
        await AsyncStorage.setItem(TOKEN_KEY, d.token);
        setToken(d.token);
        setMe(d.me);
        setMode("account");
        setPassword("");
      } else setMsg(d.error || "Sign-in failed.");
    } catch {
      setMsg("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }
  function signOut() {
    AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    setToken(null);
    setMe(null);
    setMode("intro");
  }

  /* ------------------------------- Account -------------------------------- */
  const [tab, setTab] = useState<"browse" | "interests">("browse");
  const [cards, setCards] = useState<NikahCard[] | null>(null);
  const [notApproved, setNotApproved] = useState("");
  const [openProfile, setOpenProfile] = useState<NikahProfileFull | null>(null);
  const [ints, setInts] = useState<{ received: NikahInterestVM[]; sent: NikahInterestVM[]; mutual: NikahInterestVM[] } | null>(null);

  useEffect(() => {
    if (mode !== "account" || !token || !me) return;
    if (tab === "browse") {
      nikahBrowse(token, {}).then((d) => {
        if (d.ok) setCards(d.cards || []);
        else if (d.notApproved) setNotApproved(d.error || "");
      }).catch(() => {});
    } else {
      nikahInterests(token).then((d) => d.ok && setInts({ received: d.received || [], sent: d.sent || [], mutual: d.mutual || [] })).catch(() => {});
    }
  }, [mode, tab, token, me]);

  async function express(c: NikahCard) {
    if (!token) return;
    Alert.alert("Express interest", `Send an expression of interest to ${c.reference}? Only your anonymous profile is shared — never your name or contacts.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        onPress: async () => {
          const d = await nikahExpressInterest(token, c.id).catch(() => null);
          setMsg(d?.ok ? `Sent to ${c.reference} — we'll email you when there's news.` : d?.error || "Could not send.");
          setOpenProfile(null);
        },
      },
    ]);
  }

  async function decide(i: NikahInterestVM, action: "accept" | "decline" | "withdraw") {
    if (!token) return;
    const d = await nikahDecide(token, i.id, action).catch(() => null);
    setMsg(d?.ok ? (d.status === "accepted" ? "Mutual interest, alhamdulillah — the Nikah team will contact your families." : "Done.") : d?.error || "Could not update.");
    nikahInterests(token).then((x) => x.ok && setInts({ received: x.received || [], sent: x.sent || [], mutual: x.mutual || [] })).catch(() => {});
  }

  /* --------------------------------- Render -------------------------------- */
  const err = msg ? (
    <Card style={{ borderColor: "rgba(201,162,39,0.6)", borderWidth: 1 }}>
      <Text style={{ color: colors.goldSoft, fontWeight: "700" }}>{msg}</Text>
    </Card>
  ) : null;

  if (mode === "intro") {
    return (
      <Page back eyebrow="Mosque-managed & private" title="Nikah Service">
        {err}
        <Card style={{ gap: space.md }}>
          {[
            ["🔒", "Anonymous profiles — members never see your name, photo or contact details."],
            ["👪", "Family at every step — your wali is part of every introduction."],
            ["🚫", "No chatting, no swiping. Structured interest, managed introductions."],
            ["🛡", "Every profile verified personally by the mosque's Nikah team."],
          ].map(([icon, txt]) => (
            <View key={icon} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
              <Text style={s.introText}>{txt}</Text>
            </View>
          ))}
        </Card>
        <GoldButton label="Apply in confidence" onPress={() => setMode("apply")} />
        <Pressable onPress={() => { tap(); setMode("login"); }} style={s.linkBtn} accessibilityRole="button">
          <Text style={s.linkText}>Already applied or approved? Sign in</Text>
        </Pressable>
      </Page>
    );
  }

  if (mode === "apply") {
    return (
      <Page back eyebrow={`Step ${step + 1} of ${APPLY_STEPS.length}`} title={APPLY_STEPS[step]} subtitle="Reviewed personally and in confidence">
        {err}
        <Card style={{ gap: space.lg }}>
          {step === 0 && (
            <>
              <Input value={f.firstName} onChange={(v) => set("firstName", v)} placeholder="First name *" />
              <Input value={f.surname} onChange={(v) => set("surname", v)} placeholder="Surname * (mosque-only)" />
              <View style={s.chips}>
                <Chip label="Male" on={f.gender === "male"} onPress={() => set("gender", "male")} />
                <Chip label="Female" on={f.gender === "female"} onPress={() => set("gender", "female")} />
              </View>
              <Input value={f.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} placeholder="Date of birth (YYYY-MM-DD) * — members only see your age" />
              <Input value={f.telephone} onChange={(v) => set("telephone", v)} placeholder="Phone *" keyboard="phone-pad" />
              <Input value={f.email} onChange={(v) => set("email", v)} placeholder="Email *" keyboard="email-address" />
              <Input value={f.townCity} onChange={(v) => set("townCity", v)} placeholder="Town / general area" />
            </>
          )}
          {step === 1 && (
            <>
              <Text style={s.label}>Marital status *</Text>
              <View style={s.chips}>
                {[["never-married", "Never married"], ["divorced", "Divorced"], ["widowed", "Widowed"]].map(([v, l]) => (
                  <Chip key={v} label={l} on={f.maritalStatus === v} onPress={() => set("maritalStatus", v)} />
                ))}
              </View>
              <Text style={s.label}>Practice</Text>
              <View style={s.chips}>
                {[["very", "Very practising"], ["practising", "Practising"], ["moderate", "Moderate"], ["growing", "Growing"]].map(([v, l]) => (
                  <Chip key={v} label={l} on={f.practising === v} onPress={() => set("practising", v)} />
                ))}
              </View>
              <Input multiline value={f.ethnicity} onChange={(v) => set("ethnicity", v)} placeholder="Ethnic background" />
              <Input multiline value={f.languages} onChange={(v) => set("languages", v)} placeholder="Languages" />
              <Input multiline value={f.faithNotes} onChange={(v) => set("faithNotes", v)} placeholder="Your faith & practice, in your own words" />
              <Input multiline value={f.aboutMe} onChange={(v) => set("aboutMe", v)} placeholder="About you — personality, interests, everyday life" />
            </>
          )}
          {step === 2 && (
            <>
              <Input multiline value={f.lookingFor} onChange={(v) => set("lookingFor", v)} placeholder="What are you looking for in a spouse?" />
              <Input multiline value={f.essentials} onChange={(v) => set("essentials", v)} placeholder="Your essentials (non-negotiables)" />
            </>
          )}
          {step === 3 && (
            <>
              <Text style={s.label}>{f.gender === "female" ? "Your wali / family representative (required)" : "Family contact (strongly encouraged)"}</Text>
              <Input value={f.waliName} onChange={(v) => set("waliName", v)} placeholder="Wali / family name" />
              <Input value={f.waliPhone} onChange={(v) => set("waliPhone", v)} placeholder="Their phone number" keyboard="phone-pad" />
              <Input secure value={f.password} onChange={(v) => set("password", v)} placeholder="Choose a password (8+ characters) *" />
              {(
                [
                  ["consentAccurate", "My information is true and my intention is marriage."],
                  ["consentTerms", "I agree to the mosque managing this service and its privacy policy."],
                  ["consentProcess", "I understand verification and family contact are part of the process."],
                ] as Array<[string, string]>
              ).map(([k, l]) => (
                <Pressable key={k} onPress={() => { tap(); set(k, !f[k]); }} style={s.consentRow} accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(f[k]) }}>
                  <Text style={[s.consentBox, f[k] ? s.consentBoxOn : null]}>{f[k] ? "✓" : ""}</Text>
                  <Text style={s.consentText}>{l}</Text>
                </Pressable>
              ))}
            </>
          )}
          {step < 3 ? (
            <GoldButton label={`Next: ${APPLY_STEPS[step + 1]}`} onPress={nextStep} />
          ) : (
            <GoldButton label={busy ? "Submitting…" : "Submit my application"} onPress={submitApply} />
          )}
          {step > 0 ? (
            <Pressable onPress={() => { tap(); setStep(step - 1); }} style={s.linkBtn}><Text style={s.linkText}>← Back</Text></Pressable>
          ) : null}
        </Card>
      </Page>
    );
  }

  if (mode === "login") {
    return (
      <Page back eyebrow="Nikah service" title="Sign in">
        {err}
        <Card style={{ gap: space.lg }}>
          <Input value={email} onChange={setEmail} placeholder="Email" keyboard="email-address" />
          <Input secure value={password} onChange={setPassword} placeholder="Password" />
          <GoldButton label={busy ? "Signing in…" : "Sign in"} onPress={doLogin} />
          <Pressable onPress={() => { tap(); setMode("apply"); }} style={s.linkBtn}>
            <Text style={s.linkText}>Not applied yet? Apply in confidence</Text>
          </Pressable>
        </Card>
      </Page>
    );
  }

  /* Account */
  const approved = me?.status === "approved";
  return (
    <Page
      back
      eyebrow={me?.reference || "Nikah service"}
      title={`As-salāmu ʿalaykum, ${me?.firstName || ""}`}
      subtitle={me?.statusLabel}
    >
      {err}
      {!approved ? (
        <Card>
          <Text style={s.introText}>
            Your application is with the Nikah team — we'll email you at every step. Browsing opens once you're approved.
          </Text>
        </Card>
      ) : (
        <>
          <View style={s.chips}>
            <Chip label="Browse profiles" on={tab === "browse"} onPress={() => setTab("browse")} />
            <Chip label="My interests" on={tab === "interests"} onPress={() => setTab("interests")} />
          </View>

          {tab === "browse" && (
            <>
              {notApproved ? <Card><Text style={s.introText}>{notApproved}</Text></Card> : null}
              {(cards || []).map((c) => (
                <Pressable key={c.id} onPress={() => { tap(); token && nikahProfile(token, c.id).then((d) => d.ok && d.profile && setOpenProfile(d.profile)); }}>
                  <Card style={{ gap: 8 }}>
                    <Text style={s.ref}>{c.reference}</Text>
                    <Facts c={c} />
                  </Card>
                </Pressable>
              ))}
              {cards && cards.length === 0 ? <Card><Text style={s.introText}>No profiles yet — check back soon, inshaAllah.</Text></Card> : null}
            </>
          )}

          {tab === "interests" && ints && (
            <>
              <Section title="Awaiting your decision" />
              {ints.received.length === 0 ? <Card><Text style={s.introText}>Nothing waiting right now.</Text></Card> : null}
              {ints.received.map((i) => (
                <Card key={i.id} style={{ gap: 8 }}>
                  <Text style={s.ref}>{i.card?.reference}</Text>
                  {i.card ? <Facts c={i.card} /> : null}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={{ flex: 1 }}><GoldButton compact label="Accept" onPress={() => decide(i, "accept")} /></View>
                    <Pressable onPress={() => decide(i, "decline")} style={[s.linkBtn, { paddingVertical: 10 }]}>
                      <Text style={s.linkText}>Not for me</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
              <Section title="Mutual — with the Nikah team" />
              {ints.mutual.length === 0 ? <Card><Text style={s.introText}>Mutual interests appear here; the team then contacts both families.</Text></Card> : null}
              {ints.mutual.map((i) => (
                <Card key={i.id} style={{ gap: 8, borderColor: colors.gold, borderWidth: 1 }}>
                  <Text style={s.ref}>{i.card?.reference} · 💠 introduction in progress</Text>
                  {i.card ? <Facts c={i.card} /> : null}
                </Card>
              ))}
              <Section title="Sent" />
              {ints.sent.map((i) => (
                <Card key={i.id} style={{ gap: 6 }}>
                  <Text style={s.ref}>{i.card?.reference}</Text>
                  <Text style={s.introText}>
                    {i.status === "pending" ? "Awaiting their reply" : i.status === "declined" ? "Not taken forward" : "Withdrawn"}
                  </Text>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      {openProfile ? (
        <Card style={{ gap: 10, borderColor: colors.gold, borderWidth: 1 }}>
          <Text style={s.ref}>{openProfile.reference}</Text>
          <Facts c={openProfile} />
          {openProfile.aboutMe ? <Text style={s.introText}>About: {openProfile.aboutMe}</Text> : null}
          {openProfile.faithNotes ? <Text style={s.introText}>Faith: {openProfile.faithNotes}</Text> : null}
          {openProfile.familyBackground ? <Text style={s.introText}>Family: {openProfile.familyBackground}</Text> : null}
          {openProfile.lookingFor ? <Text style={s.introText}>Looking for: {openProfile.lookingFor}</Text> : null}
          {openProfile.essentials ? <Text style={s.introText}>Essentials: {openProfile.essentials}</Text> : null}
          <GoldButton label="Express interest" onPress={() => express(openProfile)} />
          <Pressable onPress={() => setOpenProfile(null)} style={s.linkBtn}><Text style={s.linkText}>Close</Text></Pressable>
        </Card>
      ) : null}

      <Pressable onPress={signOut} style={s.linkBtn}><Text style={s.linkText}>Sign out</Text></Pressable>
    </Page>
  );
}

const s = StyleSheet.create({
  introText: { color: colors.text, fontSize: t.small, lineHeight: 20, flex: 1 },
  label: { color: colors.text, fontSize: t.small, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(244,239,226,0.18)",
    borderRadius: radius.md, color: colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: t.body, minHeight: 46,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1.5, borderColor: "rgba(244,239,226,0.22)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, minHeight: 40, justifyContent: "center" },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.text, fontSize: t.small, fontWeight: "600" },
  chipTextOn: { color: colors.onGold, fontWeight: "800" },
  ref: { color: colors.goldSoft, fontWeight: "800", fontSize: t.body, letterSpacing: 0.5 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  fact: { backgroundColor: "rgba(244,239,226,0.1)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  factText: { color: colors.text, fontSize: t.tiny, fontWeight: "600" },
  consentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  consentBox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: "rgba(244,239,226,0.35)",
    color: colors.onGold, textAlign: "center", fontWeight: "900", lineHeight: 21,
  },
  consentBoxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  consentText: { flex: 1, color: colors.text, fontSize: t.small, lineHeight: 20 },
  linkBtn: { paddingVertical: 12, alignItems: "center" },
  linkText: { color: colors.goldSoft, fontWeight: "700", fontSize: t.small },
});
