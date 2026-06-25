import React from "react";
import Link from "next/link";
import { WidgetCard } from "../WidgetCard";
import { IconPlus, IconDoc, IconCalendar, IconBell, IconBroadcast } from "../icons";
import { createHref } from "../destinations";

/* Server component: a grid of "create new" shortcuts, filtered to the roles the
   signed-in user actually has. Server access control still enforces on save — this
   is UI-only so people aren't shown buttons that would 403. Each link opens a blank
   create form (no auto-save), so no afterChange side-effects fire until the user saves. */

const EDITOR = ["super-admin", "admin", "editor"];
const PRAYER = ["super-admin", "admin", "prayer-times-manager"];

const ACTIONS: { label: string; href: string; roles: string[]; icon: React.ReactNode }[] = [
  { label: "News post", href: createHref("posts"), roles: EDITOR, icon: <IconDoc /> },
  { label: "Event", href: createHref("events"), roles: EDITOR, icon: <IconCalendar /> },
  { label: "Page", href: createHref("pages"), roles: EDITOR, icon: <IconDoc /> },
  { label: "Announcement", href: createHref("announcements"), roles: EDITOR, icon: <IconBell /> },
  { label: "Broadcast", href: createHref("broadcasts"), roles: EDITOR, icon: <IconBroadcast /> },
  { label: "Prayer day", href: createHref("prayer-days"), roles: PRAYER, icon: <IconCalendar /> },
];

export function QuickActions({ roles }: { roles: string[] }) {
  const list = roles?.length ? roles : [];
  const allowed = ACTIONS.filter((a) => a.roles.some((r) => list.includes(r)));
  if (!allowed.length) return null;
  return (
    <WidgetCard title="Quick actions" icon={<IconPlus />}>
      <div className="kma-actions">
        {allowed.map((a) => (
          <Link key={a.label} className="kma-action" href={a.href}>
            {a.icon}
            <span>{a.label}</span>
          </Link>
        ))}
      </div>
    </WidgetCard>
  );
}
