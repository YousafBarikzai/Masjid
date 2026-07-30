"use client";

import { useCallback, useEffect, useState } from "react";
import "./membership-dashboard.css";

/* The Membership dashboard, shown above the Members list: live counts for
   every stage, fees received by month, one-click CSV exports (Excel-ready)
   and a "send due reminders now" button. Data comes from the staff-only
   /app-api/membership/admin endpoint using the admin's own session. */

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
  feesByMonth: Record<string, number>;
};

const TILES: Array<{ key: keyof Stats; label: string; tone?: string }> = [
  { key: "total", label: "Total applications" },
  { key: "thisMonth", label: "Submitted this month" },
  { key: "pending", label: "Pending review", tone: "amber" },
  { key: "moreInfo", label: "More info required", tone: "amber" },
  { key: "awaitingPayment", label: "Awaiting payment", tone: "blue" },
  { key: "verifying", label: "Payments to verify", tone: "blue" },
  { key: "active", label: "Active members", tone: "green" },
  { key: "renewalsDue", label: "Renewals due (60d)", tone: "amber" },
  { key: "overdue", label: "Overdue renewals", tone: "red" },
  { key: "expired", label: "Expired", tone: "red" },
  { key: "rejected", label: "Rejected" },
];

export function MembershipDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    fetch("/app-api/membership/admin?view=stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d?.ok && setStats(d.stats))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const runReminders = async () => {
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/app-api/membership/admin", { method: "POST", credentials: "include" });
      const d = await r.json();
      if (d?.ok) {
        setNote(
          `Done — ${d.result.remindersSent} reminder${d.result.remindersSent === 1 ? "" : "s"} sent, ` +
            `${d.result.markedRenewalDue} marked renewal-due, ${d.result.markedExpired} expired.`,
        );
        load();
      } else setNote("Could not run reminders.");
    } catch {
      setNote("Could not run reminders.");
    } finally {
      setBusy(false);
    }
  };

  const months = Object.entries(stats?.feesByMonth ?? {});
  const maxFee = Math.max(1, ...months.map(([, v]) => v));

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
          <a className="kma-mdash__btn" href="/app-api/membership/admin?view=export&consent=marketing" download>
            ⬇ Marketing consented
          </a>
          <button className="kma-mdash__btn kma-mdash__btn--go" onClick={runReminders} disabled={busy} type="button">
            {busy ? "Sending…" : "✉ Send due reminders now"}
          </button>
        </div>
      </div>
      {note ? <p className="kma-mdash__note">{note}</p> : null}

      <div className="kma-mdash__tiles">
        {TILES.map((t) => (
          <div key={t.key} className={`kma-mdash__tile${t.tone ? ` is-${t.tone}` : ""}`}>
            <span className="kma-mdash__num">{stats ? (stats[t.key] as number) : "–"}</span>
            <span className="kma-mdash__lbl">{t.label}</span>
          </div>
        ))}
      </div>

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
