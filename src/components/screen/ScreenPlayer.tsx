"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DisplayBoard from "./DisplayBoard";
import type { Snapshot } from "@/lib/snapshot";

/* Plays a digital screen's slide playlist. The prayer board stays mounted (and
   live) underneath at all times; announcement / picture / QR slides fade in as
   full-screen overlays for their configured seconds, then the loop continues.
   The playlist is re-fetched periodically, so admin edits reach the TV without
   anyone touching it. A "prayer-board" slide simply shows the board itself.

   Preview mode (?preview=1) powers the admin's embedded preview: the playlist
   refreshes every few seconds instead of every minute, the parent page can
   drive it (play/pause/next/prev/restart via postMessage), and the player
   reports which slide is showing and the seconds remaining. ?all=1 also
   includes slides that are switched off, so staff can check a slide before
   showing it to the mosque. Add ?slide=2 to jump straight to a slide. */

type Slide = {
  id?: string;
  type: "prayer-board" | "announcement" | "image" | "qr";
  duration?: number;
  enabled?: boolean;
  heading?: string;
  body?: string;
  image?: { url?: string; alt?: string } | string | null;
  fit?: "contain" | "cover";
  url?: string;
  label?: string;
};

type ScreenDoc = { id: string | number; name?: string; slides?: Slide[] } | null;

function slideLabel(s: Slide | null): string {
  if (!s) return "";
  if (s.type === "prayer-board") return "Prayer times board";
  if (s.type === "announcement") return s.heading ? `Announcement — ${s.heading}` : "Announcement";
  if (s.type === "image") return s.heading ? `Picture — ${s.heading}` : "Picture";
  return s.label ? `QR — ${s.label}` : "QR code";
}

function durationOf(s: Slide | null): number {
  return Math.max(3, Number(s?.duration) || 10);
}

