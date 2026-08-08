"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* The nikah application — six short, private steps. Reuses the volunteer
   wizard's design system (vw-*) so every mosque journey feels like one
   product. Drafts autosave locally (never the password); every answer is
   clearly labelled with WHO will be able to see it. */

type Form = Record<string, any>;

const EMPTY: Form = {
  firstName: "", surname: "", gender: "", dateOfBirth: "", heightCm: "", ethnicity: "",
  languages: "", townCity: "", postcode: "", telephone: "", email: "",
  practising: "", background: "", faithNotes: "", familyBackground: "",
  educationLevel: "", profession: "", aboutMe: "",
  maritalStatus: "", hasChildren: false, childrenDetails: "", timeframe: "",
  willingToRelocate: false, relocateWhere: "",
  lookingFor: "", essentials: "", prefAgeMin: "", prefAgeMax: "", acceptsChildren: false,
  managementMode: "joint", waliName: "", waliRelationship: "", waliPhone: "", waliEmail: "",
  password: "", password2: "",
  consentAccurate: false, consentTerms: false, consentProcess: false,
};

const DRAFT_KEY = "kma-nikah-draft";
const STEPS = ["About you", "Faith & family", "Life & work", "Marriage", "Looking for", "Wali & account"];

const PRACTISING = [["very", "Very practising"], ["practising", "Practising"], ["moderate", "Moderately practising"], ["growing", "Learning & growing"]];
const EDUCATION = [["secondary", "Secondary"], ["college", "College / A-levels"], ["vocational", "Vocational"], ["bachelors", "Bachelor's"], ["masters", "Master's"], ["doctorate", "Doctorate"], ["islamic-scholarship", "Islamic scholarship"]];
const TIMEFRAME = [["soon", "As soon as a good match is found"], ["year", "Within a year"], ["1-2-years", "In 1–2 years"], ["open", "No fixed timeframe"]];
const MARITAL = [["never-married", "Never married"], ["divorced", "Divorced"], ["widowed", "Widowed"]];

function Chip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`vw-chip${on ? " is-on" : ""}`} onClick={onToggle} aria-pressed={on}>
      {on ? "✓ " : ""}{label}
    </button>
  );
}

function Who({ level }: { level: "members" | "mosque" }) {
  return (
    <span className={`nk-who nk-who--${level}`}>
      {level === "members" ? "Shown to approved members (anonymously)" : "Mosque only — never shown to members"}
    </span>
  );
}

