"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./membership-dashboard.css";

/* The Membership dashboard, shown above the Members list: live counts for
   every stage, total outstanding fees, fees received by month, one-click CSV
   exports, quick filters into the list below, and payment-reminder controls
   (everyone owing, a selection, or one member). Data comes from the
   staff-only /app-api/membership/admin endpoint using the admin's session. */

type Debtor = {
  id: string | number;
  name: string;
  number: string;
  status: string;
  paymentStatus: string;
  outstanding: number;
  lastReminderAt: string | null;
};

type Stats = {
  total: number;
  thisMonth: number;
  pending: number;
  moreInfo: number;
  awaitingPayment: number;
  verifying: number;
  active: number;
  rejected: number;
  expired: number;
  renewalsDue: number;
  overdue: number;
  overduePayments: number;
  totalOutstanding: number;
  debtors: Debtor[];
  feesByMonth: Record<string, number>;
};

const TILES: Array<{ key: keyof Stats; label: string; tone?: string; money?: boolean; filter?: string }> = [
  { key: "active", label: "Active members", tone: "green", filter: filterUrl("status", "in", "active,renewal-due") },
  { key: "pending", label: "Pending applications", tone: "amber", filter: filterUrl("status", "in", "pending-review,more-info-required") },
  { key: "renewalsDue", label: "Renewals due (60d)", tone: "amber", filter: filterUrl("status", "equals", "renewal-due") },
  { key: "overduePayments", label: "Overdue payments", tone: "red", filter: filterUrl("fee.paymentStatus", "equals", "overdue") },
  { key: "expired", label: "Expired", tone: "red", filter: filterUrl("status", "equals", "expired") },
  { key: "totalOutstanding", label: "Outstanding fees", tone: "red", money: true, filter: filterUrl("fee.outstanding", "greater_than", "0") },
  { key: "awaitingPayment", label: "Awaiting payment", tone: "blue", filter: filterUrl("status", "equals", "approved-payment-required") },
  { key: "verifying", label: "Payments to verify", tone: "blue", filter: filterUrl("status", "in", "payment-verification,renewal-pending") },
  { key: "thisMonth", label: "Submitted this month" },
  { key: "total", label: "Total applications", filter: "/admin/collections/members" },
];

/** A Payload list-view URL pre-filtered on one condition (the same shape the
 *  Filters UI writes, so it hydrates the filter controls too). */
