import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Page, Card, Section, GoldButton, tap } from "../src/ui";
import { colors, radius, space, type as t } from "../src/theme";
import {
  volunteerMeta,
  volunteerRegister,
  type VolunteerArea,
  type VolunteerMeta,
} from "../src/api";
import { Platform } from "react-native";

/* Volunteer With Us — the native registration journey. Same two friendly
   steps as the website, same CMS-driven areas & activities, same central
   volunteers database: register here and you appear in the CMS exactly like
   a website registration. Drafts save on-device so nothing is ever lost. */

const DRAFT_KEY = "kma-volunteer-draft";

type Form = {
  fullName: string; gender: string; ageGroup: string;
  guardianName: string; guardianPhone: string;
  mobile: string; email: string; preferredContact: string; postcode: string;
  languages: string[]; otherLanguage: string;
  generalVolunteer: boolean; categories: Array<number | string>;
  days: string[]; times: string[]; frequency: string;
  leadership: string; previousVolunteer: boolean; previousDetails: string;
  skills: string; additionalInfo: string;
  consentAccurate: boolean; consentContact: boolean; consentChecks: boolean;
};

const EMPTY: Form = {
  fullName: "", gender: "", ageGroup: "", guardianName: "", guardianPhone: "",
  mobile: "", email: "", preferredContact: "any", postcode: "",
  languages: [], otherLanguage: "",
  generalVolunteer: false, categories: [],
  days: [], times: [], frequency: "",
  leadership: "", previousVolunteer: false, previousDetails: "",
  skills: "", additionalInfo: "",
  consentAccurate: false, consentContact: false, consentChecks: false,
};

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      style={[s.chip, on && s.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[s.chipText, on && s.chipTextOn]}>{on ? "✓ " : ""}{label}</Text>
    </Pressable>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}{required ? <Text style={{ color: "#e08a7e" }}> *</Text> : null}</Text>
      {children}
    </View>
  );
}

function Input(props: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  keyboard?: "default" | "email-address" | "phone-pad"; multiline?: boolean;
}) {
  return (
    <TextInput
      style={[s.input, props.multiline && { minHeight: 70, textAlignVertical: "top" }]}
      value={props.value}
      onChangeText={props.onChange}
      placeholder={props.placeholder}
      placeholderTextColor={colors.textFaint}
      keyboardType={props.keyboard}
      autoCapitalize={props.keyboard === "email-address" ? "none" : "sentences"}
      multiline={props.multiline}
    />
  );
}

