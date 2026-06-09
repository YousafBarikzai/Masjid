"use client";

import { useState } from "react";
import Link from "next/link";
import { nav } from "@/lib/content";

export default function MobileMenu() {
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
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/donate" className="btn btn-gold" style={{ marginTop: 10 }}>
            Donate
          </Link>
        </div>
      )}
    </div>
  );
}
