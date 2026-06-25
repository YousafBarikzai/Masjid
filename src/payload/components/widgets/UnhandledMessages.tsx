import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { WidgetCard } from "../WidgetCard";
import { IconInbox } from "../icons";
import { collectionHref } from "../destinations";

/* Server component: a gold callout when contact-form messages are waiting. Renders
   nothing when the inbox is clear. */

export async function UnhandledMessages({ payload }: { payload: Payload }) {
  try {
    const { totalDocs } = await payload.count({
      collection: "contact-submissions",
      where: { handled: { equals: false } },
      overrideAccess: true,
    });
    if (!totalDocs) return null;
    const href = `${collectionHref("contact-submissions")}?where[handled][equals]=false`;
    return (
      <WidgetCard
        title="Messages"
        icon={<IconInbox />}
        className="kma-card--alert"
        action={{ label: "Review →", href }}
      >
        <div className="kma-alert">
          <span className="kma-alert__count">{totalDocs}</span>
          <span>{totalDocs === 1 ? "new message" : "new messages"} awaiting a reply.</span>
        </div>
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
