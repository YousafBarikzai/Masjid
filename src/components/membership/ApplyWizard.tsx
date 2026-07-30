"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* The five-step membership application. Progress is saved to this device after
   every change (so people can leave and continue later), each step validates
   before moving on, errors are written in plain words next to the field, and
   the final step shows everything for review before submitting. The same
   endpoint serves the iOS/Android apps, so behaviour matches everywhere. */

type Form = Record<string, string>;
type Consents = { accurate: boolean; terms: boolean; privacy: boolean; marketing: boolean };

const DRAFT_KEY = "kma-membership-draft";
const STEPS = ["Personal details", "Contact & address", "KMA proposers", "Account & consent", "Review & submit"];

const empty: Form = {
  title: "", firstName: "", surname: "", gender: "", dateOfBirth: "",
  address1: "", address2: "", townCity: "", county: "", postcode: "", email: "", telephone: "",
  p1fullName: "", p1telephone: "", p1email: "", p1membershipNumber: "",
  p2fullName: "", p2telephone: "", p2email: "", p2membershipNumber: "",
  username: "", password: "", passwordConfirm: "",
};

/** 0–4 password score with a plain-words label. */
function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "" };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];
  return { score: s, label: labels[s] };
}

function Field({
  id, label, value, onChange, error, type = "text", hint, required, autoComplete,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string;
  type?: string; hint?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <div className={`mw-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label} {required ? <span aria-hidden="true" className="mw-req">*</span> : null}
      </label>
      {hint ? <span className="mw-hint">{hint}</span> : null}
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <span className="mw-error" id={`${id}-error`} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default function ApplyWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [consents, setConsents] = useState<Consents>({ accurate: false, terms: false, privacy: false, marketing: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [doneNumber, setDoneNumber] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [restored, setRestored] = useState(false);

  // Restore & continuously save the draft (passwords are never saved to disk).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { form?: Form; step?: number; consents?: Consents };
        if (d.form) setForm((f) => ({ ...f, ...d.form, password: "", passwordConfirm: "" }));
        if (typeof d.step === "number") setStep(Math.min(d.step, 3));
        if (d.consents) setConsents((c) => ({ ...c, ...d.consents }));
        setRestored(true);
      }
    } catch { /* fresh start */ }
  }, []);
  useEffect(() => {
    try {
      const { password: _p, passwordConfirm: _pc, ...safe } = form;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form: safe, step, consents }));
    } catch { /* private mode */ }
  }, [form, step, consents]);

  const set = useCallback((k: string) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)) : e));
  }, []);

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    const need = (k: string, msg: string) => { if (!form[k].trim()) e[k] = msg; };
    if (s === 0) {
      need("firstName", "Enter your first name.");
      need("surname", "Enter your surname.");
    }
    if (s === 1) {
      need("address1", "Enter the first line of your address.");
      need("townCity", "Enter your town or city.");
      need("postcode", "Enter your postcode.");
      need("email", "Enter your email address.");
      if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "That email address doesn't look right.";
      need("telephone", "Enter a telephone number.");
    }
    if (s === 2) {
      need("p1fullName", "Enter your first proposer's full name.");
      if (!form.p1telephone.trim() && !form.p1email.trim()) e.p1telephone = "Give a phone number or email for proposer 1.";
      need("p2fullName", "Enter your second proposer's full name.");
      if (!form.p2telephone.trim() && !form.p2email.trim()) e.p2telephone = "Give a phone number or email for proposer 2.";
    }
    if (s === 3) {
      need("username", "Choose a username.");
      if (form.username && !/^[a-zA-Z0-9._-]{3,30}$/.test(form.username)) e.username = "3–30 characters: letters, numbers, dots or dashes.";
      if (form.password.length < 8) e.password = "Use at least 8 characters.";
      if (form.passwordConfirm !== form.password) e.passwordConfirm = "The two passwords don't match.";
      if (!consents.accurate) e.consentAccurate = "Please confirm your information is accurate.";
      if (!consents.terms) e.consentTerms = "Please agree to the membership terms.";
      if (!consents.privacy) e.consentPrivacy = "Please agree to the privacy policy.";
    }
    return e;
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    // Re-validate everything (the password steps especially).
    for (let s = 0; s <= 3; s++) {
      const e = validateStep(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setBusy(true);
    setServerError("");
    try {
      const res = await fetch("/app-api/membership/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title, firstName: form.firstName, surname: form.surname,
          gender: form.gender, dateOfBirth: form.dateOfBirth,
          address1: form.address1, address2: form.address2, townCity: form.townCity,
          county: form.county, postcode: form.postcode, email: form.email, telephone: form.telephone,
          username: form.username, password: form.password, passwordConfirm: form.passwordConfirm,
          proposer1: { fullName: form.p1fullName, telephone: form.p1telephone, email: form.p1email, membershipNumber: form.p1membershipNumber },
          proposer2: { fullName: form.p2fullName, telephone: form.p2telephone, email: form.p2email, membershipNumber: form.p2membershipNumber },
          consents,
          website: "", // honeypot stays empty for humans
        }),
      });
      const data = (await res.json()) as { ok?: boolean; applicationNumber?: string; error?: string; errors?: Record<string, string> };
      if (data.ok) {
        setDoneNumber(data.applicationNumber || "");
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
      } else if (data.errors) {
        setErrors(data.errors);
        const k = Object.keys(data.errors)[0];
        setStep(k === "email" || k === "telephone" ? 1 : k.startsWith("consent") || k === "username" || k.startsWith("password") ? 3 : 0);
      } else {
        setServerError(data.error || "Something went wrong — please try again.");
      }
    } catch {
      setServerError("Could not reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (doneNumber !== null) {
    return (
      <div className="mw-done">
        <div className="mw-done__badge" aria-hidden>✓</div>
        <h2>Application submitted</h2>
        <p>
          Thank you — your application number is <b>{doneNumber}</b>. We&apos;ve emailed you a confirmation, and the
          committee will review your application. You can sign in at any time to check progress.
        </p>
        <p>
          <Link className="btn btn-green" href="/membership/account">Go to my account →</Link>
        </p>
      </div>
    );
  }

  const review: Array<[string, string]> = [
    ["Name", [form.title, form.firstName, form.surname].filter(Boolean).join(" ")],
    ["Gender", form.gender || "—"],
    ["Date of birth", form.dateOfBirth || "—"],
    ["Address", [form.address1, form.address2, form.townCity, form.county, form.postcode].filter(Boolean).join(", ")],
    ["Email", form.email],
    ["Telephone", form.telephone],
    ["Proposer 1", `${form.p1fullName} ${form.p1telephone || form.p1email}`.trim()],
    ["Proposer 2", `${form.p2fullName} ${form.p2telephone || form.p2email}`.trim()],
    ["Username", form.username],
    ["News & updates", consents.marketing ? "Yes please" : "No thanks"],
  ];

  return (
    <div className="mw">
      {/* Progress */}
      <ol className="mw-steps" aria-label="Application progress">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? "is-current" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="mw-steps__dot">{i < step ? "✓" : i + 1}</span>
            <span className="mw-steps__lbl">{s}</span>
          </li>
        ))}
      </ol>
      {restored && step > 0 ? <p className="mw-restored">Welcome back — we saved your progress on this device.</p> : null}

      {step === 0 && (
        <fieldset className="mw-card">
          <legend>Personal details</legend>
          <div className="mw-row">
            <div className="mw-field" style={{ maxWidth: 120 }}>
              <label htmlFor="title">Title</label>
              <select id="title" value={form.title} onChange={(e) => set("title")(e.target.value)}>
                <option value="">—</option>
                {["Mr", "Mrs", "Miss", "Ms", "Dr", "Other"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Field id="firstName" label="First name" required value={form.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="given-name" />
            <Field id="surname" label="Surname" required value={form.surname} onChange={set("surname")} error={errors.surname} autoComplete="family-name" />
          </div>
          <div className="mw-row">
            <div className="mw-field">
              <label htmlFor="gender">Gender</label>
              <select id="gender" value={form.gender} onChange={(e) => set("gender")(e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Field id="dateOfBirth" label="Date of birth" type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} autoComplete="bday" />
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="mw-card">
          <legend>Contact &amp; address</legend>
          <Field id="address1" label="Address line 1" required value={form.address1} onChange={set("address1")} error={errors.address1} autoComplete="address-line1" />
          <Field id="address2" label="Address line 2" value={form.address2} onChange={set("address2")} autoComplete="address-line2" />
          <div className="mw-row">
            <Field id="townCity" label="Town / City" required value={form.townCity} onChange={set("townCity")} error={errors.townCity} autoComplete="address-level2" />
            <Field id="county" label="County" value={form.county} onChange={set("county")} />
            <Field id="postcode" label="Postcode" required value={form.postcode} onChange={set("postcode")} error={errors.postcode} autoComplete="postal-code" />
          </div>
          <div className="mw-row">
            <Field id="email" label="Email address" type="email" required hint="We'll send your application updates here." value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            <Field id="telephone" label="Telephone number" type="tel" required value={form.telephone} onChange={set("telephone")} error={errors.telephone} autoComplete="tel" />
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="mw-card">
          <legend>Your two KMA proposers</legend>
          <p className="mw-intro">Two current KMA members who support your application. We may contact them to confirm.</p>
          {[1, 2].map((n) => (
            <div key={n} className="mw-proposer">
              <h3>KMA proposer {n}</h3>
              <Field id={`p${n}fullName`} label="Full name" required value={form[`p${n}fullName`]} onChange={set(`p${n}fullName`)} error={errors[`p${n}fullName`]} />
              <div className="mw-row">
                <Field id={`p${n}telephone`} label="Telephone number" type="tel" value={form[`p${n}telephone`]} onChange={set(`p${n}telephone`)} error={errors[`p${n}telephone`]} />
                <Field id={`p${n}email`} label="Email address" type="email" value={form[`p${n}email`]} onChange={set(`p${n}email`)} />
                <Field id={`p${n}membershipNumber`} label="KMA membership no." hint="If they know it." value={form[`p${n}membershipNumber`]} onChange={set(`p${n}membershipNumber`)} />
              </div>
            </div>
          ))}
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="mw-card">
          <legend>Your account &amp; consent</legend>
          <Field id="username" label="Username" required hint="You'll use this (or your email) to sign in." value={form.username} onChange={set("username")} error={errors.username} autoComplete="username" />
          <div className="mw-row">
            <div className="mw-field-stack">
              <Field id="password" label="Password" type="password" required hint="At least 8 characters." value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
              {form.password ? (
                <div className={`mw-strength s-${strength.score}`} aria-live="polite">
                  <span className="mw-strength__bar"><span style={{ width: `${(strength.score / 4) * 100}%` }} /></span>
                  <span className="mw-strength__lbl">{strength.label}</span>
                </div>
              ) : null}
            </div>
            <Field id="passwordConfirm" label="Confirm password" type="password" required value={form.passwordConfirm} onChange={set("passwordConfirm")} error={errors.passwordConfirm} autoComplete="new-password" />
          </div>
          <div className="mw-consents">
            {(
              [
                ["accurate", "I confirm the information I've provided is accurate.", errors.consentAccurate],
                ["terms", "I agree to KMA's membership terms.", errors.consentTerms],
                ["privacy", "I agree to the privacy policy and the use of my personal data to manage my membership.", errors.consentPrivacy],
                ["marketing", "Please also send me optional news and community updates (you can change this any time).", undefined],
              ] as Array<[keyof Consents, string, string | undefined]>
            ).map(([k, label, err]) => (
              <label key={k} className={`mw-consent${err ? " has-error" : ""}`}>
                <input
                  type="checkbox"
                  checked={consents[k]}
                  onChange={(e) => setConsents((c) => ({ ...c, [k]: e.target.checked }))}
                />
                <span>
                  {label}
                  {err ? <span className="mw-error" role="alert"> {err}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="mw-card">
          <legend>Review &amp; submit</legend>
          <p className="mw-intro">Please check everything is right. Use Back to change anything.</p>
          <dl className="mw-review">
            {review.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>
            ))}
          </dl>
          {serverError ? <p className="mw-servererror" role="alert">{serverError}</p> : null}
        </fieldset>
      )}

      <div className="mw-nav">
        {step > 0 ? (
          <button type="button" className="btn mw-back" onClick={() => setStep((s) => s - 1)}>← Back</button>
        ) : <span />}
        {step < 4 ? (
          <button type="button" className="btn btn-green" onClick={next}>Continue →</button>
        ) : (
          <button type="button" className="btn btn-gold" onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit my application"}
          </button>
        )}
      </div>
      <p className="mw-savednote">Your progress is saved on this device automatically — you can come back and continue later.</p>
    </div>
  );
}
