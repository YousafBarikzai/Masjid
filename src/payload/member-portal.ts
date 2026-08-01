import path from "path";
import type { CollectionConfig, Payload, Where } from "payload";
import { isAdmin, isMembershipStaff, userIsMembershipStaff } from "./access";
import { section } from "./sections";

/* ============================================================================
   Members-only portal content — documents and notices that ONLY approved,
   signed-in members (and membership staff) can see.

   Security model:
   • `member-documents` is its OWN upload collection with restricted read
     access. Payload serves its files through /api/member-documents/file/<name>
     and enforces that same access on every download — so there is NO public
     URL for a members-only file, unlike the public Media library. Files are
     stored in a separate folder (never under Next's /public).
   • A member counts as "approved" only while their status is active /
     renewal-due / renewal-pending. Applicants, rejected and expired members
     see nothing.
   • Categories are their own tiny collection, so the portal grows through the
     CMS: add a category, upload documents into it, done — no code change.
   ============================================================================ */

export const APPROVED_MEMBER_STATUSES = ["active", "renewal-due", "renewal-pending"];

export function userIsApprovedMember(user: unknown): boolean {
  const u = user as { collection?: string; status?: string } | null;
  return !!u && u.collection === "members" && APPROVED_MEMBER_STATUSES.includes(String(u.status));
}

/** Members-only files live OUTSIDE the public media folder, in a sibling
 *  directory on the same (persistent) volume. */
const memberDocsDir = () =>
  process.env.MEMBER_DOCS_DIR ||
  (process.env.MEDIA_DIR ? path.join(process.env.MEDIA_DIR, "member-documents") : path.resolve(process.cwd(), "media/member-documents"));

export const MemberDocumentCategories: CollectionConfig = {
  slug: "member-document-categories",
  labels: { singular: "Portal category", plural: "Portal Categories" },
  admin: {
    group: "Membership",
    useAsTitle: "name",
    defaultColumns: ["name", "order", "updatedAt"],
    description:
      "The sections of the members-only portal (Financial accounts, AGM minutes, Confidential documents…). Add a category here and it appears on the portal as soon as it has a published document — that's how the portal grows without code changes.",
  },
  access: {
    read: ({ req: { user } }) => userIsMembershipStaff(user) || userIsApprovedMember(user),
    create: isMembershipStaff,
    update: isMembershipStaff,
    delete: isAdmin,
  },
  defaultSort: "order",
  fields: [
    section("🗂 Category", [
      {
        type: "row",
        fields: [
          { name: "name", type: "text", required: true, admin: { width: "60%" } },
          {
            name: "order",
            type: "number",
            defaultValue: 0,
            admin: { width: "40%", description: "Sort position on the portal — lowest first." },
          },
        ],
      },
      { name: "description", type: "text", admin: { description: "One line shown under the category heading on the portal." } },
    ]),
  ],
};

