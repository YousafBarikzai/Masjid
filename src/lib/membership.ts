import "server-only";
import type { Payload } from "payload";
import { journeyStep, prorate, readFeeSettings, recordCommunication } from "@/payload/membership";

/* Server-side membership helpers shared by the app-api routes, the reminder
   scheduler (payload.config onInit) and the admin dashboard endpoints. */

type AnyDoc = Record<string, any>;

export const JOURNEY = [
  "Application submitted",
  "Under review",
  "Approved — payment required",
  "Payment being verified",
  "Active member",
];

const STATUS_LABELS: Record<string, string> = {
  "pending-review": "Under review",
  "more-info-required": "More information required",
  "approved-payment-required": "Approved — payment required",
  "payment-verification": "Payment being verified",
  active: "Active member",
  "renewal-due": "Renewal due",
  "renewal-pending": "Renewal pending",
  expired: "Expired",
  rejected: "Not approved",
};

const PAYMENT_LABELS: Record<string, string> = {
  "not-due": "Not due yet",
  pending: "Payment pending",
  "part-paid": "Part paid",
  paid: "Paid in full",
  overdue: "Overdue",
  waived: "Waived / concession",
};

export function paymentStatusLabel(s: string): string {
  return PAYMENT_LABELS[s] || s;
}

export function statusLabel(s: string): string {
  return STATUS_LABELS[s] || s;
}

/** What the member should do next, in plain words. */
export function nextAction(status: string): string {
  switch (status) {
    case "pending-review":
      return "Nothing to do — we're reviewing your application and will email you.";
    case "more-info-required":
      return "We've asked for a little more information — please check your email.";
    case "approved-payment-required":
      return "Pay the membership fee by bank transfer using your personal reference, then tell us below.";
    case "payment-verification":
      return "Nothing to do — we're verifying your payment against the mosque account.";
    case "active":
      return "Nothing to do — enjoy your membership.";
    case "renewal-due":
      return "Your membership is due for renewal — pay the fee using your reference, then tell us below.";
    case "renewal-pending":
      return "Nothing to do — we're verifying your renewal payment.";
    case "expired":
      return "Your membership has expired — pay the fee to renew, then tell us below.";
    case "rejected":
      return "This application was not approved. Contact the mosque office if you'd like to discuss it.";
    default:
      return "";
  }
}

const PAY_STATUSES = ["approved-payment-required", "renewal-due", "expired"];
const REPORT_STATUSES = [...PAY_STATUSES];

/** The safe member-facing view of their own record (no internal notes etc.). */
export async function memberView(payload: Payload, member: AnyDoc): Promise<AnyDoc> {
  const settings = ((await payload
    .findGlobal({ slug: "membership-settings" as never })
    .catch(() => null)) ?? {}) as AnyDoc;
  const status = String(member.status || "pending-review");
  const showPayment = PAY_STATUSES.includes(status);

  // Billing: the member's own fee record; before approval fall back to a live
  // pro-rata quote so applicants always see what they WOULD pay.
  const f = (member.fee as AnyDoc) || {};
  const quote = prorate(readFeeSettings(settings), new Date());
  const monthlyRate = Number(f.monthlyRate) || quote.monthlyRate;
  const monthsCharged = Number(f.monthsCharged) || quote.monthsCharged;
  const amountDue = Number(f.amountDue) || quote.amountDue;
  const adjustment = Number(f.adjustment) || 0;
  const amountPaid = Number(f.amountPaid) || 0;
  const netDue = Math.max(0, Math.round((amountDue - adjustment) * 100) / 100);
  const outstanding = f.outstanding != null ? Number(f.outstanding) : Math.max(0, netDue - amountPaid);
  const paymentStatus = String(f.paymentStatus || "not-due");

  return {
    id: member.id,
    firstName: member.firstName,
    surname: member.surname,
    title: member.title,
    fullName: member.fullName,
    email: member.email,
    telephone: member.telephone,
    username: member.username,
    address1: member.address1,
    address2: member.address2,
    townCity: member.townCity,
    county: member.county,
    postcode: member.postcode,
    applicationNumber: member.applicationNumber,
    membershipNumber: member.membershipNumber || null,
    status,
    statusLabel: statusLabel(status),
    journeyStep: journeyStep(status),
    journey: JOURNEY,
    nextAction: nextAction(status),
    startDate: member.startDate || null,
    expiryDate: member.expiryDate || null,
    renewalDate: member.expiryDate || null,
    paymentReference: showPayment || status === "payment-verification" || status === "renewal-pending" ? member.paymentReference || null : null,
    canReportPayment: REPORT_STATUSES.includes(status),
    // `fee` = what the member is being asked to pay right now (net of any
    // discount). Kept as a plain number for the mobile app.
    fee: outstanding > 0 ? outstanding : netDue,
    billing: {
      monthlyRate,
      monthsCharged,
      amountDue,
      adjustment,
      netDue,
      amountPaid,
      outstanding,
      paymentStatus,
      paymentStatusLabel: paymentStatusLabel(paymentStatus),
      renewalDate: member.expiryDate || quote.expiryDate.toISOString(),
    },
    bank: showPayment
      ? {
          accountName: settings.bank?.accountName || "",
          sortCode: settings.bank?.sortCode || "",
          accountNumber: settings.bank?.accountNumber || "",
        }
      : null,
    proofOfPaymentEnabled: Boolean(settings.proofOfPaymentEnabled),
    paymentHistory: (member.paymentHistory || []).map((p: AnyDoc) => ({
      at: p.at,
      amount: p.amount ?? null,
      reference: p.reference,
      note: p.note,
    })),
    statusHistory: (member.statusHistory || []).map((h: AnyDoc) => ({ status: statusLabel(String(h.status)), at: h.at })),
    reportedPaymentDate: member.reportedPaymentDate || null,
  };
}

