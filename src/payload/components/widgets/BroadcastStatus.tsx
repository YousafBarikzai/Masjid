import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { WidgetCard } from "../WidgetCard";
import { IconBroadcast } from "../icons";
import { collectionHref, createHref, docHref } from "../destinations";

/* Server component: surfaces the Broadcast Center — which channels are configured
   (so the mosque knows what still needs setting up) and the most recent broadcasts
   with their status. Reads process.env on the server; only the ready/not booleans
   reach the client, never any secret. */

const CHANNELS: { key: string; label: string; ready: () => boolean }[] = [
  { key: "email", label: "Email", ready: () => !!process.env.SMTP_HOST },
  {
    key: "telegram",
    label: "Telegram",
    ready: () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    ready: () =>
      !!(
        (process.env.WHATSAPP_GATEWAY_URL &&
          process.env.WHATSAPP_GATEWAY_SECRET &&
          process.env.WHATSAPP_GROUP_IDS) ||
        (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)
      ),
  },
  {
    key: "facebook",
    label: "Facebook",
    ready: () => !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN),
  },
  {
    key: "instagram",
    label: "Instagram",
    ready: () =>
      !!(
        process.env.INSTAGRAM_USER_ID &&
        (process.env.INSTAGRAM_TOKEN || process.env.FACEBOOK_PAGE_TOKEN)
      ),
  },
];

export async function BroadcastStatus({ payload }: { payload: Payload }) {
  try {
    const channels = CHANNELS.map((c) => ({ label: c.label, ready: c.ready() }));
    const readyCount = channels.filter((c) => c.ready).length;

    let recent: Array<{ id: string | number; title: string; status?: string }> = [];
    try {
      const res = await payload.find({
        collection: "broadcasts",
        sort: "-createdAt",
        limit: 3,
        depth: 0,
        overrideAccess: true,
      });
      recent = (res.docs as any[]).map((d) => ({
        id: d.id,
        title: d.title || "(untitled)",
        status: d.status,
      }));
    } catch {
      /* broadcasts collection optional */
    }

    return (
      <WidgetCard
        title="Broadcast Centre"
        icon={<IconBroadcast />}
        action={{ label: "New broadcast →", href: createHref("broadcasts") }}
      >
        <div className="kma-channels">
          {channels.map((c) => (
            <span
              key={c.label}
              className={`kma-channel${c.ready ? " is-ready" : ""}`}
              title={c.ready ? "Configured" : "Needs setup (add its keys to the environment)"}
            >
              <span className="kma-channel__dot" />
              {c.label}
            </span>
          ))}
        </div>
        <p className="kma-empty" style={{ padding: "2px" }}>
          {readyCount}/{channels.length} channels configured.{" "}
          <Link href={collectionHref("broadcasts")} className="kma-card__action">
            View all
          </Link>
        </p>
        {recent.length > 0 && (
          <div className="kma-list">
            {recent.map((b) => (
              <Link key={b.id} className="kma-row" href={docHref("broadcasts", b.id)}>
                <span className="kma-row__main">
                  <span className="kma-row__title">{b.title}</span>
                </span>
                <span className={`kma-badge${b.status === "sent" ? " kma-badge--sent" : ""}`}>
                  {b.status === "sent" ? "Sent" : "Draft"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
