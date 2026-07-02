"use client";

import { useEffect, useRef, useState } from "react";

/* Native-style pull-to-refresh for the installed PWA. Only active when running
   standalone (so it never double-ups with Safari/Chrome's own browser gesture)
   and only on touch devices. Pull down from the top of the page past a
   threshold to reload the current route. */

const THRESHOLD = 72; // px pulled before a refresh fires
const MAX = 96; // px the indicator travels at most
const RESIST = 0.5; // rubber-band resistance

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!isStandalone()) return;
    if (!("ontouchstart" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      active.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        if (active.current) {
          active.current = false;
          setPull(0);
        }
        return;
      }
      // We're pulling down from the very top — take over the gesture.
      active.current = true;
      if (e.cancelable) e.preventDefault();
      setPull(Math.min(delta * RESIST, MAX));
    };

    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (active.current && pull >= THRESHOLD) {
        setRefreshing(true);
        setPull(MAX);
        // Brief beat so the spinner is visible, then reload.
        window.setTimeout(() => window.location.reload(), 360);
      } else {
        setPull(0);
      }
      active.current = false;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [pull, refreshing]);

  if (pull <= 0 && !refreshing) return null;

  const progress = Math.min(pull / THRESHOLD, 1);
  const ready = progress >= 1;

  return (
    <div className="ptr" style={{ transform: `translateX(-50%) translateY(${pull}px)`, opacity: Math.min(progress + 0.2, 1) }} aria-hidden>
      <div className={`ptr__ring${refreshing ? " is-spinning" : ready ? " is-ready" : ""}`} style={{ transform: `rotate(${pull * 3}deg)` }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 4v5h-5" />
        </svg>
      </div>
    </div>
  );
}
