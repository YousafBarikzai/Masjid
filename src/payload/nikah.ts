import type { CollectionConfig, Payload } from "payload";
import {
  isAdmin,
  isNikahAdmin,
  isNikahAdminFieldLevel,
  isNikahStaff,
} from "./access";
import { section } from "./sections";

/* ============================================================================
   Nikah matrimonial service — a MOSQUE-MANAGED introduction service, not a
   dating app. One central backend serves the website, iOS and Android.

   Architecture decisions (the critical review the spec asked for):
   · Three-tier visibility, enforced SERVER-SIDE, never client-side:
       member-visible — what approved members of the opposite gender see
                        (reference code, age band, general area, background,
                        faith & about-me — NO name, NO photo, NO contacts)
       restricted    — first name, released only inside a mosque-managed
                       introduction after mutual interest
       mosque-only   — legal identity, DOB, contacts, address, wali,
                       references, verification, notes (field-level access)
   · V1 photo policy: NO photographs for anyone. Dignified, equal, and the
     safest possible launch; the policy lives in one place so it can change
     later without redevelopment.
   · No member-to-member messaging AT ALL. The only actions are structured
     expressions of interest; contact happens through the Nikah team and
     walis inside an introduction case (NI-####). This removes the single
     biggest safeguarding/moderation burden of matrimonial platforms.
   · Interests carry NO free text — nothing to moderate, nothing hurtful to
     receive. Declines are conveyed neutrally ("not taken forward").
   · Wali involvement: management mode chosen by the applicant (self / joint
     / wali-managed) and wali details are mandatory for sisters, strongly
     encouraged for brothers. A separate wali LOGIN is deferred to V2 — in
     V1 the Nikah team involves walis by phone/email at every introduction,
     which matches how the mosque actually operates today.
   · Anti-abuse: browse is capped per day, active interests are capped, a
     declined interest can never be re-sent to the same person, and every
     member can discreetly report a profile straight to a confidential
     safeguarding case queue that only nikah-admins can read.
   ============================================================================ */

export const NIKAH_STATUSES = [
  { label: "Submitted", value: "submitted" },
  { label: "Under review", value: "under-review" },
  { label: "More information required", value: "info-required" },
  { label: "Verification in progress", value: "verification" },
  { label: "Approved — profile live", value: "approved" },
  { label: "Paused (member request)", value: "paused" },
  { label: "Not approved", value: "rejected" },
  { label: "Suspended", value: "suspended" },
  { label: "Withdrawn", value: "withdrawn" },
] as const;

/** Statuses whose profiles appear in search/browse. */
export const LIVE_STATUSES = ["approved"];

export const MARITAL_STATUSES = [
  { label: "Never married", value: "never-married" },
  { label: "Divorced", value: "divorced" },
  { label: "Widowed", value: "widowed" },
] as const;

export const PRACTISING_LEVELS = [
  { label: "Very practising", value: "very" },
  { label: "Practising", value: "practising" },
  { label: "Moderately practising", value: "moderate" },
  { label: "Learning & growing", value: "growing" },
] as const;

export const EDUCATION_LEVELS = [
  { label: "Secondary school", value: "secondary" },
  { label: "College / A-levels", value: "college" },
  { label: "Apprenticeship / vocational", value: "vocational" },
  { label: "Bachelor's degree", value: "bachelors" },
  { label: "Master's degree", value: "masters" },
  { label: "Doctorate", value: "doctorate" },
  { label: "Islamic scholarship", value: "islamic-scholarship" },
] as const;

export const TIMEFRAMES = [
  { label: "As soon as a good match is found", value: "soon" },
  { label: "Within a year", value: "year" },
  { label: "In 1–2 years", value: "1-2-years" },
  { label: "No fixed timeframe", value: "open" },
] as const;

export const MANAGEMENT_MODES = [
  { label: "Self-managed", value: "self" },
  { label: "Jointly with my wali / family", value: "joint" },
  { label: "Managed by my wali / family", value: "wali" },
] as const;

export const INTRO_STATUSES = [
  { label: "New introduction", value: "new" },
  { label: "Awaiting wali contact", value: "awaiting-wali" },
  { label: "Families connected", value: "families-connected" },
  { label: "Meeting arranged", value: "meeting" },
  { label: "Considering", value: "considering" },
  { label: "Proceeding", value: "proceeding" },
  { label: "Paused", value: "intro-paused" },
  { label: "Not proceeding", value: "declined" },
  { label: "Engaged", value: "engaged" },
  { label: "Nikah arranged", value: "nikah-arranged" },
  { label: "Nikah completed — alhamdulillah", value: "completed" },
] as const;

