import type { CollectionConfig, PayloadRequest, Payload } from "payload";
import {
  isAdmin,
  isVolunteerManager,
  isVolunteerManagerFieldLevel,
  isVolunteerStaff,
} from "./access";
import { section } from "./sections";

/* ============================================================================
   Volunteer registration & management — one central database behind the
   website form, the iOS/Android apps and the CMS.

   Design decisions (the "critical review" the spec asked for):
   · No volunteer login in V1 — registering must take two minutes from a QR
     code. Volunteers update details via the office; accounts can come later.
   · Data minimisation: age GROUP not date of birth, no address (postcode
     optional), no sensitive data at registration. Guardian details only for
     under-18s. DBS/safeguarding documents are NEVER uploaded here — only a
     status the office maintains after checking them offline.
   · Categories are CMS content (two small collections), so staff can add,
     rename, reorder, hide or gender-mark activities with zero code changes.
   · Sensitive roles (janazah/funeral team) are seeded publiclySelectable:false
     — staff assign them by hand; the public never sees them on the form.
   · Roles around children / the elderly / new Muslims carry a safeguarding
     flag: the form shows a friendly notice, the profile shows a badge, and
     the office tracks the check via safeguarding status.
   ============================================================================ */

export const VOLUNTEER_STATUSES = [
  { label: "New", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Approved", value: "approved" },
  { label: "Active", value: "active" },
  { label: "Requires follow-up", value: "follow-up" },
  { label: "Inactive", value: "inactive" },
] as const;

export const AGE_GROUPS = ["Under 16", "16–17", "18–25", "26–40", "41–60", "61+"] as const;
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const TIMES = ["Morning", "Afternoon", "Evening", "After Salah", "Flexible"] as const;
export const FREQUENCIES = [
  "Regularly",
  "A few times a month",
  "Occasionally",
  "Events only",
  "Ramadan only",
  "Eid only",
  "Whenever help is needed",
] as const;
export const LANGUAGES = [
  "English", "Arabic", "Urdu", "Punjabi", "Bengali", "Somali", "Turkish", "Pashto", "Dari", "Other",
] as const;
export const CONTACT_METHODS = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Phone", value: "phone" },
  { label: "Email", value: "email" },
  { label: "No preference", value: "any" },
] as const;

const opts = (list: readonly string[]) => list.map((v) => ({ label: v, value: v }));

/* ------------------------- Category administration ------------------------- */

export const VolunteerCategoryGroups: CollectionConfig = {
  slug: "volunteer-category-groups",
  labels: { singular: "Volunteer area", plural: "Volunteer Areas" },
  admin: {
    group: "Volunteers",
    useAsTitle: "name",
    defaultColumns: ["name", "icon", "order", "active", "updatedAt"],
    description:
      "The sections of the volunteer form (Events, Ramadan, Food & Hospitality…). Add an area here, then add its activities under Volunteer Activities — the website and apps update automatically.",
  },
  access: { read: () => true, create: isVolunteerManager, update: isVolunteerManager, delete: isAdmin },
  defaultSort: "order",
  fields: [
    section("🗂 Area", [
      {
        type: "row",
        fields: [
          { name: "name", type: "text", required: true, admin: { width: "40%" } },
          { name: "icon", type: "text", admin: { width: "20%", description: "An emoji, e.g. 🌙" } },
          { name: "order", type: "number", defaultValue: 0, admin: { width: "20%", description: "Lowest first." } },
          { name: "active", type: "checkbox", defaultValue: true, admin: { width: "20%", description: "Untick to hide the whole area." } },
        ],
      },
      { name: "description", type: "text", admin: { description: "One friendly line shown under the area heading (optional)." } },
    ]),
  ],
};

