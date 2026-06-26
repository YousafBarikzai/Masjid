import { getPayloadClient } from "@/lib/payloadClient";
import { getToday, dayRows } from "@/lib/prayer";
import { getPrayerOverride } from "@/lib/cms";
import { toMinutes, londonSecondsNow } from "@/lib/nextPrayer";
import { loadWebPush } from "@/lib/webpush";

/* Prayer-time reminders. Ping this endpoint every minute (external scheduler —
   Railway cron, cron-job.org, a GitHub Action…) and it sends a Web Push to each
   opted-in device whose chosen offset matches a prayer that's coming up now.

   Secured by CRON_SECRET: pass it as ?key=... or an "x-cron-key" header. Inert
   (200, did nothing) until both CRON_SECRET and the VAPID keys are configured. */

export const dynamic = "force-dynamic";

type WebSub = {
  id: string | number;
  token?: string;
  p256dh?: string;
  auth?: string;
  reminderOffset?: number;
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ ok: false, reason: "CRON_SECRET not set" }, { status: 200 });
  }
  const url = new URL(req.url);
  const provided = url.searchParams.get("key") || req.headers.get("x-cron-key");
  if (provided !== secret) {
    return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  const webpush = await loadWebPush();
  if (!webpush) {
    return Response.json({ ok: false, reason: "web push not configured" }, { status: 200 });
  }

  // Today's jamāʿah times (with any admin override), in seconds since midnight.
  const base = getToday();
  const override = await getPrayerOverride(base.date);
  const rows = dayRows(override ?? base);
  const nowSec = londonSecondsNow();
  const prayers = rows
    .filter((r) => r.jamaah && !r.isInfo)
    .map((r) => ({ name: r.en, time: r.jamaah as string, sec: toMinutes(r.jamaah as string) * 60 }));

  // Fetch web subscribers who opted into prayer reminders.
  const p = await getPayloadClient();
  const res = await p.find({
    collection: "device-tokens" as never,
    where: {
      enabled: { equals: true },
      platform: { equals: "web" },
      topics: { contains: "prayer" },
    } as never,
    limit: 10000,
    depth: 0,
    overrideAccess: true,
  });
  const subs = (res.docs as WebSub[]).filter((s) => s.token && s.p256dh && s.auth);

  let sent = 0;
  const dead: Array<string | number> = [];

  await Promise.all(
    subs.map(async (s) => {
      const offset = Number.isFinite(s.reminderOffset) ? (s.reminderOffset as number) : 15;
      // A prayer is "due" for this device when it's ~offset minutes away (the
      // current minute the countdown crosses the offset). Cron runs each minute.
      const due = prayers.find((pr) => Math.round((pr.sec - nowSec) / 60) === offset);
      if (!due) return;

      const body = JSON.stringify({
        title: `${due.name} in ${offset} minutes`,
        body: `Jamāʿah at ${due.time}. Time to prepare for ${due.name}.`,
        data: { type: "prayer", url: "/prayer-times" },
      });
      try {
        await webpush.sendNotification(
          { endpoint: s.token as string, keys: { p256dh: s.p256dh as string, auth: s.auth as string } },
          body,
        );
        sent += 1;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
      }
    }),
  );

  for (const id of dead) {
    try {
      await p.delete({ collection: "device-tokens" as never, id, overrideAccess: true });
    } catch {
      /* ignore */
    }
  }

  return Response.json(
    { ok: true, candidates: subs.length, sent, prunedDead: dead.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
