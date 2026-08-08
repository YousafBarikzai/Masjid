"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

/* The nikah member area: application status, my profile (with an EXACT
   preview of the anonymous view others see), privacy-preserving browse,
   and structured expressions of interest. All rules are enforced
   server-side — this UI only ever receives pre-anonymised data. */

type Me = {
  id: string | number;
  firstName: string;
  gender: string;
  status: string;
  statusLabel: string;
  reference: string | null;
  profileHidden: boolean;
  editable: Record<string, any>;
};
type Card = {
  id: string | number;
  reference: string;
  age: number | null;
  area: string;
  ethnicity: string;
  languages: string;
  maritalStatus: string;
  hasChildren: boolean;
  practising: string;
  education: string;
  profession: string;
  heightCm: number | null;
  timeframe: string;
  willingToRelocate: boolean;
};
type FullProfile = Card & {
  childrenDetails: string;
  background: string;
  faithNotes: string;
  aboutMe: string;
  familyBackground: string;
  relocateWhere: string;
  lookingFor: string;
  essentials: string;
};
type Interest = { id: string | number; direction: string; status: string; createdAt: string; card: Card | null };

const TOKEN_KEY = "kma-nikah-token";

function CardFacts({ c }: { c: Card }) {
  const facts = [
    c.age ? `${c.age} years` : null,
    c.area || null,
    c.ethnicity || null,
    c.maritalStatus || null,
    c.hasChildren ? "Has children" : null,
    c.practising || null,
    c.education || null,
    c.profession || null,
    c.heightCm ? `${c.heightCm} cm` : null,
    c.willingToRelocate ? "Open to relocating" : null,
  ].filter(Boolean) as string[];
  return (
    <div className="nk-facts">
      {facts.map((x) => (
        <span key={x} className="nk-fact">{x}</span>
      ))}
    </div>
  );
}