const opts = <T extends readonly { label: string; value: string }[]>(o: T) => o as never;

/* ------------------------------- Helpers ---------------------------------- */

export function ageFromDob(dob: string | Date | undefined | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export async function sendNikahEmail(payload: Payload, to: string, subject: string, bodyHtml: string): Promise<boolean> {
  const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
  try {
    await payload.sendEmail({
      to,
      subject,
      html: `<div style="background:#f4f1e8;padding:24px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e7dfcb;">
          <div style="background:#0b3d2e;padding:18px 26px;">
            <div style="color:#e8d59a;font-size:12px;letter-spacing:.12em;font-weight:700;">KINGSTON MOSQUE · NIKAH SERVICE</div>
          </div>
          <div style="padding:22px 26px;color:#2b2922;font-size:15px;line-height:1.65;">${bodyHtml}</div>
          <div style="background:#f7f6f3;border-top:1px solid #ecebe6;padding:12px 26px;color:#6f6c63;font-size:12.5px;">
            This service is privately managed by Kingston Muslim Association ·
            <a href="${site}/nikah" style="color:#157f54;">${site.replace(/^https?:\/\//, "")}/nikah</a>
          </div>
        </div>
      </div>`,
    });
    return true;
  } catch (err) {
    payload.logger.warn(`Nikah email to ${to} failed: ${(err as Error).message}`);
    return false;
  }
}

/* ------------------------------ Profiles ----------------------------------- */

export const NikahProfiles: CollectionConfig = {
  slug: "nikah-profiles",
  labels: { singular: "Nikah application / member", plural: "Nikah Members" },
  auth: {
    tokenExpiration: 60 * 60 * 8, // shorter sessions than the general site — sensitive area
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: "Lax" },
  },
  admin: {
    group: "Nikah",
    useAsTitle: "fullName",
    defaultColumns: ["fullName", "gender", "reference", "status", "assignedReviewer", "createdAt"],
    listSearchableFields: ["firstName", "surname", "email", "reference", "townCity"],
    description:
      "Every nikah application and approved member. Members NEVER see each other's names or contact details — the anonymised matrimonial card is built server-side from this record. Move the Status to run the journey; approval mints the matrimonial reference and emails the member.",
    components: { beforeList: ["@/payload/components/NikahDashboard#NikahDashboard"] },
  },
  access: {
    // Applicants read their own record; nikah staff read all. Member-to-member
    // visibility NEVER touches this collection directly — only the browse API,
    // which builds the anonymised view.
    read: ({ req: { user }, id }) => {
      if (!user) return false;
      if ((user as { collection?: string }).collection === "nikah-profiles") {
        return id != null ? String(user.id) === String(id) : { id: { equals: user.id } };
      }
      return (isNikahStaff({ req: { user } } as never) as boolean) || false;
    },
    create: isNikahAdmin, // the public applies through the app-api route
    update: isNikahAdmin,
    delete: isAdmin,
    admin: ({ req: { user } }) => (user as { collection?: string } | null)?.collection === "users",
    unlock: isNikahAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req, context }) => {
        const d = data as Record<string, any>;
        if ((context as Record<string, unknown>)?.internal) return d;
        if (operation === "create") {
          d.status = d.status || "submitted";
          d.fullName = [d.firstName, d.surname].filter(Boolean).join(" ");
          d.statusHistory = [{ status: "submitted", at: new Date().toISOString(), by: "applicant" }];
          return d;
        }
        d.fullName = [d.firstName ?? originalDoc?.firstName, d.surname ?? originalDoc?.surname].filter(Boolean).join(" ");
        const prev = originalDoc?.status as string | undefined;
        const next = d.status as string | undefined;
        if (next && next !== prev) {
          const who = (req.user as { email?: string; collection?: string } | null)?.collection === "users"
            ? (req.user as { email?: string }).email || "staff"
            : "member";
          d.statusHistory = [
            ...((originalDoc?.statusHistory as unknown[]) || []),
            { status: next, at: new Date().toISOString(), by: who },
          ];
          // Approval: mint the matrimonial reference KM-M-#### / KM-F-####.
          if (next === "approved" && !originalDoc?.reference) {
            const gender = String(d.gender ?? originalDoc?.gender) === "female" ? "F" : "M";
            const { totalDocs } = await req.payload.count({
              collection: "nikah-profiles" as never,
              where: { reference: { exists: true } } as never,
              overrideAccess: true,
            });
            d.reference = `KM-${gender}-${String(100 + totalDocs + 1).padStart(5, "0")}`;
            d.approvedAt = new Date().toISOString();
          }
        }
        return d;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        const d = doc as Record<string, any>;
        if ((context as Record<string, unknown>)?.internal || operation === "create") return doc;
        const prev = (previousDoc as Record<string, any>)?.status;
        if (!d.status || d.status === prev || !d.email) return doc;
        const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
        const account = `${site}/nikah/account`;
        switch (d.status) {
          case "approved":
            await sendNikahEmail(
              req.payload,
              d.email,
              "Your Kingston Mosque Nikah profile is now live",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>Alhamdulillah — your application has been approved. Your matrimonial reference is <b>${d.reference}</b>.</p>
               <p>Your profile is now visible to approved members, always anonymously: no name, photograph or contact details are ever shown. You can now sign in to browse profiles and express interest:</p>
               <p><a href="${account}">${account}</a></p>
               <p>May Allah put barakah in your search.</p>`,
            );
            break;
          case "info-required":
            await sendNikahEmail(
              req.payload,
              d.email,
              "Your nikah application — a little more information needed",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>To continue reviewing your application, we need some more information:</p>
               <p><i>${String(d.infoRequest || "Please contact the Nikah team at the mosque office.")}</i></p>
               <p>Please reply to this email or contact the mosque office.</p>`,
            );
            break;
          case "rejected":
            await sendNikahEmail(
              req.payload,
              d.email,
              "Your Kingston Mosque nikah application",
              `<p>As-salāmu ʿalaykum ${d.firstName},</p>
               <p>Thank you for applying to the Kingston Mosque Nikah Service. After careful review, we are unable to approve your application at this time.</p>
               <p>You are very welcome to contact the mosque office in confidence if you would like to discuss this.</p>`,
            );
            break;
        }
        return doc;
      },
    ],
  },
  fields: [
    { name: "fullName", type: "text", admin: { hidden: true } },
    // ---- Identity (mosque-only) -------------------------------------------
    section("🪪 Identity — mosque only, never shown to members", [
      {
        type: "row",
        fields: [
          { name: "firstName", type: "text", required: true, admin: { width: "34%" } },
          { name: "surname", type: "text", required: true, access: { read: isNikahAdminFieldLevel }, admin: { width: "33%" } },
          {
            name: "gender",
            type: "select",
            required: true,
            options: [
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ],
            admin: { width: "33%" },
          },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "dateOfBirth",
            type: "date",
            required: true,
            access: { read: isNikahAdminFieldLevel },
            admin: { width: "34%", date: { pickerAppearance: "dayOnly" }, description: "Members only ever see the age." },
          },
          { name: "telephone", type: "text", access: { read: isNikahAdminFieldLevel }, admin: { width: "33%" } },
          { name: "postcode", type: "text", access: { read: isNikahAdminFieldLevel }, admin: { width: "33%" } },
        ],
      },
    ]),
    // ---- The matrimonial profile (member-visible fields) -------------------
    section("💠 Matrimonial profile — what approved members see (anonymised)", [
      {
        type: "row",
        fields: [
          { name: "townCity", type: "text", label: "Town / general area", admin: { width: "34%", description: "Shown as the general area only." } },
          { name: "heightCm", type: "number", label: "Height (cm)", min: 100, max: 230, admin: { width: "33%" } },
          { name: "ethnicity", type: "text", admin: { width: "33%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "languages", type: "text", admin: { width: "50%", description: "e.g. English, Urdu, Arabic" } },
          {
            name: "maritalStatus",
            type: "select",
            options: opts(MARITAL_STATUSES),
            admin: { width: "50%" },
          },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "hasChildren", type: "checkbox", label: "Has children", admin: { width: "34%" } },
          { name: "childrenDetails", type: "text", admin: { width: "66%", description: "e.g. “2 children, living with me” — shown to members.", condition: (data) => Boolean(data?.hasChildren) } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "practising", type: "select", options: opts(PRACTISING_LEVELS), admin: { width: "34%" } },
          {
            name: "background",
            type: "select",
            options: [
              { label: "Born Muslim", value: "born" },
              { label: "Revert", value: "revert" },
            ],
            admin: { width: "33%" },
          },
          { name: "educationLevel", type: "select", options: opts(EDUCATION_LEVELS), admin: { width: "33%" } },
        ],
      },
      { name: "profession", type: "text", admin: { description: "General profession only — never the employer's name." } },
      { name: "faithNotes", type: "textarea", label: "Faith & practice (in their words)" },
      { name: "aboutMe", type: "textarea", label: "About me" },
      { name: "familyBackground", type: "textarea", label: "Family background (brief)" },
      {
        type: "row",
        fields: [
          { name: "timeframe", type: "select", options: opts(TIMEFRAMES), admin: { width: "34%" } },
          { name: "willingToRelocate", type: "checkbox", admin: { width: "33%" } },
          { name: "relocateWhere", type: "text", admin: { width: "33%", condition: (data) => Boolean(data?.willingToRelocate) } },
        ],
      },
      { name: "lookingFor", type: "textarea", label: "What they are looking for" },
      { name: "essentials", type: "textarea", label: "Essential requirements (non-negotiables)" },
      {
        type: "row",
        fields: [
          { name: "prefAgeMin", type: "number", label: "Preferred age from", min: 18, max: 90, admin: { width: "34%" } },
          { name: "prefAgeMax", type: "number", label: "to", min: 18, max: 90, admin: { width: "33%" } },
          { name: "acceptsChildren", type: "checkbox", label: "Open to a spouse with children", admin: { width: "33%" } },
        ],
      },
    ]),
    // ---- Wali & references (mosque-only) -----------------------------------
    section(
      "👪 Wali & references — mosque only",
      [
        {
          name: "managementMode",
          type: "select",
          defaultValue: "joint",
          options: opts(MANAGEMENT_MODES),
          admin: { description: "How the member chose to run their search. The Nikah team contacts the wali at every introduction." },
        },
        {
          name: "wali",
          type: "group",
          label: false as never,
          access: { read: isNikahAdminFieldLevel },
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", type: "text", admin: { width: "30%" } },
                { name: "relationship", type: "text", admin: { width: "20%" } },
                { name: "phone", type: "text", admin: { width: "25%" } },
                { name: "email", type: "text", admin: { width: "25%" } },
              ],
            },
          ],
        },
        {
          name: "reference",
          type: "text",
          label: "Matrimonial reference",
          unique: true,
          admin: { readOnly: true, description: "KM-M-##### / KM-F-##### — minted on approval; the ONLY identifier members ever see." },
        },
        {
          name: "communityReference",
          type: "group",
          label: "Community / imam reference (optional)",
          access: { read: isNikahAdminFieldLevel },
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", type: "text", admin: { width: "40%" } },
                { name: "phone", type: "text", admin: { width: "30%" } },
                { name: "notes", type: "text", admin: { width: "30%" } },
              ],
            },
          ],
        },
      ],
      { collapsed: true },
    ),
    // ---- Verification (nikah-admins only) ----------------------------------
    section(
      "🛡 Verification — nikah admins only",
      [
        {
          name: "verification",
          type: "group",
          label: false as never,
          access: { read: isNikahAdminFieldLevel, update: isNikahAdminFieldLevel },
          fields: [
            {
              type: "row",
              fields: [
                { name: "identityChecked", type: "checkbox", label: "Identity seen & checked", admin: { width: "34%" } },
                { name: "waliContacted", type: "checkbox", label: "Wali spoken to", admin: { width: "33%" } },
                { name: "referenceChecked", type: "checkbox", label: "Reference checked", admin: { width: "33%" } },
              ],
            },
            {
              name: "notes",
              type: "textarea",
              admin: {
                description:
                  "Record WHAT was checked and when — never store copies of identity documents in the CMS. Documents are seen in person or kept in the office's secure records.",
              },
            },
          ],
        },
      ],
      { collapsed: true },
    ),
    // ---- Administration ----------------------------------------------------
    section(
      "🗂 Administration",
      [
        {
          name: "infoRequest",
          type: "textarea",
          admin: {
            description: "Emailed to the applicant when status is set to “More information required”.",
            condition: (data) => ["info-required", "submitted", "under-review"].includes(String(data?.status)),
          },
        },
        {
          name: "internalNotes",
          type: "array",
          labels: { singular: "Note", plural: "Internal notes" },
          admin: { initCollapsed: true, description: "Never visible to any member." },
          fields: [
            { name: "note", type: "textarea", required: true },
            { name: "by", type: "text" },
            { name: "at", type: "date" },
          ],
        },
        {
          name: "statusHistory",
          type: "array",
          admin: { readOnly: true, initCollapsed: true, description: "The full journey — who moved it and when." },
          fields: [
            { name: "status", type: "text" },
            { name: "at", type: "date" },
            { name: "by", type: "text" },
          ],
        },
      ],
      { collapsed: true },
    ),
    // ---- Sidebar ------------------------------------------------------------
    {
      name: "status",
      type: "select",
      defaultValue: "submitted",
      required: true,
      options: opts(NIKAH_STATUSES),
      admin: {
        position: "sidebar",
        components: { Cell: "@/payload/components/MemberStatusCell#NikahStatusCell" },
        description:
          "Approval mints the matrimonial reference, emails the member and makes the anonymised profile visible to approved members of the opposite gender.",
      },
    },
    {
      name: "assignedReviewer",
      type: "relationship",
      relationTo: "users",
      admin: { position: "sidebar", description: "Who is handling this application." },
    },
    { name: "approvedAt", type: "date", admin: { position: "sidebar", readOnly: true } },
    {
      name: "profileHidden",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Tick to hide from search without changing status (also settable by the member as “pause my profile”)." },
    },
    {
      name: "source",
      type: "select",
      defaultValue: "website",
      options: [
        { label: "Website", value: "website" },
        { label: "iOS app", value: "ios" },
        { label: "Android app", value: "android" },
      ],
      admin: { position: "sidebar", readOnly: true },
    },
  ],
};

