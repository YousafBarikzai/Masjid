import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";

// Public mailing-list sign-up from EVERY surface — the website's newsletter
// form and the iOS/Android apps all post here. Upserts by email so repeat
// sign-ups never duplicate, and the Subscribers collection's own hooks mirror
// each entry to Mailchimp automatically (when configured).
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function POST(req: Request) {
  let payload: { email?: unknown; name?: unknown; source?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400, headers: CORS });
  }
  const name = typeof payload.name === "string" ? payload.name.trim().slice(0, 120) : "";
  const source = typeof payload.source === "string" ? payload.source.slice(0, 60) : "website";

  try {
    const p = await getPayloadClient();
    const existing = await p.find({
      collection: "subscribers" as never,
      where: { email: { equals: email } } as never,
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs[0]) {
      await p.update({
        collection: "subscribers" as never,
        id: (existing.docs[0] as { id: string | number }).id,
        data: { emailOptIn: true, unsubscribed: false, ...(name ? { name } : {}) } as never,
        overrideAccess: true,
      });
    } else {
      await p.create({
        collection: "subscribers" as never,
        data: { email, emailOptIn: true, source, ...(name ? { name } : {}) } as never,
        overrideAccess: true,
      });
    }
    return NextResponse.json({ ok: true }, { headers: CORS });
  } catch (err) {
    return NextResponse.json(
      { error: "subscribe_failed", message: (err as Error).message },
      { status: 500, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