export default function NikahAccount() {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [preview, setPreview] = useState<FullProfile | null>(null);
  const [view, setView] = useState<"home" | "profile" | "browse" | "interests">("home");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Sign-in form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Browse
  const [cards, setCards] = useState<Card[] | null>(null);
  const [filters, setFilters] = useState({ ageMin: "", ageMax: "", maritalStatus: "", practising: "", area: "" });
  const [open, setOpen] = useState<FullProfile | null>(null);
  const [notApproved, setNotApproved] = useState("");
  // Interests
  const [interests, setInterests] = useState<{ received: Interest[]; sent: Interest[]; mutual: Interest[] } | null>(null);
  // Report
  const [reporting, setReporting] = useState<Card | null>(null);
  const [reportText, setReportText] = useState("");
  // Profile edit
  const [edit, setEdit] = useState<Record<string, any>>({});

  const authed = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: { ...(init?.headers || {}), "Content-Type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}) },
      }),
    [token],
  );

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) setToken(t);
  }, []);
  useEffect(() => {
    if (!token) return;
    authed("/app-api/nikah/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setMe(d.me);
          setPreview(d.preview);
          setEdit(d.me.editable || {});
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      })
      .catch(() => {});
  }, [token, authed]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/app-api/nikah/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (d?.ok) {
        localStorage.setItem(TOKEN_KEY, d.token);
        setToken(d.token);
        setMe(d.me);
        setPreview(d.preview);
        setEdit(d.me.editable || {});
        setPassword("");
      } else setMsg(d?.error || "Sign-in failed.");
    } catch {
      setMsg("Could not reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  const loadBrowse = useCallback(async () => {
    setBusy(true);
    setNotApproved("");
    try {
      const q = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
      const r = await authed(`/app-api/nikah/browse?${q}`);
      const d = await r.json();
      if (d?.ok) setCards(d.cards);
      else if (d?.notApproved) setNotApproved(d.error);
      else setMsg(d?.error || "Could not load profiles.");
    } catch {
      setMsg("Could not load profiles.");
    } finally {
      setBusy(false);
    }
  }, [authed, filters]);

  const loadInterests = useCallback(async () => {
    const r = await authed("/app-api/nikah/interest");
    const d = await r.json().catch(() => null);
    if (d?.ok) setInterests(d);
  }, [authed]);

  useEffect(() => {
    if (view === "browse" && me) loadBrowse();
    if (view === "interests" && me) loadInterests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, me]);

  async function openProfile(id: string | number) {
    const r = await authed(`/app-api/nikah/browse?profile=${id}`);
    const d = await r.json().catch(() => null);
    if (d?.ok) setOpen(d.profile);
    else setMsg(d?.error || "Profile unavailable.");
  }

  async function expressInterest(c: Card) {
    if (!window.confirm(`Express interest in ${c.reference}? They (and their family) will review your anonymous profile — no contact details are shared.`)) return;
    setBusy(true);
    const r = await authed("/app-api/nikah/interest", { method: "POST", body: JSON.stringify({ to: c.id }) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    setMsg(d?.ok ? `Your expression of interest has been sent to ${c.reference}. You'll be emailed when there's news.` : d?.error || "Could not send.");
    setBusy(false);
    setOpen(null);
  }

  async function decide(i: Interest, action: "accept" | "decline" | "withdraw") {
    const labels = { accept: "Accept this interest? The Nikah team will open an introduction and contact both families.", decline: "Not take this forward? They'll be told neutrally — no details are shared.", withdraw: "Withdraw this expression of interest?" };
    if (!window.confirm(labels[action])) return;
    setBusy(true);
    const r = await authed("/app-api/nikah/interest", { method: "PATCH", body: JSON.stringify({ id: i.id, action }) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    setMsg(d?.ok ? (d.status === "accepted" ? "Mutual interest, alhamdulillah — the Nikah team will contact you and your family." : "Done.") : d?.error || "Could not update.");
    setBusy(false);
    loadInterests();
  }

  async function saveProfile() {
    setBusy(true);
    const r = await authed("/app-api/nikah/me", { method: "PATCH", body: JSON.stringify(edit) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d?.ok) {
      setMe(d.me);
      setPreview(d.preview);
      setMsg("Profile updated — the preview below is exactly what members see.");
    } else setMsg(d?.error || "Could not save.");
    setBusy(false);
  }

  async function togglePause() {
    const r = await authed("/app-api/nikah/me", { method: "PATCH", body: JSON.stringify({ profileHidden: !me?.profileHidden }) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d?.ok) {
      setMe(d.me);
      setMsg(d.me.profileHidden ? "Your profile is paused — you won't appear in anyone's search." : "Your profile is live again.");
    }
  }

  async function sendReport() {
    if (!reportText.trim()) return;
    const r = await authed("/app-api/nikah/report", {
      method: "POST",
      body: JSON.stringify({ about: reporting?.id, category: "other", details: reportText }),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);
    setMsg(d?.ok ? d.message : d?.error || "Could not send the report.");
    setReporting(null);
    setReportText("");
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMe(null);
  }

  /* ------------------------------ Signed out ------------------------------ */
  if (!me) {
    return (
      <div className="ma-login">
        <h2>Sign in to the Nikah Service</h2>
        <form onSubmit={signIn} className="ma-login__form">
          <label htmlFor="nk-email">Email</label>
          <input id="nk-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <label htmlFor="nk-pass">Password</label>
          <input id="nk-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {msg ? <p className="ma-msg" role="alert">{msg}</p> : null}
          <button className="btn btn-green" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="ma-login__alt">
          Not applied yet? <Link href="/nikah/apply">Apply in confidence</Link>. Forgotten your password? Contact the
          mosque office and ask for the Nikah team.
        </p>
      </div>
    );
  }

  const approved = me.status === "approved";

  /* ------------------------------ Signed in ------------------------------- */
  return (
    <div className="ma">
      <div className="ma-top">
        <div>
          <h2 className="ma-name">As-salāmu ʿalaykum, {me.firstName}</h2>
          <p className="ma-sub">
            {me.reference ? <>Reference <b>{me.reference}</b> · </> : null}
            {me.statusLabel}
          </p>
        </div>
        <button className="ma-signout" onClick={signOut} type="button">Sign out</button>
      </div>

      {msg ? <p className="ma-msg" role="status">{msg}</p> : null}

      <div className="ma-actions">
        <button type="button" className={view === "home" ? "is-on" : ""} onClick={() => setView("home")}>Overview</button>
        <button type="button" className={view === "profile" ? "is-on" : ""} onClick={() => setView("profile")}>My profile</button>
        {approved && <button type="button" className={view === "browse" ? "is-on" : ""} onClick={() => setView("browse")}>Browse profiles</button>}
        {approved && <button type="button" className={view === "interests" ? "is-on" : ""} onClick={() => setView("interests")}>My interests</button>}
      </div>

      {view === "home" && (
        <div className="nk-panel">
          <p>
            {approved
              ? "Your profile is live. Members see it anonymously — your name, photograph and contact details are never shown to anyone."
              : "Your application is with the Nikah team. We'll email you at every step — there's nothing you need to do right now."}
          </p>
          {approved && (
            <button type="button" className="btn btn-outline vw-back" onClick={togglePause}>
              {me.profileHidden ? "▶ Unpause my profile" : "⏸ Pause my profile (hide me from search)"}
            </button>
          )}
          <p className="nk-quiet">
            Need help, want to update mosque-only details, or wish to withdraw? Contact the mosque office and ask for
            the Nikah team — everything is handled in confidence.
          </p>
        </div>
      )}

      {view === "profile" && preview && (
        <div className="nk-panel">
          <h3>Edit my profile</h3>
          <p className="nk-quiet">These are the sections members can read (always anonymously). Save, then check the preview below — it is exactly what others see.</p>
          {(
            [
              ["aboutMe", "About me"],
              ["faithNotes", "Faith & practice"],
              ["familyBackground", "Family background"],
              ["lookingFor", "What I'm looking for"],
              ["essentials", "My essentials"],
            ] as const
          ).map(([k, label]) => (
            <div className="vw-field" key={k}>
              <label htmlFor={`nke-${k}`}>{label}</label>
              <textarea id={`nke-${k}`} rows={3} value={edit[k] || ""} onChange={(e) => setEdit((x) => ({ ...x, [k]: e.target.value }))} />
            </div>
          ))}
          <button type="button" className="btn btn-green" disabled={busy} onClick={saveProfile}>Save changes</button>

          <h3 style={{ marginTop: 22 }}>How members see you</h3>
          <div className="nk-card nk-card--preview">
            <div className="nk-card__head">
              <span className="nk-ref">{me.reference || "KM-…"}</span>
              <span className="nk-quiet">Anonymous profile — no name, no photo</span>
            </div>
            <CardFacts c={preview} />
            {preview.aboutMe ? <p><b>About:</b> {preview.aboutMe}</p> : null}
            {preview.faithNotes ? <p><b>Faith:</b> {preview.faithNotes}</p> : null}
            {preview.lookingFor ? <p><b>Looking for:</b> {preview.lookingFor}</p> : null}
          </div>
        </div>
      )}

      {view === "browse" && (
        <div className="nk-panel">
          {notApproved ? (
            <p className="vw-note vw-note--info">{notApproved}</p>
          ) : (
            <>
              <div className="nk-filters">
                <input placeholder="Age from" inputMode="numeric" style={{ width: 90 }} value={filters.ageMin} onChange={(e) => setFilters((f) => ({ ...f, ageMin: e.target.value }))} aria-label="Age from" />
                <input placeholder="to" inputMode="numeric" style={{ width: 70 }} value={filters.ageMax} onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value }))} aria-label="Age to" />
                <select value={filters.maritalStatus} onChange={(e) => setFilters((f) => ({ ...f, maritalStatus: e.target.value }))} aria-label="Marital status">
                  <option value="">Any marital status</option>
                  <option value="never-married">Never married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
                <select value={filters.practising} onChange={(e) => setFilters((f) => ({ ...f, practising: e.target.value }))} aria-label="Practising">
                  <option value="">Any practice level</option>
                  <option value="very">Very practising</option>
                  <option value="practising">Practising</option>
                  <option value="moderate">Moderately practising</option>
                  <option value="growing">Learning & growing</option>
                </select>
                <input placeholder="Area" style={{ width: 120 }} value={filters.area} onChange={(e) => setFilters((f) => ({ ...f, area: e.target.value }))} aria-label="Area" />
                <button type="button" className="btn btn-green" onClick={loadBrowse} disabled={busy}>Search</button>
              </div>
              {cards && cards.length === 0 ? <p className="nk-quiet">No profiles match yet — try widening your search, and check back soon.</p> : null}
              <div className="nk-grid">
                {(cards || []).map((c) => (
                  <button key={c.id} type="button" className="nk-card nk-card--tap" onClick={() => openProfile(c.id)}>
                    <div className="nk-card__head">
                      <span className="nk-ref">{c.reference}</span>
                      <span className="nk-quiet">{c.timeframe}</span>
                    </div>
                    <CardFacts c={c} />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {view === "interests" && interests && (
        <div className="nk-panel">
          <h3>Received — awaiting your decision</h3>
          {interests.received.length === 0 ? <p className="nk-quiet">Nothing waiting for you right now.</p> : null}
          {interests.received.map((i) => (
            <div key={i.id} className="nk-card">
              <div className="nk-card__head"><span className="nk-ref">{i.card?.reference}</span></div>
              {i.card ? <CardFacts c={i.card} /> : null}
              <div className="nk-row">
                {i.card ? <button type="button" className="btn btn-outline vw-back" onClick={() => openProfile(i.card!.id)}>View profile</button> : null}
                <button type="button" className="btn btn-green" disabled={busy} onClick={() => decide(i, "accept")}>Accept</button>
                <button type="button" className="btn btn-outline vw-back" disabled={busy} onClick={() => decide(i, "decline")}>Not for me</button>
              </div>
            </div>
          ))}
          <h3>Mutual interest — with the Nikah team</h3>
          {interests.mutual.length === 0 ? <p className="nk-quiet">When both sides accept, the introduction appears here and the team contacts your families.</p> : null}
          {interests.mutual.map((i) => (
            <div key={i.id} className="nk-card nk-card--mutual">
              <div className="nk-card__head"><span className="nk-ref">{i.card?.reference}</span><span>💠 Introduction in progress</span></div>
              {i.card ? <CardFacts c={i.card} /> : null}
              <p className="nk-quiet">The Nikah team will contact you and your wali/family — no contact details are exchanged through the platform.</p>
            </div>
          ))}
          <h3>Sent</h3>
          {interests.sent.length === 0 ? <p className="nk-quiet">You haven't expressed interest in anyone yet.</p> : null}
          {interests.sent.map((i) => (
            <div key={i.id} className="nk-card">
              <div className="nk-card__head">
                <span className="nk-ref">{i.card?.reference}</span>
                <span className="nk-quiet">{i.status === "pending" ? "Awaiting their reply" : i.status === "declined" ? "Not taken forward" : "Withdrawn"}</span>
              </div>
              {i.status === "pending" ? (
                <div className="nk-row">
                  <button type="button" className="btn btn-outline vw-back" disabled={busy} onClick={() => decide(i, "withdraw")}>Withdraw</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Full profile modal */}
      {open && (
        <div className="nk-modal" role="dialog" aria-modal="true" aria-label={`Profile ${open.reference}`}>
          <div className="nk-modal__card">
            <div className="nk-card__head">
              <span className="nk-ref">{open.reference}</span>
              <button type="button" className="ma-signout" onClick={() => setOpen(null)}>Close</button>
            </div>
            <CardFacts c={open} />
            {open.background ? <p><b>Background:</b> {open.background}{open.hasChildren && open.childrenDetails ? ` · ${open.childrenDetails}` : ""}</p> : null}
            {open.aboutMe ? <p><b>About:</b> {open.aboutMe}</p> : null}
            {open.faithNotes ? <p><b>Faith & practice:</b> {open.faithNotes}</p> : null}
            {open.familyBackground ? <p><b>Family:</b> {open.familyBackground}</p> : null}
            {open.lookingFor ? <p><b>Looking for:</b> {open.lookingFor}</p> : null}
            {open.essentials ? <p><b>Essentials:</b> {open.essentials}</p> : null}
            {open.willingToRelocate && open.relocateWhere ? <p><b>Open to relocating:</b> {open.relocateWhere}</p> : null}
            <div className="nk-row">
              <button type="button" className="btn btn-gold" disabled={busy} onClick={() => expressInterest(open)}>Express interest</button>
              <button type="button" className="btn btn-outline vw-back" onClick={() => { setReporting(open); setOpen(null); }}>Report a concern</button>
            </div>
            <p className="nk-quiet">Expressing interest shares only your anonymous profile — never your name or contact details.</p>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reporting && (
        <div className="nk-modal" role="dialog" aria-modal="true" aria-label="Report a concern">
          <div className="nk-modal__card">
            <h3>Report a concern about {reporting.reference}</h3>
            <p className="nk-quiet">Your report goes directly and confidentially to the Nikah team. The member will not know who reported.</p>
            <textarea rows={4} value={reportText} onChange={(e) => setReportText(e.target.value)} aria-label="Describe your concern" />
            <div className="nk-row">
              <button type="button" className="btn btn-green" onClick={sendReport}>Send in confidence</button>
              <button type="button" className="btn btn-outline vw-back" onClick={() => setReporting(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
