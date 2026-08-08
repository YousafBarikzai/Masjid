"use client";

import { useEffect, useState } from "react";
import "./membership-dashboard.css";

/* The Nikah dashboard, shown above the Nikah Members list. Its whole job is
   to answer "what needs my attention today?" — an action queue first, then
   the healthy-service numbers. Reuses the shared dashboard design system. */

type Stats = {
  submitted: number;
  underReview: number;
  infoRequired: number;
  verification: number;
  approvedMale: number;
  approvedFemale: number;
  pendingInterests: number;
  mutualInterests: number;
  introsNew: number;
  introsActive: number;
  introsFollowUpDue: number;
  engagedPlus: number;
  casesOpen: number | null;
};

function u(collection: string, field: string, op: string, value: string): string {
  return `/admin/collections/${collection}?where[or][0][and][0][${field}][${op}]=${encodeURIComponent(value)}`;
}

export function NikahDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/app-api/nikah/admin", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setStats(d.stats);
          setIsAdmin(Boolean(d.isNikahAdmin));
        }
      })
      .catch(() => {});
  }, []);

  const s = stats;
  const QUEUE: Array<{ label: string; value: number | null; tone: string; url: string }> = s
    ? [
        { label: "New applications to review", value: s.submitted, tone: "blue", url: u("nikah-profiles", "status", "equals", "submitted") },
        { label: "In review", value: s.underReview, tone: "amber", url: u("nikah-profiles", "status", "equals", "under-review") },
        { label: "Awaiting applicant info", value: s.infoRequired, tone: "amber", url: u("nikah-profiles", "status", "equals", "info-required") },
        { label: "In verification", value: s.verification, tone: "blue", url: u("nikah-profiles", "status", "equals", "verification") },
        { label: "NEW mutual interests", value: s.introsNew, tone: "red", url: u("nikah-introductions", "status", "equals", "new") },
        { label: "Introduction follow-ups due", value: s.introsFollowUpDue, tone: "red", url: "/admin/collections/nikah-introductions?sort=followUpDate" },
        ...(s.casesOpen != null
          ? [{ label: "Open safeguarding cases", value: s.casesOpen, tone: "red", url: u("nikah-cases", "status", "in", "new,investigating") }]
          : []),
      ]
    : [];

  const SERVICE: Array<{ label: string; value: number | null; tone?: string; url: string }> = s
    ? [
        { label: "Live brothers", value: s.approvedMale, tone: "green", url: u("nikah-profiles", "status", "equals", "approved") },
        { label: "Live sisters", value: s.approvedFemale, tone: "green", url: u("nikah-profiles", "status", "equals", "approved") },
        { label: "Interests awaiting reply", value: s.pendingInterests, url: "/admin/collections/nikah-interests" },
        { label: "Active introductions", value: s.introsActive, url: "/admin/collections/nikah-introductions" },
        { label: "Engaged / nikah — alhamdulillah", value: s.engagedPlus, tone: "green", url: u("nikah-introductions", "status", "in", "engaged,nikah-arranged,completed") },
      ]
    : [];

  return (
    <div className="kma-mdash">
      <div className="kma-mdash__head">
        <span className="kma-mdash__title">💠 Nikah service — needs attention today</span>
      </div>
      <div className="kma-mdash__tiles">
        {QUEUE.map((t) => (
          <a key={t.label} className={`kma-mdash__tile kma-mdash__tile--link is-${t.tone}`} href={t.url}>
            <span className="kma-mdash__num">{t.value == null ? "–" : t.value}</span>
            <span className="kma-mdash__lbl">{t.label}</span>
          </a>
        ))}
      </div>
      <div className="kma-mdash__head" style={{ marginTop: 14 }}>
        <span className="kma-mdash__title" style={{ fontSize: 13.5 }}>Service health</span>
      </div>
      <div className="kma-mdash__tiles">
        {SERVICE.map((t) => (
          <a key={t.label} className={`kma-mdash__tile kma-mdash__tile--link${t.tone ? ` is-${t.tone}` : ""}`} href={t.url}>
            <span className="kma-mdash__num">{t.value == null ? "–" : t.value}</span>
            <span className="kma-mdash__lbl">{t.label}</span>
          </a>
        ))}
      </div>
      {!isAdmin && stats ? (
        <p className="kma-mdash__note">You have reviewer access — you can read applications and add notes; decisions, introductions and safeguarding are for Nikah administrators.</p>
      ) : null}
    </div>
  );
}