export const VolunteerCategories: CollectionConfig = {
  slug: "volunteer-categories",
  labels: { singular: "Volunteer activity", plural: "Volunteer Activities" },
  admin: {
    group: "Volunteers",
    useAsTitle: "name",
    defaultColumns: ["name", "group", "audience", "safeguarding", "active", "order"],
    description:
      "Every activity a volunteer can choose. Tick the flags that apply — safeguarding shows a notice on the form, “not publicly selectable” hides sensitive roles (e.g. janazah team) so only staff can assign them.",
  },
  access: { read: () => true, create: isVolunteerManager, update: isVolunteerManager, delete: isAdmin },
  defaultSort: "order",
  fields: [
    section("🏷 Activity", [
      {
        type: "row",
        fields: [
          { name: "name", type: "text", required: true, admin: { width: "50%" } },
          {
            name: "group",
            type: "relationship",
            relationTo: "volunteer-category-groups" as never,
            required: true,
            admin: { width: "30%", description: "Which area it appears under." },
          },
          { name: "order", type: "number", defaultValue: 0, admin: { width: "20%", description: "Within the area — lowest first." } },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "audience",
            type: "select",
            defaultValue: "general",
            options: [
              { label: "General / shared", value: "general" },
              { label: "Brothers", value: "brothers" },
              { label: "Sisters", value: "sisters" },
            ],
            admin: { width: "34%" },
          },
          { name: "active", type: "checkbox", defaultValue: true, admin: { width: "33%", description: "Untick to hide from the form." } },
          { name: "popular", type: "checkbox", defaultValue: false, admin: { width: "33%", description: "Show in “most needed” highlights." } },
        ],
      },
    ]),
    section(
      "🛡 Safeguarding & visibility",
      [
        {
          type: "row",
          fields: [
            {
              name: "safeguarding",
              type: "checkbox",
              defaultValue: false,
              admin: { width: "34%", description: "Involves children or vulnerable people — the form shows a safeguarding notice." },
            },
            {
              name: "requiresDbs",
              type: "checkbox",
              defaultValue: false,
              admin: { width: "33%", description: "A DBS check is needed before taking part." },
            },
            {
              name: "requiresApproval",
              type: "checkbox",
              defaultValue: false,
              admin: { width: "33%", description: "Staff approval/qualification check needed (e.g. first aid, electrics)." },
            },
          ],
        },
        {
          name: "publiclySelectable",
          type: "checkbox",
          defaultValue: true,
          admin: {
            description:
              "Untick for sensitive roles (e.g. janazah/funeral team): hidden from the public form — staff assign volunteers to it here in the CMS.",
          },
        },
      ],
      { collapsed: true },
    ),
  ],
};

/* -------------------------------- Volunteers ------------------------------- */

async function sendVolunteerEmail(payload: Payload, to: string, subject: string, html: string): Promise<boolean> {
  try {
    await payload.sendEmail({ to, subject, html });
    return true;
  } catch (err) {
    payload.logger.warn(`Volunteer email to ${to} failed: ${(err as Error).message}`);
    return false;
  }
}
export { sendVolunteerEmail };

