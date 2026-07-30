import { headers as nextHeaders } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { memberView } from "@/lib/membership";

/* The member's own account API (website account area + mobile apps).
   Authentication: the JWT from POST /api/members/login, sent as
   `Authorization: JWT <token>` (works identically for browsers and apps).

   GET    → the member's safe view of their record (status, journey, payment
            instructions when due, history, card details)
   PATCH  → update permitted contact details, or change password (requires the
            current password)
   POST   → report a payment (date + reference [+ proof media id]); moves
            approved-payment-required → payment-verification and
            renewal-due/expired → renewal-pending. Never activates by itself.
*/

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

async function authedMember() {
  const payload = await getPayloadClient();
  // Clients send `Authorization: JWT <token>` (no cookies), but keep parity
  // with authedStaff: an absent Origin is treated as same-origin, since forged
  // cross-site browser requests always carry one.
  const h = new Headers(await nextHeaders());
  if (!h.get("origin")) h.set("origin", payload.config.serverURL || "");
  const { user } = await payload.auth({ headers: h });
  if (!user || (user as { collection?: string }).collection !== "members") return { payload, member: null };
  const member = await payload.findByID({
    collection: "members" as never,
    id: user.id,
    depth: 0,
    overrideAccess: true,
  });
  return { payload, member: member as Record<string, any> };
}

export async function GET() {
  try {
    const { payload, member } = await authedMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    return NextResponse.json({ ok: true, member: await memberView(payload, member) }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

const CONTACT_FIELDS = ["telephone", "address1", "address2", "townCity", "county", "postcode"] as const;

export async function PATCH(req: NextRequest) {
  try {
    const { payload, member } = await authedMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    const body = (await req.json()) as Record<string, unknown>;

    // Password change: verify the current password first, always.
    if (typeof body.newPassword === "string") {
      const current = String(body.currentPassword || "");
      const next = String(body.newPassword);
      if (next.length < 8)
        return NextResponse.json({ ok: false, error: "New password must be at least 8 characters." }, { status: 400, headers: CORS });
      try {
        await payload.login({
          collection: "members" as never,
          data: { email: member.email, password: current } as never,
        });
      } catch {
        return NextResponse.json({ ok: false, error: "Your current password is incorrect." }, { status: 403, headers: CORS });
      }
      await payload.update({
        collection: "members" as never,
        id: member.id,
        data: { password: next } as never,
        overrideAccess: true,
      });
      return NextResponse.json({ ok: true, changed: "password" }, { headers: CORS });
    }

    // Contact details.
    const data: Record<string, string> = {};
    for (const f of CONTACT_FIELDS) {
      if (typeof body[f] === "string") data[f] = (body[f] as string).trim().slice(0, 200);
    }
    if (!Object.keys(data).length)
      return NextResponse.json({ ok: false, error: "Nothing to update." }, { status: 400, headers: CORS });
    await payload.update({ collection: "members" as never, id: member.id, data: data as never, overrideAccess: true });
    const fresh = await payload.findByID({ collection: "members" as never, id: member.id, depth: 0, overrideAccess: true });
    return NextResponse.json({ ok: true, member: await memberView(payload, fresh as never) }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { payload, member } = await authedMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });

    const status = String(member.status);
    const allowed: Record<string, string> = {
      "approved-payment-required": "payment-verification",
      "renewal-due": "renewal-pending",
      expired: "renewal-pending",
    };
    const nextStatus = allowed[status];
    if (!nextStatus)
      return NextResponse.json(
        { ok: false, error: "There's no payment due on your membership right now." },
        { status: 400, headers: CORS },
      );

    const body = (await req.json()) as Record<string, unknown>;
    const date = typeof body.paymentDate === "string" ? body.paymentDate.slice(0, 30) : "";
    const ref = typeof body.paymentReference === "string" ? body.paymentReference.trim().slice(0, 40) : "";
    if (!date) return NextResponse.json({ ok: false, error: "Tell us the date you paid." }, { status: 400, headers: CORS });

    const data: Record<string, unknown> = {
      status: nextStatus,
      reportedPaymentDate: date,
      reportedPaymentRef: ref || member.paymentReference || "",
    };
    if (typeof body.proofId === "number" || (typeof body.proofId === "string" && body.proofId)) {
      data.proofOfPayment = body.proofId;
    }
    await payload.update({ collection: "members" as never, id: member.id, data: data as never, overrideAccess: true });
    const fresh = await payload.findByID({ collection: "members" as never, id: member.id, depth: 0, overrideAccess: true });
    return NextResponse.json({ ok: true, member: await memberView(payload, fresh as never) }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
