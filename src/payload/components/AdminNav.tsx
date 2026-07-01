"use client";

import "./admin-nav.css";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ─────────────────────────────────────────────────────────────────────────────
   Waterfall admin navigation. Replaces Payload's flat group list with a clear
   hierarchy: main heading → everything under it → child actions, so staff can
   always see where each kind of content lives and add to it in one click.

     ▸ Website Pages        → Main menu, every page (edit directly), + new page
     ▸ Content              → News, Events, Classes, Announcements, Media …
     ▸ Prayer Times         → Timetable, uploads, Jumu'ah, Ramadan & Eid
     ▸ Community & Forms    → Forms, submissions, subscribers
     ▸ Broadcast            → Broadcasts + settings
     ▸ Site Settings        → Site settings, donations
     ▸ Administration       → Users, devices, audit log

   Rendered via admin.components.beforeNavLinks; the default group list is
   hidden in admin-theme.css. Open/closed state persists per browser.
   ──────────────────────────────────────────────────────────────────────────── */

type Item = {
  label: string;
  href: string;
  /** link to the "create new" view (collections only) */
  addHref?: string;
  hint?: string;
};

type Group = {
  key: string;
  label: string;
  icon: string;
  items: Item[];
  /** when true, also list the actual page documents as child links */
  pagesTree?: boolean;
};

const col = (slug: string) => `/admin/collections/${slug}`;
const add = (slug: string) => `/admin/collections/${slug}/create`;
const glob = (slug: string) => `/admin/globals/${slug}`;

const GROUPS: Group[] = [
  {
    key: "pages",
    label: "Website Pages",
    icon: "📄",
    pagesTree: true,
    items: [
      { label: "Site navigation (menus)", href: glob("main-menu"), hint: "Header menu & dropdowns" },
      { label: "All pages", href: col("pages"), addHref: add("pages") },
    ],
  },
  {
    key: "content",
    label: "Content",
    icon: "📰",
    items: [
      { label: "News & articles", href: col("posts"), addHref: add("posts") },
      { label: "Events", href: col("events"), addHref: add("events") },
      { label: "Classes & education", href: col("classes"), addHref: add("classes") },
      { label: "Services", href: col("services"), addHref: add("services") },
      { label: "Announcements & banners", href: col("announcements"), addHref: add("announcements") },
      { label: "Media library", href: col("media"), addHref: add("media") },
    ],
  },
  {
    key: "prayer",
    label: "Prayer Times",
    icon: "🕌",
    items: [
      { label: "Prayer timetable", href: col("prayer-days"), addHref: add("prayer-days") },
      { label: "Annual timetable upload", href: col("timetable-uploads"), addHref: add("timetable-uploads") },
      { label: "Jumuʿah settings", href: glob("jummah-settings") },
      { label: "Ramadan & Eid", href: glob("special-schedule") },
    ],
  },
  {
    key: "community",
    label: "Community & Forms",
    icon: "💬",
    items: [
      { label: "Forms (builder)", href: col("forms"), addHref: add("forms") },
      { label: "Form submissions", href: col("form-submissions") },
      { label: "Contact messages", href: col("contact-submissions") },
      { label: "Subscribers", href: col("subscribers"), addHref: add("subscribers") },
    ],
  },
  {
    key: "broadcast",
    label: "Broadcast",
    icon: "📣",
    items: [
      { label: "Broadcasts (send a notice)", href: col("broadcasts"), addHref: add("broadcasts") },
      { label: "Broadcast settings", href: glob("broadcast-settings") },
    ],
  },
  {
    key: "settings",
    label: "Site Settings",
    icon: "⚙️",
    items: [
      { label: "Site settings", href: glob("site-settings"), hint: "Contact info, about, socials" },
      { label: "Donations", href: glob("donation-settings"), hint: "Bank details, giving link, campaigns" },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    icon: "🔐",
    items: [
      { label: "Staff users", href: col("users"), addHref: add("users") },
      { label: "App devices (push)", href: col("device-tokens") },
      { label: "Audit log", href: col("audit-log") },
    ],
  },
];

const STORE = "kma-admin-nav-open";

type PageDoc = { id: string | number; title?: string; slug?: string; _status?: string };

export function AdminNav() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [pages, setPages] = useState<PageDoc[]>([]);

  // Restore open/closed state (default: the group containing the active link,
  // plus Website Pages so the tree is visible on first visit).
  useEffect(() => {
    let initial: Record<string, boolean> | null = null;
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) initial = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (!initial) {
      initial = { pages: true };
      for (const g of GROUPS) {
        if (g.items.some((i) => pathname.startsWith(i.href))) initial[g.key] = true;
      }
    }
    setOpen(initial);
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(open));
    } catch {
      /* ignore */
    }
  }, [open, loaded]);

  // Live list of website pages so each one is a direct child link.
  useEffect(() => {
    let active = true;
    fetch("/api/pages?limit=100&depth=0&sort=title&draft=true", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.docs) setPages(data.docs as PageDoc[]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="kma-nav" data-loaded={loaded ? "true" : "false"}>
      <Link href="/admin" className={`kma-nav__dash${pathname === "/admin" ? " is-active" : ""}`}>
        <span className="kma-nav__dash-ic" aria-hidden>⌂</span>
        Dashboard
      </Link>

      {GROUPS.map((g) => {
        const expanded = !!open[g.key];
        const groupActive = g.items.some((i) => isActive(i.href));
        return (
          <div className={`kma-nav__group${expanded ? " is-open" : ""}`} key={g.key}>
            <button
              type="button"
              className={`kma-nav__head${groupActive ? " is-active" : ""}`}
              aria-expanded={expanded}
              onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}
            >
              <span className="kma-nav__ic" aria-hidden>{g.icon}</span>
              <span className="kma-nav__label">{g.label}</span>
              <svg
                className="kma-nav__chev"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>

            {expanded && (
              <div className="kma-nav__items">
                {g.items.map((item) => (
                  <div className="kma-nav__row" key={item.href}>
                    <Link
                      href={item.href}
                      className={`kma-nav__link${isActive(item.href) ? " is-active" : ""}`}
                      title={item.hint}
                    >
                      {item.label}
                    </Link>
                    {item.addHref && (
                      <Link
                        href={item.addHref}
                        className="kma-nav__add"
                        title={`Add new — ${item.label}`}
                        aria-label={`Add new — ${item.label}`}
                      >
                        +
                      </Link>
                    )}
                  </div>
                ))}

                {g.pagesTree && pages.length > 0 && (
                  <div className="kma-nav__tree">
                    {pages.map((p) => (
                      <Link
                        key={p.id}
                        href={`/admin/collections/pages/${p.id}`}
                        className={`kma-nav__leaf${
                          pathname === `/admin/collections/pages/${p.id}` ? " is-active" : ""
                        }`}
                      >
                        <span className="kma-nav__leaf-dot" aria-hidden />
                        <span className="kma-nav__leaf-label">{p.title || p.slug || "Untitled"}</span>
                        {p._status === "draft" && <span className="kma-nav__draft">draft</span>}
                      </Link>
                    ))}
                    <Link href={add("pages")} className="kma-nav__leaf kma-nav__leaf--new">
                      <span className="kma-nav__leaf-dot is-new" aria-hidden>+</span>
                      <span className="kma-nav__leaf-label">Add a new page</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
