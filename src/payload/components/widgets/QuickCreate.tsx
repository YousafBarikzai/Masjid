import React from "react";
import Link from "next/link";
import { createHref } from "../destinations";
import { IconDoc, IconBell, IconCalendar, IconBroadcast } from "../icons";

/* The "Quick create" card — a row of create shortcuts, role-gated. The last
   (Broadcast) is rendered as the filled primary action, matching the design. */

const EDITOR = ["super-admin", "admin", "editor"];

const ITEMS: { label: string; href: string; icon: React.ReactNode; primary?: boolean }[] = [
  { label: "News post", href: createHref("posts"), icon: <IconDoc size={16} /> },
  { label: "Announcement", href: createHref("announcements"), icon: <IconBell size={16} /> },
  { label: "Event", href: createHref("events"), icon: <IconCalendar size={16} /> },
  { label: "Page", href: createHref("pages"), icon: <IconDoc size={16} /> },
  { label: "Broadcast", href: createHref("broadcasts"), icon: <IconBroadcast size={16} />, primary: true },
];

export function QuickCreate({ roles }: { roles: string[] }) {
  const canEdit = roles?.some((r) => EDITOR.includes(r));
  if (!canEdit) return null;
  return (
    <section className="kma-panel">
      <h3 className="kma-panel__title">Quick create</h3>
      <div className="kma-qc">
        {ITEMS.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className={`kma-qc__btn${it.primary ? " kma-qc__btn--primary" : ""}`}
          >
            {it.icon}
            <span>{it.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