export const Volunteers: CollectionConfig = {
  slug: "volunteers",
  labels: { singular: "Volunteer", plural: "Volunteers" },
  admin: {
    group: "Volunteers",
    useAsTitle: "fullName",
    defaultColumns: ["fullName", "gender", "ageGroup", "mobile", "status", "createdAt", "lastContactedAt"],
    listSearchableFields: ["fullName", "email", "mobile", "postcode"],
    description:
      "Everyone who has registered to volunteer — from the website, iOS or Android app, they all land here. Use the Filters button (or the quick filters above) to find the right people in seconds, then open a profile to review, note and contact them.",
    components: { beforeList: ["@/payload/components/VolunteersDashboard#VolunteersDashboard"] },
  },
  access: {
    read: isVolunteerStaff,
    create: isVolunteerManager, // the public registers via the app-api route (overrideAccess)
    update: isVolunteerManager,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req, context }) => {
        const d = data as Record<string, any>;
        if ((context as Record<string, unknown>)?.internal) return d;
        if (operation === "create") {
          d.status = d.status || "new";
          return d;
        }
        // Status changes go into the history with who/when.
        const prev = originalDoc?.status;
        if (d.status && d.status !== prev) {
          const who = (req.user as { email?: string } | null)?.email || "system";
          d.statusHistory = [
            ...((originalDoc?.statusHistory as unknown[]) || []),
            { status: d.status, at: new Date().toISOString(), by: who },
          ];
        }
        return d;
      },
    ],
  },
  fields: [
    // ---- About the volunteer ----------------------------------------------
    section("👤 About", [
      {
        type: "row",
        fields: [
          { name: "fullName", type: "text", required: true, admin: { width: "40%" } },
          {
            name: "gender",
            type: "select",
            options: [
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
            ],
            admin: { width: "30%" },
          },
          { name: "ageGroup", type: "select", options: opts(AGE_GROUPS), admin: { width: "30%" } },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "mobile", type: "text", required: true, admin: { width: "34%" } },
          { name: "email", type: "email", required: true, admin: { width: "36%" } },
          {
            name: "preferredContact",
            type: "select",
            defaultValue: "any",
            options: CONTACT_METHODS as never,
            admin: { width: "30%" },
          },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "postcode", type: "text", admin: { width: "30%" } },
          { name: "languages", type: "select", hasMany: true, options: opts(LANGUAGES), admin: { width: "45%" } },
          { name: "otherLanguage", type: "text", admin: { width: "25%", description: "If “Other” is selected." } },
        ],
      },
      {
        name: "guardian",
        type: "group",
        label: "Parent / guardian (under-18s)",
        admin: { condition: (data) => ["Under 16", "16–17"].includes(String(data?.ageGroup)) },
        fields: [
          {
            type: "row",
            fields: [
              { name: "name", type: "text", admin: { width: "40%" } },
              { name: "phone", type: "text", admin: { width: "30%" } },
              { name: "email", type: "text", admin: { width: "30%" } },
            ],
          },
        ],
      },
    ]),
    // ---- What they'd like to do -------------------------------------------
    section("🤲 How they'd like to help", [
      {
        name: "generalVolunteer",
        type: "checkbox",
        defaultValue: false,
        label: "General volunteer — happy to help wherever needed",
      },
      {
        name: "categories",
        type: "relationship",
        relationTo: "volunteer-categories" as never,
        hasMany: true,
        admin: { description: "The activities they chose (staff may also assign non-public roles here, e.g. janazah team)." },
      },
      {
        type: "row",
        fields: [
          { name: "days", type: "select", hasMany: true, options: opts(DAYS), admin: { width: "40%", description: "Generally available on…" } },
          { name: "times", type: "select", hasMany: true, options: opts(TIMES), admin: { width: "30%" } },
          { name: "frequency", type: "select", options: opts(FREQUENCIES), admin: { width: "30%" } },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "leadership",
            type: "select",
            options: [
              { label: "Yes", value: "yes" },
              { label: "Maybe", value: "maybe" },
              { label: "No", value: "no" },
            ],
            admin: { width: "34%", description: "Willing to lead/coordinate a small team?" },
          },
          { name: "previousVolunteer", type: "checkbox", admin: { width: "33%", description: "Has volunteered here before." } },
          { name: "previousDetails", type: "text", admin: { width: "33%", description: "What they helped with before." } },
        ],
      },
      { name: "skills", type: "textarea", admin: { description: "Skills, qualifications or experience they offered." } },
      { name: "additionalInfo", type: "textarea", admin: { description: "Anything else they told us." } },
    ]),
    // ---- Consents ----------------------------------------------------------
    section(
      "✅ Consents at registration",
      [
        {
          name: "consents",
          type: "group",
          label: false as never,
          fields: [
            { name: "accurate", type: "checkbox", label: "Confirmed information is accurate" },
            { name: "contact", type: "checkbox", label: "Happy to be contacted about volunteering" },
            { name: "checks", type: "checkbox", label: "Understands some roles need checks/approval" },
            { name: "recordedAt", type: "date", admin: { readOnly: true } },
          ],
        },
      ],
      { collapsed: true },
    ),
    // ---- Safeguarding (managers only) --------------------------------------
    section(
      "🛡 Safeguarding & checks",
      [
        {
          name: "dbsStatus",
          type: "select",
          defaultValue: "not-required",
          access: { read: isVolunteerManagerFieldLevel, update: isVolunteerManagerFieldLevel },
          options: [
            { label: "Not required", value: "not-required" },
            { label: "Required — not started", value: "required" },
            { label: "Requested / in progress", value: "in-progress" },
            { label: "Cleared", value: "cleared" },
            { label: "Expired / needs renewal", value: "expired" },
          ],
          admin: {
            description:
              "Track the CHECK STATUS only — never upload DBS certificates or safeguarding documents into the CMS. Keep documents in the office's secure records.",
          },
        },
      ],
      { collapsed: true },
    ),
    // ---- Volunteer history --------------------------------------------------
    section(
      "📖 Volunteer history",
      [
        {
          name: "history",
          type: "array",
          labels: { singular: "Entry", plural: "History" },
          admin: { description: "What they've actually helped with, e.g. “Eid 2026 — Parking team”." },
          fields: [
            {
              type: "row",
              fields: [
                { name: "what", type: "text", required: true, admin: { width: "60%", description: "e.g. Ramadan 2027 — Iftar team" } },
                { name: "when", type: "date", admin: { width: "40%", date: { pickerAppearance: "dayOnly" } } },
              ],
            },
            { name: "note", type: "text" },
          ],
        },
      ],
      { collapsed: true },
    ),
    // ---- Communications & notes --------------------------------------------
    section(
      "💬 Contact log & internal notes",
      [
        {
          name: "communications",
          type: "array",
          admin: { readOnly: true, initCollapsed: true, description: "Emails and contacts recorded automatically, newest last." },
          fields: [
            { name: "at", type: "date" },
            { name: "by", type: "text" },
            { name: "channel", type: "text" },
            { name: "note", type: "text" },
          ],
        },
        { name: "lastContactedAt", type: "date", admin: { description: "Most recent contact — set automatically when emailing from the dashboard; update by hand for calls." } },
        {
          name: "internalNotes",
          type: "array",
          labels: { singular: "Note", plural: "Internal notes" },
          access: { read: isVolunteerManagerFieldLevel, update: isVolunteerManagerFieldLevel },
          admin: { initCollapsed: true, description: "Visible to volunteer managers and admins only — never to the volunteer." },
          fields: [
            { name: "note", type: "textarea", required: true },
            { name: "by", type: "text" },
            { name: "at", type: "date" },
          ],
        },
        {
          name: "statusHistory",
          type: "array",
          admin: { readOnly: true, initCollapsed: true, description: "Status changes — who and when." },
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
      defaultValue: "new",
      required: true,
      options: VOLUNTEER_STATUSES as never,
      admin: {
        position: "sidebar",
        components: { Cell: "@/payload/components/MemberStatusCell#VolunteerStatusCell" },
        description: "New → Reviewed → Approved → Active. Every change is logged with who and when.",
      },
    },
    {
      name: "source",
      type: "select",
      defaultValue: "website",
      options: [
        { label: "Website", value: "website" },
        { label: "iOS app", value: "ios" },
        { label: "Android app", value: "android" },
        { label: "Added by staff", value: "staff" },
      ],
      admin: { position: "sidebar", readOnly: true, description: "Where they registered." },
    },
  ],
};

