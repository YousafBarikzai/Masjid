"use client";

import "./command-palette.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  COLLECTIONS,
  GLOBALS,
  SEARCHABLE,
  API_BASE,
  createHref,
  docHref,
} from "./destinations";
import {
  IconSearch,
  IconDoc,
  IconCalendar,
  IconBell,
  IconBroadcast,
  IconTheme,
  IconNavigate,
  IconClock,
  IconArrow,
} from "./icons";

const RECENT_KEY = "kma:cmdk:recent";

type Group = "Quick actions" | "Go to" | "Recent" | "Search results";

interface Item {
  id: string;
  group: Group;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  keywords?: string;
  href?: string;
  run: () => void;
}

interface RecentEntry {
  title: string;
  sub?: string;
  href: string;
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Ranked match: prefix > word-boundary > substring > subsequence; -1 = no match. */
function score(query: string, text: string): number {
  const n = norm(query);
  if (!n) return 0;
  const t = norm(text);
  if (t.startsWith(n)) return 100;
  const idx = t.indexOf(n);
  if (idx > 0) {
    if (/\s|[-/]/.test(t[idx - 1])) return 80;
    return 60;
  }
  let ti = 0;
  for (const ch of n) {
    ti = t.indexOf(ch, ti);
    if (ti === -1) return -1;
    ti++;
  }
  return 30;
}

function matchScore(query: string, it: Item): number {
  return Math.max(score(query, it.title), it.keywords ? score(query, it.keywords) : -1);
}

function readRecent(): RecentEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((r) => r && r.href && r.title).slice(0, 6) : [];
  } catch {
    return [];
  }
}

