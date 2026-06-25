import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { WidgetCard } from "../WidgetCard";
import { IconDoc } from "../icons";
import { docHref } from "../destinations";

/* Server component: unpublished drafts awaiting attention. Only `pages` and `posts`
   have drafts enabled, so only those are queried. Renders nothing when there are none. */

export async function PendingDrafts({ payload }: { payload: Payload }) {
  try {
    const q = (collection: "pages" | "posts") =>
      payload.find({
        collection,
        where: { _status: { equals: "draft" } },
        sort: "-updatedAt",
        limit: 5,
        depth: 0,
        overrideAccess: true,
      });
    const [pages, posts] = await Promise.all([q("pages"), q("posts")]);
    const items = [
      ...pages.docs.map((d: any) => ({ slug: "pages", id: d.id, title: d.title || "(untitled page)" })),
      ...posts.docs.map((d: any) => ({ slug: "posts", id: d.id, title: d.title || "(untitled post)" })),
    ].slice(0, 6);
    if (!items.length) return null;
    return (
      <WidgetCard title="Pending drafts" icon={<IconDoc />}>
        <div className="kma-list">
          {items.map((it) => (
            <Link key={`${it.slug}:${it.id}`} className="kma-row" href={docHref(it.slug, it.id)}>
              <span className="kma-row__icon"><IconDoc size={16} /></span>
              <span className="kma-row__main">
                <span className="kma-row__title">{it.title}</span>
              </span>
              <span className="kma-badge kma-badge--draft">Draft</span>
            </Link>
          ))}
        </div>
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
