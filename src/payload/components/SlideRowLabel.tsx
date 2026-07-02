"use client";

import React from "react";
import { useRowLabel } from "@payloadcms/ui";

/* Collapsed-row label for a screen playlist slide: shows the slide type, its
   title, how long it stays on screen, and whether it's hidden — so the whole
   playlist reads at a glance, MasjidBox-style. */

type SlideRow = {
  type?: string;
  duration?: number;
  enabled?: boolean;
  heading?: string;
  label?: string;
  url?: string;
};

const TYPE_META: Record<string, { icon: string; name: string }> = {
  "prayer-board": { icon: "🕌", name: "Prayer times board" },
  announcement: { icon: "📢", name: "Announcement" },
  image: { icon: "🖼️", name: "Picture" },
  qr: { icon: "🔳", name: "QR code" },
};

export const SlideRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<SlideRow>();
  const meta = TYPE_META[data?.type ?? ""] ?? { icon: "▦", name: "Slide" };
  const title = data?.heading || data?.label || data?.url || "";
  const secs = data?.duration ?? 10;
  const hidden = data?.enabled === false;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, opacity: hidden ? 0.55 : 1 }}>
      <span aria-hidden>{meta.icon}</span>
      <strong>{meta.name}</strong>
      {title ? <span style={{ opacity: 0.75 }}>— {title.length > 42 ? title.slice(0, 42) + "…" : title}</span> : null}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "1px 8px",
          borderRadius: 999,
          background: "rgba(201,162,39,.18)",
          color: "inherit",
        }}
      >
        {secs}s
      </span>
      {hidden ? (
        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", opacity: 0.7 }}>
          hidden
        </span>
      ) : null}
      <span style={{ opacity: 0.4, fontSize: 11 }}>#{(rowNumber ?? 0) + 1}</span>
    </span>
  );
};