/* --------------------------------- Seeding --------------------------------- */

type SeedCat = {
  name: string;
  audience?: "general" | "brothers" | "sisters";
  safeguarding?: boolean;
  requiresDbs?: boolean;
  requiresApproval?: boolean;
  publiclySelectable?: boolean;
  popular?: boolean;
};

const SEED: Array<{ group: string; icon: string; description?: string; cats: SeedCat[] }> = [
  {
    group: "Events & Community",
    icon: "🎪",
    description: "Help our events run smoothly and feel welcoming.",
    cats: [
      { name: "Community & Eid events", popular: true },
      { name: "Open days & school visits" },
      { name: "Talks & conferences" },
      { name: "Family events & community dinners" },
    ],
  },
  {
    group: "Masjid Operations",
    icon: "🕌",
    description: "The day-to-day running of the masjid.",
    cats: [
      { name: "Jumuʿah (Friday) support", popular: true },
      { name: "Welcoming visitors" },
      { name: "Prayer hall support" },
      { name: "Entrance & shoe area" },
      { name: "General masjid help" },
    ],
  },
  {
    group: "Ramadan & Eid",
    icon: "🌙",
    description: "Our busiest and most rewarding time of year.",
    cats: [
      { name: "Iftar preparation", popular: true },
      { name: "Iftar serving", popular: true },
      { name: "Taraweeh support" },
      { name: "Ramadan clean-up" },
      { name: "Eid day support" },
    ],
  },
  {
    group: "Food & Hospitality",
    icon: "🍽️",
    cats: [
      { name: "Catering & food preparation" },
      { name: "Serving food & refreshments" },
      { name: "Kitchen support" },
    ],
  },
  {
    group: "Facilities & Maintenance",
    icon: "🔧",
    cats: [
      { name: "Cleaning" },
      { name: "Gardening" },
      { name: "DIY & general maintenance" },
      { name: "Skilled trades (plumbing, electrical, decorating)", requiresApproval: true },
    ],
  },
  {
    group: "Community & Welfare",
    icon: "❤️",
    cats: [
      { name: "Food bank & food parcels", popular: true },
      { name: "Charity collections" },
      { name: "Elderly support", safeguarding: true, requiresDbs: true },
      { name: "New Muslim support", safeguarding: true },
      { name: "Community welfare visits", safeguarding: true, requiresDbs: true },
    ],
  },
  {
    group: "Youth & Education",
    icon: "⚽",
    cats: [
      { name: "Youth & sports activities", safeguarding: true, requiresDbs: true },
      { name: "Children's events", safeguarding: true, requiresDbs: true },
      { name: "Madrasa & educational support", safeguarding: true, requiresDbs: true },
      { name: "Course & event registration desk" },
    ],
  },
  {
    group: "Janazah & Funeral Support",
    icon: "🕊️",
    description: "Sensitive roles — assigned by the mosque team.",
    cats: [
      { name: "Janazah event support", publiclySelectable: false, requiresApproval: true },
      { name: "Funeral administration", publiclySelectable: false, requiresApproval: true },
      { name: "Bereaved family support", publiclySelectable: false, safeguarding: true, requiresApproval: true },
    ],
  },
  {
    group: "Administration & Reception",
    icon: "🗂️",
    cats: [
      { name: "Reception & welcome desk" },
      { name: "Office administration & data entry" },
      { name: "Event & membership registration" },
    ],
  },
  {
    group: "IT, Digital & Media",
    icon: "💻",
    cats: [
      { name: "IT & technical support" },
      { name: "Website & mobile app" },
      { name: "Digital screens & livestreaming" },
      { name: "Photography & video" },
      { name: "Graphic design & social media" },
      { name: "Marketing & newsletter" },
    ],
  },
  {
    group: "Fundraising",
    icon: "💷",
    cats: [
      { name: "Fundraising events & collections" },
      { name: "Donation campaigns & sponsorship" },
    ],
  },
  {
    group: "Stewarding, Parking & Safety",
    icon: "🦺",
    cats: [
      { name: "Parking", popular: true },
      { name: "Event stewarding & crowd management" },
      { name: "First aid", requiresApproval: true },
      { name: "Health & safety" },
    ],
  },
  {
    group: "Professional Skills",
    icon: "💼",
    description: "Offer your professional experience to the masjid.",
    cats: [
      { name: "Accounting & finance" },
      { name: "Legal" },
      { name: "HR" },
      { name: "Project management" },
      { name: "Software development & cybersecurity" },
      { name: "Engineering, architecture & construction" },
      { name: "Teaching & training" },
      { name: "Translation & languages" },
      { name: "Other professional skills" },
    ],
  },
];

