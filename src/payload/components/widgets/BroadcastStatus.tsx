import React from "react";
import Link from "next/link";
import type { Payload } from "payload";
import { IconBroadcast, IconReturn, IconPlus } from "../icons";
import { createHref } from "../destinations";

/* Server component: the Broadcast Centre card — how many channels are configured,
   per-channel readiness dots, the last broadcast sent, and a New broadcast button.
   Reads process.env on the server; only ready/not booleans reach the client. */

const CHANNELS: { key: string; label: string; ready: () => boolean }[] = [
  { key: "email", label: "Email", ready: () => !!process.env.SMTP_HOST },
  { key: "whatsapp", label: "WhatsApp", ready: () =>
      !!((process.env.WHATSAPP_GATEWAY_URL && process.env.WHATSAPP_GATEWAY_SECRET && process.env.WHATSAPP_GROUP_IDS) ||
        (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)) },
  { key: "telegram", label: "Telegram", ready: () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) },
  { key: "facebook", label: "Facebook", ready: () => !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN) },
  { key: "instagram", label: "Instagram", ready: () =>
      !!(process.env.INSTAGRAM_USER_ID && (process.env.INSTAGRAM_TOKEN || process.env.FACEBOOK_PAGE_TOKEN)) },
];

function ago(iso?: string): string {
  if (!iso) return "";
  try {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export async function BroadcastStatus({ payload }: { payload: Payload }) {
  try {
    const channels = CHANNELS.map((c) => ({ label: c.label, ready: c.ready() }));
    const ready = channels.filter((c) => c.ready).length;

    let last: { title: string; sentAt?: string } | null = null;
    try {
      const res = await payload.find({
        collection: "broadcasts",
        where: { status: { equals: "sent" } },
        sort: "-sentAt",
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const d = (res.docs as any[])[0];
      if (d) last = { title: d.title, sentAt: d.sentAt };
    } catch {
      /* optional */
    }

    return (
      <section className="kma-card kma-bc">
        <header className="kma-card__head">
          <span className="kma-card__title">
            <IconBroadcast size={15} /> Broadcast centre
          </span>
          <span className="kma-bc__count">
            {ready} / {channels.length} connected
          </span>
        </header>

        <div className="kma-bc__chips">
          {channels.map((c) => (
            <span key={c.label} className={`kma-bc__chip${c.ready ? " is-ready" : ""}`}>
              <span className="kma-bc__dot" />
              {c.label}
            </span>
          ))}
        </div>

        {last && (
          <div className="kma-bc__last">
            <IconReturn size={15} />
            <span>
              <strong>Last sent · {last.title}</strong>
              <span className="kma-bc__lastsub">{ago(last.sentAt)}</span>
            </span>
          </div>
        )}

        <Link href={createHref("broadcasts")} className="kma-bc__btn">
          <IconPlus size={15} /> New broadcast
        </Link>
      </section>
    );
  } catch {
    return null;
  }
}
