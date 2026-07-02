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
  /** roles that see this item (default: the group's view roles) */
  view?: string[];
  /** roles that get the "+" create shortcut */
  create?: string[];
};

type Group = {
  key: string;
  label: string;
  icon: string;
  items: Item[];
  /** roles that see this group at all */
  view: string[];
  /** roles that may create in the docs tree ("Add new" leaf) */
  treeCreate?: string[];
  /** list the collection's actual documents as child links (e.g. pages, screens) */
  docsTree?: { collection: string; titleField: string };
};

const col = (slug: string) => `/admin/collections/${slug}`;
const add = (slug: string) => `/admin/collections/${slug}/create`;
const glob = (slug: string) => `/admin/globals/${slug}`;

/* Role sets — mirror src/payload/access.ts. The sidebar only SHOWS what the
   role can actually use; the server enforces the same rules regardless. */
const ADMINS = ["super-admin", "admin"];
const EDITORS = [...ADMINS, "editor"];
const CONTENT_EDIT = [...EDITORS, "updater", "contributor"]; // may open/edit content
const CONTENT_CREATE = [...EDITORS, "contributor"]; // may create pages/posts (updater may not)
const PRAYER = [...ADMINS, "prayer-times-manager", "editor"];
const PRAYER_CREATE = [...ADMINS, "prayer-times-manager"];

const GROUPS: Group[] = [
  {
    key: "pages",
    label: "Website Pages",
    icon: "📄",
    view: CONTENT_EDIT,
    treeCreate: CONTENT_CREATE,
    docsTree: { collection: "pages", titleField: "title" },
    items: [
      { label: "Site navigation (menus)", href: glob("main-menu"), hint: "Header menu & dropdowns", view: EDITORS },
      { label: "All pages", href: col("pages"), addHref: add("pages"), create: CONTENT_CREATE },
    ],
  },
  {
    key: "content",
    label: "Content",
    icon: "📰",
    view: CONTENT_EDIT,
    items: [
      { label: "News & articles", href: col("posts"), addHref: add("posts"), create: CONTENT_CREATE },
      { label: "Events", href: col("events"), addHref: add("events"), create: EDITORS },
      { label: "Classes & education", href: col("classes"), addHref: add("classes"), create: EDITORS },
      { label: "Services", href: col("services"), addHref: add("services"), create: EDITORS },
      { label: "Announcements & banners", href: col("announcements"), addHref: add("announcements"), create: EDITORS },
      { label: "Media library", href: col("media"), addHref: add("media"), create: EDITORS },
    ],
  },
  {
    key: "prayer",
    label: "Prayer Times",
    icon: "🕌",
    view: PRAYER,
    items: [
      { label: "Prayer timetable", href: col("prayer-days"), addHref: add("prayer-days"), create: PRAYER_CREATE },
      { label: "Annual timetable upload", href: col("timetable-uploads"), addHref: add("timetable-uploads"), view: PRAYER_CREATE, create: PRAYER_CREATE },
      { label: "Jumuʿah settings", href: glob("jummah-settings"), view: PRAYER_CREATE },
      { label: "Ramadan & Eid", href: glob("special-schedule"), view: PRAYER_CREATE },
    ],
  },
  {
    key: "community",
    label: "Community & Forms",
    icon: "💬",
    view: EDITORS,
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
    view: EDITORS,
    items: [
      { label: "Broadcasts (send a notice)", href: col("broadcasts"), addHref: add("broadcasts") },
      { label: "Broadcast settings", href: glob("broadcast-settings") },
    ],
  },
  {
    key: "tv",
    label: "Digital Screens",
    icon: "📺",
    view: EDITORS,
    treeCreate: EDITORS,
    docsTree: { collection: "screens", titleField: "name" },
    items: [{ label: "All screens", href: col("screens"), addHref: add("screens"), hint: "Each TV's slide playlist" }],
  },
  {
    key: "settings",
    label: "Site Settings",
    icon: "⚙️",
    view: ADMINS,
    items: [
      { label: "Site settings", href: glob("site-settings"), hint: "Contact info, about, socials" },
      { label: "Donations", href: glob("donation-settings"), hint: "Bank details, giving link, campaigns" },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    icon: "🔐",
    view: ADMINS,
    items: [
      { label: "Staff users", href: col("users"), addHref: add("users") },
      { label: "App devices (push)", href: col("device-tokens") },
      { label: "Audit log", href: col("audit-log") },
    ],
  },
];

const STORE = "kma-admin-nav-open";

type TreeDoc = { id: string | number; title?: string; name?: string; slug?: string; _status?: string };

export function AdminNav() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [trees, setTrees] = useState<Record<string, TreeDoc[]>>({});
  const [roles, setRoles] = useState<string[] | null>(null);

  // Who am I? The sidebar only shows what this person's role can use.
  useEffect(() => {
    let active = true;
    fetch("/api/users/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const rs = data?.user?.roles;
        setRoles(Array.isArray(rs) ? rs : []);
      })
      .catch(() => setRoles([]));
    return () => {
      active = false;
    };
  }, []);

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

  // Live document lists (website pages, digital screens) as direct child links.
  useEffect(() => {
    let active = true;
    for (const g of GROUPS) {
      if (!g.docsTree) continue;
      const { collection, titleField } = g.docsTree;
      fetch(`/api/${collection}?limit=100&depth=0&sort=${titleField}&draft=true`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (active && data?.docs) setTrees((t) => ({ ...t, [collection]: data.docs as TreeDoc[] }));
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Role gate: null while loading (render only the Dashboard link — no flash of
  // menus the user isn't allowed to use).
  const can = (allowed?: string[]) =>
    !allowed || (roles ?? []).some((r) => allowed.includes(r));
  const visibleGroups =
    roles === null
      ? []
      : GROUPS.filter((g) => can(g.view)).map((g) => ({
          ...g,
          items: g.items.filter((i) => can(i.view ?? g.view)),
        })).filter((g) => g.items.length > 0 || g.docsTree);

  return (
    <div className="kma-nav" data-loaded={loaded ? "true" : "false"}>
      <Link href="/admin" className={`kma-nav__dash${pathname === "/admin" ? " is-active" : ""}`}>
        <span className="kma-nav__dash-ic" aria-hidden>⌂</span>
        Dashboard
      </Link>

      {visibleGroups.map((g) => {
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
                    {item.addHref && can(item.create) && (
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

                {g.docsTree && (trees[g.docsTree.collection]?.length ?? 0) > 0 && (
                  <div className="kma-nav__tree">
                    {trees[g.docsTree.collection].map((p) => (
                      <Link
                        key={p.id}
                        href={`/admin/collections/${g.docsTree!.collection}/${p.id}`}
                        className={`kma-nav__leaf${
                          pathname === `/admin/collections/${g.docsTree!.collection}/${p.id}` ? " is-active" : ""
                        }`}
                      >
                        <span className="kma-nav__leaf-dot" aria-hidden />
                        <span className="kma-nav__leaf-label">{p.title || p.name || p.slug || "Untitled"}</span>
                        {p._status === "draft" && <span className="kma-nav__draft">draft</span>}
                      </Link>
                    ))}
                    {can(g.treeCreate) && (
                      <Link href={add(g.docsTree.collection)} className="kma-nav__leaf kma-nav__leaf--new">
                        <span className="kma-nav__leaf-dot is-new" aria-hidden>+</span>
                        <span className="kma-nav__leaf-label">Add new</span>
                      </Link>
                    )}
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
