import type { CollectionConfig } from "payload";
import { anyone, isAdmin } from "./access";

/* Resource documents — the PDFs published under Resources (data policy, AGM
   minutes, financial accounts, forms). Administrators upload, replace,
   rename, reorder, publish and unpublish here with no code change: a
   published document REPLACES the built-in default for its category on the
   website, so the bundled starter PDFs keep working until real ones exist.
   Files live in the Media library (PDFs are accepted there), which gives
   drag-and-drop upload, progress, preview and validation for free. */

export const ResourceDocuments: CollectionConfig = {
  slug: "documents",
  labels: { singular: "Resource document", plural: "Resource Documents" },
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "category", "year", "published", "updatedAt"],
    description:
      "The downloadable PDFs on the Resources pages. Upload the file (drag & drop), give it a clear title and the right category, and Save — it appears on the website within a minute, replacing the built-in sample for that category. Untick “Published” to take a document down without deleting it; use “Order” to arrange documents within a page (lowest first).",
  },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  defaultSort: "order",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: { description: "Shown on the document card, e.g. “Financial Accounts — Year End 2025”." },
    },
    {
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Data Policy", value: "data-policy" },
        { label: "Right of Access Request", value: "right-of-access-request" },
        { label: "AGM Meeting Minutes", value: "agm-minutes" },
        { label: "Financial Accounts", value: "financial-accounts" },
        { label: "Membership", value: "membership-form" },
      ],
      admin: { description: "Which Resources page this document appears on." },
    },
    {
      type: "row",
      fields: [
        { name: "year", type: "text", admin: { width: "34%", description: "e.g. 2025" } },
        { name: "version", type: "text", admin: { width: "33%", description: "e.g. v1.0" } },
        {
          name: "publishedDate",
          type: "date",
          admin: { width: "33%", date: { pickerAppearance: "dayOnly" }, description: "Shown on the card." },
        },
      ],
    },
    {
      name: "file",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: { description: "The PDF itself — drag it straight from your desktop." },
    },
    {
      type: "row",
      fields: [
        {
          name: "published",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%", description: "Untick to hide from the website without deleting." },
        },
        {
          name: "order",
          type: "number",
          defaultValue: 0,
          admin: { width: "50%", description: "Sort position on the page — lowest first." },
        },
      ],
    },
  ],
};
