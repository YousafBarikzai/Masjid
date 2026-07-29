"use client";

import { useEffect, useState } from "react";
import { useFormFields } from "@payloadcms/ui";
import "./screen-link.css";

/** True after first client render — the URL needs window.location.origin, so
 *  rendering it only after mount keeps server and client HTML identical. */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/* The screen's unique URL, front and centre. Every TV plays exactly one
   address — /display/<slug> — so both the edit screen and the list show it
   ready to copy or open. The link derives live from the slug field, so a
   brand-new screen shows its link the moment the slug is typed. */

function buildUrl(slug: unknown): string {
  if (typeof window === "undefined" || !slug || typeof slug !== "string") return "";
  return `${window.location.origin}/display/${slug}`;
}

function CopyButton({ url, small }: { url: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`kma-screenlink__copy${small ? " kma-screenlink__copy--small" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard
          .writeText(url)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          })
          .catch(() => {});
      }}
    >
      {copied ? "✓ Copied" : "Copy link"}
    </button>
  );
}

/** Edit view: a labelled bar with the URL, copy and open actions. */
export function ScreenLinkField() {
  const mounted = useMounted();
  const slug = useFormFields(([fields]) => fields?.slug?.value as string | undefined);
  const url = mounted ? buildUrl(slug) : "";
  if (!mounted) return <div className="kma-screenlink kma-screenlink--empty" aria-hidden />;
  if (!url) {
    return (
      <div className="kma-screenlink kma-screenlink--empty">
        This screen&apos;s unique link appears here once the slug below is filled in.
      </div>
    );
  }
  return (
    <div className="kma-screenlink">
      <span className="kma-screenlink__label">📺 This screen&apos;s link</span>
      <code className="kma-screenlink__url">{url}</code>
      <span className="kma-screenlink__actions">
        <CopyButton url={url} />
        <a className="kma-screenlink__open" href={url} target="_blank" rel="noopener noreferrer">
          Open ↗
        </a>
      </span>
      <span className="kma-screenlink__hint">
        Open this address in the TV&apos;s browser (full screen) — that&apos;s the whole setup. You can also send it to
        whoever looks after the TV.
      </span>
    </div>
  );
}

/** List view cell: the same link on the Digital Screens overview. */
export function ScreenLinkCell({ rowData }: { rowData?: { slug?: string } }) {
  const mounted = useMounted();
  const url = mounted ? buildUrl(rowData?.slug) : "";
  if (!url) return null;
  return (
    <span className="kma-screenlink__cell" onClick={(e) => e.stopPropagation()}>
      <code className="kma-screenlink__cellurl">/display/{rowData!.slug}</code>
      <CopyButton url={url} small />
      <a
        className="kma-screenlink__open kma-screenlink__open--small"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open ↗
      </a>
    </span>
  );
}