/** Seed the reviewed category set once; admins own it from then on. */
export async function seedVolunteerCategories(payload: Payload): Promise<void> {
  const existing = await payload.count({ collection: "volunteer-category-groups" as never, overrideAccess: true });
  if (existing.totalDocs > 0) return;
  let g = 0;
  for (const grp of SEED) {
    g += 1;
    const group = (await payload.create({
      collection: "volunteer-category-groups" as never,
      data: { name: grp.group, icon: grp.icon, description: grp.description || "", order: g, active: true } as never,
      overrideAccess: true,
    })) as { id: number | string };
    let c = 0;
    for (const cat of grp.cats) {
      c += 1;
      await payload.create({
        collection: "volunteer-categories" as never,
        data: {
          name: cat.name,
          group: group.id,
          order: c,
          active: true,
          audience: cat.audience || "general",
          popular: Boolean(cat.popular),
          safeguarding: Boolean(cat.safeguarding),
          requiresDbs: Boolean(cat.requiresDbs),
          requiresApproval: Boolean(cat.requiresApproval),
          publiclySelectable: cat.publiclySelectable !== false,
        } as never,
        overrideAccess: true,
      });
    }
  }
  payload.logger.info("Seeded the volunteer areas & activities.");
}

/** Append to a volunteer's contact log without re-running hooks. */
export async function recordVolunteerContact(
  payload: Payload,
  volunteer: Record<string, any>,
  entry: { by: string; channel: string; note?: string },
): Promise<void> {
  try {
    const at = new Date().toISOString();
    await payload.update({
      collection: "volunteers" as never,
      id: volunteer.id,
      data: {
        communications: [...((volunteer.communications as unknown[]) || []), { at, ...entry }],
        lastContactedAt: at,
      } as never,
      overrideAccess: true,
      context: { internal: true } as never,
    });
  } catch {
    /* best-effort */
  }
}

