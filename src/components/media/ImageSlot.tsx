"use client";

import { useState } from "react";

/**
 * Renders an image from /public/images/<slot>.jpg. Until that file exists it
 * shows a labelled placeholder telling the editor exactly which existing-site
 * image to drop in. Lets the layout stay image-led without inventing photos.
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
    <div className={`img-slot ${className ?? ""}`} style={{ aspectRatio: ratio, borderRadius: radius }}>
      <span className="img-slot-ic" aria-hidden>
        🖼️
      </span>
      <b>{alt}</b>
      <small>
        Add <code>/public/images/{slot}.jpg</code>
      </small>
    </div>
  );
}