/* --------------------------- Expressions of interest ----------------------- */

export const NikahInterests: CollectionConfig = {
  slug: "nikah-interests",
  labels: { singular: "Expression of interest", plural: "Expressions of Interest" },
  admin: {
    group: "Nikah",
    defaultColumns: ["from", "to", "status", "createdAt", "decidedAt"],
    description:
      "Structured expressions of interest — no messages, no contact details, ever. A mutual acceptance automatically opens an Introduction case for the Nikah team.",
  },
  access: {
    read: isNikahStaff, // members use the app-api, which scopes to their own
    create: isNikahAdmin,
    update: isNikahAdmin,
    delete: isAdmin,
  },
  fields: [
    section("💌 Interest", [
      {
        type: "row",
        fields: [
          { name: "from", type: "relationship", relationTo: "nikah-profiles" as never, required: true, admin: { width: "50%" } },
          { name: "to", type: "relationship", relationTo: "nikah-profiles" as never, required: true, admin: { width: "50%" } },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "status",
            type: "select",
            defaultValue: "pending",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Accepted — mutual interest", value: "accepted" },
              { label: "Not taken forward", value: "declined" },
              { label: "Withdrawn", value: "withdrawn" },
              { label: "Expired", value: "expired" },
            ],
            admin: { width: "50%" },
          },
          { name: "decidedAt", type: "date", admin: { width: "50%", readOnly: true } },
        ],
      },
    ]),
  ],
};