export function CommandPalette() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState<{ slug: string; label: string; id: string; title: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  /* Global hotkey: ⌘K / Ctrl+K. Capture phase so it wins over the page — except when
     text is selected inside a Lexical editor (there ⌘K is "insert link"). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const ae = document.activeElement as HTMLElement | null;
        const inLexical = ae?.closest?.(".rich-text-lexical, [data-lexical-editor]");
        const collapsed = window.getSelection()?.isCollapsed ?? true;
        if (inLexical && !collapsed) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  /* On open: remember focus, load recent, focus input, lock body scroll. */
  useEffect(() => {
    if (!open) return;
    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    setQuery("");
    setActiveIndex(0);
    setResults([]);
    setRecent(readRecent());
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  /* Debounced, abortable content search across collections (session cookie authorises). */
  useEffect(() => {
    const q = query.trim();
    if (!open || !q) {
      setResults([]);
      setSearching(false);
      setSearchError(false);
      return;
    }
    setSearching(true);
    setSearchError(false);
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const settled = await Promise.allSettled(
          SEARCHABLE.map(async (s) => {
            const url = `${API_BASE}/${s.slug}?where[${s.field}][like]=${encodeURIComponent(
              q,
            )}&limit=5&depth=0&sort=-updatedAt`;
            const res = await fetch(url, { credentials: "include", signal: ctrl.signal });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            return (data?.docs ?? []).map((d: any) => ({
              slug: s.slug,
              label: s.label,
              id: String(d.id),
              title: String(d[s.field] ?? d.title ?? d.name ?? `#${d.id}`),
            }));
          }),
        );
        if (ctrl.signal.aborted) return;
        const ok = settled.filter((x) => x.status === "fulfilled") as PromiseFulfilledResult<any[]>[];
        setResults(ok.flatMap((x) => x.value).slice(0, 24));
        setSearchError(ok.length === 0);
      } catch {
        if (!ctrl.signal.aborted) {
          setResults([]);
          setSearchError(true);
        }
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, open]);

  const navigate = useCallback(
    (href: string, newTab = false) => {
      if (newTab) {
        window.open(href, "_blank", "noopener");
        return;
      }
      router.push(href);
      close();
    },
    [router, close],
  );

  const remember = useCallback(
    (entry: RecentEntry) => {
      try {
        const next = [entry, ...readRecent().filter((r) => r.href !== entry.href)].slice(0, 6);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      navigate(entry.href);
    },
    [navigate],
  );

  const toggleTheme = useCallback(() => {
    try {
      const el = document.documentElement;
      const next = el.getAttribute("data-theme") === "dark" ? "light" : "dark";
      el.setAttribute("data-theme", next);
      localStorage.setItem("payload-theme", next);
    } catch {
      /* ignore */
    }
    close();
  }, [close]);

  /* Build the item set for the current query. */
  const quickItems: Item[] = [
    { id: "qa-post", title: "New news post", subtitle: "Create", icon: <IconDoc />, keywords: "add create article news", href: createHref("posts") },
    { id: "qa-event", title: "New event", subtitle: "Create", icon: <IconCalendar />, keywords: "add create", href: createHref("events") },
    { id: "qa-page", title: "New page", subtitle: "Create", icon: <IconDoc />, keywords: "add create", href: createHref("pages") },
    { id: "qa-ann", title: "New announcement", subtitle: "Create", icon: <IconBell />, keywords: "add create banner alert", href: createHref("announcements") },
    { id: "qa-broadcast", title: "New broadcast", subtitle: "Send", icon: <IconBroadcast />, keywords: "whatsapp email telegram send", href: createHref("broadcasts") },
    { id: "qa-form", title: "New form", subtitle: "Create", icon: <IconDoc />, keywords: "form builder enquiry membership", href: createHref("forms") },
  ].map((a) => ({
    ...a,
    group: "Quick actions" as const,
    run: () => navigate(a.href!),
  }));
  quickItems.push({
    id: "qa-export-submissions",
    group: "Quick actions",
    title: "Export form submissions (CSV)",
    subtitle: "Download",
    icon: <IconDoc />,
    keywords: "csv export download forms responses spreadsheet",
    run: () => {
      window.open("/app-api/form-export", "_blank", "noopener");
      close();
    },
  });
  quickItems.push({
    id: "qa-theme",
    group: "Quick actions",
    title: "Toggle light / dark theme",
    subtitle: "Action",
    icon: <IconTheme />,
    keywords: "dark mode appearance",
    run: toggleTheme,
  });

  const navItems: Item[] = [...COLLECTIONS, ...GLOBALS].map((d) => ({
    id: "nav-" + d.slug,
    group: "Go to" as const,
    title: d.label,
    subtitle: d.group,
    icon: <IconNavigate />,
    keywords: d.slug,
    href: d.href,
    run: () => remember({ title: d.label, sub: d.group, href: d.href }),
  }));

  const searchItems: Item[] = results.map((r) => ({
    id: `doc:${r.slug}:${r.id}`,
    group: "Search results" as const,
    title: r.title,
    subtitle: r.label,
    icon: <IconDoc />,
    href: docHref(r.slug, r.id),
    run: () => remember({ title: r.title, sub: r.label, href: docHref(r.slug, r.id) }),
  }));

  const recentItems: Item[] = recent.map((r, i) => ({
    id: "recent-" + i,
    group: "Recent" as const,
    title: r.title,
    subtitle: r.sub,
    icon: <IconClock />,
    href: r.href,
    run: () => remember({ title: r.title, sub: r.sub, href: r.href }),
  }));

  const q = query.trim();
  const groups: { label: Group; items: Item[] }[] = [];
  if (!q) {
    groups.push({ label: "Quick actions", items: quickItems });
    if (recentItems.length) groups.push({ label: "Recent", items: recentItems });
    groups.push({ label: "Go to", items: navItems });
  } else {
    const filt = (items: Item[]) =>
      items
        .map((it) => ({ it, s: matchScore(q, it) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.it);
    const qa = filt(quickItems);
    if (qa.length) groups.push({ label: "Quick actions", items: qa });
    const nv = filt(navItems);
    if (nv.length) groups.push({ label: "Go to", items: nv });
    if (searchItems.length) groups.push({ label: "Search results", items: searchItems });
  }

  // Flatten for keyboard navigation, tagging each row with its flat index.
  const flat: Item[] = [];
  const rendered = groups.map((g) => ({
    label: g.label,
    rows: g.items.map((it) => {
      const idx = flat.length;
      flat.push(it);
      return { it, idx };
    }),
  }));
  const active = flat.length ? Math.min(activeIndex, flat.length - 1) : 0;

  useEffect(() => {
    if (!open) return;
    const node = resultsRef.current?.querySelector<HTMLElement>(`#cmdk-opt-${active}`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open, query, results]);

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (Math.min(i, flat.length - 1) + 1) % flat.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        flat.length ? (Math.min(i, flat.length - 1) - 1 + flat.length) % flat.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flat[active];
      if (!it) return;
      if ((e.metaKey || e.ctrlKey) && it.href) navigate(it.href, true);
      else it.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="cmdk-panel cmdk-root"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="cmdk-search">
          <span className="cmdk-search__icon">
            <IconSearch />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages, create, jump to…"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-listbox"
            aria-autocomplete="list"
            aria-activedescendant={flat.length ? `cmdk-opt-${active}` : undefined}
            spellCheck={false}
            autoComplete="off"
          />
          {searching && <span className="cmdk-search__spin" aria-hidden />}
        </div>

        <div className="cmdk-results" ref={resultsRef} id="cmdk-listbox" role="listbox">
          {flat.length === 0 ? (
            <div className="cmdk-empty">
              {searching ? "Searching…" : `No matches for “${query}”.`}
            </div>
          ) : (
            rendered.map((g) => (
              <div key={g.label} role="group" aria-label={g.label}>
                <div className="cmdk-group__label" role="presentation">
                  {g.label}
                </div>
                {g.rows.map(({ it, idx }) => (
                  <div
                    key={it.id}
                    id={`cmdk-opt-${idx}`}
                    role="option"
                    aria-selected={idx === active}
                    className="cmdk-item"
                    onMouseMove={() => setActiveIndex(idx)}
                    onClick={() => it.run()}
                  >
                    <span className="cmdk-item__icon">{it.icon}</span>
                    <span className="cmdk-item__main">
                      <span className="cmdk-item__title">{it.title}</span>
                      {it.subtitle && <span className="cmdk-item__sub">{it.subtitle}</span>}
                    </span>
                    <span className="cmdk-item__hint" aria-hidden>
                      <IconArrow size={15} />
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
          {q && searchError && (
            <div className="cmdk-note">Content search unavailable — navigation still works.</div>
          )}
        </div>

        <div className="cmdk-foot">
          <span className="cmdk-kbd">
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span className="cmdk-kbd">
            <kbd>↵</kbd> open
          </span>
          <span className="cmdk-kbd">
            <kbd>esc</kbd> close
          </span>
          <span className="cmdk-foot__spacer" />
          <span className="cmdk-foot__brand">Kingston Mosque</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
