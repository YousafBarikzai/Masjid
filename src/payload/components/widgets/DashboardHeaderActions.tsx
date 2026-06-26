"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconPlus } from "../icons";
import { collectionHref } from "../destinations";

/* The greeting-row actions: a notifications bell (→ unread messages) and a Create
   button that opens the ⌘K command palette via a window event. */

export function DashboardHeaderActions({ unread = 0 }: { unread?: number }) {
  const router = useRouter();
  return (
    <div className="kma-top__actions">
      <button
        type="button"
        className="kma-iconbtn"
        aria-label="Notifications"
        onClick={() => router.push(`${collectionHref("contact-submissions")}?where[handled][equals]=false`)}
      >
        <IconBell size={18} />
        {unread > 0 && <span className="kma-iconbtn__dot" aria-hidden />}
      </button>
      <button
        type="button"
        className="kma-createbtn"
        onClick={() => window.dispatchEvent(new CustomEvent("kma:palette"))}
      >
        <IconPlus size={16} />
        <span>Create</span>
      </button>
    </div>
  );
}
