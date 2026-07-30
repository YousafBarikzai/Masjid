"use client";

import { useEffect, useRef, useState } from "react";
import { useFormFields } from "@payloadcms/ui";
import "./screen-preview.css";

/* Live preview of a digital screen, embedded in the edit page.

   Rather than re-implementing the TV's renderer (which would inevitably
   drift), the preview embeds the REAL /display/<slug> page in an iframe with
   ?preview=1 — so what you see IS what the TV shows, pixel for pixel. The
   player in preview mode accepts play/pause/next/prev/restart commands via
   postMessage and reports back which slide is showing and how many seconds
   remain. It also re-fetches the playlist every few seconds, so saved changes
   appear in the preview almost immediately.

   No third-party library is used: the preview is our own player plus ~100
   lines of glue, which keeps it dependency-free, licence-clean and always
   in sync with the real screen. */

type Status = { index: number; total: number; secondsLeft: number; duration: number; label: string } | null;

const SIZES = [
  { key: "tv", label: "TV (16:9)", w: 1920, h: 1080 },
  { key: "portrait", label: "Portrait (9:16)", w: 1080, h: 1920 },
  { key: "classic", label: "Classic (4:3)", w: 1440, h: 1080 },
] as const;

export function ScreenPreview() {
  const slug = useFormFields(([fields]) => fields?.slug?.value as string | undefined);
  const [size, setSize] = useState<(typeof SIZES)[number]>(SIZES[0]);
  const [includeHidden, setIncludeHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [scale, setScale] = useState(0.3);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Fit the virtual TV resolution into the available width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / size.w, 1));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  // Status reports from the player.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const s = (e.data as { kmaSlide?: Status })?.kmaSlide;
      if (s) setStatus(s);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  if (!slug) {
    return <div className="kma-preview kma-preview--empty">Save the screen (with a slug) to see its live preview here.</div>;
  }

  const send = (cmd: string) => frameRef.current?.contentWindow?.postMessage({ kmaPreview: cmd }, "*");
  const src = `/display/${slug}?preview=1${includeHidden ? "&all=1" : ""}&r=${reloadKey}`;

  return (
    <div className="kma-preview">
      <div className="kma-preview__head">
        <span className="kma-preview__title">🖥️ Live preview</span>
        <span className="kma-preview__status">
          {status && status.total > 0
            ? `Slide ${status.index + 1} of ${status.total} — ${status.label} · ${status.secondsLeft}s left of ${status.duration}s`
            : "Playing the prayer board (no slides yet, or loading…)"}
        </span>
      </div>

      <div className="kma-preview__bar">
        <div className="kma-preview__controls">
          <button type="button" onClick={() => send("prev")} title="Previous slide">⏮</button>
          <button
            type="button"
            onClick={() => {
              send(paused ? "play" : "pause");
              setPaused(!paused);
            }}
            title={paused ? "Play" : "Pause"}
          >
            {paused ? "▶" : "⏸"}
          </button>
          <button type="button" onClick={() => send("next")} title="Next slide">⏭</button>
          <button
            type="button"
            onClick={() => {
              send("restart");
              setPaused(false);
            }}
            title="Restart the loop"
          >
            ↺
          </button>
          <button
            type="button"
            className="kma-preview__refresh"
            onClick={() => {
              setReloadKey((k) => k + 1);
              setPaused(false);
              setStatus(null);
            }}
            title="Reload the preview"
          >
            Refresh
          </button>
        </div>

        <div className="kma-preview__opts">
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={s.key === size.key ? "is-on" : ""}
              onClick={() => setSize(s)}
            >
              {s.label}
            </button>
          ))}
          <label className="kma-preview__hidden">
            <input type="checkbox" checked={includeHidden} onChange={(e) => setIncludeHidden(e.target.checked)} />
            Include hidden slides
          </label>
        </div>
      </div>

      <div className="kma-preview__stage" ref={wrapRef} style={{ height: size.h * scale }}>
        <iframe
          key={`${size.key}-${includeHidden}-${reloadKey}`}
          ref={frameRef}
          className="kma-preview__frame"
          src={src}
          title="Screen preview"
          style={{ width: size.w, height: size.h, transform: `scale(${scale})` }}
        />
      </div>

      <p className="kma-preview__note">
        This is the real screen page, shown at {size.w}×{size.h}. Saved changes appear here within a few seconds —
        after editing slides, press <b>Save</b> above, and the preview updates itself. Tick “Include hidden slides” to
        check a slide before switching it on for the mosque.
      </p>
    </div>
  );
}