export const MemberDocuments: CollectionConfig = {
  slug: "member-documents",
  labels: { singular: "Members-only document", plural: "Members-only Documents" },
  admin: {
    group: "Membership",
    useAsTitle: "title",
    defaultColumns: ["title", "category", "visibility", "published", "updatedAt"],
    description:
      "Documents for the members-only portal: financial accounts, AGM minutes, confidential papers. These files are NOT public — every download is checked against the signed-in member's status, and there is no public link. Untick “Published” to take one down without deleting it.",
  },
  access: {
    read: ({ req: { user } }) => {
      if (userIsMembershipStaff(user)) return true;
      if (userIsApprovedMember(user)) {
        return { and: [{ published: { equals: true } }, { visibility: { equals: "members" } }] } as Where;
      }
      return false;
    },
    create: isMembershipStaff,
    update: isMembershipStaff,
    delete: isAdmin,
  },
  upload: {
    staticDir: memberDocsDir(),
    mimeTypes: [
      "application/pdf",
      "image/*",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  defaultSort: "order",
  fields: [
    section("📄 Document", [
      {
        type: "row",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
            admin: { width: "60%", description: "Shown on the portal card, e.g. “Approved Accounts — Year End 2025”." },
          },
          {
            name: "category",
            type: "relationship",
            relationTo: "member-document-categories" as never,
            required: true,
            admin: { width: "40%", description: "The portal section it appears under — add more in Portal Categories." },
          },
        ],
      },
      {
        type: "row",
        fields: [
          { name: "year", type: "text", admin: { width: "34%", description: "e.g. 2025" } },
          { name: "version", type: "text", admin: { width: "33%", description: "e.g. v1.0" } },
          { name: "publishedDate", type: "date", admin: { width: "33%", date: { pickerAppearance: "dayOnly" } } },
        ],
      },
    ]),
    section(
      "🔒 Visibility",
      [
        {
          type: "row",
          fields: [
            {
              name: "visibility",
              type: "select",
              defaultValue: "members",
              options: [
                { label: "All approved members", value: "members" },
                { label: "Staff only (hidden from the portal)", value: "staff" },
              ],
              admin: { width: "40%", description: "Who may see and download this document." },
            },
            {
              name: "published",
              type: "checkbox",
              defaultValue: true,
              admin: { width: "30%", description: "Untick to hide without deleting." },
            },
            { name: "order", type: "number", defaultValue: 0, admin: { width: "30%", description: "Sort position — lowest first." } },
          ],
        },
      ],
      { description: "Every download is checked against the signed-in member — these files have no public link." },
    ),
  ],
};

export const MemberNotices: CollectionConfig = {
  slug: "member-notices",
  labels: { singular: "Member notice", plural: "Member Notices" },
  admin: {
    group: "Membership",
    useAsTitle: "title",
    defaultColumns: ["title", "publishedDate", "pinned", "published", "updatedAt"],
    description:
      "Notices and announcements shown ONLY to signed-in, approved members on their portal — never on the public website. Pin the important ones to keep them at the top.",
  },
  access: {
    read: ({ req: { user } }) => {
      if (userIsMembershipStaff(user)) return true;
      if (userIsApprovedMember(user)) return { published: { equals: true } };
      return false;
    },
    create: isMembershipStaff,
    update: isMembershipStaff,
    delete: isAdmin,
  },
  defaultSort: "-publishedDate",
  fields: [
    section("📣 Notice", [
      { name: "title", type: "text", required: true },
      { name: "body", type: "richText" },
    ]),
    section("🔒 Publication", [
      {
        type: "row",
        fields: [
          { name: "publishedDate", type: "date", defaultValue: () => new Date().toISOString(), admin: { width: "40%", date: { pickerAppearance: "dayOnly" } } },
          { name: "pinned", type: "checkbox", defaultValue: false, admin: { width: "30%", description: "Keep at the top of the portal." } },
          { name: "published", type: "checkbox", defaultValue: true, admin: { width: "30%", description: "Untick to hide from members." } },
        ],
      },
    ]),
  ],
};

/** Seed the default portal categories once, so the portal matches the agreed
 *  structure out of the box. Admins can rename/extend freely afterwards. */
export async function seedMemberPortal(payload: Payload): Promise<void> {
  const existing = await payload.count({ collection: "member-document-categories" as never, overrideAccess: true });
  if (existing.totalDocs > 0) return;
  const defaults = [
    { name: "Financial accounts", description: "KMA financial accounts and reports for members.", order: 1 },
    { name: "AGM meeting minutes", description: "Minutes of Annual General Meetings.", order: 2 },
    { name: "Confidential documents", description: "Papers shared in confidence with members only.", order: 3 },
    { name: "Policies & forms", description: "Member policies, constitutions and forms.", order: 4 },
  ];
  for (const c of defaults) {
    await payload.create({ collection: "member-document-categories" as never, data: c as never, overrideAccess: true });
  }
  payload.logger.info("Seeded the members-portal categories.");
}
