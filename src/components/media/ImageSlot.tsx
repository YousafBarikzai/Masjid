"use client";

import { useState } from "react";

/**
 * Renders an image from /public/images/<slot>.jpg. Until that file exists it
 * shows a clean, branded placeholder panel (a muted mosque emblem) so the live
 * site looks intentional — never dev text or a broken image. The exact filename
 * to upload is kept in the title attribute (and aria-label) for editors.
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
  const [ok, setOk] = useState(true);
  const radius = rounded ? 14 : 0;

  if (ok) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/images/${slot}.jpg`}
        alt={alt}
        onError={() => setOk(false)}
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
