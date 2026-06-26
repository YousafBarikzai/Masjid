"use client";

import { useEffect, useRef, useState } from "react";
import { findNext, londonSecondsNow, formatCountdown, type NextPrayer } from "@/lib/nextPrayer";
import type { Snapshot } from "@/lib/snapshot";

const STORAGE_KEY = "kma-display-snapshot";
const POLL_MS = 60_000; // refresh content every 60s — well inside the 5–10 min target
const BANNER_MS = 9_000; // rotate announcements/news/events
const RELOAD_MS = 60 * 60 * 1000; // hard reload hourly to pick up the new day & deploys

function londonClock(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

interface Banner {
  chip: string;
  text: string;
}

function buildBanners(data: Snapshot): Banner[] {
  const out: Banner[] = [];
  if (data.announcement) out.push({ chip: data.announcement.label || "Notice", text: data.announcement.message });
  for (const n of (data.news ?? []).slice(0, 3)) out.push({ chip: "News", text: n.title });
  for (const e of (data.events ?? []).slice(0, 3)) {
    out.push({ chip: e.tag || "Event", text: e.title });
  }
  return out;
}

export default function DisplayBoard({ initial }: { initial: Snapshot }) {
  const [data, setData] = useState<Snapshot>(initial);
  const [now, setNow] = useState<Date>(() => new Date());
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);
  const [banner, setBanner] = useState(0);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Tick the clock & countdown every second (client only).
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Poll the snapshot feed; keep the last good copy on failure so the board
  // never blanks during a Wi-Fi blip.
  useEffect(() => {
    // Prefer a newer cached snapshot if it exists (e.g. served from SW cache).
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Snapshot;
        if (parsed?.generatedAt && parsed.generatedAt > initial.generatedAt) setData(parsed);
      }
    } catch {
      /* ignore */
    }

    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/app-api/snapshot", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const fresh = (await res.json()) as Snapshot;
        if (!active) return;
        setData(fresh);
        setOnline(true);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        } catch {
          /* storage full / disabled — non-fatal */
        }
      } catch {
        if (active) setOnline(false); // keep showing dataRef.current
      }
    };
    const id = setInterval(poll, POLL_MS);
    poll();
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [initial.generatedAt]);

  // Rotate the banner.
  useEffect(() => {
    const id = setInterval(() => setBanner((b) => b + 1), BANNER_MS);
    return () => clearInterval(id);
  }, []);

  // Keep the TV awake (where the browser supports the Wake Lock API).
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const wl = (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<typeof lock> } }).wakeLock;
    const acquire = async () => {
      try {
        if (wl) lock = await wl.request("screen");
      } catch {
        /* not supported / denied — TV settings should also disable sleep */
      }
    };
    acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  // Register the display service worker (offline shell + cached board).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/display-sw.js", { scope: "/display" }).catch(() => {});
    }
  }, []);

  // Hourly hard reload so the board rolls over to the new prayer day and picks
  // up any deployed changes, even if a long-running tab has drifted.
  useEffect(() => {
    const id = setTimeout(() => location.reload(), RELOAD_MS);
    return () => clearTimeout(id);
  }, []);

  // Online/offline indicator from the browser too.
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // --- Derived view data ---------------------------------------------------
  const fajrJamaah = data.prayers.find((p) => p.key === "fajr")?.jamaah ?? "05:00";
  // Before mount, reuse the server-computed next prayer so SSR and first client
  // render match; after mount, recompute live each second.
  const next: NextPrayer = mounted
    ? findNext(data.prayers, fajrJamaah, londonSecondsNow(now))
    : data.nextPrayer;
  const highlightKey = next.tomorrow ? "fajr" : next.name.toLowerCase();

  const fivePrayers = data.prayers.filter((p) => !p.isInfo);
  const sunrise = data.prayers.find((p) => p.key === "sunrise");
  const banners = buildBanners(data);
  const current = banners.length ? banners[banner % banners.length] : null;

  return (
    <main className="board">
      {!online && <span className="offline" title="Reconnecting…" aria-hidden />}

      <header className="board-head">
        <div className="masjid serif">
          Kingston Mosque
          <small>Kingston Muslim Association</small>
        </div>
        <div className="head-right">
          <div className="clock" suppressHydrationWarning>
            {mounted ? londonClock(now) : ""}
          </div>
          <div className="dates">
            <span>{data.date.gregorian}</span>
            {data.date.hijri ? <span className="hijri"> · {data.date.hijri}</span> : null}
          </div>
        </div>
      </header>

      <section className="next-hero">
        <div className="eyebrow">Next Jamā‘ah</div>
        <div className="nh-line">
          <span className="nh-name serif">{next.name}</span>
          <span className="nh-count" suppressHydrationWarning>
            {formatCountdown(next.diffSeconds)}
          </span>
        </div>
        <div className="nh-at">
          at {next.time}
          {next.tomorrow ? " (tomorrow)" : ""}
        </div>
      </section>

      <section className="prayers">
        {fivePrayers.map((p) => (
          <div key={p.key} className={`prayer${p.key === highlightKey ? " is-next" : ""}`}>
            <div className="pname serif">{p.en}</div>
            <div className="par ar">{p.ar}</div>
            <div className="prow">
              <div className="plabel">Jamā‘ah</div>
              <div className="ptime">{p.jamaah ?? p.begins}</div>
            </div>
            <div className="pbegins">Begins {p.begins}</div>
          </div>
        ))}
      </section>

      {sunrise ? (
        <div className="sunrise">
          Sunrise (Shurūq) <b>{sunrise.begins}</b>
        </div>
      ) : null}

      {current ? (
        <footer className="ticker">
          <span className="chip">{current.chip}</span>
          <span key={banner} className="msg fade">
            {current.text}
          </span>
        </footer>
      ) : null}
    </main>
  );
}
