import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { docHref, collectionHref } from "../destinations";
import { IconDoc, IconBell, IconCalendar, IconBook } from "../icons";

/* The "Recent content" panel — the latest items across content collections, each
   with a type, a status badge (Published / Live / Draft) and a relative time. */

const COLS: { slug: string; field: string; type: string; icon: React.ReactNode }[] = [
  { slug: "posts", field: "title", type: "News", icon: <IconBell size={15} /> },
  { slug: "announcements", field: "message", type: "Announcement", icon: <IconBell size={15} /> },
  { slug: "events", field: "title", type: "Event", icon: <IconCalendar size={15} /> },
  { slug: "pages", field: "title", type: "Page", icon: <IconDoc size={15} /> },
  { slug: "classes", field: "title", type: "Class", icon: <IconBook size={15} /> },
  { slug: "services", field: "title", type: "Service", icon: <IconDoc size={15} /> },
];

function ago(iso?: string): string {
  if (!iso) return "";
  try {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function statusOf(slug: string, d: any): { label: string; cls: string } {
  if (slug === "announcements") return d.enabled ? { label: "Live", cls: "live" } : { label: "Off", cls: "draft" };
  if (d._status === "draft") return { label: "Draft", cls: "draft" };
  if (d._status === "published") return { label: "Published", cls: "published" };
  return { label: "Published", cls: "published" };
}

export async function RecentContent({ payload }: { payload: Payload }) {
  try {
    const settled = await Promise.allSettled(
      COLS.map((c) =>
        payload
          .find({ collection: c.slug, sort: "-updatedAt", limit: 3, depth: 0, overrideAccess: true })
          .then((res) =>
            res.docs.map((d: any) => ({
              slug: c.slug,
              type: c.type,
              icon: c.icon,
              id: d.id,
              title: String(d[c.field] ?? d.title ?? `#${d.id}`).slice(0, 70),
              updatedAt: d.updatedAt as string | undefined,
              status: statusOf(c.slug, d),
            })),
          ),
      ),
    );
    const items = settled
      .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
      .sort((a, b) => (String(b.updatedAt) > String(a.updatedAt) ? 1 : -1))
      .slice(0, 5);
    if (!items.length) return null;

    return (
      <section className="kma-panel">
        <header className="kma-panel__head">
          <h3 className="kma-panel__title">Recent content</h3>
          <Link href={collectionHref("posts")} className="kma-section__link">
            Open News →
          </Link>
        </header>
        <div className="kma-recent">
          {items.map((it) => (
            <Link key={`${it.slug}:${it.id}`} href={docHref(it.slug, it.id)} className="kma-recent__row">
              <span className="kma-recent__icon">{it.icon}</span>
              <span className="kma-recent__main">
                <span className="kma-recent__title">{it.title}</span>
                <span className="kma-recent__meta">{it.type}</span>
              </span>
              <span className={`kma-pill kma-pill--${it.status.cls}`}>{it.status.label}</span>
              <span className="kma-recent__time">{ago(it.updatedAt)}</span>
            </Link>
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}
