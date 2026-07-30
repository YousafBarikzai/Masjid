import "server-only";
import type { Payload } from "payload";
import { journeyStep } from "@/payload/membership";

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
    fee: Number(settings.annualFee ?? 12),
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

/** Daily housekeeping: move statuses along the renewal lifecycle and send the
 *  reminder emails that are due. Idempotent — each reminder is recorded on the
 *  member and never sent twice in a cycle. Returns a summary for the admin. */
export async function runMembershipSweep(payload: Payload): Promise<AnyDoc> {
  const out = { checked: 0, markedRenewalDue: 0, markedExpired: 0, remindersSent: 0, errors: 0 };
  const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
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

      // Reminder emails.
      const sent = new Set(((raw.remindersSent as AnyDoc[]) || []).map((r) => String(r.kind)));
      for (const r of REMINDERS) {
        const due = r.daysBefore >= 0 ? daysLeft <= r.daysBefore : daysLeft <= r.daysBefore;
        if (!due || sent.has(r.kind)) continue;
        const overdue = daysLeft < 0;
        try {
          await payload.sendEmail({
            to: raw.email,
            subject: overdue
              ? "Your KMA membership has expired — renew today"
              : `Your KMA membership expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
            html: `<p>As-salāmu ʿalaykum ${raw.firstName},</p>
              <p>${
                overdue
                  ? "Your Kingston Muslim Association membership has <b>expired</b>."
                  : `Your Kingston Muslim Association membership (number <b>${raw.membershipNumber}</b>) expires on <b>${new Date(expiry).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</b>.`
              }</p>
              <p>To renew, pay the annual fee using your personal reference <b>${raw.paymentReference || raw.applicationNumber}</b> — the bank details and a “I've paid” button are in your account:</p>
              <p><a href="${site}/membership/account">${site}/membership/account</a></p>`,
          });
          await payload.update({
            collection: "members" as never,
            id: raw.id,
            data: {
              remindersSent: [...((raw.remindersSent as AnyDoc[]) || []), { kind: r.kind, at: new Date().toISOString() }],
            } as never,
            overrideAccess: true,
          });
          raw.remindersSent = [...((raw.remindersSent as AnyDoc[]) || []), { kind: r.kind, at: new Date().toISOString() }];
          out.remindersSent++;
        } catch {
          out.errors++;
        }
        break; // at most one reminder per member per sweep
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
