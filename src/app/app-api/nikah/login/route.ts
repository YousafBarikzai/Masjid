import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { nikahOwnView, nikahProfileView } from "@/lib/nikah";

/* Nikah member sign-in (website + apps). Email + password, returns the JWT
   (sent back as `Authorization: JWT <token>`) and the member's own view.
   Payload enforces lockout (5 attempts → 10-minute lock); sessions are
   deliberately short (8 hours) for this sensitive area. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Enter your email and password." }, { status: 400, headers: CORS });
    }
    const payload = await getPayloadClient();
    const result = await payload.login({ collection: "nikah-profiles" as never, data: { email, password } as never });
    const member = (await payload.findByID({
      collection: "nikah-profiles" as never,
      id: (result.user as { id: string | number }).id,
      depth: 0,
      overrideAccess: true,
    })) as Record<string, any>;
    return NextResponse.json(
      { ok: true, token: result.token, me: nikahOwnView(member), preview: nikahProfileView(member) },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "We couldn't sign you in — check your details and try again." }, { status: 401, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
