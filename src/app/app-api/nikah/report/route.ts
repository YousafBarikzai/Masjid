import { NextResponse, type NextRequest } from "next/server";
import { authedNikahMember } from "@/lib/nikah";

/* Discreet safeguarding reporting — any signed-in nikah member can report a
   profile or concern. The report lands in the confidential Nikah
   Safeguarding queue (nikah administrators only) and the reporter is never
   identified to the person reported. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function POST(req: NextRequest) {
  try {
    const { payload, member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    const body = (await req.json().catch(() => ({}))) as { about?: string | number; category?: string; details?: string };
    const category = ["behaviour", "false-info", "harassment", "fraud", "misuse", "other"].includes(String(body.category))
      ? String(body.category)
      : "other";
    const details = String(body.details || "").trim().slice(0, 3000);
    if (!details) return NextResponse.json({ ok: false, error: "Please describe your concern." }, { status: 400, headers: CORS });

    await payload.create({
      collection: "nikah-cases" as never,
      data: {
        reportedBy: member.id,
        about: body.about || undefined,
        category,
        status: "new",
        details,
      } as never,
      overrideAccess: true,
    });
    return NextResponse.json(
      { ok: true, message: "Thank you — your report has been received in confidence and will be reviewed by the Nikah team." },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
