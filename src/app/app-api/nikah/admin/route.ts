import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { userIsNikahAdmin, userIsNikahStaff } from "@/payload/access";

/* Staff-only stats for the Nikah dashboard — the "what needs my attention
   today?" queues plus healthy service numbers. */

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getPayloadClient();
  const h = new Headers(await nextHeaders());
  if (!h.get("origin")) h.set("origin", payload.config.serverURL || "");
  const { user } = await payload.auth({ headers: h });
  if (!user || (user as { collection?: string }).collection !== "users" || !userIsNikahStaff(user)) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  }

  const count = (collection: string, where: Record<string, unknown>) =>
    payload.count({ collection: collection as never, where: where as never, overrideAccess: true }).then((r) => r.totalDocs);

  const now = new Date().toISOString();
  const [
    submitted, underReview, infoRequired, verification,
    approvedMale, approvedFemale, pendingInterests, mutualInterests,
    introsNew, introsActive, introsFollowUpDue, engagedPlus,
    casesOpen,
  ] = await Promise.all([
    count("nikah-profiles", { status: { equals: "submitted" } }),
    count("nikah-profiles", { status: { equals: "under-review" } }),
    count("nikah-profiles", { status: { equals: "info-required" } }),
    count("nikah-profiles", { status: { equals: "verification" } }),
    count("nikah-profiles", { and: [{ status: { equals: "approved" } }, { gender: { equals: "male" } }] }),
    count("nikah-profiles", { and: [{ status: { equals: "approved" } }, { gender: { equals: "female" } }] }),
    count("nikah-interests", { status: { equals: "pending" } }),
    count("nikah-interests", { status: { equals: "accepted" } }),
    count("nikah-introductions", { status: { equals: "new" } }),
    count("nikah-introductions", { status: { in: ["awaiting-wali", "families-connected", "meeting", "considering", "proceeding"] } }),
    count("nikah-introductions", { and: [{ followUpDate: { less_than_equal: now } }, { status: { not_in: ["declined", "completed"] } }] }),
    count("nikah-introductions", { status: { in: ["engaged", "nikah-arranged", "completed"] } }),
    userIsNikahAdmin(user) ? count("nikah-cases", { status: { in: ["new", "investigating"] } }) : Promise.resolve(null),
  ]);

  return NextResponse.json({
    ok: true,
    isNikahAdmin: userIsNikahAdmin(user),
    stats: {
      submitted, underReview, infoRequired, verification,
      approvedMale, approvedFemale, pendingInterests, mutualInterests,
      introsNew, introsActive, introsFollowUpDue, engagedPlus,
      casesOpen,
    },
  });
}
