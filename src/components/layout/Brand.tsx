import Link from "next/link";
import { site } from "@/lib/content";

/**
 * Kingston Muslim Association logo lockup — navy "IN" monogram + stacked
 * wordmark, matching the official logo. Used in the header (navy on light) and
 * footer (gold/cream on dark, via `light`).
 *
 * NOTE: this is a faithful vector recreation. To use the exact official asset,
 * drop the file in /public (e.g. public/kma-logo.svg) and swap this for
 * <img src="/kma-logo.svg" alt="Kingston Muslim Association" />.
 */
export default function Brand({ light = false }: { light?: boolean }) {
  const primary = light ? "#e8d59a" : "#21407c";
  const sub = light ? "rgba(255,255,255,0.82)" : "#21407c";
  return (
    <Link className="brand" href="/" aria-label={`${site.org} — home`} style={{ gap: 11 }}>
      <svg
        width="42"
        height="36"
        viewBox="0 0 64 54"
        aria-hidden="true"
        style={{ flex: "none" }}
      >
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
