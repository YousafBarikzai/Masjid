import { headers as nextHeaders } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { membersToCsv, runMembershipSweep, sendPaymentReminder } from "@/lib/membership";
import { userIsMembershipStaff } from "@/payload/access";
import { prorate, readFeeSettings } from "@/payload/membership";

/* Staff-only membership admin API (powers the dashboard in the CMS):
     GET  ?view=stats            → dashboard counts, outstanding fees, fees by month
     GET  ?view=fee-preview[&id] → the pro-rata fee calculation for one member
                                   (or for a brand-new joiner today) — shown on
                                   the edit screen so staff confirm the sum
                                   BEFORE approving
     GET  ?view=export[&...]     → CSV download (filters: status, consent,
                                   expiryFrom, expiryTo) — no bank details, no
                                   passwords, no internal notes
     POST {action:"sweep"}       → run the renewal sweep now
     POST {action:"remind", ids?|all} → payment reminders to one member,
                                   selected members, or everyone with an
                                   outstanding balance (recorded per member)
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

  if (view === "fee-preview") {
    const settings = readFeeSettings(
      (await payload.findGlobal({ slug: "membership-settings" as never }).catch(() => null)) as Record<string, any> | null,
    );
    const id = q.get("id");
    const member = id
      ? ((await payload
          .findByID({ collection: "members" as never, id, depth: 0, overrideAccess: true })
          .catch(() => null)) as Record<string, any> | null)
      : null;

    const gbp = (n: number) => `£${n.toFixed(2)}`;
    const fmt = (d: Date | string) =>
      new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const f = (member?.fee as Record<string, any>) || {};
    // A charge is FIXED once the application has passed approval (or a renewal
    // cycle opened); before that the amounts are a live preview of today.
    const charged =
      Number(f.amountDue) > 0 &&
      ["approved-payment-required", "payment-verification", "active", "renewal-due", "renewal-pending", "expired"].includes(
        String(member?.status),
      );
    const quote = prorate(settings, new Date());
    const monthlyRate = charged ? Number(f.monthlyRate) || quote.monthlyRate : quote.monthlyRate;
    const monthsCharged = charged ? Number(f.monthsCharged) || quote.monthsCharged : quote.monthsCharged;
    const amountDue = charged ? Number(f.amountDue) : quote.amountDue;
    const adjustment = Math.min(Number(f.adjustment) || 0, amountDue);
    const netDue = Math.max(0, Math.round((amountDue - adjustment) * 100) / 100);
    const amountPaid = Number(f.amountPaid) || 0;
    const outstanding = Math.max(0, Math.round((netDue - amountPaid) * 100) / 100);

    const rows: Array<{ label: string; value: string; strong?: boolean }> = [
      { label: "Monthly rate", value: gbp(monthlyRate) },
      { label: "Months charged (to the renewal month)", value: String(monthsCharged) },
      { label: "Prorated amount due", value: gbp(amountDue) },
    ];
    if (adjustment > 0) rows.push({ label: "Discount / waiver", value: `−${gbp(adjustment)}` });
    rows.push({ label: adjustment > 0 ? "Net amount due" : "Amount due", value: gbp(netDue), strong: true });
    if (member) {
      rows.push({ label: "Amount paid", value: gbp(amountPaid) });
      rows.push({ label: "Outstanding balance", value: gbp(outstanding), strong: true });
      if (member.startDate) rows.push({ label: "Membership start", value: fmt(member.startDate) });
      rows.push({
        label: "Expiry / renewal date",
        value: fmt(member.expiryDate || quote.expiryDate),
      });
    } else {
      rows.push({ label: "Expiry / renewal date", value: fmt(quote.expiryDate) });
    }
    const note = charged
      ? "This charge was fixed when the application was approved (or the renewal opened). Amounts update automatically as payments and discounts are recorded."
      : `Preview for approval TODAY: ${monthsCharged} month${monthsCharged === 1 ? "" : "s"} remaining to the renewal on ${fmt(quote.expiryDate)} at ${gbp(monthlyRate)}/month. Approving fixes this charge; add a discount/waiver below first if one applies.`;
    return NextResponse.json({ ok: true, preview: { rows, note } });
  }

  if (view === "export") {
    const where: Record<string, unknown>[] = [];
    if (q.get("status")) where.push({ status: { equals: q.get("status") } });
    if (q.get("paymentStatus")) where.push({ "fee.paymentStatus": { equals: q.get("paymentStatus") } });
    if (q.get("outstanding") === "yes") where.push({ "fee.outstanding": { greater_than: 0 } });
    if (q.get("reminded") === "yes") where.push({ lastReminderAt: { exists: true } });
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

  const [total, thisMonth, pending, moreInfo, awaitingPayment, verifying, active, rejected, expired, renewalsDue, overdue, overduePayments] =
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
      count({ "fee.paymentStatus": { equals: "overdue" } }),
    ]);

  // Total outstanding fees + who owes them (drives the reminder controls).
  const owing = await payload.find({
    collection: "members" as never,
    where: {
      and: [{ "fee.outstanding": { greater_than: 0 } }, { status: { not_in: ["rejected", "pending-review", "more-info-required"] } }],
    } as never,
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });
  let totalOutstanding = 0;
  const debtors = (owing.docs as Array<Record<string, any>>).map((m) => {
    const out = Number(m.fee?.outstanding) || 0;
    totalOutstanding += out;
    return {
      id: m.id,
      name: m.fullName || `${m.firstName} ${m.surname}`,
      number: m.membershipNumber || m.applicationNumber,
      status: m.status,
      paymentStatus: m.fee?.paymentStatus || "pending",
      outstanding: out,
      lastReminderAt: m.lastReminderAt || null,
    };
  });
  totalOutstanding = Math.round(totalOutstanding * 100) / 100;

  // Fees received by month (from verified payment history; older entries
  // without a stored amount fall back to the flat annual fee).
  const settings = ((await payload.findGlobal({ slug: "membership-settings" as never }).catch(() => null)) ?? {}) as Record<string, any>;
  const fallbackFee = Number(settings.annualFee ?? 12);
  const paid = await payload.find({
    collection: "members" as never,
    where: { paymentConfirmedAt: { exists: true } } as never,
    limit: 2000,
    depth: 0,
    overrideAccess: true,
  });
  const feesByMonth: Record<string, number> = {};
  for (const m of paid.docs as Array<Record<string, any>>) {
    for (const p of (m.paymentHistory as Array<{ at?: string; amount?: number }>) || []) {
      if (!p.at) continue;
      const key = String(p.at).slice(0, 7); // YYYY-MM
      feesByMonth[key] = Math.round(((feesByMonth[key] || 0) + (Number(p.amount) > 0 ? Number(p.amount) : fallbackFee)) * 100) / 100;
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
      overduePayments,
      totalOutstanding,
      debtors: debtors.sort((a, b) => b.outstanding - a.outstanding).slice(0, 200),
      feesByMonth: Object.fromEntries(Object.entries(feesByMonth).sort().slice(-12)),
    },
  });
}

export async function POST(req: NextRequest) {
  const { payload, user } = await authedStaff();
  if (!user) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; ids?: Array<string | number>; all?: boolean };
  const action = body.action || "sweep";

  if (action === "remind") {
    // Manual payment reminders: one member, a selection, or everyone owing.
    const where: Record<string, unknown> =
      body.all || !body.ids?.length
        ? {
            and: [
              { "fee.outstanding": { greater_than: 0 } },
              { status: { not_in: ["rejected", "pending-review", "more-info-required"] } },
            ],
          }
        : { id: { in: body.ids } };
    const res = await payload.find({
      collection: "members" as never,
      where: where as never,
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    });
    let sent = 0;
    let failed = 0;
    for (const m of res.docs as Array<Record<string, any>>) {
      if (!(Number(m.fee?.outstanding) > 0)) continue; // never chase a settled account
      if (await sendPaymentReminder(payload, m, "manual", { manual: true })) sent++;
      else failed++;
    }
    return NextResponse.json({ ok: true, result: { sent, failed, considered: res.docs.length } });
  }

  const result = await runMembershipSweep(payload);
  return NextResponse.json({ ok: true, result });
}
