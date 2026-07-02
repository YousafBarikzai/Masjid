import "server-only";
import type { Payload } from "payload";
import type { BroadcastInput, ChannelId, ChannelResult } from "./types";

export type { BroadcastInput, ChannelId, ChannelResult } from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Fan a single composed message out to the selected channels. Every adapter is
 * env-gated and fail-tolerant: an unconfigured channel reports "skipped" and a
 * failing channel reports "failed" — neither blocks the others. Credentials and
 * target IDs come from env (same pattern as SMTP/S3), so secrets never sit in
 * the database.
 */
export async function runBroadcast(
  payload: Payload,
  input: BroadcastInput,
  channels: ChannelId[],
): Promise<ChannelResult[]> {
  const results: ChannelResult[] = [];
  if (channels.includes("push")) results.push(await sendPush(payload, input));
  if (channels.includes("email")) results.push(await sendEmail(payload, input));
  if (channels.includes("telegram")) results.push(await sendTelegram(input));
  if (channels.includes("whatsapp")) results.push(await sendWhatsApp(payload, input));
  if (channels.includes("facebook")) results.push(await sendFacebook(input));
  if (channels.includes("instagram")) results.push(await sendInstagram(input));
  return results;
}

/* ------------------------- App notification (push) ------------------------ */
// Reaches everyone who installed the PWA / app and opted into notifications,
// via the same pipeline as published announcements (Web Push + Expo).
async function sendPush(payload: Payload, input: BroadcastInput): Promise<ChannelResult> {
  try {
    const { sendPushToAll } = await import("../push");
    const { sent } = await sendPushToAll(
      payload,
      { title: input.title, body: input.body, data: { type: "broadcast" } },
      "news",
    );
    return {
      channel: "push",
      status: sent ? "sent" : "skipped",
      detail: sent ? `${sent} device(s)` : "no subscribers",
      count: sent,
    };
  } catch (err) {
    return { channel: "push", status: "failed", detail: (err as Error).message };
  }
}

/* --------------------------------- Email ---------------------------------- */
// Reuses the site's existing nodemailer setup (SMTP_* env). Sends to opted-in
// subscribers individually so addresses are never exposed to each other.
async function sendEmail(payload: Payload, input: BroadcastInput): Promise<ChannelResult> {
  if (!process.env.SMTP_HOST) return { channel: "email", status: "skipped", detail: "SMTP not configured" };
  const subs = await payload.find({
    collection: "subscribers" as never,
    where: {
      and: [{ emailOptIn: { equals: true } }, { unsubscribed: { not_equals: true } }, { email: { exists: true } }],
    } as never,
    limit: 10000,
    depth: 0,
    overrideAccess: true,
  });
  const emails = (subs.docs as Array<{ email?: string }>).map((d) => d.email).filter((e): e is string => !!e);
  if (!emails.length) return { channel: "email", status: "skipped", detail: "no email subscribers" };

  let sent = 0;
  for (const to of emails) {
    try {
      await payload.sendEmail({ to, subject: input.title, text: input.body });
      sent++;
    } catch {
      /* keep going */
    }
  }
  return {
    channel: "email",
    status: sent ? "sent" : "failed",
    detail: `${sent}/${emails.length} emailed`,
    count: sent,
  };
}

/* -------------------------------- Telegram -------------------------------- */
// Official Bot API — posts straight into the mosque's Telegram group/channel.
async function sendTelegram(input: BroadcastInput): Promise<ChannelResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { channel: "telegram", status: "skipped", detail: "not configured" };

  try {
    const res = input.imageUrl
      ? await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, photo: input.imageUrl, caption: `${input.title}\n\n${input.body}` }),
        })
      : await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text: `${input.title}\n\n${input.body}` }),
        });
    if (!res.ok) return { channel: "telegram", status: "failed", detail: `HTTP ${res.status}` };
    return { channel: "telegram", status: "sent", detail: "posted to group/channel" };
  } catch (err) {
    return { channel: "telegram", status: "failed", detail: (err as Error).message };
  }
}

