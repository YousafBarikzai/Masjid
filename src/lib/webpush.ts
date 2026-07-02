import "server-only";
import type { Payload } from "payload";
import type { PushMessage } from "./push";

/* Web Push (browser / installed PWA) delivery. Activates only when the VAPID
   keys are set as env vars, mirroring the env-gated S3/SMTP integrations — with
   them unset this is a silent no-op, so a deploy is never blocked. Dead
   subscriptions (410 Gone / 404) are pruned automatically. */

export function webPushConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** Load the web-push module with VAPID details set, or null if not configured. */
export async function loadWebPush() {
  if (!webPushConfigured()) return null;
  const mod = await import("web-push");
  const webpush = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@kingstonmosque.org",
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
  return webpush;
}

type WebSub = {
  id: string | number;
  token?: string; // endpoint
  p256dh?: string;
  auth?: string;
};

export async function sendWebPushToAll(
  payload: Payload,
  message: PushMessage,
  topic?: string,
): Promise<{ sent: number }> {
  if (!webPushConfigured()) return { sent: 0 };

  const mod = await import("web-push");
  const webpush = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@kingstonmosque.org",
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );

  const where: Record<string, unknown> = {
    enabled: { equals: true },
    platform: { equals: "web" },
  };
  if (topic) where.topics = { contains: topic };

  const res = await payload.find({
    collection: "device-tokens" as never,
    where: where as never,
    limit: 10000,
    depth: 0,
    overrideAccess: true,
  });

  const subs = (res.docs as WebSub[]).filter((d) => d.token && d.p256dh && d.auth);
  if (!subs.length) return { sent: 0 };

  const payloadStr = JSON.stringify({
    title: message.title,
    body: message.body,
    data: message.data ?? {},
  });

  let sent = 0;
  const dead: Array<string | number> = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.token as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
          payloadStr,
        );
        sent += 1;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
        // Other errors are swallowed (best-effort); subscription kept for retry.
      }
    }),
  );

  // Prune subscriptions the browser has permanently dropped.
  for (const id of dead) {
    try {
      await payload.delete({ collection: "device-tokens" as never, id, overrideAccess: true });
    } catch {
      /* ignore */
    }
  }

  return { sent };
}
