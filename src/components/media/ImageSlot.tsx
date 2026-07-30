"use client";

import { useState } from "react";
import { REMOTE_IMAGES } from "@/lib/remote-images";

// Try these extensions in order, so an editor can upload jpg/png/webp with the
// slot name and it just works.
const EXTS = ["jpg", "jpeg", "png", "webp"];

/**
 * Renders an image for a named slot, in order of preference:
 *   1. an uploaded file at /public/images/<slot>.<ext> — the mosque's own
 *      photo always wins;
 *   2. the slot's default mosque-themed photo (remote-images.ts);
 *   3. a clean, branded placeholder panel — never dev text or a broken image.
 * The filename to upload is kept in the title/aria-label for editors.
 */
export default function ImageSlot({
  slot,
  alt,
  ratio = "16 / 9",
  rounded = true,
  className,
}: {
  slot: string;
  alt: string;
  ratio?: string;
  rounded?: boolean;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const radius = rounded ? 14 : 0;

  const remote = REMOTE_IMAGES[slot];
  const sources = [...EXTS.map((ext) => `/images/${slot}.${ext}`), ...(remote ? [remote] : [])];

  if (i < sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sources[i]}
        alt={alt}
        loading="lazy"
        onError={() => setI((n) => n + 1)}
        className={className}
        style={{ width: "100%", aspectRatio: ratio, objectFit: "cover", borderRadius: radius, display: "block" }}
      />
    );
  }

  return (
    <div
      className={`img-slot ${className ?? ""}`}
      style={{ aspectRatio: ratio, borderRadius: radius }}
      role="img"
      aria-label={alt}
      title={`Add /public/images/${slot}.jpg`}
    >
      <svg viewBox="0 0 64 64" width="46" height="46" aria-hidden focusable="false">
        <g fill="currentColor">
          <path d="M32 13 Q21 23 21 35 L43 35 Q43 23 32 13 Z" />
          <rect x="21" y="35" width="22" height="16" rx="2" />
          <rect x="13" y="40" width="6" height="11" rx="1" />
          <rect x="45" y="40" width="6" height="11" rx="1" />
          <rect x="30.5" y="6" width="3" height="6" rx="1.5" />
          <circle cx="32" cy="5" r="2.4" />
        </g>
      </svg>
    </div>
  );
}
