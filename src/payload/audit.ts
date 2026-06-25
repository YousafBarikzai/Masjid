import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from "payload";
import { isAdmin } from "./access";

/* ----------------------------------------------------------------------------
   Audit log (Phase 7) — an append-only record of who changed what, when. A
   reusable wrapper (withAudit) appends afterChange/afterDelete hooks to the
   collections worth tracking, writing a row into `audit-log`. Invaluable for a
   multi-volunteer team. Writes are best-effort and never block the real save.
   ---------------------------------------------------------------------------- */

const never = () => false;

export const AuditLog: CollectionConfig = {
  slug: "audit-log",
  labels: { singular: "Audit log entry", plural: "Audit Log" },
  admin: {
    group: "Administration",
    useAsTitle: "summary",
    defaultColumns: ["summary", "action", "collectionLabel", "userEmail", "createdAt"],
    description: "A read-only record of changes made in the admin. Newest first.",
  },
  // Read by admins only; entries are written internally (overrideAccess) and are
  // immutable. Admins may delete old entries for housekeeping.
  access: { read: isAdmin, create: never, update: never, delete: isAdmin },
  fields: [
    { name: "summary", type: "text", admin: { readOnly: true } },
    {
      name: "action",
      type: "select",
      options: [
        { label: "Created", value: "create" },
        { label: "Updated", value: "update" },
        { label: "Deleted", value: "delete" },
      ],
      admin: { readOnly: true },
    },
    { name: "collectionLabel", type: "text", admin: { readOnly: true } },
    { name: "documentId", type: "text", admin: { readOnly: true } },
    { name: "userEmail", type: "text", admin: { readOnly: true } },
    { name: "userId", type: "text", admin: { readOnly: true } },
  ],
  timestamps: true,
};

function docTitle(doc: Record<string, any>): string {
  return String(
    doc?.title ?? doc?.message ?? doc?.name ?? doc?.filename ?? doc?.email ?? doc?.id ?? "—",
  ).slice(0, 120);
}

async function write(
  req: any,
  action: "create" | "update" | "delete",
  collectionSlug: string,
  collectionLabel: string,
  doc: Record<string, any>,
) {
  try {
    const user = req?.user as { id?: unknown; email?: string; name?: string } | undefined;
    const who = user?.email || user?.name || "system";
    await req.payload.create({
      collection: "audit-log",
      overrideAccess: true,
      data: {
        action,
        collectionLabel,
        documentId: String(doc?.id ?? ""),
        userEmail: who,
        userId: user?.id != null ? String(user.id) : "",
        summary: `${who} ${action}d ${collectionLabel.toLowerCase()} “${docTitle(doc)}”`,
      },
    });
  } catch {
    /* auditing is best-effort — never block the real operation */
  }
}

/** Wrap a collection so its create/update/delete are recorded in the audit log. */
export function withAudit(collection: CollectionConfig): CollectionConfig {
  const label = collection.labels?.singular
    ? String(collection.labels.singular)
    : collection.slug;
  const existing = collection.hooks || {};

  const auditChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
    await write(req, operation === "create" ? "create" : "update", collection.slug, label, doc as any);
    return doc;
  };
  const auditDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    await write(req, "delete", collection.slug, label, doc as any);
    return doc;
  };

  return {
    ...collection,
    hooks: {
      ...existing,
      afterChange: [...(existing.afterChange || []), auditChange],
      afterDelete: [...(existing.afterDelete || []), auditDelete],
    },
  };
}