export default function NikahApplyWizard() {
  const [f, setF] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [topErr, setTopErr] = useState("");
  const honeypot = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setF({ ...EMPTY, ...(JSON.parse(saved) as Form), password: "", password2: "" });
    } catch { /* fresh */ }
  }, []);
  useEffect(() => {
    try {
      const { password, password2, ...rest } = f;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch { /* private mode */ }
  }, [f]);

  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const female = f.gender === "female";

  const age = useMemo(() => {
    if (!f.dateOfBirth) return null;
    const d = new Date(f.dateOfBirth);
    if (Number.isNaN(d.getTime())) return null;
    const n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a -= 1;
    return a;
  }, [f.dateOfBirth]);

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!f.firstName.trim()) e.firstName = "Please enter your first name.";
      if (!f.surname.trim()) e.surname = "Please enter your surname (mosque-only).";
      if (!f.gender) e.gender = "Please select male or female.";
      if (age == null) e.dateOfBirth = "Enter your date of birth.";
      else if (age < 18) e.dateOfBirth = "You must be 18 or over to use this service.";
      if (String(f.telephone).replace(/\D/g, "").length < 10) e.telephone = "Enter a valid phone number.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(f.email).trim())) e.email = "Enter a valid email address.";
    }
    if (s === 3 && !f.maritalStatus) e.maritalStatus = "Please select your marital status.";
    if (s === 5) {
      if (female && (!f.waliName.trim() || !f.waliPhone.trim())) e.wali = "Please provide your wali / family representative's name and number.";
      if (String(f.password).length < 8) e.password = "Choose a password of at least 8 characters.";
      if (f.password !== f.password2) e.password2 = "Passwords don't match.";
      if (!f.consentAccurate || !f.consentTerms || !f.consentProcess) e.consent = "Please confirm the three declarations.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (busy) return;
    if (!validate(5)) { scrollTop(); return; }
    setBusy(true);
    setTopErr("");
    try {
      const r = await fetch("/app-api/nikah/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: honeypot.current?.value || "",
          source: "website",
          ...f,
          heightCm: f.heightCm ? Number(f.heightCm) : undefined,
          prefAgeMin: f.prefAgeMin ? Number(f.prefAgeMin) : undefined,
          prefAgeMax: f.prefAgeMax ? Number(f.prefAgeMax) : undefined,
          wali: { name: f.waliName, relationship: f.waliRelationship, phone: f.waliPhone, email: f.waliEmail },
          consents: { accurate: f.consentAccurate, terms: f.consentTerms, process: f.consentProcess },
        }),
      });
      const d = await r.json();
      if (d?.ok) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
        setDone(true);
        scrollTop();
      } else if (d?.errors) {
        setErrors(d.errors);
        setTopErr("Please check the highlighted answers.");
        scrollTop();
      } else {
        setTopErr(d?.error || "Something went wrong — please try again.");
        scrollTop();
      }
    } catch {
      setTopErr("Could not reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="vw-done" ref={topRef}>
        <div className="vw-done__mark" aria-hidden>💠</div>
        <h2 className="vw-done__title">Application received</h2>
        <p className="vw-done__lead">JazakAllahu Khairan — your nikah application is with our team.</p>
        <p>
          It will be reviewed personally and in confidence. Nothing about you is visible to anyone until your
          application is approved — we&apos;ll email you at every step, and may contact you (and your family) for
          verification.
        </p>
        <p className="vw-done__dua">May Allah put barakah in your intention and decree what is best for you. Ameen.</p>
        <div className="vw-done__actions">
          <Link href="/nikah/account" className="btn btn-green">Sign in to my account</Link>
          <Link href="/" className="btn btn-outline vw-done__alt">Return to Kingston Mosque</Link>
        </div>
      </div>
    );
  }

  const field = (
    key: string, label: string, opts?: { type?: string; ph?: string; who?: "members" | "mosque"; req?: boolean; textarea?: boolean; help?: string },
  ) => (
    <div className="vw-field">
      <label htmlFor={`nk-${key}`}>
        {label} {opts?.req ? <span className="vw-req">*</span> : <span className="vw-opt">(optional)</span>}
        {opts?.who ? <Who level={opts.who} /> : null}
      </label>
      {opts?.help ? <p className="nk-help">{opts.help}</p> : null}
      {opts?.textarea ? (
        <textarea id={`nk-${key}`} rows={3} placeholder={opts?.ph} value={f[key]} onChange={(e) => set(key, e.target.value)} />
      ) : (
        <input id={`nk-${key}`} type={opts?.type || "text"} placeholder={opts?.ph} value={f[key]} onChange={(e) => set(key, e.target.value)} />
      )}
      {errors[key] ? <p className="vw-fielderr" role="alert">{errors[key]}</p> : null}
    </div>
  );

  const chips = (key: string, options: string[][], label: string, who?: "members" | "mosque", req?: boolean) => (
    <div className="vw-field">
      <span className="vw-label">
        {label} {req ? <span className="vw-req">*</span> : null} {who ? <Who level={who} /> : null}
      </span>
      <div className="vw-chips" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <Chip key={v} label={l} on={f[key] === v} onToggle={() => set(key, f[key] === v ? "" : v)} />
        ))}
      </div>
      {errors[key] ? <p className="vw-fielderr" role="alert">{errors[key]}</p> : null}
    </div>
  );

  return (
    <div className="vw" ref={topRef}>
      <div className="vw-progress" role="group" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        <div className="vw-progress__step is-on"><span>{step + 1}</span> {STEPS[step]}</div>
        <div className="vw-progress__bar"><div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        <div className="vw-progress__step"><span>{STEPS.length}</span> steps</div>
      </div>

      {topErr ? <p className="vw-error" role="alert">{topErr}</p> : null}
      <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="vw-hp" />

      <div className="vw-card">
        {step === 0 && (
          <>
            <p className="vw-sub">Everything here stays with the mosque unless marked otherwise — members only ever see an anonymous profile.</p>
            <div className="vw-grid2">
              {field("firstName", "First name", { req: true, who: "mosque" })}
              {field("surname", "Surname", { req: true, who: "mosque" })}
            </div>
            {chips("gender", [["male", "Male"], ["female", "Female"]], "I am a", undefined, true)}
            <div className="vw-grid2">
              {field("dateOfBirth", "Date of birth", { type: "date", req: true, who: "mosque", help: age != null ? `Members will only see your age: ${age}` : "Members will only ever see your age — never your date of birth." })}
              {field("heightCm", "Height (cm)", { type: "number", who: "members" })}
            </div>
            <div className="vw-grid2">
              {field("ethnicity", "Ethnic background", { who: "members" })}
              {field("languages", "Languages", { ph: "e.g. English, Urdu, Arabic", who: "members" })}
            </div>
            <div className="vw-grid2">
              {field("townCity", "Town / general area", { who: "members", help: "Shown as a general area only — never your address." })}
              {field("postcode", "Postcode", { who: "mosque" })}
            </div>
            <div className="vw-grid2">
              {field("telephone", "Phone number", { req: true, who: "mosque" })}
              {field("email", "Email address", { type: "email", req: true, who: "mosque" })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {chips("practising", PRACTISING, "How would you describe your practice?", "members")}
            {chips("background", [["born", "Born Muslim"], ["revert", "Revert"]], "Background", "members")}
            {field("faithNotes", "Your faith & practice, in your own words", { textarea: true, who: "members", ph: "Prayer, Qur'an, community, what deen means in your life…" })}
            {field("familyBackground", "Your family, briefly", { textarea: true, who: "members", ph: "e.g. family origins, siblings, how involved family will be…" })}
          </>
        )}

        {step === 2 && (
          <>
            {chips("educationLevel", EDUCATION, "Education", "members")}
            {field("profession", "Profession", { who: "members", help: "A general description — never your employer's name." })}
            {field("aboutMe", "About me", { textarea: true, who: "members", ph: "Personality, interests, what a normal week looks like…" })}
          </>
        )}

        {step === 3 && (
          <>
            {chips("maritalStatus", MARITAL, "Marital status", "members", true)}
            <div className="vw-field">
              <span className="vw-label">Do you have children? <Who level="members" /></span>
              <div className="vw-chips">
                <Chip label="Yes" on={f.hasChildren} onToggle={() => set("hasChildren", !f.hasChildren)} />
                <Chip label="No" on={!f.hasChildren} onToggle={() => set("hasChildren", false)} />
              </div>
              {f.hasChildren ? (
                <input aria-label="About your children" placeholder="e.g. 2 children, living with me" style={{ marginTop: 8 }} value={f.childrenDetails} onChange={(e) => set("childrenDetails", e.target.value)} />
              ) : null}
            </div>
            {chips("timeframe", TIMEFRAME, "When would you like to marry?", "members")}
            <div className="vw-field">
              <span className="vw-label">Would you consider relocating? <Who level="members" /></span>
              <div className="vw-chips">
                <Chip label="Yes" on={f.willingToRelocate} onToggle={() => set("willingToRelocate", !f.willingToRelocate)} />
                <Chip label="No" on={!f.willingToRelocate} onToggle={() => set("willingToRelocate", false)} />
              </div>
              {f.willingToRelocate ? (
                <input aria-label="Where would you relocate" placeholder="Where to?" style={{ marginTop: 8 }} value={f.relocateWhere} onChange={(e) => set("relocateWhere", e.target.value)} />
              ) : null}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {field("lookingFor", "What are you looking for in a spouse?", { textarea: true, who: "members" })}
            {field("essentials", "Your essentials (non-negotiables)", { textarea: true, who: "members", help: "The things that genuinely matter — deen, character, family expectations…" })}
            <div className="vw-grid2">
              {field("prefAgeMin", "Preferred age from", { type: "number", who: "mosque" })}
              {field("prefAgeMax", "to", { type: "number", who: "mosque" })}
            </div>
            <div className="vw-field">
              <span className="vw-label">Open to a spouse who has children? <Who level="mosque" /></span>
              <div className="vw-chips">
                <Chip label="Yes" on={f.acceptsChildren} onToggle={() => set("acceptsChildren", !f.acceptsChildren)} />
                <Chip label="No" on={!f.acceptsChildren} onToggle={() => set("acceptsChildren", false)} />
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            {chips("managementMode", [["self", "Self-managed"], ["joint", "Jointly with my wali/family"], ["wali", "Managed by my wali/family"]], "How would you like your search to be run?")}
            <div className="vw-note vw-note--info">
              <b>{female ? "Your wali / family representative (required)" : "Your wali / family contact (strongly encouraged)"}</b> — the
              Nikah team involves your family at every introduction. {female ? "" : "You may leave this blank and add it later with the team."}
              <div className="vw-grid2" style={{ marginTop: 10 }}>
                {field("waliName", "Name", { req: female, who: "mosque" })}
                {field("waliRelationship", "Relationship", { ph: "e.g. father, brother, aunt", who: "mosque" })}
              </div>
              <div className="vw-grid2">
                {field("waliPhone", "Phone", { req: female, who: "mosque" })}
                {field("waliEmail", "Email", { who: "mosque" })}
              </div>
              {errors.wali ? <p className="vw-fielderr" role="alert">{errors.wali}</p> : null}
            </div>
            <div className="vw-grid2">
              {field("password", "Choose a password", { type: "password", req: true, help: "At least 8 characters — you'll use your email + password to sign in." })}
              {field("password2", "Repeat password", { type: "password", req: true })}
            </div>
            <div className="vw-consent">
              {errors.consent ? <p className="vw-fielderr" role="alert">{errors.consent}</p> : null}
              <label className="vw-check">
                <input type="checkbox" checked={f.consentAccurate} onChange={(e) => set("consentAccurate", e.target.checked)} />
                <span>The information I&apos;ve provided is true and accurate, and my intention is marriage.</span>
              </label>
              <label className="vw-check">
                <input type="checkbox" checked={f.consentTerms} onChange={(e) => set("consentTerms", e.target.checked)} />
                <span>I agree to the service being managed by Kingston Mosque and to the <Link href="/resources/data-policy">Data Protection &amp; Privacy Policy</Link>.</span>
              </label>
              <label className="vw-check">
                <input type="checkbox" checked={f.consentProcess} onChange={(e) => set("consentProcess", e.target.checked)} />
                <span>I understand the mosque will verify my application, may contact my wali/family, and that introductions only happen through the Nikah team.</span>
              </label>
            </div>
          </>
        )}

        <div className="vw-navrow">
          {step > 0 ? (
            <button type="button" className="btn btn-outline vw-back" onClick={() => { setStep(step - 1); scrollTop(); }}>← Back</button>
          ) : <span />}
          {step < 5 ? (
            <button type="button" className="btn btn-green vw-next" onClick={() => { if (validate(step)) { setStep(step + 1); scrollTop(); } }}>
              Next: {STEPS[step + 1]} →
            </button>
          ) : (
            <button type="button" className="btn btn-gold vw-submit" onClick={submit} disabled={busy} aria-busy={busy}>
              {busy ? "Submitting…" : "Submit my application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
