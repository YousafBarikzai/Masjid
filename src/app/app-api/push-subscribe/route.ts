import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";

/* Browsers / installed PWAs POST their Web Push subscription here after the
   visitor opts in. Upserts by endpoint (stored in `token`) so re-subscribing
   stays deduplicated. DELETE removes a subscription on opt-out. Uses the local
   API with overrideAccess so device-tokens stays staff-locked in the admin. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const VALID_TOPICS = new Set(["news", "events", "prayer"]);

type SubscriptionJSON = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(req: Request) {
  let body: { subscription?: SubscriptionJSON; topics?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }

  const sub = body.subscription;
  const endpoint = typeof sub?.endpoint === "string" ? sub.endpoint : "";
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400, headers: CORS });
  }

  const topics = Array.isArray(body.topics)
    ? body.topics.filter((t): t is string => typeof t === "string" && VALID_TOPICS.has(t))
    : ["news", "events"];

  try {
    const p = await getPayloadClient();
    const existing = await p.find({
      collection: "device-tokens" as never,
      where: { token: { equals: endpoint } } as never,
      limit: 1,
      overrideAccess: true,
    });
    const data = {
      token: endpoint,
      platform: "web",
      p256dh,
      auth,
      topics: topics.length ? topics : ["news", "events"],
      enabled: true,
    } as never;
    if (existing.docs[0]) {
      await p.update({
        collection: "device-tokens" as never,
        id: (existing.docs[0] as { id: string | number }).id,
        data,
        overrideAccess: true,
      });
    } else {
      await p.create({ collection: "device-tokens" as never, data, overrideAccess: true });
    }
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err) {
    return NextResponse.json(
      { error: "subscribe_failed", message: (err as Error).message },
      { status: 500, headers: CORS },
    );
  }
}

export async function DELETE(req: Request) {
  let body: { endpoint?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400, headers: CORS });
  }
  try {
    const p = await getPayloadClient();
    await p.delete({
      collection: "device-tokens" as never,
      where: { token: { equals: endpoint } } as never,
      overrideAccess: true,
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err) {
    return NextResponse.json(
      { error: "unsubscribe_failed", message: (err as Error).message },
      { status: 500, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
