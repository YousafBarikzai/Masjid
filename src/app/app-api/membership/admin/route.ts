import { headers as nextHeaders } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { membersToCsv, runMembershipSweep } from "@/lib/membership";
import { userIsMembershipStaff } from "@/payload/access";

/* Staff-only membership admin API (powers the dashboard in the CMS):
     GET  ?view=stats          → dashboard counts + fees by month
     GET  ?view=export[&...]   → CSV download (filters: status, consent,
                                 expiryFrom, expiryTo) — no bank details, no
                                 passwords, no internal notes
     POST                      → run the renewal sweep now (reminders +
                                 renewal-due/expired transitions)
   Auth: the signed-in ADMIN user's cookie (staff `users` collection). */

export const dynamic = "force-dynamic";

async function authedStaff() {
  const payload = await getPayloadClient();
  // Same-origin GET/POST fetches (the admin dashboard) carry no Origin header,
  // which Payload's CSRF check treats as unauthenticated for cookie tokens.
  // An ABSENT Origin cannot come from a forged cross-site browser request
  // (those always send one), so absence is safely treated as same-origin.
  const h = new Headers(await nextHeaders());
  if (!h.get("origin")) h.set("origin", payload.config.serverURL || "");
  const { user } = await payload.auth({ headers: h });
  const ok = user && (user as { collection?: string }).collection === "users" && userIsMembershipStaff(user);
  return { payload, user: ok ? user : null };
}

export async function GET(req: NextRequest) {
  const { payload, user } = await authedStaff();
  if (!user) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });

  const q = req.nextUrl.searchParams;
  const view = q.get("view") || "stats";

  if (view === "export") {
    const where: Record<string, unknown>[] = [];
    if (q.get("status")) where.push({ status: { equals: q.get("status") } });
    if (q.get("consent") === "marketing") where.push({ "consents.marketing": { equals: true } });
    if (q.get("expiryFrom")) where.push({ expiryDate: { greater_than_equal: q.get("expiryFrom") } });
    if (q.get("expiryTo")) where.push({ expiryDate: { less_than_equal: q.get("expiryTo") } });
    const res = await payload.find({
      collection: "members" as never,
      where: (where.length ? { and: where } : {}) as never,
      limit: 5000,
      depth: 0,
      sort: "-createdAt",
      overrideAccess: true,
    });
    const csv = membersToCsv(res.docs as never);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kma-members-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Dashboard stats.
  const count = async (where: Record<string, unknown>) =>
    (
      await payload.count({
        collection: "members" as never,
        where: where as never,
        overrideAccess: true,
      })
    ).totalDocs;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const in60 = new Date(Date.now() + 60 * 86_400_000).toISOString();
  const nowIso = new Date().toISOString();

  const [total, thisMonth, pending, moreInfo, awaitingPayment, verifying, active, rejected, expired, renewalsDue, overdue] =
    await Promise.all([
      count({}),
      count({ createdAt: { greater_than_equal: monthStart.toISOString() } }),
      count({ status: { equals: "pending-review" } }),
      count({ status: { equals: "more-info-required" } }),
      count({ status: { equals: "approved-payment-required" } }),
      count({ status: { in: ["payment-verification", "renewal-pending"] } }),
      count({ status: { in: ["active", "renewal-due"] } }),
      count({ status: { equals: "rejected" } }),
      count({ status: { equals: "expired" } }),
      count({ and: [{ status: { in: ["active", "renewal-due"] } }, { expiryDate: { less_than_equal: in60 } }] }),
      count({ and: [{ status: { in: ["renewal-due"] } }, { expiryDate: { less_than: nowIso } }] }),
    ]);

  // Fees received by month (from verified payment history).
  const settings = ((await payload.findGlobal({ slug: "membership-settings" as never }).catch(() => null)) ?? {}) as Record<string, any>;
  const fee = Number(settings.annualFee ?? 12);
  const paid = await payload.find({
    collection: "members" as never,
    where: { paymentConfirmedAt: { exists: true } } as never,
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });
  const feesByMonth: Record<string, number> = {};
  for (const m of paid.docs as Array<Record<string, any>>) {
    for (const p of (m.paymentHistory as Array<{ at?: string }>) || []) {
      if (!p.at) continue;
      const key = String(p.at).slice(0, 7); // YYYY-MM
      feesByMonth[key] = (feesByMonth[key] || 0) + fee;
    }
  }

  return NextResponse.json({
    ok: true,
    stats: {
      total,
      thisMonth,
      pending,
      moreInfo,
      awaitingPayment,
      verifying,
      active,
      rejected,
      expired,
      renewalsDue,
      overdue,
      feesByMonth: Object.fromEntries(Object.entries(feesByMonth).sort().slice(-12)),
    },
  });
}

export async function POST() {
  const { payload, user } = await authedStaff();
  if (!user) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  const result = await runMembershipSweep(payload);
  return NextResponse.json({ ok: true, result });
}