/* ------------------------------ Renewal sweep ------------------------------ */

const DAY = 86_400_000;
const REMINDERS: Array<{ kind: string; daysBefore: number }> = [
  { kind: "2-months", daysBefore: 60 },
  { kind: "1-month", daysBefore: 30 },
  { kind: "1-week", daysBefore: 7 },
  { kind: "overdue", daysBefore: -3 }, // 3 days after expiry
];

const SITE = () =>
  process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";

/** One payment/renewal reminder email to one member, with the outstanding
 *  amount spelled out, recorded in remindersSent + the communication history.
 *  Used by the daily sweep AND the dashboard's manual "send reminders". */
export async function sendPaymentReminder(
  payload: Payload,
  member: AnyDoc,
  kind: string,
  opts?: { manual?: boolean },
): Promise<boolean> {
  const f = (member.fee as AnyDoc) || {};
  const outstanding = Math.max(0, Number(f.outstanding) || 0);
  const expiry = member.expiryDate ? new Date(member.expiryDate) : null;
  const overdue = expiry ? expiry.getTime() < Date.now() : String(f.paymentStatus) === "overdue";
  const amount = outstanding > 0 ? outstanding : Math.max(0, (Number(f.amountDue) || 0) - (Number(f.adjustment) || 0));
  try {
    await payload.sendEmail({
      to: member.email,
      subject: overdue
        ? "Your KMA membership fee is overdue"
        : expiry
          ? `Your KMA membership renewal — £${amount.toFixed(2)} due`
          : `Your KMA membership fee — £${amount.toFixed(2)} due`,
      html: `<p>As-salāmu ʿalaykum ${member.firstName},</p>
        <p>${
          overdue
            ? `Our records show an outstanding membership fee of <b>£${amount.toFixed(2)}</b>${expiry ? ` — your membership expired on <b>${expiry.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b>` : ""}.`
            : expiry
              ? `Your Kingston Muslim Association membership${member.membershipNumber ? ` (number <b>${member.membershipNumber}</b>)` : ""} runs until <b>${expiry.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b> and <b>£${amount.toFixed(2)}</b> is due for the next year.`
              : `A membership fee of <b>£${amount.toFixed(2)}</b> is outstanding on your account.`
        }</p>
        <p>Please pay by bank transfer using your personal reference <b>${member.paymentReference || member.applicationNumber}</b> — the bank details and an “I've paid” button are in your account:</p>
        <p><a href="${SITE()}/membership/account">${SITE()}/membership/account</a></p>`,
    });
  } catch {
    return false;
  }
  const at = new Date().toISOString();
  try {
    await payload.update({
      collection: "members" as never,
      id: member.id,
      data: {
        remindersSent: [...((member.remindersSent as AnyDoc[]) || []), { kind, at }],
        lastReminderAt: at,
      } as never,
      overrideAccess: true,
      context: { internal: true } as never,
    });
    member.remindersSent = [...((member.remindersSent as AnyDoc[]) || []), { kind, at }];
    member.lastReminderAt = at;
  } catch {
    /* recorded best-effort */
  }
  await recordCommunication(payload, member, {
    kind: opts?.manual ? "Manual payment reminder" : `Renewal reminder (${kind})`,
    note: `£${amount.toFixed(2)} outstanding`,
  });
  return true;
}

/** Daily housekeeping: move statuses along the renewal lifecycle and send the
 *  reminder emails that are due. Idempotent — each reminder is recorded on the
 *  member and never sent twice in a cycle. Returns a summary for the admin. */
export async function runMembershipSweep(payload: Payload): Promise<AnyDoc> {
  const out = { checked: 0, markedRenewalDue: 0, markedExpired: 0, markedOverdue: 0, remindersSent: 0, errors: 0 };
  const now = Date.now();

  const res = await payload.find({
    collection: "members" as never,
    where: { status: { in: ["active", "renewal-due", "renewal-pending"] } } as never,
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });

  for (const raw of res.docs as AnyDoc[]) {
    out.checked++;
    try {
      const expiry = raw.expiryDate ? new Date(raw.expiryDate).getTime() : null;
      if (!expiry) continue;
      const daysLeft = Math.floor((expiry - now) / DAY);

      // Status transitions.
      if (raw.status === "active" && daysLeft <= 60) {
        await payload.update({
          collection: "members" as never,
          id: raw.id,
          data: { status: "renewal-due" } as never,
          overrideAccess: true,
          context: { skipSweep: true } as never,
        });
        out.markedRenewalDue++;
        raw.status = "renewal-due";
      }
      if ((raw.status === "renewal-due" || raw.status === "active") && daysLeft < -30) {
        // A month past expiry with no verified payment → expired.
        await payload.update({
          collection: "members" as never,
          id: raw.id,
          data: { status: "expired" } as never,
          overrideAccess: true,
        });
        out.markedExpired++;
        continue;
      }
      if (raw.status === "renewal-pending") continue; // payment reported — humans take it from here

      // Past expiry with money still owing → stamp the payment status Overdue
      // so the list/filters/dashboard show it. (deriveFee preserves "overdue"
      // until the money arrives.)
      const fee = (raw.fee as AnyDoc) || {};
      if (daysLeft < 0 && Number(fee.outstanding) > 0 && String(fee.paymentStatus) !== "overdue") {
        await payload.update({
          collection: "members" as never,
          id: raw.id,
          data: { fee: { ...fee, paymentStatus: "overdue" } } as never,
          overrideAccess: true,
          context: { internal: true } as never,
        });
        raw.fee = { ...fee, paymentStatus: "overdue" };
        out.markedOverdue++;
      }

      // Reminder emails — at most one per member per sweep, never repeated
      // within a cycle.
      const sent = new Set(((raw.remindersSent as AnyDoc[]) || []).map((r) => String(r.kind)));
      for (const r of REMINDERS) {
        if (daysLeft > r.daysBefore || sent.has(r.kind)) continue;
        if (await sendPaymentReminder(payload, raw, r.kind)) out.remindersSent++;
        else out.errors++;
        break;
      }
    } catch {
      out.errors++;
    }
  }
  return out;
}

/* --------------------------------- Export ---------------------------------- */

const EXPORT_COLUMNS: Array<[string, (m: AnyDoc) => string]> = [
  ["Application number", (m) => m.applicationNumber || ""],
  ["Membership number", (m) => m.membershipNumber || ""],
  ["Title", (m) => m.title || ""],
  ["First name", (m) => m.firstName || ""],
  ["Surname", (m) => m.surname || ""],
  ["Email", (m) => m.email || ""],
  ["Telephone", (m) => m.telephone || ""],
  ["Town/City", (m) => m.townCity || ""],
  ["Postcode", (m) => m.postcode || ""],
  ["Status", (m) => statusLabel(String(m.status || ""))],
  ["Submitted", (m) => (m.createdAt ? String(m.createdAt).slice(0, 10) : "")],
  ["Start date", (m) => (m.startDate ? String(m.startDate).slice(0, 10) : "")],
  ["Expiry date", (m) => (m.expiryDate ? String(m.expiryDate).slice(0, 10) : "")],
  ["Payment reference", (m) => m.paymentReference || ""],
  ["Monthly rate", (m) => (m.fee?.monthlyRate != null ? Number(m.fee.monthlyRate).toFixed(2) : "")],
  ["Months charged", (m) => (m.fee?.monthsCharged != null ? String(m.fee.monthsCharged) : "")],
  ["Amount due", (m) => (m.fee?.amountDue != null ? Number(m.fee.amountDue).toFixed(2) : "")],
  ["Discount", (m) => (Number(m.fee?.adjustment) ? Number(m.fee.adjustment).toFixed(2) : "")],
  ["Amount paid", (m) => (m.fee?.amountPaid != null ? Number(m.fee.amountPaid).toFixed(2) : "")],
  ["Outstanding", (m) => (m.fee?.outstanding != null ? Number(m.fee.outstanding).toFixed(2) : "")],
  ["Payment status", (m) => (m.fee?.paymentStatus ? paymentStatusLabel(String(m.fee.paymentStatus)) : "")],
  ["Last reminder", (m) => (m.lastReminderAt ? String(m.lastReminderAt).slice(0, 10) : "")],
  ["Marketing consent", (m) => (m.consents?.marketing ? "yes" : "no")],
  ["Proposer 1", (m) => m.proposer1?.fullName || ""],
  ["Proposer 2", (m) => m.proposer2?.fullName || ""],
];

function csvCell(v: string): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV of members (opens directly in Excel). NEVER includes passwords (not in
 *  data at all), bank details, notes, or proposers' contact details. */
export function membersToCsv(docs: AnyDoc[]): string {
  const head = EXPORT_COLUMNS.map(([h]) => csvCell(h)).join(",");
  const rows = docs.map((m) => EXPORT_COLUMNS.map(([, f]) => csvCell(f(m))).join(","));
  return [head, ...rows].join("\n");
}