/* -------------------------------- WhatsApp -------------------------------- */
// WhatsApp Business Cloud API — broadcasts to opted-in subscribers. NOTE: free
// outside the 24h window only via an approved message template; plain text
// works inside a session window. See docs/BROADCAST.md.
async function sendWhatsApp(payload: Payload, input: BroadcastInput): Promise<ChannelResult> {
  // Preferred: self-hosted gateway that posts into the actual WhatsApp group(s).
  const gwUrl = process.env.WHATSAPP_GATEWAY_URL;
  const gwSecret = process.env.WHATSAPP_GATEWAY_SECRET;
  const groupIds = (process.env.WHATSAPP_GROUP_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (gwUrl && gwSecret && groupIds.length) {
    const text = `${input.title}\n\n${input.body}`;
    let sent = 0;
    for (const groupId of groupIds) {
      try {
        const r = await fetch(`${gwUrl.replace(/\/$/, "")}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${gwSecret}` },
          body: JSON.stringify({ groupId, text, imageUrl: input.imageUrl || undefined }),
        });
        if (r.ok) sent++;
      } catch {
        /* keep going */
      }
    }
    return {
      channel: "whatsapp",
      status: sent ? "sent" : "failed",
      detail: `${sent}/${groupIds.length} group(s) via gateway`,
      count: sent,
    };
  }

  // Fallback: official Cloud API broadcast to opted-in subscribers.
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return { channel: "whatsapp", status: "skipped", detail: "not configured" };

  const subs = await payload.find({
    collection: "subscribers" as never,
    where: {
      and: [{ whatsappOptIn: { equals: true } }, { unsubscribed: { not_equals: true } }, { whatsapp: { exists: true } }],
    } as never,
    limit: 10000,
    depth: 0,
    overrideAccess: true,
  });
  const numbers = (subs.docs as Array<{ whatsapp?: string }>)
    .map((d) => d.whatsapp?.replace(/[^\d]/g, ""))
    .filter((n): n is string => !!n);
  if (!numbers.length) return { channel: "whatsapp", status: "skipped", detail: "no WhatsApp subscribers" };

  let sent = 0;
  for (const to of numbers) {
    try {
      const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: `${input.title}\n\n${input.body}` },
        }),
      });
      if (res.ok) sent++;
    } catch {
      /* keep going */
    }
  }
  return {
    channel: "whatsapp",
    status: sent ? "sent" : "failed",
    detail: `${sent}/${numbers.length} messaged`,
    count: sent,
  };
}

/* -------------------------------- Facebook -------------------------------- */
async function sendFacebook(input: BroadcastInput): Promise<ChannelResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !token) return { channel: "facebook", status: "skipped", detail: "not configured" };

  const message = `${input.title}\n\n${input.body}`;
  try {
    const res = input.imageUrl
      ? await fetch(`${GRAPH}/${pageId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input.imageUrl, caption: message, access_token: token }),
        })
      : await fetch(`${GRAPH}/${pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, access_token: token }),
        });
    if (!res.ok) return { channel: "facebook", status: "failed", detail: `HTTP ${res.status}` };
    return { channel: "facebook", status: "sent", detail: "posted to Page" };
  } catch (err) {
    return { channel: "facebook", status: "failed", detail: (err as Error).message };
  }
}

/* ------------------------------- Instagram -------------------------------- */
// IG feed posts require an image and a two-step container → publish flow.
async function sendInstagram(input: BroadcastInput): Promise<ChannelResult> {
  const igId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_TOKEN || process.env.FACEBOOK_PAGE_TOKEN;
  if (!igId || !token) return { channel: "instagram", status: "skipped", detail: "not configured" };
  if (!input.imageUrl) return { channel: "instagram", status: "skipped", detail: "Instagram needs an image" };

  try {
    const caption = `${input.title}\n\n${input.body}`;
    const create = await fetch(`${GRAPH}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: input.imageUrl, caption, access_token: token }),
    });
    const created = (await create.json()) as { id?: string };
    if (!created.id) return { channel: "instagram", status: "failed", detail: "container failed" };

    const publish = await fetch(`${GRAPH}/${igId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: created.id, access_token: token }),
    });
    if (!publish.ok) return { channel: "instagram", status: "failed", detail: `publish HTTP ${publish.status}` };
    return { channel: "instagram", status: "sent", detail: "posted to Instagram" };
  } catch (err) {
    return { channel: "instagram", status: "failed", detail: (err as Error).message };
  }
}
