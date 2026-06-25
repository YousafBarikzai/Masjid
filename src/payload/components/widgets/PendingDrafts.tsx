import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { WidgetCard } from "../WidgetCard";
import { IconDoc } from "../icons";
import { docHref } from "../destinations";

/* Server component: the drafts & editorial review queue. Only `pages` and `posts` have
   drafts + the review workflow enabled, so only those are queried. Items submitted
   "Ready for review" are surfaced first with a gold badge so editors can act on them.
   Renders nothing when there's nothing pending. */

export async function PendingDrafts({ payload }: { payload: Payload }) {
  try {
    const q = (collection: "pages" | "posts") =>
      payload.find({
        collection,
        where: {
          or: [{ _status: { equals: "draft" } }, { reviewStatus: { equals: "in-review" } }],
        },
        sort: "-updatedAt",
        limit: 6,
        depth: 0,
        overrideAccess: true,
      });
    const [pages, posts] = await Promise.all([q("pages"), q("posts")]);
    const map = (slug: "pages" | "posts") => (d: any) => ({
      slug,
      id: d.id,
      title: d.title || `(untitled ${slug === "pages" ? "page" : "post"})`,
      inReview: d.reviewStatus === "in-review",
    });
    const items = [...pages.docs.map(map("pages")), ...posts.docs.map(map("posts"))]
      // review queue first, then plain drafts
      .sort((a, b) => Number(b.inReview) - Number(a.inReview))
      .slice(0, 6);
    if (!items.length) return null;
    const awaiting = items.filter((i) => i.inReview).length;
    return (
      <WidgetCard
        title={awaiting ? `Review queue · ${awaiting}` : "Pending drafts"}
        icon={<IconDoc />}
      >
        <div className="kma-list">
          {items.map((it) => (
            <Link key={`${it.slug}:${it.id}`} className="kma-row" href={docHref(it.slug, it.id)}>
              <span className="kma-row__icon">
                <IconDoc size={16} />
              </span>
              <span className="kma-row__main">
                <span className="kma-row__title">{it.title}</span>
              </span>
              {it.inReview ? (
                <span className="kma-badge kma-badge--review">Review</span>
              ) : (
                <span className="kma-badge kma-badge--draft">Draft</span>
              )}
            </Link>
          ))}
        </div>
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