/* ------------------------------ Introductions ------------------------------ */

export const NikahIntroductions: CollectionConfig = {
  slug: "nikah-introductions",
  labels: { singular: "Introduction", plural: "Introductions" },
  admin: {
    group: "Nikah",
    useAsTitle: "reference",
    defaultColumns: ["reference", "status", "followUpDate", "updatedAt"],
    description:
      "Official introduction cases (NI-#####), opened automatically on mutual interest. The Nikah team contacts both walis, connects the families and records progress here — members never exchange contact details through the platform.",
  },
  access: { read: isNikahStaff, create: isNikahAdmin, update: isNikahAdmin, delete: isAdmin },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req, context }) => {
        const d = data as Record<string, any>;
        if ((context as Record<string, unknown>)?.internal) return d;
        if (operation === "create" && !d.reference) {
          const { totalDocs } = await req.payload.count({ collection: "nikah-introductions" as never, overrideAccess: true });
          d.reference = `NI-${String(totalDocs + 1).padStart(5, "0")}`;
          d.timeline = [{ status: d.status || "new", at: new Date().toISOString(), by: "system" }];
        } else if (operation === "update" && d.status && d.status !== originalDoc?.status) {
          const who = (req.user as { email?: string } | null)?.email || "staff";
          d.timeline = [
            ...((originalDoc?.timeline as unknown[]) || []),
            { status: d.status, at: new Date().toISOString(), by: who },
          ];
        }
        return d;
      },
    ],
  },
  fields: [
    section("🤝 Introduction", [
      { name: "reference", type: "text", unique: true, admin: { readOnly: true } },
      {
        type: "row",
        fields: [
          { name: "brother", type: "relationship", relationTo: "nikah-profiles" as never, required: true, admin: { width: "50%" } },
          { name: "sister", type: "relationship", relationTo: "nikah-profiles" as never, required: true, admin: { width: "50%" } },
        ],
      },
      { name: "interest", type: "relationship", relationTo: "nikah-interests" as never, admin: { description: "The mutual interest that opened this case." } },
      {
        type: "row",
        fields: [
          { name: "followUpDate", type: "date", admin: { width: "50%", description: "Next check-in with the families." } },
          { name: "assignedTo", type: "relationship", relationTo: "users", admin: { width: "50%" } },
        ],
      },
    ]),
    section(
      "🗒 Case notes & timeline",
      [
        {
          name: "notes",
          type: "array",
          labels: { singular: "Note", plural: "Case notes" },
          admin: { initCollapsed: true, description: "Confidential — wali calls, family conversations, meeting arrangements." },
          fields: [
            { name: "note", type: "textarea", required: true },
            { name: "by", type: "text" },
            { name: "at", type: "date" },
          ],
        },
        {
          name: "timeline",
          type: "array",
          admin: { readOnly: true, initCollapsed: true },
          fields: [
            { name: "status", type: "text" },
            { name: "at", type: "date" },
            { name: "by", type: "text" },
          ],
        },
      ],
      { collapsed: true },
    ),
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      required: true,
      options: opts(INTRO_STATUSES),
      admin: {
        position: "sidebar",
        components: { Cell: "@/payload/components/MemberStatusCell#IntroStatusCell" },
        description: "Every change is stamped into the timeline with who and when.",
      },
    },
  ],
};

