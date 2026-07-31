import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Page, Card, Section, GoldButton, tap } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";
import {
  absUrl,
  membershipApply,
  membershipLogin,
  membershipMe,
  membershipPortal,
  membershipReportPayment,
  type MembershipMember,
  type PortalCategory,
  type PortalDocument,
  type PortalNotice,
} from "../src/api";

/* KMA membership in the app — the same journey, statuses and endpoints as the
   website: apply in five short steps, sign in, track progress on the
   five-step tracker, see the payment instructions with your personal
   reference, and report your payment. */

const TOKEN_KEY = "kma-member-token";
const DRAFT_KEY = "kma-membership-draft-app";
const STEPS = ["Personal", "Contact", "Proposers", "Account", "Review"];

type Form = Record<string, string>;
const emptyForm: Form = {
  title: "", firstName: "", surname: "", gender: "", dateOfBirth: "",
  address1: "", address2: "", townCity: "", county: "", postcode: "", email: "", telephone: "",
  p1fullName: "", p1telephone: "", p1email: "", p1membershipNumber: "",
  p2fullName: "", p2telephone: "", p2email: "", p2membershipNumber: "",
  username: "", password: "", passwordConfirm: "",
};

function strength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "" };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return { score: s, label: ["Too short", "Weak", "Okay", "Good", "Strong"][s] };
}

