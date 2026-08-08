import { NextResponse, type NextRequest } from "next/server";
import { authedNikahMember, nikahOwnView, nikahProfileView } from "@/lib/nikah";

/* The nikah member's own account (website + apps):
     GET    → own status, reference, editable profile AND an exact preview of
              what other approved members can see (the anonymised view)
     PATCH  → update the permitted profile fields, pause/unpause the profile,
              or change password (current password required) */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const { member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    return NextResponse.json(
      { ok: true, me: nikahOwnView(member), preview: nikahProfileView(member) },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

const TEXT_FIELDS = [
  "townCity", "profession", "faithNotes", "aboutMe", "familyBackground",
  "lookingFor", "essentials", "relocateWhere",
] as const;

export async function PATCH(req: NextRequest) {
  try {
    const { payload, member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    const body = (await req.json()) as Record<string, unknown>;

    if (typeof body.newPassword === "string") {
      if (body.newPassword.length < 8)
        return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400, headers: CORS });
      try {
        await payload.login({ collection: "nikah-profiles" as never, data: { email: member.email, password: String(body.currentPassword || "") } as never });
      } catch {
        return NextResponse.json({ ok: false, error: "Your current password is incorrect." }, { status: 403, headers: CORS });
      }
      await payload.update({ collection: "nikah-profiles" as never, id: member.id, data: { password: body.newPassword } as never, overrideAccess: true });
      return NextResponse.json({ ok: true, changed: "password" }, { headers: CORS });
    }

    const data: Record<string, unknown> = {};
    for (const f of TEXT_FIELDS) {
      if (typeof body[f] === "string") data[f] = (body[f] as string).trim().slice(0, 1500);
    }
    if (typeof body.profileHidden === "boolean") data.profileHidden = body.profileHidden;
    if (typeof body.willingToRelocate === "boolean") data.willingToRelocate = body.willingToRelocate;
    if (typeof body.acceptsChildren === "boolean") data.acceptsChildren = body.acceptsChildren;
    if (["soon", "year", "1-2-years", "open"].includes(String(body.timeframe))) data.timeframe = body.timeframe;
    const num = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) >= 18 && Number(v) <= 90 ? Number(v) : undefined);
    if (body.prefAgeMin !== undefined) data.prefAgeMin = num(body.prefAgeMin);
    if (body.prefAgeMax !== undefined) data.prefAgeMax = num(body.prefAgeMax);

    if (!Object.keys(data).length)
      return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400, headers: CORS });

    await payload.update({
      collection: "nikah-profiles" as never,
      id: member.id,
      data: data as never,
      overrideAccess: true,
      context: { internal: true } as never,
    });
    const fresh = (await payload.findByID({ collection: "nikah-profiles" as never, id: member.id, depth: 0, overrideAccess: true })) as Record<string, any>;
    return NextResponse.json({ ok: true, me: nikahOwnView(fresh), preview: nikahProfileView(fresh) }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
