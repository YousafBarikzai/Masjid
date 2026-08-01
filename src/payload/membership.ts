import type { CollectionConfig, GlobalConfig, PayloadRequest } from "payload";
import { isAdmin, isMembershipStaff } from "./access";
import { section } from "./sections";

/* ============================================================================
   KMA Membership — applications, approval, payment verification, active
   membership, renewals.

   `members` is its OWN auth collection (separate from staff `users`): an
   applicant creates a secure account when applying, can log in to track
   progress, and later manages their membership. Payload hashes passwords —
   administrators can never see them.

   The status machine (one `status` field, same names on every surface):
     pending-review → approved-payment-required → payment-verification → active
     side states: more-info-required, rejected
     lifecycle:   active → renewal-due → renewal-pending → active | expired

   Transitions are driven by staff editing the status in the admin; hooks do
   the paperwork automatically (payment reference, membership number, dates,
   emails, history). A member reporting a payment is the ONLY member-driven
   transition (approved-payment-required → payment-verification) — activation
   always requires a staff member to verify the money actually arrived.
   ============================================================================ */

export const MEMBER_STATUSES = [
  { label: "Application received / under review", value: "pending-review" },
  { label: "More information required", value: "more-info-required" },
  { label: "Approved — payment pending", value: "approved-payment-required" },
  { label: "Payment being verified", value: "payment-verification" },
  { label: "Active member", value: "active" },
  { label: "Renewal due", value: "renewal-due" },
  { label: "Renewal pending (payment reported)", value: "renewal-pending" },
  { label: "Expired", value: "expired" },
  { label: "Rejected", value: "rejected" },
] as const;

export const PAYMENT_STATUSES = [
  { label: "Not due yet", value: "not-due" },
  { label: "Payment pending", value: "pending" },
  { label: "Part paid", value: "part-paid" },
  { label: "Paid in full", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Waived / concession", value: "waived" },
] as const;

const ONE_TO_TWELVE = Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));

/** Fee settings shape used by the proration maths. */
export type FeeSettings = {
  annualFee: number;
  monthlyRate: number;
  renewalMonth: number; // 1–12, April = 4
  membershipDurationMonths: number;
};

export function readFeeSettings(raw: Record<string, any> | null | undefined): FeeSettings {
  const annualFee = Number(raw?.annualFee ?? 12) || 12;
  const explicitMonthly = Number(raw?.monthlyRate);
  return {
    annualFee,
    monthlyRate: explicitMonthly > 0 ? explicitMonthly : Math.round((annualFee / 12) * 100) / 100,
    renewalMonth: Number(raw?.renewalMonth ?? 4) || 4,
    membershipDurationMonths: Number(raw?.membershipPeriodMonths ?? 12) || 12,
  };
}

/** All memberships renew on the 1st of the renewal month (April by default).
 *  Joining is charged pro-rata for the months remaining INCLUDING the joining
 *  month: join in December with April renewal → Dec, Jan, Feb, Mar = 4 months.
 *  Joining in the renewal month itself = a full cycle (12 months). */
export function prorate(settings: FeeSettings, joinDate: Date): {
  monthsCharged: number;
  monthlyRate: number;
  amountDue: number;
  expiryDate: Date;
} {
  const renewalIdx = settings.renewalMonth - 1; // 0-based month of renewal
  const joinIdx = joinDate.getMonth();
  const raw = (renewalIdx - joinIdx + 12) % 12;
  const monthsCharged = raw === 0 ? 12 : raw;
  const amountDue = Math.round(settings.monthlyRate * monthsCharged * 100) / 100;
  // Expiry = the 1st of the next renewal month after the join date.
  const expiry = new Date(joinDate.getFullYear(), renewalIdx, 1);
  while (expiry <= joinDate) expiry.setFullYear(expiry.getFullYear() + 1);
  return { monthsCharged, monthlyRate: settings.monthlyRate, amountDue, expiryDate: expiry };
}

/** Renewal charge: a full cycle to the following renewal month. */
export function renewalCharge(settings: FeeSettings, fromExpiry: Date): {
  monthsCharged: number;
  monthlyRate: number;
  amountDue: number;
  expiryDate: Date;
} {
  const expiry = new Date(fromExpiry);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return {
    monthsCharged: 12,
    monthlyRate: settings.monthlyRate,
    amountDue: Math.round(settings.monthlyRate * 12 * 100) / 100,
    expiryDate: expiry,
  };
}

