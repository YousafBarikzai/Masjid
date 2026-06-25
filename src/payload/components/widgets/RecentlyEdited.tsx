import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { WidgetCard } from "../WidgetCard";
import { IconClock } from "../icons";
import { docHref } from "../destinations";

/* Server component: the most recently edited content across collections, so an editor
   can jump straight back to what they (or a colleague) just touched. Each collection
   is queried independently (Promise.allSettled) so one failing never empties the list. */

const COLS: { slug: string; field: string; label: string }[] = [
  { slug: "pages", field: "title", label: "Page" },
  { slug: "posts", field: "title", label: "Post" },
  { slug: "events", field: "title", label: "Event" },
  { slug: "announcements", field: "message", label: "Announcement" },
  { slug: "services", field: "title", label: "Service" },
  { slug: "classes", field: "title", label: "Class" },
];

function fmt(updatedAt?: string): string {
  if (!updatedAt) return "";
  try {
    const d = new Date(updatedAt);
    const diff = Date.now() - d.getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export async function RecentlyEdited({ payload }: { payload: Payload }) {
  try {
    const settled = await Promise.allSettled(
      COLS.map((c) =>
        payload
          .find({ collection: c.slug, sort: "-updatedAt", limit: 3, depth: 0, overrideAccess: true })
          .then((res) =>
            res.docs.map((d: any) => ({
              slug: c.slug,
              id: d.id,
              label: c.label,
              title: String(d[c.field] ?? d.title ?? d.name ?? `#${d.id}`),
              updatedAt: d.updatedAt as string | undefined,
            })),
          ),
      ),
    );
    const items = settled
      .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
      .sort((a, b) => (String(b.updatedAt) > String(a.updatedAt) ? 1 : -1))
      .slice(0, 7);
    if (!items.length) return null;
    return (
      <WidgetCard title="Recently edited" icon={<IconClock />}>
        <div className="kma-list">
          {items.map((it) => (
            <Link key={`${it.slug}:${it.id}`} className="kma-row" href={docHref(it.slug, it.id)}>
              <span className="kma-row__main">
                <span className="kma-row__title">{it.title}</span>
                <span className="kma-row__meta">
                  {it.label}
                  {fmt(it.updatedAt) ? ` · ${fmt(it.updatedAt)}` : ""}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
