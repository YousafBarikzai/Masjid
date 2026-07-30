import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { memberView } from "@/lib/membership";

/* Member sign-in for the website account area and the mobile apps. Accepts
   email OR username plus password, returns the member's JWT (sent back as
   `Authorization: JWT <token>` on later requests) and their account view.
   Payload enforces the lockout rules (5 attempts → 10-minute lock). */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { identifier?: string; password?: string };
    const identifier = String(body.identifier || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!identifier || !password) {
      return NextResponse.json({ ok: false, error: "Enter your email (or username) and password." }, { status: 400, headers: CORS });
    }

    const payload = await getPayloadClient();
    let email = identifier;
    if (!identifier.includes("@")) {
      const res = await payload.find({
        collection: "members" as never,
        where: { username: { equals: identifier } } as never,
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const doc = res.docs[0] as { email?: string } | undefined;
      if (!doc?.email) {
        return NextResponse.json({ ok: false, error: "We couldn't sign you in — check your details and try again." }, { status: 401, headers: CORS });
      }
      email = doc.email;
    }

    const result = await payload.login({
      collection: "members" as never,
      data: { email, password } as never,
    });
    const member = await payload.findByID({
      collection: "members" as never,
      id: (result.user as { id: string | number }).id,
      depth: 0,
      overrideAccess: true,
    });
    return NextResponse.json(
      { ok: true, token: result.token, member: await memberView(payload, member as never) },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "We couldn't sign you in — check your details and try again." },
      { status: 401, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