function QrImage({ url }: { url: string }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then((QR) =>
        QR.toDataURL(url, { width: 640, margin: 1, color: { dark: "#0c3322", light: "#ffffff" } }),
      )
      .then((data) => {
        if (alive) setSrc(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [url]);
  if (!src) return <div className="slide-qr__ph" aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="slide-qr__img" src={src} alt={`QR code for ${url}`} />;
}

export default function ScreenPlayer({
  slug,
  initialScreen,
  initialSnapshot,
}: {
  slug: string;
  initialScreen: ScreenDoc;
  initialSnapshot: Snapshot;
}) {
  // Preview flags come from the URL; parsed once (client only — SSR sees defaults).
  const [flags] = useState(() => {
    if (typeof window === "undefined") return { preview: false, all: false, startAt: 0 };
    const q = new URLSearchParams(window.location.search);
    const n = parseInt(q.get("slide") || "", 10);
    return {
      preview: q.get("preview") === "1",
      all: q.get("all") === "1",
      startAt: Number.isFinite(n) && n > 0 ? n - 1 : 0,
    };
  });

  const activeSlides = useCallback(
    (doc: ScreenDoc): Slide[] => (doc?.slides ?? []).filter((s) => flags.all || s.enabled !== false),
    [flags.all],
  );

  const [screen, setScreen] = useState<ScreenDoc>(initialScreen);
  const [index, setIndex] = useState<number>(flags.startAt);
  const [cycle, setCycle] = useState(0); // bumps on every jump so timers reset even on 1-slide loops
  const [paused, setPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [clock, setClock] = useState("");
  const slidesRef = useRef<Slide[]>(activeSlides(initialScreen));
  slidesRef.current = activeSlides(screen);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Re-fetch the playlist so edits reach the TV automatically (fast in preview).
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/screens?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=1`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { docs?: ScreenDoc[] };
        if (alive && data.docs?.[0]) setScreen(data.docs[0]);
      } catch {
        /* keep playing the last-known playlist */
      }
    };
    const id = setInterval(poll, flags.preview ? 5_000 : 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug, flags.preview]);

  const jump = useCallback((to: (i: number, len: number) => number) => {
    setIndex((i) => {
      const len = slidesRef.current.length;
      return len ? ((to(i, len) % len) + len) % len : 0;
    });
    setCycle((c) => c + 1);
  }, []);
  const advance = useCallback(() => jump((i) => i + 1), [jump]);

  const slides = activeSlides(screen);
  const current = slides.length ? slides[index % slides.length] : null;

  // Reset the countdown whenever the slide (or playlist) changes.
  useEffect(() => {
    setSecondsLeft(durationOf(current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cycle, screen]);

  // The heartbeat: count the current slide down, advance at zero.
  useEffect(() => {
    if (!current) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setSecondsLeft((s) => {
        if (s <= 1) {
          advance();
          return 0; // replaced by the reset effect
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [current, advance]);

  // Preview mode: obey the admin preview's controls…
  useEffect(() => {
    if (!flags.preview) return;
    const onMsg = (e: MessageEvent) => {
      const cmd = (e.data as { kmaPreview?: string })?.kmaPreview;
      if (!cmd) return;
      if (cmd === "pause") setPaused(true);
      else if (cmd === "play") setPaused(false);
      else if (cmd === "next") advance();
      else if (cmd === "prev") jump((i) => i - 1);
      else if (cmd === "restart") {
        jump(() => 0);
        setPaused(false);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [flags.preview, advance, jump]);

  // …and report what's playing back to it.
  useEffect(() => {
    if (!flags.preview || typeof window === "undefined" || window.parent === window) return;
    window.parent.postMessage(
      {
        kmaSlide: {
          index: slides.length ? index % slides.length : 0,
          total: slides.length,
          secondsLeft,
          duration: durationOf(current),
          label: slideLabel(current),
        },
      },
      "*",
    );
  }, [flags.preview, index, secondsLeft, slides.length, current]);

  // Small live clock for the overlay corner chip.
  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const overlay = current && current.type !== "prayer-board" ? current : null;
  const imageUrl =
    overlay?.type === "image" && overlay.image && typeof overlay.image === "object"
      ? overlay.image.url
      : undefined;
  const imageAlt =
    overlay?.type === "image" && overlay.image && typeof overlay.image === "object"
      ? overlay.image.alt || overlay.heading || "Slide"
      : "Slide";

  return (
    <div className="screenplayer">
      {/* The live prayer board — always mounted, always up to date. */}
      <DisplayBoard initial={initialSnapshot} />

      {overlay && (
        <div className="slide-overlay" key={`${cycle}-${overlay.id ?? overlay.type}`}>
          {overlay.type === "announcement" && (
            <div className="slide slide--announce">
              {overlay.heading && <h1 className="slide-heading serif">{overlay.heading}</h1>}
              {overlay.body && <p className="slide-body">{overlay.body}</p>}
            </div>
          )}

          {overlay.type === "image" &&
            (imageUrl ? (
              <div className={`slide slide--image${overlay.fit === "cover" ? " fit-cover" : ""}`}>
                {/* Blurred copy fills the letterbox so any aspect ratio looks deliberate. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="img-backdrop" src={imageUrl} alt="" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="img-main" src={imageUrl} alt={imageAlt} />
              </div>
            ) : (
              <div className="slide slide--announce">
                <p className="slide-body">Picture slide — add an image in the admin.</p>
              </div>
            ))}

          {overlay.type === "qr" && (
            <div className="slide slide--qr">
              {overlay.heading && <h1 className="slide-heading serif">{overlay.heading}</h1>}
              <div className="slide-qr">{overlay.url ? <QrImage url={overlay.url} /> : null}</div>
              {overlay.label && <div className="slide-qr__label">{overlay.label}</div>}
            </div>
          )}

          {/* Hidden slides are visible only in preview — badge them clearly. */}
          {flags.all && overlay.enabled === false && <div className="slide-hiddenbadge">Hidden from the TV</div>}

          {/* Corner chip: the screen never loses the time. */}
          <div className="slide-chip" suppressHydrationWarning>
            <span className="slide-chip__clock">{clock}</span>
            <span className="slide-chip__name">Kingston Mosque</span>
          </div>

          {/* Progress dots so staff can see where the loop is. */}
          {slides.length > 1 && (
            <div className="slide-dots" aria-hidden>
              {slides.map((s, i) => (
                <span key={s.id ?? i} className={`slide-dot${i === index % slides.length ? " is-on" : ""}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