function filterUrl(field: string, op: string, value: string): string {
  const v = op === "in" ? value : encodeURIComponent(value);
  return `/admin/collections/members?where[or][0][and][0][${encodeURIComponent(field)}][${op}]=${v}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** List filtered to members whose expiry/renewal falls in the NEXT occurrence
 *  of the chosen month. */
function renewalMonthUrl(month1to12: number): string {
  const now = new Date();
  let year = now.getFullYear();
  if (month1to12 < now.getMonth() + 1) year += 1;
  const from = `${year}-${String(month1to12).padStart(2, "0")}-01`;
  const nextM = month1to12 === 12 ? 1 : month1to12 + 1;
  const to = `${month1to12 === 12 ? year + 1 : year}-${String(nextM).padStart(2, "0")}-01`;
  return `/admin/collections/members?where[or][0][and][0][expiryDate][greater_than_equal]=${from}&where[or][0][and][1][expiryDate][less_than]=${to}`;
}

const QUICK_FILTERS: Array<{ label: string; url: string }> = [
  { label: "Payment pending", url: filterUrl("fee.paymentStatus", "equals", "pending") },
  { label: "Part paid", url: filterUrl("fee.paymentStatus", "equals", "part-paid") },
  { label: "Paid in full", url: filterUrl("fee.paymentStatus", "equals", "paid") },
  { label: "Overdue", url: filterUrl("fee.paymentStatus", "equals", "overdue") },
  { label: "Waived", url: filterUrl("fee.paymentStatus", "equals", "waived") },
  { label: "Owing money", url: filterUrl("fee.outstanding", "greater_than", "0") },
  { label: "Reminded already", url: filterUrl("lastReminderAt", "exists", "true") },
];

export function MembershipDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [showDebtors, setShowDebtors] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [renewalMonth, setRenewalMonth] = useState(4);

  const load = useCallback(() => {
    fetch("/app-api/membership/admin?view=stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d?.ok && setStats(d.stats))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const post = async (body: Record<string, unknown>, label: string) => {
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/app-api/membership/admin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d?.ok && body.action === "remind") {
        setNote(`${label}: ${d.result.sent} sent${d.result.failed ? `, ${d.result.failed} failed` : ""}.`);
      } else if (d?.ok) {
        setNote(
          `Sweep done — ${d.result.remindersSent} reminder${d.result.remindersSent === 1 ? "" : "s"} sent, ` +
            `${d.result.markedRenewalDue} marked renewal-due, ${d.result.markedOverdue ?? 0} marked overdue, ${d.result.markedExpired} expired.`,
        );
      } else setNote("That didn't work — check you're signed in with a membership role.");
      load();
      setPicked(new Set());
    } catch {
      setNote("That didn't work — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const debtors = stats?.debtors ?? [];
  const allPicked = debtors.length > 0 && picked.size === debtors.length;
  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const months = Object.entries(stats?.feesByMonth ?? {});
  const maxFee = Math.max(1, ...months.map(([, v]) => v));
  const gbp = useMemo(() => (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, []);

  return (
    <div className="kma-mdash">
      <div className="kma-mdash__head">
        <span className="kma-mdash__title">🪪 Membership at a glance</span>
        <div className="kma-mdash__actions">
          <a className="kma-mdash__btn" href="/app-api/membership/admin?view=export" download>
            ⬇ Export all (CSV)
          </a>
          <a className="kma-mdash__btn" href="/app-api/membership/admin?view=export&status=active" download>
            ⬇ Active members
          </a>
          <a className="kma-mdash__btn" href="/app-api/membership/admin?view=export&outstanding=yes" download>
            ⬇ Outstanding fees
          </a>
          <button className="kma-mdash__btn kma-mdash__btn--go" onClick={() => post({ action: "sweep" }, "")} disabled={busy} type="button">
            {busy ? "Working…" : "✉ Run renewal sweep now"}
          </button>
        </div>
      </div>
      {note ? <p className="kma-mdash__note">{note}</p> : null}

      <div className="kma-mdash__tiles">
        {TILES.map((t) => {
          const val = stats ? (stats[t.key] as number) : null;
          const body = (
            <>
              <span className="kma-mdash__num">{val == null ? "–" : t.money ? gbp(val) : val}</span>
              <span className="kma-mdash__lbl">{t.label}</span>
            </>
          );
          return t.filter ? (
            <a key={t.key} className={`kma-mdash__tile kma-mdash__tile--link${t.tone ? ` is-${t.tone}` : ""}`} href={t.filter} title="Show these members in the list">
              {body}
            </a>
          ) : (
            <div key={t.key} className={`kma-mdash__tile${t.tone ? ` is-${t.tone}` : ""}`}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="kma-mdash__filters">
        <span className="kma-mdash__filterslbl">Quick filters:</span>
        {QUICK_FILTERS.map((f) => (
          <a key={f.label} className="kma-mdash__chip" href={f.url}>
            {f.label}
          </a>
        ))}
        <span className="kma-mdash__filterslbl">Renewals in:</span>
        <select className="kma-mdash__select" value={renewalMonth} onChange={(e) => setRenewalMonth(Number(e.target.value))} aria-label="Renewal month">
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <a className="kma-mdash__chip" href={renewalMonthUrl(renewalMonth)}>
          Show
        </a>
      </div>

      {debtors.length > 0 && (
        <div className="kma-mdash__debtors">
          <div className="kma-mdash__debtorshead">
            <button className="kma-mdash__btn" type="button" onClick={() => setShowDebtors((s) => !s)}>
              {showDebtors ? "▾" : "▸"} Outstanding fees — {debtors.length} member{debtors.length === 1 ? "" : "s"}, {gbp(stats?.totalOutstanding ?? 0)}
            </button>
            <div className="kma-mdash__actions">
              <button
                className="kma-mdash__btn"
                type="button"
                disabled={busy || picked.size === 0}
                onClick={() => post({ action: "remind", ids: [...picked] }, `Reminders to ${picked.size} selected`)}
              >
                ✉ Remind selected ({picked.size})
              </button>
              <button
                className="kma-mdash__btn kma-mdash__btn--go"
                type="button"
                disabled={busy}
                onClick={() => post({ action: "remind", all: true }, "Reminders to everyone owing")}
              >
                ✉ Remind ALL with outstanding fees
              </button>
            </div>
          </div>
          {showDebtors && (
            <table className="kma-mdash__table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allPicked}
                      onChange={() => setPicked(allPicked ? new Set() : new Set(debtors.map((d) => String(d.id))))}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Member</th>
                  <th>Number</th>
                  <th>Outstanding</th>
                  <th>Last reminded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input type="checkbox" checked={picked.has(String(d.id))} onChange={() => togglePick(String(d.id))} aria-label={`Select ${d.name}`} />
                    </td>
                    <td>
                      <a href={`/admin/collections/members/${d.id}`}>{d.name}</a>
                    </td>
                    <td>{d.number}</td>
                    <td>{gbp(d.outstanding)}</td>
                    <td>{d.lastReminderAt ? new Date(d.lastReminderAt).toLocaleDateString("en-GB") : "Never"}</td>
                    <td>
                      <button
                        className="kma-mdash__btn"
                        type="button"
                        disabled={busy}
                        onClick={() => post({ action: "remind", ids: [d.id] }, `Reminder to ${d.name}`)}
                      >
                        ✉ Remind
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {months.length > 0 && (
        <div className="kma-mdash__fees">
          <span className="kma-mdash__feestitle">Fees received by month (£)</span>
          <div className="kma-mdash__bars">
            {months.map(([m, v]) => (
              <div key={m} className="kma-mdash__barwrap" title={`£${v} in ${m}`}>
                <div className="kma-mdash__bar" style={{ height: `${Math.max(8, (v / maxFee) * 64)}px` }} />
                <span className="kma-mdash__barlbl">{m.slice(2).replace("-", "/")}</span>
                <span className="kma-mdash__barval">£{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