/* ---------------------------- Safeguarding cases --------------------------- */

export const NikahCases: CollectionConfig = {
  slug: "nikah-cases",
  labels: { singular: "Safeguarding case", plural: "Nikah Safeguarding" },
  admin: {
    group: "Nikah",
    defaultColumns: ["category", "status", "about", "createdAt"],
    description:
      "Confidential reports from members (inappropriate behaviour, false information, misuse…). Visible ONLY to nikah administrators — kept entirely separate from routine application admin.",
  },
  // Deliberately NOT audit-logged into the general audit collection and NOT
  // visible to reviewers: safeguarding stays on a strict need-to-know basis.
  access: { read: isNikahAdmin, create: isNikahAdmin, update: isNikahAdmin, delete: isAdmin },
  fields: [
    section("🛡 Report", [
      {
        type: "row",
        fields: [
          { name: "reportedBy", type: "relationship", relationTo: "nikah-profiles" as never, admin: { width: "50%" } },
          { name: "about", type: "relationship", relationTo: "nikah-profiles" as never, admin: { width: "50%", description: "The profile the report concerns." } },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "category",
            type: "select",
            options: [
              { label: "Inappropriate behaviour", value: "behaviour" },
              { label: "False information", value: "false-info" },
              { label: "Harassment", value: "harassment" },
              { label: "Suspected fraud", value: "fraud" },
              { label: "Misuse of the service", value: "misuse" },
              { label: "Other concern", value: "other" },
            ],
            admin: { width: "50%" },
          },
          {
            name: "status",
            type: "select",
            defaultValue: "new",
            options: [
              { label: "New", value: "new" },
              { label: "Investigating", value: "investigating" },
              { label: "Action taken", value: "action-taken" },
              { label: "Closed", value: "closed" },
            ],
            admin: { width: "50%" },
          },
        ],
      },
      { name: "details", type: "textarea", admin: { description: "The member's report, verbatim." } },
      {
        name: "actions",
        type: "array",
        labels: { singular: "Action", plural: "Actions taken" },
        admin: { initCollapsed: true },
        fields: [
          { name: "action", type: "textarea", required: true },
          { name: "by", type: "text" },
          { name: "at", type: "date" },
        ],
      },
    ]),
  ],
};