function fmt(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** Plain text from a Lexical rich-text body (member notices are simple). */
function lexicalToText(body: unknown): string {
  const walk = (n: unknown): string => {
    const node = n as { text?: string; children?: unknown[] } | null;
    if (!node) return "";
    if (typeof node.text === "string") return node.text;
    return (node.children ?? []).map(walk).join("");
  };
  const root = (body as { root?: { children?: unknown[] } } | null)?.root;
  return (root?.children ?? []).map((c) => walk(c)).filter(Boolean).join("\n");
}

/* -------------------------- Members-only portal --------------------------- */

function MembersArea({ token }: { token: string }) {
  const [cats, setCats] = useState<PortalCategory[] | null>(null);
  const [notices, setNotices] = useState<PortalNotice[]>([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    membershipPortal(token)
      .then((d) => {
        if (d.ok) {
          setCats(d.categories ?? []);
          setNotices(d.notices ?? []);
        } else setErr(d.error || "The members' area could not be loaded.");
      })
      .catch(() => setErr("The members' area could not be loaded — pull down to retry."));
  }, [token]);

  // Authenticated download → native share/open sheet. The file endpoint
  // re-checks the member's session on every request; there is no public URL.
  async function openDoc(doc: PortalDocument) {
    tap();
    setBusyId(String(doc.id));
    try {
      const dest = `${FileSystem.cacheDirectory}${doc.filename || `document-${doc.id}.pdf`}`;
      const res = await FileSystem.downloadAsync(absUrl(doc.url), dest, {
        headers: { Authorization: `JWT ${token}` },
      });
      if (res.status !== 200) throw new Error(String(res.status));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, { mimeType: doc.mimeType || "application/pdf", dialogTitle: doc.title });
      }
    } catch {
      setErr("That download didn't work — please try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (err) return (
    <>
      <Section title="Members' area" />
      <Card><Text style={s.hint}>{err}</Text></Card>
    </>
  );
  if (!cats) return (
    <>
      <Section title="Members' area" />
      <Card><Text style={s.hint}>Loading…</Text></Card>
    </>
  );

  return (
    <>
      {notices.length > 0 && (
        <>
          <Section title="Member notices" />
          <Card style={{ gap: space.md }}>
            {notices.map((n) => (
              <View key={n.id}>
                <View style={s.noticeHead}>
                  <Text style={s.noticeTitle}>{n.pinned ? "📌 " : ""}{n.title}</Text>
                  {n.publishedDate ? <Text style={s.noticeDate}>{fmt(n.publishedDate)}</Text> : null}
                </View>
                {n.body ? <Text style={s.noticeBody}>{lexicalToText(n.body)}</Text> : null}
              </View>
            ))}
          </Card>
        </>
      )}
      {(cats ?? []).map((c) => (
        <View key={c.id}>
          <Section title={c.name} />
          <Card style={{ gap: space.sm }}>
            {c.description ? <Text style={s.hint}>{c.description}</Text> : null}
            {c.documents.map((doc) => (
              <Pressable key={doc.id} style={s.docRow} onPress={() => openDoc(doc)} disabled={busyId === String(doc.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.docTitle}>{doc.title}</Text>
                  <Text style={s.hint}>
                    {[doc.year, doc.version, fmt(doc.publishedDate)].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                <Text style={s.docBtn}>{busyId === String(doc.id) ? "…" : "⬇"}</Text>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
      {cats && cats.length === 0 && notices.length === 0 && (
        <>
          <Section title="Members' area" />
          <Card><Text style={s.hint}>No members-only documents or notices have been published yet.</Text></Card>
        </>
      )}
    </>
  );
}

function Input({
  label, value, onChange, error, hint, secure, keyboard, autoCap,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string;
  secure?: boolean; keyboard?: "default" | "email-address" | "phone-pad"; autoCap?: "none" | "words";
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <TextInput
        style={[s.input, error ? s.inputError : null]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        keyboardType={keyboard ?? "default"}
        autoCapitalize={autoCap ?? (keyboard === "email-address" || secure ? "none" : "words")}
        placeholderTextColor={colors.textFaint}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

function Tracker({ member }: { member: MembershipMember }) {
  return (
    <View style={s.tracker}>
      {member.journey.map((label, i) => {
        const n = i + 1;
        const done = n < member.journeyStep;
        const current = n === member.journeyStep;
        return (
          <View key={label} style={s.trackStep}>
            <View style={[s.trackDot, done && s.trackDotDone, current && s.trackDotCurrent]}>
              <Text style={[s.trackDotText, (done || current) && s.trackDotTextOn]}>{done ? "✓" : n}</Text>
            </View>
            <Text style={[s.trackLbl, current && s.trackLblOn]} numberOfLines={2}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function MembershipScreen() {
  const [mode, setMode] = useState<"home" | "apply" | "login" | "account">("home");
  const [token, setToken] = useState<string | null>(null);
  const [member, setMember] = useState<MembershipMember | null>(null);

  // Wizard state
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [consent, setConsent] = useState({ accurate: false, terms: false, privacy: false, marketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [doneNo, setDoneNo] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  // Login + payment state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payRef, setPayRef] = useState("");

  const set = useCallback((k: string) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)) : e));
  }, []);
  const pw = useMemo(() => strength(form.password), [form.password]);

  // Restore session + draft.
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((tk) => {
      if (tk) {
        setToken(tk);
        membershipMe(tk).then((d) => {
          if (d.ok && d.member) {
            setMember(d.member);
            setMode("account");
          } else AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
        }).catch(() => {});
      }
    }).catch(() => {});
    AsyncStorage.getItem(DRAFT_KEY).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw) as { form?: Form; step?: number };
          if (d.form) setForm((f) => ({ ...f, ...d.form, password: "", passwordConfirm: "" }));
          if (typeof d.step === "number") setStep(Math.min(d.step, 3));
        } catch { /* fresh */ }
      }
    }).catch(() => {});
  }, []);
  // Save the draft as they type (never the password).
  useEffect(() => {
    const { password: _p, passwordConfirm: _pc, ...safe } = form;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ form: safe, step })).catch(() => {});
  }, [form, step]);

  function validate(sIdx: number): Record<string, string> {
    const e: Record<string, string> = {};
    const need = (k: string, m: string) => { if (!form[k].trim()) e[k] = m; };
    if (sIdx === 0) { need("firstName", "Enter your first name."); need("surname", "Enter your surname."); }
    if (sIdx === 1) {
      need("address1", "Enter your address."); need("townCity", "Enter your town or city.");
      need("postcode", "Enter your postcode."); need("telephone", "Enter a phone number.");
      need("email", "Enter your email.");
      if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "That email doesn't look right.";
    }
    if (sIdx === 2) {
      need("p1fullName", "Proposer 1's full name.");
      if (!form.p1telephone.trim() && !form.p1email.trim()) e.p1telephone = "A phone number or email for proposer 1.";
      need("p2fullName", "Proposer 2's full name.");
      if (!form.p2telephone.trim() && !form.p2email.trim()) e.p2telephone = "A phone number or email for proposer 2.";
    }
    if (sIdx === 3) {
      need("username", "Choose a username.");
      if (form.password.length < 8) e.password = "At least 8 characters.";
      if (form.passwordConfirm !== form.password) e.passwordConfirm = "Passwords don't match.";
      if (!consent.accurate || !consent.terms || !consent.privacy) e.consent = "Please tick the three required boxes.";
    }
    return e;
  }

  async function submit() {
    for (let i = 0; i <= 3; i++) {
      const e = validate(i);
      if (Object.keys(e).length) { setErrors(e); setStep(i); return; }
    }
    setBusy(true); setMsg("");
    try {
      const d = await membershipApply({
        ...Object.fromEntries(Object.entries(form).filter(([k]) => !k.startsWith("p1") && !k.startsWith("p2"))),
        proposer1: { fullName: form.p1fullName, telephone: form.p1telephone, email: form.p1email, membershipNumber: form.p1membershipNumber },
        proposer2: { fullName: form.p2fullName, telephone: form.p2telephone, email: form.p2email, membershipNumber: form.p2membershipNumber },
        consents: consent,
        website: "",
      });
      if (d.ok) {
        setDoneNo(d.applicationNumber || "");
        AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      } else if (d.errors) {
        setErrors(d.errors);
        setMsg(Object.values(d.errors)[0] || "Please check the highlighted fields.");
      } else setMsg(d.error || "Something went wrong — try again.");
    } catch {
      setMsg("Could not reach the mosque server — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function doLogin() {
    setBusy(true); setMsg("");
    try {
      const d = await membershipLogin(identifier.trim(), password);
      if (d.ok && d.token && d.member) {
        await AsyncStorage.setItem(TOKEN_KEY, d.token);
        setToken(d.token);
        setMember(d.member);
        setMode("account");
        setPassword("");
      } else setMsg(d.error || "Sign-in failed.");
    } catch {
      setMsg("Could not reach the mosque server.");
    } finally {
      setBusy(false);
    }
  }

  async function doReport() {
    if (!token || !payDate.trim()) { setMsg("Enter the date you paid (e.g. 2026-07-30)."); return; }
    setBusy(true); setMsg("");
    try {
      const d = await membershipReportPayment(token, payDate.trim(), payRef.trim());
      if (d.ok && d.member) { setMember(d.member); setMsg("Thank you — we'll verify your payment and confirm."); }
      else setMsg(d.error || "Could not save that.");
    } catch {
      setMsg("Could not reach the mosque server.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
    setToken(null); setMember(null); setMode("home");
  }

  /* -------------------------------- Render -------------------------------- */
  return (
    <Page title="KMA Membership" back>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {mode === "home" && (
          <>
            <Card>
              <Text style={s.lead}>
                Become a member of Kingston Muslim Association — vote at the AGM, stand for election, and have a real
                say in how your mosque is run.
              </Text>
              <GoldButton label="Apply for membership" onPress={() => { tap(); setMode("apply"); }} />
              <Pressable onPress={() => { tap(); setMode("login"); }} style={s.linkBtn}>
                <Text style={s.linkBtnText}>Already applied? Sign in →</Text>
              </Pressable>
            </Card>
            <Section title="How it works" />
            <Card>
              {["Apply in five short steps", "The committee reviews it", "Pay the fee by bank transfer", "We verify your payment", "You're a member — number, card & a year of membership"].map((x, i) => (
                <View key={i} style={s.howRow}>
                  <View style={s.howN}><Text style={s.howNText}>{i + 1}</Text></View>
                  <Text style={s.howText}>{x}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {mode === "login" && (
          <Card>
            <Text style={s.h2}>Sign in</Text>
            <Input label="Email or username" value={identifier} onChange={setIdentifier} keyboard="email-address" autoCap="none" />
            <Input label="Password" value={password} onChange={setPassword} secure />
            {msg ? <Text style={s.error}>{msg}</Text> : null}
            <GoldButton label={busy ? "Signing in…" : "Sign in"} onPress={doLogin} />
            <Pressable onPress={() => { tap(); setMode("home"); setMsg(""); }} style={s.linkBtn}>
              <Text style={s.linkBtnText}>← Back</Text>
            </Pressable>
          </Card>
        )}

        {mode === "apply" && doneNo !== null && (
          <Card>
            <Text style={s.doneBadge}>✓</Text>
            <Text style={s.h2}>Application submitted</Text>
            <Text style={s.lead}>
              Your application number is <Text style={s.bold}>{doneNo}</Text>. We&apos;ve emailed you a confirmation —
              sign in any time to track progress.
            </Text>
            <GoldButton label="Sign in to my account" onPress={() => { setDoneNo(null); setMode("login"); }} />
          </Card>
        )}

        {mode === "apply" && doneNo === null && (
          <>
            {/* progress dots */}
            <View style={s.wsteps}>
              {STEPS.map((lbl, i) => (
                <View key={lbl} style={s.wstep}>
                  <View style={[s.trackDot, i < step && s.trackDotDone, i === step && s.trackDotCurrent]}>
                    <Text style={[s.trackDotText, i <= step && s.trackDotTextOn]}>{i < step ? "✓" : i + 1}</Text>
                  </View>
                  <Text style={[s.trackLbl, i === step && s.trackLblOn]}>{lbl}</Text>
                </View>
              ))}
            </View>

            <Card>
              {step === 0 && (
                <>
                  <Text style={s.h2}>Personal details</Text>
                  <Input label="Title (Mr, Mrs, Dr…)" value={form.title} onChange={set("title")} />
                  <Input label="First name *" value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
                  <Input label="Surname *" value={form.surname} onChange={set("surname")} error={errors.surname} />
                  <Input label="Gender (male / female / other)" value={form.gender} onChange={set("gender")} autoCap="none" />
                  <Input label="Date of birth (YYYY-MM-DD)" value={form.dateOfBirth} onChange={set("dateOfBirth")} autoCap="none" />
                </>
              )}
              {step === 1 && (
                <>
                  <Text style={s.h2}>Contact &amp; address</Text>
                  <Input label="Address line 1 *" value={form.address1} onChange={set("address1")} error={errors.address1} />
                  <Input label="Address line 2" value={form.address2} onChange={set("address2")} />
                  <Input label="Town / City *" value={form.townCity} onChange={set("townCity")} error={errors.townCity} />
                  <Input label="County" value={form.county} onChange={set("county")} />
                  <Input label="Postcode *" value={form.postcode} onChange={set("postcode")} error={errors.postcode} autoCap="none" />
                  <Input label="Email address *" value={form.email} onChange={set("email")} error={errors.email} keyboard="email-address" hint="Application updates go here." />
                  <Input label="Telephone *" value={form.telephone} onChange={set("telephone")} error={errors.telephone} keyboard="phone-pad" />
                </>
              )}
              {step === 2 && (
                <>
                  <Text style={s.h2}>Your two KMA proposers</Text>
                  <Text style={s.hint}>Two current KMA members who support your application.</Text>
                  {[1, 2].map((n) => (
                    <View key={n} style={s.proposer}>
                      <Text style={s.h3}>Proposer {n}</Text>
                      <Input label="Full name *" value={form[`p${n}fullName`]} onChange={set(`p${n}fullName`)} error={errors[`p${n}fullName`]} />
                      <Input label="Telephone" value={form[`p${n}telephone`]} onChange={set(`p${n}telephone`)} error={errors[`p${n}telephone`]} keyboard="phone-pad" />
                      <Input label="Email" value={form[`p${n}email`]} onChange={set(`p${n}email`)} keyboard="email-address" />
                      <Input label="KMA membership no. (if known)" value={form[`p${n}membershipNumber`]} onChange={set(`p${n}membershipNumber`)} autoCap="none" />
                    </View>
                  ))}
                </>
              )}
              {step === 3 && (
                <>
                  <Text style={s.h2}>Your account &amp; consent</Text>
                  <Input label="Username *" value={form.username} onChange={set("username")} error={errors.username} autoCap="none" hint="You'll sign in with this or your email." />
                  <Input label="Password * (8+ characters)" value={form.password} onChange={set("password")} error={errors.password} secure />
                  {form.password ? (
                    <View style={s.strengthRow}>
                      <View style={s.strengthBar}>
                        <View style={[s.strengthFill, { width: `${(pw.score / 4) * 100}%` as never, backgroundColor: pw.score >= 4 ? "#2a9168" : pw.score >= 3 ? "#7fae1b" : pw.score >= 2 ? "#d99a1b" : "#c0392b" }]} />
                      </View>
                      <Text style={s.strengthLbl}>{pw.label}</Text>
                    </View>
                  ) : null}
                  <Input label="Confirm password *" value={form.passwordConfirm} onChange={set("passwordConfirm")} error={errors.passwordConfirm} secure />
                  {(
                    [
                      ["accurate", "My information is accurate *"],
                      ["terms", "I agree to KMA's membership terms *"],
                      ["privacy", "I agree to the privacy policy *"],
                      ["marketing", "Send me optional news & updates"],
                    ] as Array<[keyof typeof consent, string]>
                  ).map(([k, lbl]) => (
                    <Pressable key={k} style={s.consentRow} onPress={() => { tap(); setConsent((c) => ({ ...c, [k]: !c[k] })); }}>
                      <View style={[s.checkbox, consent[k] && s.checkboxOn]}>{consent[k] ? <Text style={s.checkboxTick}>✓</Text> : null}</View>
                      <Text style={s.consentText}>{lbl}</Text>
                    </Pressable>
                  ))}
                  {errors.consent ? <Text style={s.error}>{errors.consent}</Text> : null}
                </>
              )}
              {step === 4 && (
                <>
                  <Text style={s.h2}>Review &amp; submit</Text>
                  {(
                    [
                      ["Name", [form.title, form.firstName, form.surname].filter(Boolean).join(" ")],
                      ["Address", [form.address1, form.townCity, form.postcode].filter(Boolean).join(", ")],
                      ["Email", form.email],
                      ["Telephone", form.telephone],
                      ["Proposer 1", form.p1fullName],
                      ["Proposer 2", form.p2fullName],
                      ["Username", form.username],
                    ] as Array<[string, string]>
                  ).map(([k, v]) => (
                    <View key={k} style={s.reviewRow}>
                      <Text style={s.reviewKey}>{k}</Text>
                      <Text style={s.reviewVal}>{v || "—"}</Text>
                    </View>
                  ))}
                  {msg ? <Text style={s.error}>{msg}</Text> : null}
                </>
              )}

              <View style={s.wnav}>
                {step > 0 ? (
                  <Pressable style={s.backBtn} onPress={() => { tap(); setStep((x) => x - 1); }}>
                    <Text style={s.backBtnText}>← Back</Text>
                  </Pressable>
                ) : (
                  <Pressable style={s.backBtn} onPress={() => { tap(); setMode("home"); }}>
                    <Text style={s.backBtnText}>Cancel</Text>
                  </Pressable>
                )}
                {step < 4 ? (
                  <GoldButton
                    label="Continue"
                    onPress={() => {
                      const e = validate(step);
                      setErrors(e);
                      if (!Object.keys(e).length) setStep((x) => x + 1);
                    }}
                  />
                ) : (
                  <GoldButton label={busy ? "Submitting…" : "Submit application"} onPress={submit} />
                )}
              </View>
              <Text style={s.savedNote}>Progress is saved on this phone automatically.</Text>
            </Card>
          </>
        )}

        {mode === "account" && member && (
          <>
            <Card>
              <Text style={s.h2}>As-salāmu ʿalaykum, {member.firstName}</Text>
              <Text style={s.hint}>
                Application {member.applicationNumber}
                {member.membershipNumber ? ` · Membership ${member.membershipNumber}` : ""}
              </Text>
              <Tracker member={member} />
              <View style={s.statusBox}>
                <Text style={s.statusTitle}>{member.statusLabel}</Text>
                <Text style={s.statusBody}>{member.nextAction}</Text>
              </View>
              {msg ? <Text style={s.ok}>{msg}</Text> : null}
            </Card>

            {member.bank && (
              <>
                <Section title={`Pay your £${Number(member.fee).toFixed(2)} fee`} />
                {member.billing ? (
                  <Card>
                    <Text style={s.hint}>
                      {member.billing.monthsCharged} month{member.billing.monthsCharged === 1 ? "" : "s"} at £
                      {member.billing.monthlyRate.toFixed(2)}/month until your renewal on {fmt(member.billing.renewalDate)}
                      {member.billing.adjustment > 0 ? ` (after a £${member.billing.adjustment.toFixed(2)} discount)` : ""}.
                    </Text>
                  </Card>
                ) : null}
                <Card>
                  {(
                    [
                      ["Account name", member.bank.accountName],
                      ["Sort code", member.bank.sortCode],
                      ["Account number", member.bank.accountNumber],
                      ["Your reference", member.paymentReference || ""],
                    ] as Array<[string, string]>
                  ).map(([k, v]) => (
                    <View key={k} style={s.reviewRow}>
                      <Text style={s.reviewKey}>{k}</Text>
                      <Text style={[s.reviewVal, k === "Your reference" && s.refVal]}>{v || "—"}</Text>
                    </View>
                  ))}
                  <Text style={s.hint}>Use your reference exactly — a volunteer verifies every payment before activation.</Text>
                  <Input label="Date you paid (YYYY-MM-DD)" value={payDate} onChange={setPayDate} autoCap="none" />
                  <Input label="Reference you used" value={payRef} onChange={setPayRef} autoCap="none" />
                  <GoldButton label={busy ? "Saving…" : "I've sent the payment"} onPress={doReport} />
                </Card>
              </>
            )}

            {member.membershipNumber && (
              <>
                <Section title="My membership" />
                <Card style={s.memberCard}>
                  <View style={s.cardHead}>
                    <Text style={s.cardOrg}>KINGSTON MUSLIM ASSOCIATION</Text>
                    <Text style={s.cardBadge}>MEMBER</Text>
                  </View>
                  <Text style={s.cardName}>{member.fullName}</Text>
                  <View style={s.cardRow}>
                    <View><Text style={s.cardK}>MEMBERSHIP NO.</Text><Text style={s.cardV}>{member.membershipNumber}</Text></View>
                    <View><Text style={s.cardK}>VALID UNTIL</Text><Text style={s.cardV}>{fmt(member.expiryDate)}</Text></View>
                  </View>
                </Card>
              </>
            )}

            {["active", "renewal-due", "renewal-pending"].includes(member.status) && token ? (
              <MembersArea token={token} />
            ) : null}

            {member.paymentHistory.length > 0 && (
              <>
                <Section title="Payment history" />
                <Card>
                  {member.paymentHistory.map((p, i) => (
                    <Text key={i} style={s.histRow}>
                      {fmt(p.at)}
                      {p.amount != null && p.amount > 0 ? ` — £${Number(p.amount).toFixed(2)}` : ""} ({p.note})
                    </Text>
                  ))}
                </Card>
              </>
            )}

            <Pressable onPress={signOut} style={s.linkBtn}>
              <Text style={s.linkBtnText}>Sign out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Page>
  );
}

const s = StyleSheet.create({
  lead: { color: colors.text, fontSize: t.body, lineHeight: 22, marginBottom: 14 },
  bold: { fontWeight: "800", color: colors.goldSoft },
  h2: { color: colors.text, fontSize: t.h2, fontWeight: "800", marginBottom: 10 },
  h3: { color: colors.goldSoft, fontSize: t.body, fontWeight: "800", marginTop: 6, marginBottom: 6 },
  linkBtn: { alignSelf: "center", padding: 12 },
  linkBtnText: { color: colors.goldSoft, fontWeight: "700", fontSize: t.body },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  howN: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(201,162,39,0.18)", alignItems: "center", justifyContent: "center" },
  howNText: { color: colors.goldSoft, fontWeight: "800" },
  howText: { color: colors.text, flex: 1, fontSize: t.body },

  field: { marginBottom: 12 },
  label: { color: colors.text, fontWeight: "700", fontSize: t.small, marginBottom: 4 },
  hint: { color: colors.textDim, fontSize: t.small, marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(232,213,154,0.25)",
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 9,
    fontSize: t.body,
  },
  inputError: { borderColor: "#e0533d" },
  error: { color: "#f2a196", fontSize: t.small, fontWeight: "700", marginTop: 4, marginBottom: 6 },
  ok: { color: "#9fd8b7", fontSize: t.small, fontWeight: "700", marginTop: 8 },

  wsteps: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, paddingHorizontal: 4 },
  wstep: { alignItems: "center", flex: 1, gap: 4 },
  tracker: { flexDirection: "row", justifyContent: "space-between", marginVertical: 14 },
  trackStep: { alignItems: "center", flex: 1, gap: 4 },
  trackDot: {
    width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 2, borderColor: "rgba(232,213,154,0.25)",
  },
  trackDotDone: { backgroundColor: "#157f54", borderColor: "#157f54" },
  trackDotCurrent: { borderColor: colors.gold, backgroundColor: "rgba(201,162,39,0.15)" },
  trackDotText: { color: colors.textDim, fontWeight: "800", fontSize: 13 },
  trackDotTextOn: { color: colors.text },
  trackLbl: { color: colors.textFaint, fontSize: 10, textAlign: "center" },
  trackLblOn: { color: colors.goldSoft, fontWeight: "700" },

  proposer: { borderTopWidth: 1, borderTopColor: "rgba(232,213,154,0.15)", paddingTop: 10, marginTop: 8 },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -6, marginBottom: 10 },
  strengthBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: 3 },
  strengthLbl: { color: colors.textDim, fontSize: t.small, fontWeight: "700", minWidth: 56 },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "rgba(232,213,154,0.4)",
    alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  checkboxOn: { backgroundColor: "#157f54", borderColor: "#157f54" },
  checkboxTick: { color: "#fff", fontWeight: "800", fontSize: 13 },
  consentText: { color: colors.text, flex: 1, fontSize: t.small, lineHeight: 19 },

  reviewRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  reviewKey: { color: colors.textDim, fontWeight: "700", width: 120, fontSize: t.small },
  reviewVal: { color: colors.text, flex: 1, fontSize: t.small },
  refVal: { color: colors.goldSoft, fontWeight: "800", letterSpacing: 0.5 },
  wnav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 10 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.08)" },
  backBtnText: { color: colors.text, fontWeight: "700" },
  savedNote: { color: colors.textFaint, fontSize: 11, textAlign: "center", marginTop: 12 },
  doneBadge: {
    alignSelf: "center", width: 64, height: 64, borderRadius: 32, backgroundColor: "#157f54",
    color: "#fff", fontSize: 30, fontWeight: "800", textAlign: "center", lineHeight: 62, marginBottom: 10, overflow: "hidden",
  },

  statusBox: { backgroundColor: "rgba(201,162,39,0.1)", borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: "rgba(201,162,39,0.3)" },
  statusTitle: { color: colors.goldSoft, fontWeight: "800", fontSize: t.body, marginBottom: 4 },
  statusBody: { color: colors.text, fontSize: t.small, lineHeight: 20 },

  memberCard: { backgroundColor: "#0d3b29", borderWidth: 1, borderColor: "rgba(232,213,154,0.3)" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardOrg: { color: colors.goldSoft, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  cardBadge: { backgroundColor: colors.gold, color: "#2a2000", fontWeight: "800", fontSize: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, letterSpacing: 1 },
  cardName: { color: colors.text, fontSize: 20, fontWeight: "800", marginVertical: 12 },
  cardRow: { flexDirection: "row", gap: 26 },
  cardK: { color: "rgba(244,239,226,0.6)", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  cardV: { color: colors.text, fontWeight: "800", marginTop: 2 },
  histRow: { color: colors.text, fontSize: t.small, marginBottom: 6 },
  noticeHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  noticeTitle: { color: colors.text, fontSize: t.body, fontWeight: "700", flex: 1 },
  noticeDate: { color: colors.textDim, fontSize: t.small },
  noticeBody: { color: colors.textDim, fontSize: t.small, marginTop: 4, lineHeight: 19 },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(244,239,226,0.14)",
  },
  docTitle: { color: colors.text, fontSize: t.body, fontWeight: "600" },
  docBtn: { color: colors.gold, fontSize: 20, paddingHorizontal: 6 },
  space: { height: space.lg },
});