/** The branded confirmation email (Phase 6). */
export function volunteerConfirmationEmail(v: {
  fullName: string;
  categories: string[];
  generalVolunteer: boolean;
  days: string[];
  times: string[];
  frequency?: string;
}): { subject: string; html: string } {
  const firstName = String(v.fullName || "").trim().split(/\s+/)[0] || "friend";
  const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
  const chips = (items: string[]) =>
    items
      .map(
        (c) =>
          `<span style="display:inline-block;background:#eef5f1;color:#0b3d2e;border-radius:999px;padding:4px 12px;margin:3px 4px 3px 0;font-size:13px;">${c}</span>`,
      )
      .join("");
  const cats = v.generalVolunteer ? ["General volunteer — wherever help is needed", ...v.categories] : v.categories;
  const availability = [...v.days, ...v.times, v.frequency || ""].filter(Boolean);
  return {
    subject: "Thank you for registering as a Kingston Mosque volunteer",
    html: `
    <div style="background:#f4f1e8;padding:24px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7dfcb;">
        <div style="background:#0b3d2e;padding:22px 26px;">
          <div style="color:#e8d59a;font-size:12px;letter-spacing:.12em;font-weight:700;">KINGSTON MOSQUE</div>
          <div style="color:#ffffff;font-size:21px;font-weight:700;margin-top:4px;">JazakAllahu Khairan, ${firstName}</div>
        </div>
        <div style="padding:24px 26px;color:#2b2922;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">Thank you for registering your interest in volunteering with Kingston Mosque. We have received your registration successfully.</p>
          ${cats.length ? `<p style="margin:16px 0 6px;font-weight:700;">You offered to help with:</p><div>${chips(cats)}</div>` : ""}
          ${availability.length ? `<p style="margin:16px 0 6px;font-weight:700;">Your general availability:</p><div>${chips(availability)}</div>` : ""}
          <p style="margin:18px 0 0;">Our team will review your registration and contact you when suitable volunteering opportunities become available — you don't need to do anything else.</p>
          <p style="margin:14px 0 0;">May Allah reward you for offering your time and skills to support the masjid and our community. Ameen.</p>
          <p style="margin:18px 0 0;color:#6f6c63;font-size:13px;">If any of your details change, just contact the mosque office and we'll update them for you.</p>
        </div>
        <div style="background:#f7f6f3;border-top:1px solid #ecebe6;padding:14px 26px;color:#6f6c63;font-size:12.5px;">
          Kingston Muslim Association · <a href="${site}" style="color:#157f54;">${site.replace(/^https?:\/\//, "")}</a>
        </div>
      </div>
    </div>`,
  };
}
