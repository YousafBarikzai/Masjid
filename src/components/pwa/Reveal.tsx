"use client";

import { useEffect } from "react";

/* Subtle scroll-reveal for the home/content cards on phones — each block fades
   and rises into view as you scroll, the way a polished native app does.
   - Phones only (<=820px), and skipped entirely for reduced-motion.
   - Adds `reveal-on` to <html> so the hidden start-state only applies when JS is
     running; without JS everything stays visible (no FOUC, no hidden content). */

const SELECTORS = [
  ".hx-section-head",
  ".hx-prayer-card",
  ".hx-jummah-card",
  ".hx-event-card",
  ".hx-icard",
  ".hx-news-card",
  ".hx-donate-box",
  ".hx-contact-map",
  ".hx-contact-info",
  ".hx-facility",
].join(",");

export default function Reveal() {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 820px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    root.classList.add("reveal-on");

    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS));
    if (!els.length) {
      root.classList.remove("reveal-on");
      return;
    }
    // Light stagger within each row/group for a smoother cascade.
    els.forEach((el, i) => {
      el.style.setProperty("--reveal-delay", `${(i % 4) * 60}ms`);
      el.classList.add("reveal");
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));

    // Safety net: reveal everything after a moment in case the observer misses.
    const safety = window.setTimeout(() => {
      els.forEach((el) => el.classList.add("is-in"));
    }, 1600);

    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return null;
}
