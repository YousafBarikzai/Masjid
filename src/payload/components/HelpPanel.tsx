"use client";

import React, { useEffect, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import { HELP_CONTENT, type HelpEntry } from "../help-content";
import "./help-panel.css";

/* A friendly, collapsible "how to use this page" panel. Registered (via the same
   importMap entry) on every collection's list + edit views and every global's edit
   view; it reads the current slug to show the right guidance, and renders nothing
   for slugs without authored help. Collapse state persists in localStorage and is
   applied only after mount, so SSR and first client paint always agree. */

const STORAGE_KEY = "kma:help:collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function HelpPanel(props: { collectionSlug?: string; globalSlug?: string }) {
  // useDocumentInfo covers the globals case (no slug prop there); props win when present.
  const docInfo = useDocumentInfo?.() as
    | { collectionSlug?: string; globalSlug?: string }
    | undefined;

  const slug =
    props.collectionSlug ?? props.globalSlug ?? docInfo?.collectionSlug ?? docInfo?.globalSlug;

  const entry: HelpEntry | undefined = slug ? HELP_CONTENT[slug] : undefined;

  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
    setMounted(true);
  }, []);

  if (!entry) return null;

  const isCollapsed = mounted && collapsed;

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* storage blocked — keep in-memory */
    }
  };

  return (
    <aside className="kma-help" data-kma-help data-collapsed={isCollapsed ? "1" : "0"}>
      <button
        type="button"
        className="kma-help__header"
        aria-expanded={!isCollapsed}
        onClick={toggle}
      >
        <span className="kma-help__icon" aria-hidden>
          ?
        </span>
        <span className="kma-help__title">{entry.title}</span>
        <span className="kma-help__hint">How to use this page</span>
        <span className="kma-help__chevron" aria-hidden>
          {isCollapsed ? "▸" : "▾"}
        </span>
      </button>

      {!isCollapsed && (
        <div className="kma-help__body">
          <p className="kma-help__intro">{entry.intro}</p>
          {entry.steps.length > 0 && (
            <ol className="kma-help__steps">
              {entry.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          {entry.tip && (
            <p className="kma-help__tip">
              <strong>Tip:</strong> {entry.tip}
            </p>
          )}
        </div>
      )}
    </aside>
  );
}
