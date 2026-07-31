"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MembersPortal from "./MembersPortal";

/* The member's account: sign in, the five-step journey tracker, what to do
   next, the full fee breakdown (monthly rate × months to the April renewal,
   discounts, paid, outstanding), payment instructions when due, "I've paid"
   reporting, contact-detail updates, password change, payment history, a
   printable membership card — and the members-only portal (documents &
   notices) once the membership is approved. */

type MemberVM = {
  id: number | string;
  firstName: string;
  fullName: string;
  email: string;
  telephone?: string;
  username?: string;
  address1?: string; address2?: string; townCity?: string; county?: string; postcode?: string;
  applicationNumber: string;
  membershipNumber: string | null;
  status: string;
  statusLabel: string;
  journeyStep: number;
  journey: string[];
  nextAction: string;
  startDate: string | null;
  expiryDate: string | null;
  paymentReference: string | null;
  canReportPayment: boolean;
  fee: number;
  billing?: {
    monthlyRate: number;
    monthsCharged: number;
    amountDue: number;
    adjustment: number;
    netDue: number;
    amountPaid: number;
    outstanding: number;
    paymentStatus: string;
    paymentStatusLabel: string;
    renewalDate: string | null;
  };
  bank: { accountName: string; sortCode: string; accountNumber: string } | null;
  paymentHistory: Array<{ at: string; reference: string; note: string; amount?: number | null }>;
  statusHistory: Array<{ status: string; at: string }>;
  reportedPaymentDate: string | null;
};

const TOKEN_KEY = "kma-member-token";

