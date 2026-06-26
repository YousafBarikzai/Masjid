import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { collectionHref } from "../destinations";
import { IconInbox, IconDoc, IconBell, IconClock } from "../icons";

/* The "Needs your attention" row — four colour-accented status cards that surface
   what the mosque team should act on now. All counts are server-queried and each
   query is guarded so one failure leaves the others intact. */

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  try {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.ceil(ms / 86400000);
  } catch {
    return null;
  }
}

export async function AttentionCards({ payload }: { payload: Payload }) {
  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  const [unread, submissions, expiring, drafts] = await Promise.all([
    // Unread contact messages
    safe(
      () =>
        payload.count({
          collection: "contact-submissions",
          where: { handled: { equals: false } },
          overrideAccess: true,
        }),
      { totalDocs: 0 },
    ),
    // Form submissions (total)
    safe(
      () =>
        payload.count({
          collection: "form-submissions" as never,
          overrideAccess: true,
        }),
      { totalDocs: 0 },
    ),
    // Soonest-expiring active announcement
    safe(
      () =>
        payload
          .find({
            collection: "announcements",
            where: {
              and: [{ enabled: { equals: true } }, { endDate: { exists: true } }],
            },
            sort: "endDate",
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })
          .then((r) => r.docs as any[]),
      [] as any[],
    ),
    // Drafts across pages + posts
    safe(async () => {
      const [p, n] = await Promise.all([
        payload.count({ collection: "pages", where: { _status: { equals: "draft" } }, overrideAccess: true }),
        payload.count({ collection: "posts", where: { _status: { equals: "draft" } }, overrideAccess: true }),
      ]);
      return p.totalDocs + n.totalDocs;
    }, 0),
  ]);

  const expDoc = (expiring as any[])[0];
  const expDays = expDoc ? daysUntil(expDoc.endDate) : null;
  const expiringSoon = expDoc && expDays !== null && expDays >= 0 && expDays <= 14;

  const cards: React.ReactNode[] = [];

  cards.push(
    <Link key="msg" href={`${collectionHref("contact-submissions")}?where[handled][equals]=false`} className="kma-att kma-att--red">
      <span className="kma-att__head"><IconInbox size={16} /> Unread messages</span>
      <span className="kma-att__big">{unread.totalDocs}</span>
      <span className="kma-att__sub">{unread.totalDocs ? "Awaiting a reply" : "Inbox is clear"}</span>
      <span className="kma-att__cta">Review inbox →</span>
    </Link>,
  );

  cards.push(
    <Link key="forms" href={collectionHref("form-submissions")} className="kma-att kma-att--green">
      <span className="kma-att__head"><IconDoc size={16} /> Form submissions</span>
      <span className="kma-att__big">{submissions.totalDocs}</span>
      <span className="kma-att__sub">{submissions.totalDocs ? "Enquiries & requests" : "No submissions yet"}</span>
      <span className="kma-att__cta">Open submissions →</span>
    </Link>,
  );

  if (expiringSoon) {
    cards.push(
      <Link key="exp" href={collectionHref("announcements")} className="kma-att kma-att--gold">
        <span className="kma-att__head"><IconClock size={16} /> Expiring soon</span>
        <span className="kma-att__title">{expDoc.message?.slice(0, 48) || "Announcement"}</span>
        <span className="kma-att__sub">
          {expDays === 0 ? "Goes offline today" : `Goes offline in ${expDays} day${expDays === 1 ? "" : "s"}`}
        </span>
        <span className="kma-att__cta">Extend or edit →</span>
      </Link>,
    );
  }

  cards.push(
    <Link key="drafts" href={collectionHref("pages")} className="kma-att">
      <span className="kma-att__head"><IconBell size={16} /> Drafts</span>
      <span className="kma-att__big">{drafts}</span>
      <span className="kma-att__sub">{drafts ? "Unpublished work" : "Nothing in progress"}</span>
      <span className="kma-att__cta">Continue editing →</span>
    </Link>,
  );

  return (
    <section className="kma-attention">
      <header className="kma-section__head">
        <h3 className="kma-section__title">Needs your attention</h3>
        <Link href={collectionHref("audit-log")} className="kma-section__link">
          View all activity →
        </Link>
      </header>
      <div className="kma-attention__row">{cards}</div>
    </section>
  );
}
