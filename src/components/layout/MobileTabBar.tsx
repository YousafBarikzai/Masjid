"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/content";

/* App-style bottom navigation for phones (and the installed PWA).
   Five targets — Home · Prayer · Donate (raised) · Events · More — with a
   frosted-glass bar, gold active state and a slide-up "More" sheet that holds
   the full menu. Hidden on desktop via CSS. */

type TabBarProps = {
  menu: NavItem[];
  phone: string;
  phoneHref: string;
  email: string;
};

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
  </svg>
);
const PrayerIcon = () => (
  // Mosque silhouette — dome + minarets
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2.5c2.4 1.8 3.6 3.6 3.6 5.4 0 1.4-1.6 2.4-3.6 2.4S8.4 9.3 8.4 7.9c0-1.8 1.2-3.6 3.6-5.4Z" />
    <path d="M4 21v-6.5A2.5 2.5 0 0 1 6.5 12h11A2.5 2.5 0 0 1 20 14.5V21" />
    <path d="M4 21h16M10 21v-3a2 2 0 0 1 4 0v3" />
    <path d="M4 13.5V8M20 13.5V8" />
  </svg>
);
const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden>
    <path d="M12 21s-7.5-4.6-10-9.2C.7 9 1.6 5.4 4.7 4.3c2-.7 4 .1 5.3 1.8l2 .1 2-.1c1.3-1.7 3.3-2.5 5.3-1.8 3.1 1.1 4 4.7 2.7 7.5C19.5 16.4 12 21 12 21Z" />
  </svg>
);
const EventsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M7.5 14h3v3h-3z" />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
    <path d="m21 6-9 6L3 6" />
  </svg>
);

export default function MobileTabBar({ menu, phone, phoneHref, email }: TabBarProps) {
  const pathname = usePathname() || "/";
  const [sheet, setSheet] = useState(false);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  // Close the sheet whenever the route changes.
  useEffect(() => {
    setSheet(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <nav className="tabbar" aria-label="Primary">
        <Link href="/" className={`tabbar__item${isActive("/") ? " is-active" : ""}`}>
          <span className="tabbar__icon">
            <HomeIcon />
          </span>
          <span className="tabbar__label">Home</span>
        </Link>

        <Link
          href="/prayer-times"
          className={`tabbar__item${isActive("/prayer-times") ? " is-active" : ""}`}
        >
          <span className="tabbar__icon">
            <PrayerIcon />
          </span>
          <span className="tabbar__label">Prayer</span>
        </Link>

        <Link href="/donate" className="tabbar__fab" aria-label="Donate">
          <span className="tabbar__fab-ring">
            <HeartIcon />
          </span>
          <span className="tabbar__fab-label">Donate</span>
        </Link>

        <Link
          href="/events"
          className={`tabbar__item${isActive("/events") ? " is-active" : ""}`}
        >
          <span className="tabbar__icon">
            <EventsIcon />
          </span>
          <span className="tabbar__label">Events</span>
        </Link>

        <button
          type="button"
          className={`tabbar__item${sheet ? " is-active" : ""}`}
          aria-haspopup="dialog"
          aria-expanded={sheet}
          onClick={() => setSheet(true)}
        >
          <span className="tabbar__icon">
            <MoreIcon />
          </span>
          <span className="tabbar__label">More</span>
        </button>
      </nav>

      {sheet && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={() => setSheet(false)}
        >
          <div className="sheet__panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__grabber" />
            <div className="sheet__head">
              <span className="sheet__title">Explore</span>
              <button
                type="button"
                className="sheet__close"
                onClick={() => setSheet(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="sheet__grid">
              {menu
                .filter((n) => !n.cta)
                .flatMap((n) => [n, ...(n.children ?? [])])
                .map((n) => (
                  <Link
                    key={n.href + n.label}
                    href={n.href}
                    className={`sheet__link${isActive(n.href) ? " is-active" : ""}`}
                  >
                    {n.label}
                  </Link>
                ))}
            </div>

            <div className="sheet__contact">
              <a href={phoneHref} className="sheet__contact-btn">
                <PhoneIcon />
                <span>{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="sheet__contact-btn">
                <MailIcon />
                <span>Email us</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