function fmt(d?: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

export default function AccountArea() {
  const [token, setToken] = useState<string | null>(null);
  const [member, setMember] = useState<MemberVM | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState<"status" | "details" | "password" | "card" | "portal">("status");

  // Sign-in form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  // Report-payment form state
  const [payDate, setPayDate] = useState("");
  const [payRef, setPayRef] = useState("");
  // Editable contact details
  const [contact, setContact] = useState<Record<string, string>>({});
  // Password change
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");

  const authFetch = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          "Content-Type": "application/json",
          ...(token ? { Authorization: `JWT ${token}` } : {}),
        },
      }),
    [token],
  );

  // Restore the session.
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) setToken(t);
  }, []);
  useEffect(() => {
    if (!token) return;
    authFetch("/app-api/membership/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setMember(d.member);
        else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      })
      .catch(() => {});
  }, [token, authFetch]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/app-api/membership/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const d = await r.json();
      if (d?.ok) {
        localStorage.setItem(TOKEN_KEY, d.token);
        setToken(d.token);
        setMember(d.member);
        setPassword("");
      } else setMsg(d?.error || "Sign-in failed.");
    } catch {
      setMsg("Could not reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setMember(null);
  }

  async function reportPayment(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await authFetch("/app-api/membership/me", {
        method: "POST",
        body: JSON.stringify({ paymentDate: payDate, paymentReference: payRef }),
      });
      const d = await r.json();
      if (d?.ok) {
        setMember(d.member);
        setMsg("Thank you — we'll verify your payment and confirm by email.");
      } else setMsg(d?.error || "Could not save that — try again.");
    } catch {
      setMsg("Could not reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await authFetch("/app-api/membership/me", { method: "PATCH", body: JSON.stringify(contact) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d?.ok) {
      setMember(d.member);
      setMsg("Details updated.");
      setView("status");
    } else setMsg(d?.error || "Could not save — try again.");
    setBusy(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await authFetch("/app-api/membership/me", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d?.ok) {
      setMsg("Password changed.");
      setPwCurrent("");
      setPwNew("");
      setView("status");
    } else setMsg(d?.error || "Could not change the password.");
    setBusy(false);
  }

  /* ----------------------------- Signed out ------------------------------ */
  if (!member) {
    return (
      <div className="ma-login">
        <h2>Sign in to your membership account</h2>
        <form onSubmit={signIn} className="ma-login__form">
          <label htmlFor="ma-id">Email or username</label>
          <input id="ma-id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required />
          <label htmlFor="ma-pw">Password</label>
          <input id="ma-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {msg ? <p className="ma-msg" role="alert">{msg}</p> : null}
          <button className="btn btn-green" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="ma-login__alt">
          Not applied yet? <Link href="/membership/apply">Apply for membership</Link>. Forgotten your password? Contact
          the mosque office and we&apos;ll help you reset it.
        </p>
      </div>
    );
  }

  /* ------------------------------ Signed in ------------------------------ */
  const isActive = member.status === "active" || member.status === "renewal-due";
  const isApproved = ["active", "renewal-due", "renewal-pending"].includes(member.status);
  const b = member.billing;
  const gbp = (n: number) => `£${n.toFixed(2)}`;
  return (
    <div className="ma">
      <div className="ma-top">
        <div>
          <h2 className="ma-name">As-salāmu ʿalaykum, {member.firstName}</h2>
          <p className="ma-sub">
            Application <b>{member.applicationNumber}</b>
            {member.membershipNumber ? <> · Membership <b>{member.membershipNumber}</b></> : null}
          </p>
        </div>
        <button className="ma-signout" onClick={signOut} type="button">Sign out</button>
      </div>

      {/* Journey tracker */}
      <ol className="ma-journey" aria-label="Membership progress">
        {member.journey.map((label, i) => {
          const n = i + 1;
          const done = n < member.journeyStep;
          const current = n === member.journeyStep;
          return (
            <li key={label} className={done ? "is-done" : current ? "is-current" : ""}>
              <span className="ma-journey__dot">{done ? "✓" : n}</span>
              <span className="ma-journey__lbl">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className={`ma-status ma-status--${member.status}`}>
        <b>{member.statusLabel}.</b> {member.nextAction}
      </div>
      {msg ? <p className="ma-msg" role="status">{msg}</p> : null}

      {/* Fee breakdown — the same numbers staff see, at every stage. */}
      {b && (
        <div className="ma-billing">
          <h3>Your membership fee</h3>
          <dl className="ma-billing__grid">
            <div><dt>Monthly rate</dt><dd>{gbp(b.monthlyRate)}</dd></div>
            <div><dt>Months charged</dt><dd>{b.monthsCharged} (to the annual renewal)</dd></div>
            <div><dt>Prorated amount due</dt><dd>{gbp(b.amountDue)}</dd></div>
            {b.adjustment > 0 && <div><dt>Discount applied</dt><dd>−{gbp(b.adjustment)}</dd></div>}
            <div><dt>Amount paid</dt><dd>{gbp(b.amountPaid)}</dd></div>
            <div><dt>Outstanding balance</dt><dd className={b.outstanding > 0 ? "is-owing" : ""}>{gbp(b.outstanding)}</dd></div>
            <div><dt>Payment status</dt><dd><span className={`ma-paychip is-${b.paymentStatus}`}>{b.paymentStatusLabel}</span></dd></div>
            {member.startDate && <div><dt>Membership start</dt><dd>{fmt(member.startDate)}</dd></div>}
            <div><dt>Expiry / renewal date</dt><dd>{fmt(b.renewalDate || member.expiryDate)}</dd></div>
          </dl>
        </div>
      )}

      {/* Payment instructions */}
      {member.bank && (
        <div className="ma-pay">
          <h3>How to pay your £{Number(member.fee).toFixed(2)} membership fee</h3>
          {b && (
            <p className="ma-paynote">
              That&apos;s {b.monthsCharged} month{b.monthsCharged === 1 ? "" : "s"} at £{b.monthlyRate.toFixed(2)}/month
              until your renewal on {fmt(b.renewalDate || member.expiryDate)}
              {b.adjustment > 0 ? <> (after a £{b.adjustment.toFixed(2)} discount)</> : null}.
            </p>
          )}
          <p>Please pay by bank transfer to:</p>
          <dl className="ma-bank">
            <div><dt>Account name</dt><dd>{member.bank.accountName || "—"}</dd></div>
            <div><dt>Sort code</dt><dd>{member.bank.sortCode || "—"}</dd></div>
            <div><dt>Account number</dt><dd>{member.bank.accountNumber || "—"}</dd></div>
            <div><dt>Your reference</dt><dd className="ma-ref">{member.paymentReference}</dd></div>
          </dl>
          <p className="ma-paynote">
            Please use <b>your reference exactly</b> so we can match your payment. Then tell us below — a volunteer
            verifies every payment before membership is activated.
          </p>
          <form onSubmit={reportPayment} className="ma-payform">
            <div>
              <label htmlFor="ma-paydate">Date you paid</label>
              <input id="ma-paydate" type="date" required value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ma-payref">Reference you used</label>
              <input id="ma-payref" placeholder={member.paymentReference || ""} value={payRef} onChange={(e) => setPayRef(e.target.value)} />
            </div>
            <button className="btn btn-gold" disabled={busy} type="submit">{busy ? "Saving…" : "I've sent the payment"}</button>
          </form>
        </div>
      )}

      {/* Membership summary */}
      {member.membershipNumber && (
        <dl className="ma-summary">
          <div><dt>Status</dt><dd>{member.statusLabel}</dd></div>
          <div><dt>Membership number</dt><dd>{member.membershipNumber}</dd></div>
          <div><dt>Start date</dt><dd>{fmt(member.startDate)}</dd></div>
          <div><dt>Expires / renewal</dt><dd>{fmt(member.expiryDate)}</dd></div>
        </dl>
      )}

      {/* Actions */}
      <div className="ma-actions">
        {isApproved && (
          <button type="button" className={view === "portal" ? "is-on" : ""} onClick={() => setView(view === "portal" ? "status" : "portal")}>
            🔒 Members&apos; area
          </button>
        )}
        <button type="button" className={view === "details" ? "is-on" : ""} onClick={() => setView(view === "details" ? "status" : "details")}>
          Update contact details
        </button>
        <button type="button" className={view === "password" ? "is-on" : ""} onClick={() => setView(view === "password" ? "status" : "password")}>
          Change password
        </button>
        {isActive && (
          <button type="button" className={view === "card" ? "is-on" : ""} onClick={() => setView(view === "card" ? "status" : "card")}>
            Membership card
          </button>
        )}
      </div>

      {view === "portal" && isApproved && <MembersPortal token={token} />}

      {view === "details" && (
        <form className="ma-form" onSubmit={saveContact}>
          {(
            [["telephone", "Telephone"], ["address1", "Address line 1"], ["address2", "Address line 2"], ["townCity", "Town / City"], ["county", "County"], ["postcode", "Postcode"]] as const
          ).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`ma-${k}`}>{label}</label>
              <input
                id={`ma-${k}`}
                defaultValue={(member as never as Record<string, string>)[k] || ""}
                onChange={(e) => setContact((c) => ({ ...c, [k]: e.target.value }))}
              />
            </div>
          ))}
          <button className="btn btn-green" disabled={busy} type="submit">Save changes</button>
        </form>
      )}

      {view === "password" && (
        <form className="ma-form" onSubmit={changePassword}>
          <div>
            <label htmlFor="ma-pwc">Current password</label>
            <input id="ma-pwc" type="password" required value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="ma-pwn">New password (8+ characters)</label>
            <input id="ma-pwn" type="password" required minLength={8} value={pwNew} onChange={(e) => setPwNew(e.target.value)} autoComplete="new-password" />
          </div>
          <button className="btn btn-green" disabled={busy} type="submit">Change password</button>
        </form>
      )}

      {view === "card" && (
        <div className="ma-cardwrap">
          <div className="ma-card">
            <div className="ma-card__head">
              <span className="ma-card__org">Kingston Muslim Association</span>
              <span className="ma-card__badge">MEMBER</span>
            </div>
            <div className="ma-card__name">{member.fullName}</div>
            <dl className="ma-card__rows">
              <div><dt>Membership no.</dt><dd>{member.membershipNumber}</dd></div>
              <div><dt>Valid until</dt><dd>{fmt(member.expiryDate)}</dd></div>
            </dl>
          </div>
          <button type="button" className="btn btn-green" onClick={() => window.print()}>
            Print / save as PDF
          </button>
        </div>
      )}

      {/* History */}
      {member.paymentHistory.length > 0 && (
        <details className="ma-history">
          <summary>Payment history</summary>
          <ul>
            {member.paymentHistory.map((p, i) => (
              <li key={i}>
                {fmt(p.at)}
                {p.amount != null && p.amount > 0 ? <> — £{Number(p.amount).toFixed(2)}</> : null} ({p.note})
                {p.reference ? ` · ref ${p.reference}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
      {member.statusHistory.length > 0 && (
        <details className="ma-history">
          <summary>Application timeline</summary>
          <ul>
            {member.statusHistory.map((h, i) => (
              <li key={i}>{fmt(h.at)} — {h.status}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
