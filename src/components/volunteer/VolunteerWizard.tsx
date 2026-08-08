"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* The volunteer registration wizard — two friendly steps, mobile-first,
   built for people arriving from a QR code on the digital screens:

     Step 1 · About you       name, contact, age group (+ guardian if under 18)
     Step 2 · How you'd like to help
                              general-volunteer card, CMS-driven activity
                              areas (expandable), availability, optional
                              extras, consent, submit

   Everything typed is kept in localStorage so going back (or losing signal
   mid-mosque) never loses the form. Categories come from /app-api/volunteer/
   meta, so the mosque team can reshape the whole form from the CMS. */

type Cat = { id: string | number; name: string; audience: string; safeguarding: boolean; requiresDbs: boolean; popular: boolean };
type Area = { id: string | number; name: string; icon: string; description: string; categories: Cat[] };
type Meta = {
  areas: Area[];
  options: {
    ageGroups: string[];
    days: string[];
    times: string[];
    frequencies: string[];
    languages: string[];
    contactMethods: Array<{ label: string; value: string }>;
  };
};

type Form = {
  fullName: string;
  gender: string;
  ageGroup: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  mobile: string;
  email: string;
  preferredContact: string;
  postcode: string;
  languages: string[];
  otherLanguage: string;
  generalVolunteer: boolean;
  categories: Array<string | number>;
  days: string[];
  times: string[];
  frequency: string;
  leadership: string;
  previousVolunteer: boolean;
  previousDetails: string;
  skills: string;
  additionalInfo: string;
  consentAccurate: boolean;
  consentContact: boolean;
  consentChecks: boolean;
};

const EMPTY: Form = {
  fullName: "", gender: "", ageGroup: "", guardianName: "", guardianPhone: "", guardianEmail: "",
  mobile: "", email: "", preferredContact: "any", postcode: "", languages: [], otherLanguage: "",
  generalVolunteer: false, categories: [], days: [], times: [], frequency: "", leadership: "",
  previousVolunteer: false, previousDetails: "", skills: "", additionalInfo: "",
  consentAccurate: false, consentContact: false, consentChecks: false,
};

const DRAFT_KEY = "kma-volunteer-draft";

function Chip({
  label, on, onToggle, badge,
}: { label: string; on: boolean; onToggle: () => void; badge?: string }) {
  return (
    <button type="button" className={`vw-chip${on ? " is-on" : ""}`} onClick={onToggle} aria-pressed={on}>
      {on ? <span aria-hidden>✓ </span> : null}
      {label}
      {badge ? <span className="vw-chip__badge">{badge}</span> : null}
    </button>
  );
}

