"use client";

import "./role-guide.css";
import React from "react";
import Link from "next/link";

/* Visual role guide at the top of the Users list — so whoever is adding a team
   member can pick the right role at a glance, WordPress-style. Mirrors the
   access rules in src/payload/access.ts exactly. */

type RoleCard = {
  icon: string;
  name: string;
  tagline: string;
  can: string[];
  cannot: string[];
  accent?: boolean;
};

const ROLES: RoleCard[] = [
  {
    icon: "👑",
    name: "Super Admin",
    tagline: "The owner — everything, everywhere.",
    can: ["All content & settings", "Add / remove users", "Delete anything"],
    cannot: [],
    accent: true,
  },
  {
    icon: "🛡️",
    name: "Admin",
    tagline: "Runs the whole site day-to-day.",
    can: ["All content & settings", "Add / remove users", "Broadcasts & screens"],
    cannot: [],
  },
  {
    icon: "✏️",
    name: "Editor",
    tagline: "Owns the content.",
    can: ["Create new pages, news, events…", "Edit & publish anything", "Broadcasts, screens, forms"],
    cannot: ["Users & site settings"],
  },
  {
    icon: "📝",
    name: "Editor (edit only)",
    tagline: "Keeps existing content up to date.",
    can: ["Edit & publish existing pages, news, events, media"],
    cannot: ["Create new items", "Delete anything", "Users & settings"],
  },
  {
    icon: "🌱",
    name: "Contributor",
    tagline: "Writes — an editor approves.",
    can: ["Create new drafts", "Edit their drafts", "Submit for review"],
    cannot: ["Publish to the live site", "Delete anything"],
  },
  {
    icon: "🕌",
    name: "Prayer Times Manager",
    tagline: "The timetable specialist.",
    can: ["Prayer timetable & annual upload", "Jumuʿah, Ramadan & Eid times"],
    cannot: ["Pages, news & other content", "Users & settings"],
  },
];

export function RoleGuide() {
  return (
    <div className="rg">
      <div className="rg__head">
        <div>
          <b>Team &amp; roles</b>
          <span>
            Each person sees only the menus their role allows — pick the smallest role that covers
            what they need to do.
          </span>
        </div>
        <Link href="/admin/collections/users/create" className="rg__cta">
          + Add a team member
        </Link>
      </div>
      <div className="rg__grid">
        {ROLES.map((r) => (
          <div className={`rg__card${r.accent ? " is-accent" : ""}`} key={r.name}>
            <div className="rg__title">
              <span className="rg__icon" aria-hidden>{r.icon}</span>
              <div>
                <b>{r.name}</b>
                <small>{r.tagline}</small>
              </div>
            </div>
            <ul className="rg__list">
              {r.can.map((c) => (
                <li key={c} className="rg__can">{c}</li>
              ))}
              {r.cannot.map((c) => (
                <li key={c} className="rg__cannot">{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