export type MemberStatus = (typeof MEMBER_STATUSES)[number]["value"];

/** The five-step public journey; side statuses map onto the nearest step. */
export function journeyStep(status: string): number {
  switch (status) {
    case "pending-review":
    case "more-info-required":
      return 2; // submitted (1) done, under review (2)
    case "approved-payment-required":
      return 3;
    case "payment-verification":
    case "renewal-pending":
      return 4;
    case "active":
    case "renewal-due":
      return 5;
    default:
      return 2; // rejected/expired shown via status text, tracker stays honest
  }
}

const proposerFields = (n: 1 | 2) => ({
  name: `proposer${n}` as const,
  type: "group" as const,
  label: `KMA proposer ${n}`,
  fields: [
    { name: "fullName", type: "text" as const },
    {
      type: "row" as const,
      fields: [
        { name: "telephone", type: "text" as const, admin: { width: "34%" } },
        { name: "email", type: "text" as const, admin: { width: "36%" } },
        { name: "membershipNumber", type: "text" as const, admin: { width: "30%" } },
      ],
    },
  ],
});

/** Bank-safe payment reference: application number + surname, ≤18 chars. */
export function paymentReferenceFor(applicationNumber: string, surname: string): string {
  const clean = String(surname || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return `${applicationNumber}-${clean}`.slice(0, 18);
}

async function sendMemberEmail(req: PayloadRequest, to: string, subject: string, html: string): Promise<boolean> {
  try {
    await req.payload.sendEmail({ to, subject, html });
    return true;
  } catch (err) {
    req.payload.logger.warn(`Membership email to ${to} failed: ${(err as Error).message}`);
    return false;
  }
}

/** Append to the member's communication history without re-triggering the
 *  status emails (context.internal short-circuits both hooks). */
export async function recordCommunication(
  payload: PayloadRequest["payload"],
  member: Record<string, any>,
  entry: { kind: string; channel?: string; note?: string },
): Promise<void> {
  try {
    await payload.update({
      collection: "members" as never,
      id: member.id,
      data: {
        communications: [
          ...((member.communications as unknown[]) || []),
          { at: new Date().toISOString(), channel: "email", ...entry },
        ],
      } as never,
      overrideAccess: true,
      context: { internal: true } as never,
    });
  } catch {
    /* history is best-effort — never block the real change */
  }
}

/** Derive outstanding balance + payment status from the amounts. The ONLY
 *  hand-set value that survives is "overdue" (stamped by the daily sweep) —
 *  everything else follows the money so the admin can't get out of sync. */
export function deriveFee(fee: Record<string, any>): Record<string, any> {
  const due = Math.max(0, Number(fee.amountDue) || 0);
  const adj = Math.min(Math.max(0, Number(fee.adjustment) || 0), due);
  const paid = Math.max(0, Number(fee.amountPaid) || 0);
  const net = Math.round((due - adj) * 100) / 100;
  const outstanding = Math.max(0, Math.round((net - paid) * 100) / 100);
  let status = String(fee.paymentStatus || "not-due");
  if (!due) status = "not-due";
  else if (net === 0) status = "waived";
  else if (outstanding === 0) status = "paid";
  else if (paid > 0) status = "part-paid";
  else if (!["pending", "overdue", "not-due"].includes(status)) status = "pending";
  fee.adjustment = adj;
  fee.outstanding = outstanding;
  fee.paymentStatus = status;
  return fee;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export const Members: CollectionConfig = {
  slug: "members",
  labels: { singular: "Member / application", plural: "Members" },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 14, // members stay signed in for 2 weeks
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: "Lax" },
  },
  admin: {
    group: "Membership",
    useAsTitle: "fullName",
    defaultColumns: ["fullName", "applicationNumber", "membershipNumber", "status", "expiryDate", "updatedAt"],
    listSearchableFields: ["firstName", "surname", "email", "applicationNumber", "membershipNumber", "telephone"],
    description:
      "Every membership application and member, at every stage. Change the Status to move an application along — emails, payment references, membership numbers and dates are handled automatically. Activation must only follow a verified bank payment.",
    components: { beforeList: ["@/payload/components/MembershipDashboard#MembershipDashboard"] },
  },
  access: {
    // Personal data: membership staff only in the admin/API. Members read
    // their own record (the account area builds on this).
    read: ({ req: { user }, id }) => {
      if (!user) return false;
      if ((user as { collection?: string }).collection === "members") {
        return id != null ? String(user.id) === String(id) : { id: { equals: user.id } };
      }
      return isMembershipStaff({ req: { user } } as never) as boolean;
    },
    create: () => true, // applying IS creating — validated + rate-limited by the apply endpoint
    update: isMembershipStaff,
    delete: isAdmin,
    admin: ({ req: { user } }) => (user as { collection?: string } | null)?.collection === "users",
    unlock: isMembershipStaff,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req, context }) => {
        const d = data as Record<string, any>;
        // Internal bookkeeping writes (communication history, sweep stamps)
        // must not re-run the journey machinery.
        if ((context as Record<string, unknown>)?.internal) return d;

        const feeSettings = async () =>
          readFeeSettings(
            (await req.payload
              .findGlobal({ slug: "membership-settings" as never })
              .catch(() => null)) as Record<string, any> | null,
          );

        if (operation === "create") {
          // Application number: KMA-<year>-<sequence>.
          const year = new Date().getFullYear();
          const { totalDocs } = await req.payload.count({ collection: "members" as never, overrideAccess: true });
          d.applicationNumber = `KMA-${year}-${String(totalDocs + 1).padStart(4, "0")}`;
          d.status = d.status || "pending-review";
          d.fullName = [d.title, d.firstName, d.surname].filter(Boolean).join(" ");
          d.statusHistory = [
            { status: "pending-review", at: new Date().toISOString(), by: "applicant" },
          ];
          // Fee PREVIEW from day one: what this applicant would pay if approved
          // today, so staff (and the applicant) see the pro-rata sum up front.
          // Nothing is owed until approval — status stays "not due yet".
          const q = prorate(await feeSettings(), new Date());
          d.fee = deriveFee({
            monthlyRate: q.monthlyRate,
            monthsCharged: q.monthsCharged,
            amountDue: q.amountDue,
            amountPaid: 0,
            adjustment: 0,
            paymentStatus: "not-due",
          });
          return d;
        }

        // Keep the display name in sync.
        const first = d.firstName ?? originalDoc?.firstName;
        const sur = d.surname ?? originalDoc?.surname;
        const title = d.title ?? originalDoc?.title;
        d.fullName = [title, first, sur].filter(Boolean).join(" ");

        const who =
          (req.user as { email?: string; collection?: string } | null)?.collection === "users"
            ? (req.user as { email?: string }).email || "staff"
            : "member";

        // Merged fee view (saved values + this edit) that the transitions below
        // and the derivation at the end both work on.
        const fee: Record<string, any> = { ...((originalDoc?.fee as object) || {}), ...((d.fee as object) || {}) };

        const prev = originalDoc?.status as string | undefined;
        const next = d.status as string | undefined;
        const changed = Boolean(next && next !== prev);

        if (changed) {
          d.statusHistory = [
            ...((originalDoc?.statusHistory as unknown[]) || []),
            { status: next, at: new Date().toISOString(), by: who },
          ];
        }

        // Approval: mint the personal payment reference and FIX the charge —
        // monthly rate × months from the approval month to the renewal month.
        // The admin has seen this exact sum in the fee preview.
        if (changed && next === "approved-payment-required") {
          if (!originalDoc?.paymentReference) {
            d.paymentReference = paymentReferenceFor(
              String(originalDoc?.applicationNumber || d.applicationNumber || "KMA"),
              String(sur || ""),
            );
          }
          const q = prorate(await feeSettings(), new Date());
          fee.monthlyRate = q.monthlyRate;
          fee.monthsCharged = q.monthsCharged;
          fee.amountDue = q.amountDue;
          if (String(fee.paymentStatus || "not-due") === "not-due") fee.paymentStatus = "pending";
          // The renewal date this payment covers — shown to member and staff.
          d.expiryDate = q.expiryDate.toISOString();
        }

        // Renewal due: open the next billing cycle (a full year to the next
        // renewal month). A standing discount/concession carries over.
        if (changed && next === "renewal-due") {
          const s = await feeSettings();
          const base = originalDoc?.expiryDate ? new Date(originalDoc.expiryDate) : new Date();
          const q = renewalCharge(s, base);
          fee.monthlyRate = q.monthlyRate;
          fee.monthsCharged = q.monthsCharged;
          fee.amountDue = q.amountDue;
          fee.amountPaid = 0;
          fee.paymentStatus = "pending";
        }

        // Activation (first time or renewal): staff-verified payment only.
        if (changed && next === "active") {
          const s = await feeSettings();
          const renewalFlow = ["renewal-due", "renewal-pending", "expired"].includes(String(prev));
          // If no charge was ever fixed (legacy records), fix it now.
          if (!Number(fee.amountDue)) {
            const q = renewalFlow
              ? renewalCharge(s, originalDoc?.expiryDate ? new Date(originalDoc.expiryDate) : new Date())
              : prorate(s, new Date());
            fee.monthlyRate = q.monthlyRate;
            fee.monthsCharged = q.monthsCharged;
            fee.amountDue = q.amountDue;
          }
          // Activating means the money (net of any waiver) has been verified.
          const net = Math.max(0, (Number(fee.amountDue) || 0) - (Number(fee.adjustment) || 0));
          const alreadyPaid = Number(fee.amountPaid) || 0;
          const received = Math.max(0, net - alreadyPaid);
          if (alreadyPaid < net) fee.amountPaid = net;

          if (renewalFlow) {
            const oldExpiry = new Date(originalDoc?.expiryDate || Date.now());
            const longExpired = oldExpiry.getTime() < Date.now() - 90 * 86_400_000;
            // Lapsed for months → treat like a new pro-rata joiner from today;
            // otherwise the cycle stays anchored: old expiry + 1 year.
            d.expiryDate = (longExpired ? prorate(s, new Date()) : renewalCharge(s, oldExpiry)).expiryDate.toISOString();
          } else {
            // First activation: paid up to the next renewal month.
            d.expiryDate = (originalDoc?.expiryDate
              ? new Date(originalDoc.expiryDate)
              : prorate(s, new Date()).expiryDate
            ).toISOString();
            if (new Date(d.expiryDate).getTime() <= Date.now()) {
              d.expiryDate = prorate(s, new Date()).expiryDate.toISOString();
            }
          }
          if (!originalDoc?.membershipNumber) {
            d.membershipNumber = `KMA-M-${String(1000 + Number(originalDoc?.id ?? 0))}`;
            d.startDate = new Date().toISOString();
          }
          d.paymentConfirmedAt = new Date().toISOString();
          d.paymentHistory = [
            ...((originalDoc?.paymentHistory as unknown[]) || []),
            {
              at: new Date().toISOString(),
              amount: received,
              reference: originalDoc?.reportedPaymentRef || originalDoc?.paymentReference || "",
              confirmedBy: who,
              note: renewalFlow ? "Renewal" : "First membership fee",
            },
          ];
          d.remindersSent = []; // fresh cycle, fresh reminders
        }

        // Always: outstanding balance + payment status follow the amounts, and
        // any hand-change to the money is written to the fee audit trail.
        deriveFee(fee);
        const before = (originalDoc?.fee as Record<string, any>) || {};
        const audit: unknown[] = [...(((originalDoc?.feeAudit as unknown[]) || []))];
        for (const k of ["amountDue", "amountPaid", "adjustment"] as const) {
          const a = Number(before[k]) || 0;
          const b = Number(fee[k]) || 0;
          if (a !== b) {
            audit.push({
              at: new Date().toISOString(),
              by: who,
              change: `${k === "amountDue" ? "Amount due" : k === "amountPaid" ? "Amount paid" : "Discount/waiver"}: £${a.toFixed(2)} → £${b.toFixed(2)}${k === "adjustment" && fee.adjustmentReason ? ` (${fee.adjustmentReason})` : ""}`,
            });
          }
        }
        d.feeAudit = audit;
        d.fee = fee;

        return d;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        const d = doc as Record<string, any>;
        if ((context as Record<string, unknown>)?.internal) return doc;
        const email = String(d.email || "");
        if (!email) return doc;
        const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
        const account = `${site}/membership/account`;

        if (operation === "create") {
          const sent = await sendMemberEmail(
            req,
            email,
            "Your KMA membership application has been received",
            `<p>As-salāmu ʿalaykum ${d.firstName},</p>
             <p>Thank you for applying to become a member of Kingston Muslim Association. Your application number is <b>${d.applicationNumber}</b>.</p>
             <p>Your application is now <b>under review</b>. You can sign in at any time to check progress:</p>
             <p><a href="${account}">${account}</a></p>
             <p>We will email you as soon as it moves forward.</p>`,
          );
          if (sent) await recordCommunication(req.payload, d, { kind: "Application received", note: "Confirmation email" });
          return doc;
        }

        const prev = (previousDoc as Record<string, any>)?.status;
        if (!d.status || d.status === prev) return doc;

        const fee = (d.fee as Record<string, any>) || {};
        const net = Math.max(0, (Number(fee.amountDue) || 0) - (Number(fee.adjustment) || 0));
        const feeLines = `
          <table style="border-collapse:collapse;margin:8px 0">
            <tr><td style="padding:2px 16px 2px 0">Monthly rate</td><td><b>£${(Number(fee.monthlyRate) || 0).toFixed(2)}</b></td></tr>
            <tr><td style="padding:2px 16px 2px 0">Months charged</td><td><b>${Number(fee.monthsCharged) || 0}</b> (until the annual renewal)</td></tr>
            ${Number(fee.adjustment) > 0 ? `<tr><td style="padding:2px 16px 2px 0">Discount applied</td><td><b>−£${Number(fee.adjustment).toFixed(2)}</b></td></tr>` : ""}
            <tr><td style="padding:2px 16px 2px 0">Amount due</td><td><b>£${net.toFixed(2)}</b></td></tr>
          </table>`;

        let sentKind = "";
        switch (d.status) {
          case "approved-payment-required":
            if (
              await sendMemberEmail(
                req,
                email,
                "KMA membership approved — payment required",
                `<p>As-salāmu ʿalaykum ${d.firstName},</p>
                 <p>Good news — your membership application <b>${d.applicationNumber}</b> has been <b>approved</b>.</p>
                 <p>Your membership fee is calculated pro-rata for the months remaining until the annual renewal${d.expiryDate ? ` on <b>${fmtDate(new Date(d.expiryDate))}</b>` : ""}:</p>
                 ${feeLines}
                 <p>Please pay by bank transfer. Your secure payment instructions (including the account details and your personal payment reference <b>${d.paymentReference}</b>) are in your account:</p>
                 <p><a href="${account}">${account}</a></p>
                 <p>Once you have paid, tell us in your account and we will verify it and activate your membership.</p>`,
              )
            )
              sentKind = "Approved — payment request";
            break;
          case "payment-verification":
            if (
              await sendMemberEmail(
                req,
                email,
                "We're verifying your KMA membership payment",
                `<p>As-salāmu ʿalaykum ${d.firstName},</p>
                 <p>Thank you — you've told us your payment has been sent. We'll verify it against the mosque account and confirm your membership, usually within a few days.</p>`,
              )
            )
              sentKind = "Payment being verified";
            break;
          case "active":
            if (
              await sendMemberEmail(
                req,
                email,
                "Welcome — your KMA membership is active",
                `<p>As-salāmu ʿalaykum ${d.firstName},</p>
                 <p>Your payment has been verified and your membership is now <b>active</b>.</p>
                 <p>Your membership number is <b>${d.membershipNumber}</b>. Your membership runs until <b>${fmtDate(new Date(d.expiryDate))}</b>.</p>
                 <p>Your membership card, payment history and the members' area are in your account: <a href="${account}">${account}</a></p>`,
              )
            )
              sentKind = "Membership activated";
            break;
          case "more-info-required":
            if (
              await sendMemberEmail(
                req,
                email,
                "KMA membership — we need a little more information",
                `<p>As-salāmu ʿalaykum ${d.firstName},</p>
                 <p>To continue reviewing your application <b>${d.applicationNumber}</b>, we need some more information:</p>
                 <p><i>${String(d.moreInfoRequest || "Please contact the mosque office.")}</i></p>
                 <p>Please reply to this email, or contact the mosque office.</p>`,
              )
            )
              sentKind = "More information requested";
            break;
          case "rejected":
            if (
              await sendMemberEmail(
                req,
                email,
                "KMA membership application decision",
                `<p>As-salāmu ʿalaykum ${d.firstName},</p>
                 <p>We're sorry — your membership application <b>${d.applicationNumber}</b> has not been approved on this occasion.</p>
                 ${d.decisionReason ? `<p><i>${String(d.decisionReason)}</i></p>` : ""}
                 <p>You are welcome to contact the mosque office to discuss this.</p>`,
              )
            )
              sentKind = "Application decision";
            break;
          case "renewal-due":
            // The reminder sweep sends the dated reminder emails; no email here.
            break;
        }
        if (sentKind) await recordCommunication(req.payload, d, { kind: sentKind, note: `Status email (${d.status})` });
        return doc;
      },
    ],
  },
  fields: [
    { name: "fullName", type: "text", admin: { hidden: true } },
    // ---- Applicant ---------------------------------------------------------
    section("👤 Applicant", [
      {
        type: "row",
        fields: [
          { name: "title", type: "select", options: ["Mr", "Mrs", "Miss", "Ms", "Dr", "Other"], admin: { width: "20%" } },
          { name: "firstName", type: "text", required: true, admin: { width: "40%" } },
          { name: "surname", type: "text", required: true, admin: { width: "40%" } },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "gender",
            type: "select",
            options: [
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" },
              { label: "Prefer not to say", value: "not-said" },
            ],
            admin: { width: "34%" },
          },
          { name: "dateOfBirth", type: "date", admin: { width: "33%", date: { pickerAppearance: "dayOnly" } } },
          { name: "username", type: "text", required: true, unique: true, admin: { width: "33%" } },
        ],
      },
    ]),
    // ---- Address & contact -------------------------------------------------
    section("🏠 Address & contact", [
      {
        type: "row",
        fields: [
          { name: "address1", type: "text", label: "Address line 1", admin: { width: "50%" } },
          { name: "address2", type: "text", label: "Address line 2", admin: { width: "50%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "townCity", type: "text", admin: { width: "30%" } },
          { name: "county", type: "text", admin: { width: "20%" } },
          { name: "postcode", type: "text", admin: { width: "20%" } },
          { name: "telephone", type: "text", admin: { width: "30%" } },
        ],
      },
    ]),
    // ---- Proposers & consents ---------------------------------------------
    section("🤝 Proposers", [proposerFields(1), proposerFields(2)], {
      collapsed: true,
      description: "The two current KMA members who proposed this applicant.",
    }),
    section(
      "✅ Consents at application",
      [
        {
          name: "consents",
          type: "group",
          label: false as never,
          fields: [
            { name: "accurate", type: "checkbox", label: "Confirmed information is accurate" },
            { name: "terms", type: "checkbox", label: "Agreed to membership terms" },
            { name: "privacy", type: "checkbox", label: "Agreed to privacy policy" },
            { name: "marketing", type: "checkbox", label: "Opted in to news & community updates" },
            { name: "recordedAt", type: "date", admin: { readOnly: true } },
          ],
        },
      ],
      { collapsed: true },
    ),
    // ---- Membership state (sidebar) ---------------------------------------
    {
      name: "status",
      type: "select",
      defaultValue: "pending-review",
      required: true,
      options: MEMBER_STATUSES as never,
      admin: {
        position: "sidebar",
        components: { Cell: "@/payload/components/MemberStatusCell#MemberStatusCell" },
        description:
          "Moving this drives the journey: approval mints the payment reference and emails instructions; Active (only after YOU have verified the bank payment) assigns the membership number and dates.",
      },
    },
    { name: "applicationNumber", type: "text", unique: true, admin: { position: "sidebar", readOnly: true } },
    { name: "membershipNumber", type: "text", admin: { position: "sidebar", readOnly: true } },
    {
      name: "assignedReviewer",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", description: "Who is handling this application." },
    },
    { name: "startDate", type: "date", label: "Membership start", admin: { position: "sidebar" } },
    { name: "expiryDate", type: "date", label: "Membership expiry", admin: { position: "sidebar" } },
    // ---- Decisions & payment ----------------------------------------------
    section("📝 Review & decision", [
      {
        name: "moreInfoRequest",
        type: "textarea",
        admin: {
          description: "Shown/emailed to the applicant when status is set to “More information required”.",
          condition: (data) => ["more-info-required", "pending-review"].includes(data?.status),
        },
      },
      {
        name: "decisionReason",
        type: "textarea",
        admin: { description: "Internal record of why the application was approved/rejected (emailed on rejection)." },
      },
      {
        name: "paymentReference",
        type: "text",
        admin: { readOnly: true, description: "The personal bank reference the member must use — generated on approval." },
      },
    ]),
    // ---- Fee & billing (pro-rata to the April renewal) ---------------------
    section("💷 Fee & billing", [
    {
      name: "fee",
      type: "group",
      label: false as never,
      admin: {
        description:
          "Calculated automatically on approval: monthly rate × months remaining until the annual renewal month. Adjust the discount/waiver (with a reason) BEFORE approving to change what the member is asked to pay — every change is recorded in the audit log.",
      },
      fields: [
        {
          name: "feePreview",
          type: "ui",
          admin: { components: { Field: "@/payload/components/FeePreview#FeePreview" } },
        },
        {
          type: "row",
          fields: [
            { name: "monthlyRate", type: "number", label: "Monthly rate (£)", admin: { width: "20%", readOnly: true } },
            { name: "monthsCharged", type: "number", admin: { width: "20%", readOnly: true } },
            { name: "amountDue", type: "number", label: "Prorated amount due (£)", admin: { width: "20%", readOnly: true } },
            { name: "amountPaid", type: "number", label: "Amount paid (£)", defaultValue: 0, admin: { width: "20%", description: "Edit for part-payments." } },
            { name: "outstanding", type: "number", label: "Outstanding (£)", admin: { width: "20%", readOnly: true, description: "Due − discount − paid. Kept in sync automatically." } },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "adjustment",
              type: "number",
              label: "Discount / waiver (£)",
              defaultValue: 0,
              admin: { width: "34%", description: "Subtracted from the amount due. Full amount = full waiver." },
            },
            { name: "adjustmentReason", type: "text", admin: { width: "66%", description: "Why (required for any discount/waiver)." } },
          ],
        },
        {
          name: "paymentStatus",
          type: "select",
          defaultValue: "not-due",
          options: PAYMENT_STATUSES as never,
          admin: {
            components: { Cell: "@/payload/components/MemberStatusCell#PaymentStatusCell" },
            description: "Kept up to date automatically from the amounts above; Overdue is set by the daily sweep.",
          },
        },
      ],
    },
    {
      name: "feeAudit",
      type: "array",
      label: "Fee audit trail",
      admin: {
        readOnly: true,
        initCollapsed: true,
        description: "Every change to the amounts — who and when. Written automatically.",
      },
      fields: [
        { name: "at", type: "date" },
        { name: "by", type: "text" },
        { name: "change", type: "text" },
      ],
    },
    ]),
    // ---- Payments ----------------------------------------------------------
    section("🧾 Payments", [
      {
        type: "row",
        fields: [
          { name: "reportedPaymentDate", type: "date", label: "Member says paid on", admin: { width: "34%", readOnly: true } },
          { name: "reportedPaymentRef", type: "text", label: "Member's stated reference", admin: { width: "33%", readOnly: true } },
          { name: "paymentConfirmedAt", type: "date", admin: { width: "33%", readOnly: true } },
        ],
      },
      {
        name: "proofOfPayment",
        type: "upload",
        relationTo: "media",
        admin: { description: "Optional proof the member uploaded." },
      },
      {
        name: "paymentHistory",
        type: "array",
        admin: { readOnly: true, initCollapsed: true, description: "Verified payments, newest last." },
        fields: [
          { name: "at", type: "date" },
          { name: "amount", type: "number" },
          { name: "reference", type: "text" },
          { name: "confirmedBy", type: "text" },
          { name: "note", type: "text" },
        ],
      },
    ]),
    // ---- Communications & reminders ---------------------------------------
    section(
      "💬 Communications & reminders",
      [
        {
          name: "communications",
          type: "array",
          admin: { readOnly: true, initCollapsed: true, description: "Every email and reminder sent to this member, newest last." },
          fields: [
            { name: "at", type: "date" },
            { name: "kind", type: "text" },
            { name: "channel", type: "text" },
            { name: "note", type: "text" },
          ],
        },
        {
          name: "remindersSent",
          type: "array",
          admin: { readOnly: true, initCollapsed: true, description: "Renewal reminders sent this membership cycle." },
          fields: [
            { name: "kind", type: "text" },
            { name: "at", type: "date" },
          ],
        },
        {
          name: "lastReminderAt",
          type: "date",
          admin: { readOnly: true, description: "When the most recent payment/renewal reminder was sent — filter on this to see who has (not) been chased." },
        },
      ],
      { collapsed: true },
    ),
    // ---- Staff-only bookkeeping -------------------------------------------
    section(
      "🗒 Internal notes & history",
      [
        {
          name: "internalNotes",
          type: "array",
          labels: { singular: "Note", plural: "Internal notes" },
          admin: { initCollapsed: true, description: "Never shown to the member." },
          fields: [
            { name: "note", type: "textarea", required: true },
            { name: "by", type: "text" },
            { name: "at", type: "date" },
          ],
        },
        {
          name: "statusHistory",
          type: "array",
          admin: { readOnly: true, initCollapsed: true, description: "The full journey, oldest first." },
          fields: [
            { name: "status", type: "text" },
            { name: "at", type: "date" },
            { name: "by", type: "text" },
          ],
        },
      ],
      { collapsed: true },
    ),
  ],
};

