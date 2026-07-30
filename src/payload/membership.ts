import type { CollectionConfig, GlobalConfig, PayloadRequest } from "payload";
import { isAdmin, isMembershipStaff } from "./access";

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
  { label: "1 · Pending review", value: "pending-review" },
  { label: "More information required", value: "more-info-required" },
  { label: "2 · Approved — payment required", value: "approved-payment-required" },
  { label: "3 · Payment being verified", value: "payment-verification" },
  { label: "4 · Active member", value: "active" },
  { label: "Renewal due", value: "renewal-due" },
  { label: "Renewal pending (payment reported)", value: "renewal-pending" },
  { label: "Expired", value: "expired" },
  { label: "Rejected", value: "rejected" },
] as const;

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

async function sendMemberEmail(req: PayloadRequest, to: string, subject: string, html: string) {
  try {
    await req.payload.sendEmail({ to, subject, html });
  } catch (err) {
    req.payload.logger.warn(`Membership email to ${to} failed: ${(err as Error).message}`);
  }
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
      async ({ data, originalDoc, operation, req }) => {
        const d = data as Record<string, any>;

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
          return d;
        }

        // Keep the display name in sync.
        const first = d.firstName ?? originalDoc?.firstName;
        const sur = d.surname ?? originalDoc?.surname;
        const title = d.title ?? originalDoc?.title;
        d.fullName = [title, first, sur].filter(Boolean).join(" ");

        const prev = originalDoc?.status as string | undefined;
        const next = d.status as string | undefined;
        if (!next || next === prev) return d;

        const who =
          (req.user as { email?: string; collection?: string } | null)?.collection === "users"
            ? (req.user as { email?: string }).email || "staff"
            : "member";
        d.statusHistory = [
          ...((originalDoc?.statusHistory as unknown[]) || []),
          { status: next, at: new Date().toISOString(), by: who },
        ];

        // Approval: mint the personal payment reference.
        if (next === "approved-payment-required" && !originalDoc?.paymentReference) {
          d.paymentReference = paymentReferenceFor(
            String(originalDoc?.applicationNumber || d.applicationNumber || "KMA"),
            String(sur || ""),
          );
        }

        // Activation (first time or renewal): staff-verified payment only.
        if (next === "active") {
          const settings = (await req.payload
            .findGlobal({ slug: "membership-settings" as never })
            .catch(() => null)) as Record<string, any> | null;
          const months = Number(settings?.membershipPeriodMonths) || 12;
          const start = new Date();
          const expiry =
            prev === "renewal-due" || prev === "renewal-pending"
              ? new Date(
                  Math.max(Date.now(), new Date(originalDoc?.expiryDate || Date.now()).getTime()),
                )
              : start;
          const newExpiry = new Date(expiry);
          newExpiry.setMonth(newExpiry.getMonth() + months);
          if (!originalDoc?.membershipNumber) {
            d.membershipNumber = `KMA-M-${String(1000 + Number(originalDoc?.id ?? 0))}`;
            d.startDate = start.toISOString();
          }
          d.expiryDate = newExpiry.toISOString();
          d.paymentConfirmedAt = new Date().toISOString();
          d.paymentHistory = [
            ...((originalDoc?.paymentHistory as unknown[]) || []),
            {
              at: new Date().toISOString(),
              reference: originalDoc?.reportedPaymentRef || originalDoc?.paymentReference || "",
              confirmedBy: who,
              note: prev === "renewal-pending" || prev === "renewal-due" ? "Renewal" : "First membership fee",
            },
          ];
          d.remindersSent = []; // fresh cycle, fresh reminders
        }

        return d;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const d = doc as Record<string, any>;
        const email = String(d.email || "");
        if (!email) return doc;
        const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
        const account = `${site}/membership/account`;

        if (operation === "create") {
          await sendMemberEmail(
            req,
            email,
            "Your KMA membership application has been received",
            `<p>As-salāmu ʿalaykum ${d.firstName},</p>
             <p>Thank you for applying to become a member of Kingston Muslim Association. Your application number is <b>${d.applicationNumber}</b>.</p>
             <p>Your application is now <b>under review</b>. You can sign in at any time to check progress:</p>
             <p><a href="${account}">${account}</a></p>
             <p>We will email you as soon as it moves forward.</p>`,
          );
          return doc;
        }

        const prev = (previousDoc as Record<string, any>)?.status;
        if (!d.status || d.status === prev) return doc;

        const settings = (await req.payload
          .findGlobal({ slug: "membership-settings" as never })
          .catch(() => null)) as Record<string, any> | null;
        const fee = Number(settings?.annualFee ?? 12);

        switch (d.status) {
          case "approved-payment-required":
            await sendMemberEmail(
              req,
              email,
              "KMA membership approved — payment required",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>Good news — your membership application <b>${d.applicationNumber}</b> has been <b>approved</b>.</p>
               <p>To activate your membership, please pay the annual fee of <b>£${fee}</b> by bank transfer. Your secure payment instructions (including the account details and your personal payment reference <b>${d.paymentReference}</b>) are in your account:</p>
               <p><a href="${account}">${account}</a></p>
               <p>Once you have paid, tell us in your account and we will verify it and activate your membership.</p>`,
            );
            break;
          case "payment-verification":
            await sendMemberEmail(
              req,
              email,
              "We're verifying your KMA membership payment",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>Thank you — you've told us your payment has been sent. We'll verify it against the mosque account and confirm your membership, usually within a few days.</p>`,
            );
            break;
          case "active":
            await sendMemberEmail(
              req,
              email,
              "Welcome — your KMA membership is active",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>Your payment has been verified and your membership is now <b>active</b>.</p>
               <p>Your membership number is <b>${d.membershipNumber}</b>. Your membership runs until <b>${fmtDate(new Date(d.expiryDate))}</b>.</p>
               <p>Your membership card and details are in your account: <a href="${account}">${account}</a></p>`,
            );
            break;
          case "more-info-required":
            await sendMemberEmail(
              req,
              email,
              "KMA membership — we need a little more information",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>To continue reviewing your application <b>${d.applicationNumber}</b>, we need some more information:</p>
               <p><i>${String(d.moreInfoRequest || "Please contact the mosque office.")}</i></p>
               <p>Please reply to this email, or contact the mosque office.</p>`,
            );
            break;
          case "rejected":
            await sendMemberEmail(
              req,
              email,
              "KMA membership application decision",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>We're sorry — your membership application <b>${d.applicationNumber}</b> has not been approved on this occasion.</p>
               ${d.decisionReason ? `<p><i>${String(d.decisionReason)}</i></p>` : ""}
               <p>You are welcome to contact the mosque office to discuss this.</p>`,
            );
            break;
          case "renewal-due":
            // The reminder sweep sends the dated reminder emails; no email here.
            break;
        }
        return doc;
      },
    ],
  },
  fields: [
    // ---- Identity ----------------------------------------------------------
    { name: "fullName", type: "text", admin: { hidden: true } },
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
          admin: { width: "50%" },
        },
        { name: "dateOfBirth", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayOnly" } } },
      ],
    },
    { name: "username", type: "text", required: true, unique: true },
    // ---- Address & contact -------------------------------------------------
    { name: "address1", type: "text", label: "Address line 1" },
    { name: "address2", type: "text", label: "Address line 2" },
    {
      type: "row",
      fields: [
        { name: "townCity", type: "text", admin: { width: "40%" } },
        { name: "county", type: "text", admin: { width: "30%" } },
        { name: "postcode", type: "text", admin: { width: "30%" } },
      ],
    },
    { name: "telephone", type: "text" },
    // ---- Proposers ---------------------------------------------------------
    proposerFields(1),
    proposerFields(2),
    // ---- Consents (timestamped at application) -----------------------------
    {
      name: "consents",
      type: "group",
      fields: [
        { name: "accurate", type: "checkbox", label: "Confirmed information is accurate" },
        { name: "terms", type: "checkbox", label: "Agreed to membership terms" },
        { name: "privacy", type: "checkbox", label: "Agreed to privacy policy" },
        { name: "marketing", type: "checkbox", label: "Opted in to news & community updates" },
        { name: "recordedAt", type: "date", admin: { readOnly: true } },
      ],
    },
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
    {
      type: "row",
      fields: [
        { name: "reportedPaymentDate", type: "date", label: "Member says paid on", admin: { width: "50%", readOnly: true } },
        { name: "reportedPaymentRef", type: "text", label: "Member's stated reference", admin: { width: "50%", readOnly: true } },
      ],
    },
    {
      name: "proofOfPayment",
      type: "upload",
      relationTo: "media",
      admin: { description: "Optional proof the member uploaded." },
    },
    { name: "paymentConfirmedAt", type: "date", admin: { readOnly: true } },
    {
      name: "paymentHistory",
      type: "array",
      admin: { readOnly: true, description: "Verified payments, newest last." },
      fields: [
        { name: "at", type: "date" },
        { name: "reference", type: "text" },
        { name: "confirmedBy", type: "text" },
        { name: "note", type: "text" },
      ],
    },
    // ---- Staff-only bookkeeping -------------------------------------------
    {
      name: "internalNotes",
      type: "array",
      labels: { singular: "Note", plural: "Internal notes" },
      admin: { description: "Never shown to the member." },
      fields: [
        { name: "note", type: "textarea", required: true },
        { name: "by", type: "text" },
        { name: "at", type: "date" },
      ],
    },
    {
      name: "statusHistory",
      type: "array",
      admin: { readOnly: true, description: "The full journey, oldest first." },
      fields: [
        { name: "status", type: "text" },
        { name: "at", type: "date" },
        { name: "by", type: "text" },
      ],
    },
    {
      name: "remindersSent",
      type: "array",
      admin: { readOnly: true, description: "Renewal reminders sent this membership cycle." },
      fields: [
        { name: "kind", type: "text" },
        { name: "at", type: "date" },
      ],
    },
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
    {
      type: "row",
      fields: [
        {
          name: "annualFee",
          type: "number",
          defaultValue: 12,
          min: 0,
          admin: { width: "50%", description: "Annual membership fee in £." },
        },
        {
          name: "membershipPeriodMonths",
          type: "number",
          defaultValue: 12,
          min: 1,
          admin: { width: "50%", description: "How long a membership runs from activation (months)." },
        },
      ],
    },
    {
      name: "bank",
      type: "group",
      label: "KMA bank account (shown to approved applicants only)",
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
    {
      name: "benefits",
      type: "richText",
      label: "Rights & benefits of membership (public)",
      admin: { description: "Shown on the public membership page — edit freely, the wording is yours." },
    },
    {
      name: "terms",
      type: "richText",
      label: "Membership terms (public)",
      admin: { description: "What applicants agree to when they tick “I agree to the membership terms”." },
    },
  ],
};