export default function VolunteerWizard() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [duplicate, setDuplicate] = useState("");
  const [openArea, setOpenArea] = useState<string | null>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Load the CMS-driven form structure + any saved draft.
  useEffect(() => {
    fetch("/app-api/volunteer/meta")
      .then((r) => r.json())
      .then((d) => d?.ok && setMeta(d))
      .catch(() => {});
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setForm({ ...EMPTY, ...(JSON.parse(saved) as Partial<Form>) });
    } catch { /* fresh form */ }
  }, []);
  // Keep the draft — going back or losing connection never loses answers.
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* private mode */ }
  }, [form]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k: "languages" | "days" | "times", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }));
  const toggleCat = (id: string | number) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.some((x) => String(x) === String(id))
        ? f.categories.filter((x) => String(x) !== String(id))
        : [...f.categories, id],
    }));

  const underage = ["Under 16", "16–17"].includes(form.ageGroup);
  const allCats = useMemo(() => (meta?.areas || []).flatMap((a) => a.categories), [meta]);
  const chosenCats = useMemo(
    () => allCats.filter((c) => form.categories.some((x) => String(x) === String(c.id))),
    [allCats, form.categories],
  );
  const needsSafeguarding = chosenCats.some((c) => c.safeguarding);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  function validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Please tell us your name.";
    if (!form.ageGroup) e.ageGroup = "Please choose your age group.";
    if (underage && (!form.guardianName.trim() || !form.guardianPhone.trim()))
      e.guardian = "For under-18s we need a parent or guardian's name and number.";
    if (form.mobile.replace(/\D/g, "").length < 10) e.mobile = "Enter a valid mobile number.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = "Enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (!form.generalVolunteer && form.categories.length === 0)
      e.categories = "Choose at least one activity — or tick “General volunteer”.";
    if (!form.consentAccurate || !form.consentContact || !form.consentChecks)
      e.consent = "Please tick the three confirmations so we can register you.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const submit = useCallback(async () => {
    if (busy) return; // double-tap protection
    if (!validateStep2()) { scrollTop(); return; }
    setBusy(true);
    setDuplicate("");
    try {
      const r = await fetch("/app-api/volunteer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: honeypot.current?.value || "",
          source: "website",
          fullName: form.fullName,
          gender: form.gender || undefined,
          ageGroup: form.ageGroup,
          guardian: underage ? { name: form.guardianName, phone: form.guardianPhone, email: form.guardianEmail } : undefined,
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
          consents: { accurate: form.consentAccurate, contact: form.consentContact, checks: form.consentChecks },
        }),
      });
      const d = await r.json();
      if (d?.ok) {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* fine */ }
        setDone(true);
        scrollTop();
      } else if (d?.duplicate) {
        setDuplicate(String(d.error || "You're already registered."));
        scrollTop();
      } else if (d?.errors) {
        setErrors(d.errors as Record<string, string>);
        scrollTop();
      } else {
        setErrors({ submit: d?.error || "Something went wrong — please try again." });
      }
    } catch {
      setErrors({ submit: "Could not reach the server — check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }, [busy, form, underage]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------- Success -------------------------------- */
  if (done) {
    return (
      <div className="vw-done" ref={topRef}>
        <div className="vw-done__mark" aria-hidden>🤲</div>
        <h2 className="vw-done__title">JazakAllahu Khairan</h2>
        <p className="vw-done__lead">Thank you for registering as a Kingston Mosque volunteer.</p>
        <p>
          Your details have been received successfully — <b>you don&apos;t need to submit again</b>. Our team will
          review your registration and contact you when a suitable volunteering opportunity becomes available.
          We&apos;ve also emailed you a confirmation.
        </p>
        <p className="vw-done__dua">May Allah reward you for offering your time and skills to support the masjid and community. Ameen.</p>
        <div className="vw-done__actions">
          <Link href="/" className="btn btn-green">Return to Kingston Mosque</Link>
          <Link href="/events" className="btn btn-outline vw-done__alt">See upcoming events</Link>
        </div>
      </div>
    );
  }

  const o = meta?.options;

  return (
    <div className="vw" ref={topRef}>
      {/* Progress */}
      <div className="vw-progress" role="group" aria-label={`Step ${step} of 2`}>
        <div className={`vw-progress__step${step >= 1 ? " is-on" : ""}`}><span>1</span> About you</div>
        <div className="vw-progress__bar"><div style={{ width: step === 1 ? "50%" : "100%" }} /></div>
        <div className={`vw-progress__step${step >= 2 ? " is-on" : ""}`}><span>2</span> How you can help</div>
      </div>

      {duplicate ? <p className="vw-error" role="alert">{duplicate}</p> : null}
      {errors.submit ? <p className="vw-error" role="alert">{errors.submit}</p> : null}

      {/* Honeypot — hidden from real people */}
      <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="vw-hp" />

      {step === 1 && (
        <div className="vw-card">
          <div className="vw-field">
            <label htmlFor="vw-name">Full name <span className="vw-req">*</span></label>
            <input id="vw-name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoComplete="name" />
            {errors.fullName ? <p className="vw-fielderr" role="alert">{errors.fullName}</p> : null}
          </div>

          <div className="vw-field">
            <span className="vw-label" id="vw-gender-l">Gender</span>
            <div className="vw-chips" role="group" aria-labelledby="vw-gender-l">
              <Chip label="Male" on={form.gender === "male"} onToggle={() => set("gender", form.gender === "male" ? "" : "male")} />
              <Chip label="Female" on={form.gender === "female"} onToggle={() => set("gender", form.gender === "female" ? "" : "female")} />
            </div>
          </div>

          <div className="vw-field">
            <span className="vw-label" id="vw-age-l">Age group <span className="vw-req">*</span></span>
            <div className="vw-chips" role="group" aria-labelledby="vw-age-l">
              {(o?.ageGroups || []).map((a) => (
                <Chip key={a} label={a} on={form.ageGroup === a} onToggle={() => set("ageGroup", form.ageGroup === a ? "" : a)} />
              ))}
            </div>
            {errors.ageGroup ? <p className="vw-fielderr" role="alert">{errors.ageGroup}</p> : null}
          </div>

          {underage && (
            <div className="vw-note vw-note--info">
              <b>Under 18?</b> Wonderful — young volunteers are very welcome. We just need a parent or guardian&apos;s details too.
              <div className="vw-grid2" style={{ marginTop: 10 }}>
                <div className="vw-field">
                  <label htmlFor="vw-gname">Parent / guardian name <span className="vw-req">*</span></label>
                  <input id="vw-gname" value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} />
                </div>
                <div className="vw-field">
                  <label htmlFor="vw-gphone">Their contact number <span className="vw-req">*</span></label>
                  <input id="vw-gphone" inputMode="tel" value={form.guardianPhone} onChange={(e) => set("guardianPhone", e.target.value)} />
                </div>
              </div>
              <div className="vw-field">
                <label htmlFor="vw-gemail">Their email (optional)</label>
                <input id="vw-gemail" inputMode="email" value={form.guardianEmail} onChange={(e) => set("guardianEmail", e.target.value)} />
              </div>
              {errors.guardian ? <p className="vw-fielderr" role="alert">{errors.guardian}</p> : null}
            </div>
          )}

          <div className="vw-grid2">
            <div className="vw-field">
              <label htmlFor="vw-mobile">Mobile number <span className="vw-req">*</span></label>
              <input id="vw-mobile" inputMode="tel" autoComplete="tel" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
              {errors.mobile ? <p className="vw-fielderr" role="alert">{errors.mobile}</p> : null}
            </div>
            <div className="vw-field">
              <label htmlFor="vw-email">Email address <span className="vw-req">*</span></label>
              <input id="vw-email" inputMode="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              {errors.email ? <p className="vw-fielderr" role="alert">{errors.email}</p> : null}
            </div>
          </div>

          <div className="vw-field">
            <span className="vw-label" id="vw-contact-l">How should we contact you?</span>
            <div className="vw-chips" role="group" aria-labelledby="vw-contact-l">
              {(o?.contactMethods || []).map((m) => (
                <Chip key={m.value} label={m.label} on={form.preferredContact === m.value} onToggle={() => set("preferredContact", m.value)} />
              ))}
            </div>
          </div>

          <div className="vw-grid2">
            <div className="vw-field">
              <label htmlFor="vw-postcode">Postcode <span className="vw-opt">(optional)</span></label>
              <input id="vw-postcode" autoComplete="postal-code" value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
            </div>
          </div>

          <div className="vw-field">
            <span className="vw-label" id="vw-lang-l">Languages you speak <span className="vw-opt">(pick any)</span></span>
            <div className="vw-chips" role="group" aria-labelledby="vw-lang-l">
              {(o?.languages || []).map((l) => (
                <Chip key={l} label={l} on={form.languages.includes(l)} onToggle={() => toggleIn("languages", l)} />
              ))}
            </div>
            {form.languages.includes("Other") && (
              <input
                aria-label="Other language"
                placeholder="Which other language?"
                style={{ marginTop: 8 }}
                value={form.otherLanguage}
                onChange={(e) => set("otherLanguage", e.target.value)}
              />
            )}
          </div>

          <button
            type="button"
            className="btn btn-green vw-next"
            onClick={() => { if (validateStep1()) { setStep(2); scrollTop(); } }}
          >
            Next — how you can help →
          </button>
        </div>
      )}

      {step === 2 && meta && (
        <div className="vw-card">
          <h3 className="vw-h">How would you like to help?</h3>
          <p className="vw-sub">Pick as many as you like — every pair of hands makes a difference.</p>

          {/* General volunteer — the friendly default */}
          <button
            type="button"
            className={`vw-general${form.generalVolunteer ? " is-on" : ""}`}
            onClick={() => set("generalVolunteer", !form.generalVolunteer)}
            aria-pressed={form.generalVolunteer}
          >
            <span className="vw-general__icon" aria-hidden>{form.generalVolunteer ? "✅" : "🤲"}</span>
            <span>
              <b>General volunteer</b>
              <small>I&apos;m happy to help wherever needed</small>
            </span>
          </button>

          {errors.categories ? <p className="vw-fielderr" role="alert">{errors.categories}</p> : null}

          {/* CMS-driven areas */}
          <div className="vw-areas">
            {meta.areas.map((a) => {
              const selectedHere = a.categories.filter((c) => form.categories.some((x) => String(x) === String(c.id))).length;
              const open = openArea === String(a.id);
              return (
                <div key={a.id} className={`vw-area${open ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="vw-area__head"
                    onClick={() => setOpenArea(open ? null : String(a.id))}
                    aria-expanded={open}
                  >
                    <span className="vw-area__icon" aria-hidden>{a.icon}</span>
                    <span className="vw-area__name">
                      {a.name}
                      {a.description ? <small>{a.description}</small> : null}
                    </span>
                    {selectedHere > 0 ? <span className="vw-area__count">{selectedHere}</span> : null}
                    <span className="vw-area__chev" aria-hidden>{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <div className="vw-area__body">
                      {a.categories.map((c) => (
                        <Chip
                          key={c.id}
                          label={c.name}
                          badge={c.safeguarding ? "safeguarding" : c.popular ? "needed" : undefined}
                          on={form.categories.some((x) => String(x) === String(c.id))}
                          onToggle={() => toggleCat(c.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {chosenCats.length > 0 && (
            <p className="vw-selected">
              Selected: {chosenCats.map((c) => c.name).join(" · ")}
            </p>
          )}

          {needsSafeguarding && (
            <div className="vw-note vw-note--amber" role="note">
              <b>Working with children or vulnerable people:</b> some of the activities you&apos;ve chosen need
              safeguarding checks (such as a DBS check) before you can take part. Our team will guide you through this —
              there&apos;s nothing to do now.
            </div>
          )}

          <h3 className="vw-h" style={{ marginTop: 22 }}>When can you usually help?</h3>
          <div className="vw-field">
            <span className="vw-label" id="vw-days-l">Days <span className="vw-opt">(pick any)</span></span>
            <div className="vw-chips" role="group" aria-labelledby="vw-days-l">
              {(o?.days || []).map((d) => (
                <Chip key={d} label={d.slice(0, 3)} on={form.days.includes(d)} onToggle={() => toggleIn("days", d)} />
              ))}
            </div>
          </div>
          <div className="vw-field">
            <span className="vw-label" id="vw-times-l">Times</span>
            <div className="vw-chips" role="group" aria-labelledby="vw-times-l">
              {(o?.times || []).map((t) => (
                <Chip key={t} label={t} on={form.times.includes(t)} onToggle={() => toggleIn("times", t)} />
              ))}
            </div>
          </div>
          <div className="vw-field">
            <span className="vw-label" id="vw-freq-l">How often?</span>
            <div className="vw-chips" role="group" aria-labelledby="vw-freq-l">
              {(o?.frequencies || []).map((f) => (
                <Chip key={f} label={f} on={form.frequency === f} onToggle={() => set("frequency", form.frequency === f ? "" : f)} />
              ))}
            </div>
          </div>

          {/* Optional extras — collapsed so the form never feels like a job application */}
          <details className="vw-extras">
            <summary>A little more about you <span className="vw-opt">(optional — 30 seconds)</span></summary>
            <div className="vw-field" style={{ marginTop: 12 }}>
              <span className="vw-label" id="vw-lead-l">Would you be willing to lead or coordinate a small group?</span>
              <div className="vw-chips" role="group" aria-labelledby="vw-lead-l">
                {(["yes", "maybe", "no"] as const).map((v) => (
                  <Chip key={v} label={v === "yes" ? "Yes" : v === "maybe" ? "Maybe" : "No"} on={form.leadership === v} onToggle={() => set("leadership", form.leadership === v ? "" : v)} />
                ))}
              </div>
            </div>
            <div className="vw-field">
              <span className="vw-label" id="vw-prev-l">Have you volunteered at Kingston Mosque before?</span>
              <div className="vw-chips" role="group" aria-labelledby="vw-prev-l">
                <Chip label="Yes" on={form.previousVolunteer} onToggle={() => set("previousVolunteer", !form.previousVolunteer)} />
                <Chip label="No" on={!form.previousVolunteer} onToggle={() => set("previousVolunteer", false)} />
              </div>
              {form.previousVolunteer && (
                <input
                  aria-label="What did you help with before?"
                  placeholder="Briefly, what did you help with?"
                  style={{ marginTop: 8 }}
                  value={form.previousDetails}
                  onChange={(e) => set("previousDetails", e.target.value)}
                />
              )}
            </div>
            <div className="vw-field">
              <label htmlFor="vw-skills">Skills, qualifications or experience that could help the mosque</label>
              <textarea
                id="vw-skills"
                rows={3}
                placeholder="First aid, teaching, photography, accounting, event management, IT, electrical work, languages…"
                value={form.skills}
                onChange={(e) => set("skills", e.target.value)}
              />
            </div>
            <div className="vw-field">
              <label htmlFor="vw-more">Anything else you&apos;d like us to know?</label>
              <textarea id="vw-more" rows={2} value={form.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} />
            </div>
          </details>

          {/* Consent */}
          <div className="vw-consent">
            {errors.consent ? <p className="vw-fielderr" role="alert">{errors.consent}</p> : null}
            <label className="vw-check">
              <input type="checkbox" checked={form.consentAccurate} onChange={(e) => set("consentAccurate", e.target.checked)} />
              <span>The information I&apos;ve provided is accurate.</span>
            </label>
            <label className="vw-check">
              <input type="checkbox" checked={form.consentContact} onChange={(e) => set("consentContact", e.target.checked)} />
              <span>Kingston Mosque may contact me about volunteering opportunities.</span>
            </label>
            <label className="vw-check">
              <input type="checkbox" checked={form.consentChecks} onChange={(e) => set("consentChecks", e.target.checked)} />
              <span>I understand some activities may need additional checks, safeguarding requirements or approval first.</span>
            </label>
            <p className="vw-privacy">
              We only use your details to organise volunteering — see our{" "}
              <Link href="/resources/data-policy">Data Protection &amp; Privacy Policy</Link>.
            </p>
          </div>

          <div className="vw-navrow">
            <button type="button" className="btn btn-outline vw-back" onClick={() => { setStep(1); scrollTop(); }}>
              ← Back
            </button>
            <button type="button" className="btn btn-gold vw-submit" onClick={submit} disabled={busy} aria-busy={busy}>
              {busy ? "Submitting…" : "Submit volunteer registration"}
            </button>
          </div>
        </div>
      )}

      {!meta && step === 2 && <p className="vw-sub">Loading…</p>}
    </div>
  );
}
