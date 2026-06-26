import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";

// Apps POST their Expo push token here on launch. Upserts by token so repeated
// registrations (token refresh, reinstall) stay deduplicated. Uses the local
// API with overrideAccess so the device-tokens collection can stay locked to
// staff in the admin UI.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PLATFORMS = new Set(["ios", "android", "web"]);

export async function POST(req: Request) {
  let payload: { token?: unknown; platform?: unknown; topics?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }

  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  if (!token.startsWith("ExponentPushToken")) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400, headers: CORS });
  }
  const platform = PLATFORMS.has(payload.platform as string) ? (payload.platform as string) : "ios";
  const topics = Array.isArray(payload.topics) ? payload.topics : ["news", "events"];

  try {
    const p = await getPayloadClient();
    const existing = await p.find({
      collection: "device-tokens" as never,
      where: { token: { equals: token } } as never,
      limit: 1,
      overrideAccess: true,
    });
    const data = { token, platform, topics, enabled: true } as never;
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
      { error: "register_failed", message: (err as Error).message },
      { status: 500, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
