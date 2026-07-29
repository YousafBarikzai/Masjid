import type { Field } from "payload";

/* Edit-screen section cards.

   Payload renders a document's fields as one long undifferentiated column,
   which reads as clutter once a collection has more than a handful of fields.
   This helper wraps related fields in a labelled collapsible that the admin
   theme styles as a card (see admin-theme.css, ".kma-section"), giving every
   edit screen the same rhythm: a titled card per concern, in the same order
   on every content type — basics first, then appearance, then the content
   itself, then targeting.

   Collapsibles (and rows) are LAYOUT-ONLY in Payload: they do not change
   field names, data paths, or the database schema. Wrapping existing fields
   here is therefore always safe for already-published content. */
export function section(
  label: string,
  fields: Field[],
  opts?: { collapsed?: boolean; description?: string },
): Field {
  return {
    type: "collapsible",
    label,
    admin: {
      initCollapsed: opts?.collapsed ?? false,
      className: "kma-section",
      ...(opts?.description ? { description: opts.description } : {}),
    },
    fields,
  };
}
