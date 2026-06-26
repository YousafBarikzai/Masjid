"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavItem } from "@/lib/content";

export default function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-only">
      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div className="mobile-nav" onClick={() => setOpen(false)}>
          {items
            .filter((n) => !n.cta)
            .map((n) => (
              <div key={n.href} className="mobile-group">
                <Link href={n.href} className="mobile-top">
                  {n.label}
                </Link>
                {n.children?.map((c) => (
                  <Link key={c.href} href={c.href} className="mobile-sub">
                    {c.label}
                  </Link>
                ))}
              </div>
            ))}
          <Link href="/donate" className="btn btn-gold" style={{ marginTop: 10 }}>
            Donate
          </Link>
        </div>
      )}
    </div>
  );
}