export default function Volunteer() {
  const router = useRouter();
  const [meta, setMeta] = useState<VolunteerMeta | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [openArea, setOpenArea] = useState<string | null>(null);

  useEffect(() => {
    volunteerMeta().then((d) => d?.ok && setMeta(d)).catch(() => {});
    AsyncStorage.getItem(DRAFT_KEY)
      .then((saved) => saved && setForm({ ...EMPTY, ...(JSON.parse(saved) as Partial<Form>) }))
      .catch(() => {});
  }, []);
  useEffect(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form)).catch(() => {});
  }, [form]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k: "languages" | "days" | "times", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
  const toggleCat = (id: number | string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.some((x) => String(x) === String(id))
        ? f.categories.filter((x) => String(x) !== String(id))
        : [...f.categories, id],
    }));

  const underage = ["Under 16", "16–17"].includes(form.ageGroup);
  const allCats = useMemo(() => (meta?.areas || []).flatMap((a: VolunteerArea) => a.categories), [meta]);
  const chosen = useMemo(
    () => allCats.filter((c) => form.categories.some((x) => String(x) === String(c.id))),
    [allCats, form.categories],
  );
  const needsSafeguarding = chosen.some((c) => c.safeguarding);

  function next() {
    if (!form.fullName.trim()) return setErr("Please tell us your name.");
    if (!form.ageGroup) return setErr("Please choose your age group.");
    if (underage && (!form.guardianName.trim() || !form.guardianPhone.trim()))
      return setErr("For under-18s we need a parent or guardian's name and number.");
    if (form.mobile.replace(/\D/g, "").length < 10) return setErr("Enter a valid mobile number.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setErr("Enter a valid email address.");
    setErr("");
    setStep(2);
  }

  async function submit() {
    if (busy) return;
    if (!form.generalVolunteer && form.categories.length === 0)
      return setErr("Choose at least one activity — or tick “General volunteer”.");
    if (!form.consentAccurate || !form.consentContact || !form.consentChecks)
      return setErr("Please tick the three confirmations at the bottom.");
    setErr("");
    setBusy(true);
    try {
      const d = await volunteerRegister({
        source: Platform.OS === "ios" ? "ios" : "android",
        fullName: form.fullName,
        gender: form.gender || undefined,
        ageGroup: form.ageGroup,
        guardian: underage ? { name: form.guardianName, phone: form.guardianPhone } : undefined,
        mobile: form.mobile,
        email: form.email,
        preferredContact: form.preferredContact,
        postcode: form.postcode,
        languages: form.languages,
        otherLanguage: form.otherLanguage,
        generalVolunteer: form.generalVolunteer,
        categories: form.categories,
        days: form.days,
        times: form.times,
        frequency: form.frequency || undefined,
        leadership: form.leadership || undefined,
        previousVolunteer: form.previousVolunteer,
        previousDetails: form.previousDetails,
        skills: form.skills,
        additionalInfo: form.additionalInfo,
        consents: { accurate: true, contact: true, checks: true },
      });
      if (d.ok) {
        await AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
        setDone(true);
      } else setErr(d.error || Object.values(d.errors || {})[0] || "Something went wrong — try again.");
    } catch {
      setErr("Could not reach the server — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Page back eyebrow="Volunteer" title="JazakAllahu Khairan">
        <Card style={{ alignItems: "center", gap: space.md, paddingVertical: 30 }}>
          <Text style={{ fontSize: 44 }}>🤲</Text>
          <Text style={s.doneTitle}>Thank you for registering as a Kingston Mosque volunteer.</Text>
          <Text style={s.doneBody}>
            Your details have been received — you don't need to submit again. Our team will contact you when a
            suitable opportunity comes up, and we've emailed you a confirmation.
          </Text>
          <Text style={[s.doneBody, { fontStyle: "italic", color: colors.textDim }]}>
            May Allah reward you for offering your time and skills. Ameen.
          </Text>
          <GoldButton label="Done" onPress={() => router.back()} />
        </Card>
      </Page>
    );
  }

  const o = meta?.options;

  return (
    <Page
      back
      eyebrow={`Step ${step} of 2`}
      title="Volunteer With Us"
      subtitle={step === 1 ? "A short form — about two minutes" : "Pick as many ways to help as you like"}
    >
      {err ? (
        <Card style={{ borderColor: "#a33", borderWidth: 1 }}>
          <Text style={{ color: "#e08a7e", fontWeight: "700" }}>{err}</Text>
        </Card>
      ) : null}

      {step === 1 && (
        <Card style={{ gap: space.lg }}>
          <Field label="Full name" required>
            <Input value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Your name" />
          </Field>
          <Field label="Gender">
            <View style={s.chips}>
              <Chip label="Male" on={form.gender === "male"} onPress={() => set("gender", form.gender === "male" ? "" : "male")} />
              <Chip label="Female" on={form.gender === "female"} onPress={() => set("gender", form.gender === "female" ? "" : "female")} />
            </View>
          </Field>
          <Field label="Age group" required>
            <View style={s.chips}>
              {(o?.ageGroups || []).map((a) => (
                <Chip key={a} label={a} on={form.ageGroup === a} onPress={() => set("ageGroup", form.ageGroup === a ? "" : a)} />
              ))}
            </View>
          </Field>
          {underage && (
            <Card style={{ backgroundColor: "rgba(201,162,39,0.08)", gap: space.md }}>
              <Text style={s.label}>Under 18 — parent / guardian details</Text>
              <Input value={form.guardianName} onChange={(v) => set("guardianName", v)} placeholder="Parent / guardian name *" />
              <Input value={form.guardianPhone} onChange={(v) => set("guardianPhone", v)} placeholder="Their contact number *" keyboard="phone-pad" />
            </Card>
          )}
          <Field label="Mobile number" required>
            <Input value={form.mobile} onChange={(v) => set("mobile", v)} keyboard="phone-pad" placeholder="07…" />
          </Field>
          <Field label="Email address" required>
            <Input value={form.email} onChange={(v) => set("email", v)} keyboard="email-address" placeholder="you@example.com" />
          </Field>
          <Field label="How should we contact you?">
            <View style={s.chips}>
              {(o?.contactMethods || []).map((m) => (
                <Chip key={m.value} label={m.label} on={form.preferredContact === m.value} onPress={() => set("preferredContact", m.value)} />
              ))}
            </View>
          </Field>
          <Field label="Postcode (optional)">
            <Input value={form.postcode} onChange={(v) => set("postcode", v)} placeholder="KT1…" />
          </Field>
          <Field label="Languages you speak">
            <View style={s.chips}>
              {(o?.languages || []).map((l) => (
                <Chip key={l} label={l} on={form.languages.includes(l)} onPress={() => toggleIn("languages", l)} />
              ))}
            </View>
            {form.languages.includes("Other") ? (
              <Input value={form.otherLanguage} onChange={(v) => set("otherLanguage", v)} placeholder="Which other language?" />
            ) : null}
          </Field>
          <GoldButton label="Next — how you can help" onPress={next} />
        </Card>
      )}

      {step === 2 && meta && (
        <>
          <Pressable
            onPress={() => { tap(); set("generalVolunteer", !form.generalVolunteer); }}
            style={[s.general, form.generalVolunteer && s.generalOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: form.generalVolunteer }}
          >
            <Text style={{ fontSize: 26 }}>{form.generalVolunteer ? "✅" : "🤲"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.generalTitle}>General volunteer</Text>
              <Text style={s.generalSub}>I'm happy to help wherever needed</Text>
            </View>
          </Pressable>

          {meta.areas.map((a) => {
            const selectedHere = a.categories.filter((c) => form.categories.some((x) => String(x) === String(c.id))).length;
            const open = openArea === String(a.id);
            return (
              <Card key={a.id} style={{ gap: space.sm, paddingVertical: 12 }}>
                <Pressable
                  onPress={() => { tap(); setOpenArea(open ? null : String(a.id)); }}
                  style={s.areaHead}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                >
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                  <Text style={s.areaName}>{a.name}</Text>
                  {selectedHere > 0 ? (
                    <View style={s.count}><Text style={s.countText}>{selectedHere}</Text></View>
                  ) : null}
                  <Text style={s.chev}>{open ? "−" : "+"}</Text>
                </Pressable>
                {open ? (
                  <View style={s.chips}>
                    {a.categories.map((c) => (
                      <Chip
                        key={c.id}
                        label={c.safeguarding ? `${c.name} 🛡` : c.name}
                        on={form.categories.some((x) => String(x) === String(c.id))}
                        onPress={() => toggleCat(c.id)}
                      />
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })}

          {needsSafeguarding ? (
            <Card style={{ backgroundColor: "rgba(201,162,39,0.08)" }}>
              <Text style={s.noteText}>
                🛡 Some activities you chose involve children or vulnerable people — safeguarding checks (such as DBS)
                may be needed first. Our team will guide you; nothing to do now.
              </Text>
            </Card>
          ) : null}

          <Section title="When can you usually help?" />
          <Card style={{ gap: space.lg }}>
            <Field label="Days">
              <View style={s.chips}>
                {(o?.days || []).map((d) => (
                  <Chip key={d} label={d.slice(0, 3)} on={form.days.includes(d)} onPress={() => toggleIn("days", d)} />
                ))}
              </View>
            </Field>
            <Field label="Times">
              <View style={s.chips}>
                {(o?.times || []).map((x) => (
                  <Chip key={x} label={x} on={form.times.includes(x)} onPress={() => toggleIn("times", x)} />
                ))}
              </View>
            </Field>
            <Field label="How often?">
              <View style={s.chips}>
                {(o?.frequencies || []).map((f) => (
                  <Chip key={f} label={f} on={form.frequency === f} onPress={() => set("frequency", form.frequency === f ? "" : f)} />
                ))}
              </View>
            </Field>
          </Card>

          <Section title="A little more (optional)" />
          <Card style={{ gap: space.lg }}>
            <Field label="Willing to lead or coordinate a small group?">
              <View style={s.chips}>
                {(["yes", "maybe", "no"] as const).map((v) => (
                  <Chip
                    key={v}
                    label={v === "yes" ? "Yes" : v === "maybe" ? "Maybe" : "No"}
                    on={form.leadership === v}
                    onPress={() => set("leadership", form.leadership === v ? "" : v)}
                  />
                ))}
              </View>
            </Field>
            <Field label="Volunteered at Kingston Mosque before?">
              <View style={s.chips}>
                <Chip label="Yes" on={form.previousVolunteer} onPress={() => set("previousVolunteer", !form.previousVolunteer)} />
              </View>
              {form.previousVolunteer ? (
                <Input value={form.previousDetails} onChange={(v) => set("previousDetails", v)} placeholder="Briefly, what did you help with?" />
              ) : null}
            </Field>
            <Field label="Skills or experience that could help the mosque">
              <Input
                multiline
                value={form.skills}
                onChange={(v) => set("skills", v)}
                placeholder="First aid, teaching, photography, accounting, IT, languages…"
              />
            </Field>
            <Field label="Anything else you'd like us to know?">
              <Input multiline value={form.additionalInfo} onChange={(v) => set("additionalInfo", v)} />
            </Field>
          </Card>

          <Card style={{ gap: space.md }}>
            {(
              [
                ["consentAccurate", "The information I've provided is accurate."],
                ["consentContact", "Kingston Mosque may contact me about volunteering."],
                ["consentChecks", "I understand some activities may need checks or approval first."],
              ] as Array<[keyof Form, string]>
            ).map(([k, label]) => (
              <Pressable
                key={k}
                onPress={() => { tap(); set(k, !form[k] as never); }}
                style={s.consentRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: Boolean(form[k]) }}
              >
                <Text style={[s.consentBox, form[k] ? s.consentBoxOn : null]}>{form[k] ? "✓" : ""}</Text>
                <Text style={s.consentText}>{label}</Text>
              </Pressable>
            ))}
            <Text style={s.privacy}>We only use your details to organise volunteering — see the Data Policy on our website.</Text>
          </Card>

          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <Pressable onPress={() => { tap(); setStep(1); }} style={s.backBtn} accessibilityRole="button">
              <Text style={s.backText}>← Back</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <GoldButton label={busy ? "Submitting…" : "Submit registration"} onPress={submit} />
            </View>
          </View>
        </>
      )}
    </Page>
  );
}

const s = StyleSheet.create({
  label: { color: colors.text, fontSize: t.small, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(244,239,226,0.18)",
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: t.body,
    minHeight: 46,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: "rgba(244,239,226,0.22)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { color: colors.text, fontSize: t.small, fontWeight: "600" },
  chipTextOn: { color: colors.onGold, fontWeight: "800" },
  general: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(201,162,39,0.5)",
    borderRadius: radius.lg,
    padding: 16,
    backgroundColor: "rgba(201,162,39,0.06)",
  },
  generalOn: { borderStyle: "solid", borderColor: colors.gold, backgroundColor: "rgba(201,162,39,0.16)" },
  generalTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  generalSub: { color: colors.textDim, fontSize: t.small },
  areaHead: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40 },
  areaName: { flex: 1, color: colors.text, fontSize: t.body, fontWeight: "700" },
  count: { backgroundColor: colors.gold, borderRadius: 999, minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  countText: { color: colors.onGold, fontSize: 12, fontWeight: "800" },
  chev: { color: colors.textDim, fontSize: 20, fontWeight: "700" },
  noteText: { color: colors.text, fontSize: t.small, lineHeight: 20 },
  consentRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  consentBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(244,239,226,0.35)",
    color: colors.onGold,
    textAlign: "center",
    fontWeight: "900",
    lineHeight: 21,
  },
  consentBoxOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  consentText: { flex: 1, color: colors.text, fontSize: t.small, lineHeight: 20 },
  privacy: { color: colors.textFaint, fontSize: t.tiny },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  backText: { color: colors.goldSoft, fontWeight: "700", fontSize: t.body },
  doneTitle: { color: colors.text, fontSize: t.h2, fontWeight: "800", textAlign: "center" },
  doneBody: { color: colors.text, fontSize: t.body, lineHeight: 22, textAlign: "center" },
});
