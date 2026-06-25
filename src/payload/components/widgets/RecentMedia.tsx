import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { WidgetCard } from "../WidgetCard";
import { IconDoc } from "../icons";
import { collectionHref, docHref } from "../destinations";

/* Server component: the latest items in the media library, as a strip of thumbnails.
   Images show their small variant; non-images (PDFs) show a document chip. */

export async function RecentMedia({ payload }: { payload: Payload }) {
  try {
    const res = await payload.find({
      collection: "media",
      sort: "-createdAt",
      limit: 8,
      depth: 0,
      overrideAccess: true,
    });
    const items = (res.docs as any[]).filter(Boolean);
    if (!items.length) return null;
    return (
      <WidgetCard
        title="Recent media"
        icon={<IconDoc />}
        className="kma-grid__wide"
        action={{ label: "Open library →", href: collectionHref("media") }}
      >
        <div className="kma-media">
          {items.map((m) => {
            const isImage = typeof m.mimeType === "string" && m.mimeType.startsWith("image");
            const thumb = m?.sizes?.thumbnail?.url || m.url;
            const label = m.alt || m.filename || "media";
            return (
              <Link
                key={m.id}
                className="kma-media__item"
                href={docHref("media", m.id)}
                title={label}
              >
                {isImage && thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={label} loading="lazy" />
                ) : (
                  <span className="kma-media__file">
                    <IconDoc size={22} />
                    <span>{(m.filename || "file").split(".").pop()?.toUpperCase()}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