/* ---------------------------- Settings global ------------------------------ */
export const MembershipSettings: GlobalConfig = {
  slug: "membership-settings",
  label: "Membership settings",
  admin: {
    group: "Membership",
    description:
      "The fee, bank account, membership period and the public wording. Bank details live ONLY here — never in the code — and are shown solely to approved applicants who are due to pay.",
  },
  access: { read: isMembershipStaff, update: isAdmin },
  fields: [
    section(
      "💷 Fees & annual renewal",
      [
        {
          type: "row",
          fields: [
            {
              name: "annualFee",
              type: "select",
              label: "Annual fee (£)",
              defaultValue: "12",
              options: ONE_TO_TWELVE,
              admin: { width: "50%", description: "The full-year fee — pick 1 to 12." },
            },
            {
              name: "membershipPeriodMonths",
              type: "select",
              label: "Membership duration (months)",
              defaultValue: "12",
              options: ONE_TO_TWELVE,
              admin: { width: "50%", description: "How long a membership runs — pick 1 to 12." },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "monthlyRate",
              type: "number",
              label: "Monthly rate (£)",
              min: 0,
              admin: {
                width: "50%",
                description: "What pro-rata joiners pay per month. Leave empty to use annual fee ÷ 12.",
              },
            },
            {
              name: "renewalMonth",
              type: "select",
              label: "Renewal month",
              defaultValue: "4",
              options: [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December",
              ].map((m, i) => ({ label: m, value: String(i + 1) })),
              admin: {
                width: "50%",
                description: "ALL memberships renew on the 1st of this month — new joiners pay only for the months remaining.",
              },
            },
          ],
        },
      ],
      {
        description:
          "Example: April renewal, £12 a year → someone joining in December pays 4 months × £1 = £4, then renews with everyone else on 1 April.",
      },
    ),
    section("🏦 Bank account for fee payments", [
      {
        name: "bank",
        type: "group",
        label: false as never,
        fields: [
          { name: "accountName", type: "text" },
          {
            type: "row",
            fields: [
              { name: "sortCode", type: "text", admin: { width: "50%", description: "e.g. 12-34-56" } },
              { name: "accountNumber", type: "text", admin: { width: "50%" } },
            ],
          },
        ],
      },
      { name: "proofOfPaymentEnabled", type: "checkbox", defaultValue: true, label: "Let members upload proof of payment" },
    ], {
      description: "Shown ONLY to approved applicants who are due to pay — never on the public website.",
    }),
    section("📣 Public wording", [
      {
        name: "benefits",
        type: "richText",
        label: "Rights & benefits of membership",
        admin: { description: "Shown on the public membership page — edit freely, the wording is yours." },
      },
      {
        name: "terms",
        type: "richText",
        label: "Membership terms",
        admin: { description: "What applicants agree to when they tick “I agree to the membership terms”." },
      },
    ]),
  ],
};
