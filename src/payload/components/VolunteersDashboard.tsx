"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./membership-dashboard.css";

/* The Volunteers dashboard, shown above the Volunteers list: live counts,
   quick filters into the list, and a "find & contact" panel — pick a few
   criteria (activity, status, gender, day), see matching volunteers in
   seconds, tick the ones you want and email them all individually (no
   volunteer ever sees another's address), or copy their contact details.
   Reuses the membership dashboard's design system for one consistent CMS. */

type Stats = {
  total: number;
  fresh: number;
  reviewed: number;
  approved: number;
  active: number;
  followUp: number;
  inactive: number;
  thisMonth: number;
  leaders: number;
  general: number;
};
type Cat = { id: string | number; name: string; group: string };
type Vol = {
  id: string | number;
  fullName: string;
  gender?: string;
  ageGroup?: string;
  email: string;
  mobile: string;
  status: string;
  lastContactedAt?: string | null;
  generalVolunteer?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  approved: "Approved",
  active: "Active",
  "follow-up": "Follow-up",
  inactive: "Inactive",
};
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function listUrl(pairs: Array<[string, string, string]>): string {
  const qs = pairs
    .map(([field, op, value], i) => `where[or][0][and][${i}][${encodeURIComponent(field)}][${op}]=${encodeURIComponent(value)}`)
    .join("&");
  return `/admin/collections/volunteers?${qs}`;
}

