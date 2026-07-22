"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DisplayBoard from "./DisplayBoard";
import type { Snapshot } from "@/lib/snapshot";

/* Plays a digital screen's slide playlist. The prayer board stays mounted (and
   live) underneath at all times; announcement / picture / QR slides fade in as
   full-screen overlays for their configured seconds, then the loop continues.
   The playlist is re-fetched every minute, so admin edits reach the TV without
   anyone touching it. A "prayer-board" slide simply shows the board itself.
   Add ?slide=2 to the URL to preview a specific slide while editing. */

type Slide = {
  id?: string;
  type: "prayer-board" | "announcement" | "image" | "qr";
  duration?: number;
  enabled?: boolean;
  heading?: string;
  body?: string;
  image?: { url?: string; alt?: string } | string | null;
  url?: string;
  label?: string;
};

type ScreenDoc = { id: string | number; name?: string; slides?: Slide[] } | null;

const POLL_MS = 60_000;

function activeSlides(doc: ScreenDoc): Slide[] {
  return (doc?.slides ?? []).filter((s) => s.enabled !== false);
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
  const [screen, setScreen] = useState<ScreenDoc>(initialScreen);
  const [index, setIndex] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const n = parseInt(new URLSearchParams(window.location.search).get("slide") || "", 10);
    return Number.isFinite(n) && n > 0 ? n - 1 : 0;
  });
  const [clock, setClock] = useState("");
  const slidesRef = useRef<Slide[]>(activeSlides(initialScreen));
  slidesRef.current = activeSlides(screen);

  // Re-fetch the playlist every minute so edits reach the TV automatically.
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
    const id = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug]);

  // Advance the rotation: each slide holds for its own duration.
  const advance = useCallback(() => {
    setIndex((i) => (slidesRef.current.length ? (i + 1) % slidesRef.current.length : 0));
  }, []);

  const slides = activeSlides(screen);
  const current = slides.length ? slides[index % slides.length] : null;

  useEffect(() => {
    if (!current) return;
    const secs = Math.max(3, Number(current.duration) || 10);
    const id = setTimeout(advance, secs * 1000);
    return () => clearTimeout(id);
  }, [current, index, advance]);

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

  return (
    <div className="screenplayer">
      {/* The live prayer board — always mounted, always up to date. */}
      <DisplayBoard initial={initialSnapshot} />

      {overlay && (
        <div className="slide-overlay" key={`${index}-${overlay.id ?? overlay.type}`}>
          {overlay.type === "announcement" && (
            <div className="slide slide--announce">
              <div className="slide-eyebrow">Announcement</div>
              {overlay.heading && <h1 className="slide-heading serif">{overlay.heading}</h1>}
              {overlay.body && <p className="slide-body">{overlay.body}</p>}
            </div>
          )}

          {overlay.type === "image" &&
            (imageUrl ? (
              <div className="slide slide--image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={overlay.heading || "Slide"} />
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
