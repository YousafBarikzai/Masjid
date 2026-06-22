"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/content";

/**
 * Site logo. Shows the official Kingston Muslim Association artwork from
 * /public/kma-logo.png exactly as supplied (no modification). Until that file
 * is uploaded it falls back to a vector stand-in so the header/footer never
 * break. To use the official file: add it to /public as `kma-logo.png`.
 */
export default function Brand({ light = false }: { light?: boolean }) {
  const [imgOk, setImgOk] = useState(true);
  const primary = light ? "#e8d59a" : "#21407c";
  const sub = light ? "rgba(255,255,255,0.82)" : "#21407c";

  if (imgOk) {
    return (
      <Link className="brand" href="/" aria-label={`${site.org} — home`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kma-logo.png"
          alt={site.org}
          onError={() => setImgOk(false)}
          style={
            light
              ? // On the dark footer, sit the logo on a small white panel so it stays visible.
                { height: 38, width: "auto", display: "block", background: "#fff", padding: "7px 11px", borderRadius: 8 }
              : { height: 46, width: "auto", display: "block" }
          }
        />
      </Link>
    );
  }

  // Fallback vector stand-in (used only until /public/kma-logo.png exists).
  return (
    <Link className="brand" href="/" aria-label={`${site.org} — home`} style={{ gap: 11 }}>
      <svg width="42" height="36" viewBox="0 0 64 54" aria-hidden="true" style={{ flex: "none" }}>
        <g fill={primary}>
          <rect x="0" y="5" width="13" height="44" rx="1" />
          <rect x="22" y="5" width="13" height="44" rx="1" />
          <rect x="51" y="5" width="13" height="44" rx="1" />
          <polygon points="22,5 35,5 64,49 51,49" />
        </g>
      </svg>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.02, color: primary }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 700, letterSpacing: "0.01em" }}>KINGSTON</span>
        <span style={{ fontSize: "1.28rem", fontWeight: 800, letterSpacing: "0.004em", margin: "1px 0" }}>
          MUSLIM
        </span>
        <span style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.33em", color: sub }}>
          ASSOCIATION
        </span>
      </span>
    </Link>
  );
}