export function VolunteersDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [canEmail, setCanEmail] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Find & contact panel state
  const [fCat, setFCat] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fGender, setFGender] = useState("");
  const [fDay, setFDay] = useState("");
  const [results, setResults] = useState<Vol[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/app-api/volunteer/admin?view=stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setStats(d.stats);
          setCats(d.categories || []);
          setCanEmail(Boolean(d.canEmail));
        }
      })
      .catch(() => {});
  }, []);

  const find = useCallback(async () => {
    setBusy(true);
    setNote("");
    setPicked(new Set());
    try {
      const conds: string[] = [];
      let i = 0;
      if (fStatus) conds.push(`where[and][${i++}][status][equals]=${encodeURIComponent(fStatus)}`);
      if (fGender) conds.push(`where[and][${i++}][gender][equals]=${encodeURIComponent(fGender)}`);
      if (fDay) conds.push(`where[and][${i++}][days][equals]=${encodeURIComponent(fDay)}`);
      if (fCat) conds.push(`where[and][${i++}][categories][in]=${encodeURIComponent(fCat)}`);
      const r = await fetch(`/api/volunteers?limit=100&depth=0&sort=fullName&${conds.join("&")}`, { credentials: "include" });
      const d = await r.json();
      setResults((d?.docs as Vol[]) || []);
    } catch {
      setNote("Could not search — please try again.");
    } finally {
      setBusy(false);
    }
  }, [fStatus, fGender, fDay, fCat]);

  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const pickedVols = useMemo(() => (results || []).filter((v) => picked.has(String(v.id))), [results, picked]);

  const copy = async (kind: "email" | "mobile") => {
    const vals = pickedVols.map((v) => (kind === "email" ? v.email : v.mobile)).filter(Boolean);
    try {
      await navigator.clipboard.writeText(vals.join(", "));
      setNote(`Copied ${vals.length} ${kind === "email" ? "email address" : "phone number"}${vals.length === 1 ? "" : "s"}.`);
    } catch {
      setNote("Copy failed — your browser blocked clipboard access.");
    }
  };

  const sendEmail = async () => {
    if (!pickedVols.length || !subject.trim() || !message.trim()) {
      setNote("Pick volunteers and add a subject and message first.");
      return;
    }
    if (!window.confirm(`Email ${pickedVols.length} volunteer${pickedVols.length === 1 ? "" : "s"} individually?`)) return;
    setBusy(true);
    setNote("");
    try {
      const r = await fetch("/app-api/volunteer/admin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "email", ids: pickedVols.map((v) => v.id), subject, message }),
      });
      const d = await r.json();
      if (d?.ok) {
        setNote(`Sent to ${d.result.sent}${d.result.failed ? `, ${d.result.failed} failed` : ""} — each volunteer emailed individually, and every contact logged on their profile.`);
        setSubject("");
        setMessage("");
        setPicked(new Set());
      } else setNote(d?.error || "Could not send.");
    } catch {
      setNote("Could not send — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const TILES: Array<{ label: string; value: number | null; tone?: string; url: string }> = stats
    ? [
        { label: "New registrations", value: stats.fresh, tone: "blue", url: listUrl([["status", "equals", "new"]]) },
        { label: "Active volunteers", value: stats.active, tone: "green", url: listUrl([["status", "equals", "active"]]) },
        { label: "Approved", value: stats.approved, tone: "green", url: listUrl([["status", "equals", "approved"]]) },
        { label: "Needs follow-up", value: stats.followUp, tone: "amber", url: listUrl([["status", "equals", "follow-up"]]) },
        { label: "Happy to help anywhere", value: stats.general, url: listUrl([["generalVolunteer", "equals", "true"]]) },
        { label: "Willing to lead", value: stats.leaders, url: listUrl([["leadership", "equals", "yes"]]) },
        { label: "Registered this month", value: stats.thisMonth, url: "/admin/collections/volunteers?sort=-createdAt" },
        { label: "Total volunteers", value: stats.total, url: "/admin/collections/volunteers" },
      ]
    : [];

  return (
    <div className="kma-mdash">
      <div className="kma-mdash__head">
        <span className="kma-mdash__title">🤲 Volunteers at a glance</span>
      </div>
      {note ? <p className="kma-mdash__note">{note}</p> : null}

      <div className="kma-mdash__tiles">
        {TILES.map((t) => (
          <a key={t.label} className={`kma-mdash__tile kma-mdash__tile--link${t.tone ? ` is-${t.tone}` : ""}`} href={t.url}>
            <span className="kma-mdash__num">{t.value == null ? "–" : t.value}</span>
            <span className="kma-mdash__lbl">{t.label}</span>
          </a>
        ))}
      </div>

      <div className="kma-mdash__debtors">
        <div className="kma-mdash__debtorshead">
          <span className="kma-mdash__title" style={{ fontSize: 14 }}>🔎 Find &amp; contact volunteers</span>
          <div className="kma-mdash__actions">
            <select className="kma-mdash__select" value={fCat} onChange={(e) => setFCat(e.target.value)} aria-label="Activity">
              <option value="">Any activity</option>
              {cats.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.group ? `${c.group} — ` : ""}{c.name}
                </option>
              ))}
            </select>
            <select className="kma-mdash__select" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Status">
              <option value="">Any status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select className="kma-mdash__select" value={fGender} onChange={(e) => setFGender(e.target.value)} aria-label="Gender">
              <option value="">Any gender</option>
              <option value="male">Brothers</option>
              <option value="female">Sisters</option>
            </select>
            <select className="kma-mdash__select" value={fDay} onChange={(e) => setFDay(e.target.value)} aria-label="Day">
              <option value="">Any day</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button className="kma-mdash__btn kma-mdash__btn--go" type="button" onClick={find} disabled={busy}>
              {busy ? "Searching…" : "Find volunteers"}
            </button>
          </div>
        </div>

        {results && (
          <>
            {results.length === 0 ? (
              <p className="kma-mdash__note">No volunteers match those filters yet.</p>
            ) : (
              <table className="kma-mdash__table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={picked.size === results.length && results.length > 0}
                        onChange={() =>
                          setPicked(picked.size === results.length ? new Set() : new Set(results.map((v) => String(v.id))))
                        }
                        aria-label="Select all"
                      />
                    </th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Mobile</th>
                    <th>Last contacted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={picked.has(String(v.id))}
                          onChange={() => togglePick(String(v.id))}
                          aria-label={`Select ${v.fullName}`}
                        />
                      </td>
                      <td>
                        <a href={`/admin/collections/volunteers/${v.id}`}>{v.fullName}</a>
                        {v.generalVolunteer ? " ✦" : ""}
                      </td>
                      <td>{STATUS_LABELS[v.status] || v.status}</td>
                      <td>{v.mobile}</td>
                      <td>{v.lastContactedAt ? new Date(v.lastContactedAt).toLocaleDateString("en-GB") : "Never"}</td>
                      <td>
                        <a
                          className="kma-mdash__chip"
                          href={`https://wa.me/${String(v.mobile || "").replace(/\D/g, "").replace(/^0/, "44")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {results.length > 0 && (
              <div className="kma-mdash__debtorshead" style={{ marginTop: 10 }}>
                <span className="kma-mdash__filterslbl">
                  {picked.size} selected — {canEmail ? "email them individually, or" : ""} copy their details
                </span>
                <div className="kma-mdash__actions">
                  <button className="kma-mdash__btn" type="button" disabled={!picked.size} onClick={() => copy("email")}>
                    Copy emails
                  </button>
                  <button className="kma-mdash__btn" type="button" disabled={!picked.size} onClick={() => copy("mobile")}>
                    Copy phone numbers
                  </button>
                </div>
              </div>
            )}

            {canEmail && results.length > 0 && (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                <input
                  className="kma-mdash__select"
                  style={{ width: "100%" }}
                  placeholder="Email subject — e.g. Iftar volunteers needed this Saturday"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  aria-label="Email subject"
                />
                <textarea
                  className="kma-mdash__select"
                  style={{ width: "100%", minHeight: 90, resize: "vertical" }}
                  placeholder="Your message — each selected volunteer receives their own individual email; nobody sees anyone else's address."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-label="Email message"
                />
                <div>
                  <button className="kma-mdash__btn kma-mdash__btn--go" type="button" disabled={busy || !picked.size} onClick={sendEmail}>
                    ✉ Email {picked.size} selected volunteer{picked.size === 1 ? "" : "s"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
