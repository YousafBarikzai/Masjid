"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/content";

/* Desktop header navigation with properly-behaved dropdowns. The old version
   was CSS :hover/:focus-within only, so after clicking an entry the menu stayed
   open on the next page (focus never left it). This one is state-driven:
   - opens on hover (with a small close delay so it isn't twitchy)
   - closes the moment a link is clicked or the route changes
   - Escape and clicking elsewhere close it; chevron toggles for keyboard use */

export default function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);

  // Any navigation closes the menu — the fix for "it stays on when clicked".
  useEffect(() => {
    setOpen(null);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  function enter(href: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(href);
  }
  function leave() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 160);
  }

  return (
    <nav className="main" ref={rootRef as never}>
      {items
        .filter((n) => !n.cta)
        .map((n) =>
          n.children ? (
            <div
              className={`nav-item has-children${open === n.href ? " is-open" : ""}`}
              key={n.href}
              onMouseEnter={() => enter(n.href)}
              onMouseLeave={leave}
            >
              <Link href={n.href} className="nav-top" onClick={() => setOpen(null)}>
                {n.label}
              </Link>
              <button
                type="button"
                className="nav-caret"
                aria-label={`Open ${n.label} menu`}
                aria-expanded={open === n.href}
                onClick={() => setOpen((o) => (o === n.href ? null : n.href))}
              >
                ▾
              </button>
              <div className="dropdown" role="menu">
                {n.children.map((c) => (
                  <Link key={c.href} href={c.href} role="menuitem" onClick={() => setOpen(null)}>
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link key={n.href} href={n.href} className="nav-top">
              {n.label}
            </Link>
          ),
        )}
    </nav>
  );
}
