import { APIError } from "payload";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { anyone, isAdmin, isEditor, isStaff } from "./access";
import { HELP_REF } from "./help";

// Honeypot field names the public form renderer should include as a hidden input.
// Real users leave them empty; bots fill them in — those submissions are rejected.
const HONEYPOT_FIELDS = ["_hp", "bot_field"];

/* ----------------------------------------------------------------------------
   Forms builder (Phase 5) — the official Payload Form Builder plugin.

   Gives editors a no-code form designer: add fields (text, email, textarea,
   select, checkbox, number, country, state, message), choose who receives each
   submission, and set a confirmation message or redirect. Submissions are stored
   in `form-submissions` and emailed to the form's configured recipients.
   ---------------------------------------------------------------------------- */

export const formsPlugin = formBuilderPlugin({
  // Field types editors can drop into a form. Payment is intentionally off
  // (donations are handled separately) to avoid pulling in a payment processor.
  fields: {
    text: true,
    textarea: true,
    email: true,
    number: true,
    select: true,
    checkbox: true,
    message: true,
    country: true,
    state: true,
    payment: false,
  },
  // Where submissions go if a form doesn't set its own recipient.
  defaultToEmail: process.env.SMTP_FROM || "info@kingstonmosque.org",
  // Let a form redirect to a CMS page after submitting.
  redirectRelationships: ["pages"],
  formOverrides: {
    slug: "forms",
    admin: {
      group: "Forms",
      description:
        "Build custom forms (membership, enquiries, bookings…). Add the fields you need, choose who receives submissions by email, and set a thank-you message or a page to redirect to.",
      // In-CMS help panel (forms is plugin-injected, so wire it here directly).
      components: { Description: HELP_REF },
    },
    // Public read so forms can be rendered on the website; editors build them.
    access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  },
  formSubmissionOverrides: {
    slug: "form-submissions",
    admin: {
      group: "Forms",
      components: { Description: HELP_REF },
    },
    // Anyone can submit; only staff can read; only admins can edit/delete.
    access: { read: isStaff, create: anyone, update: isAdmin, delete: isAdmin },
    hooks: {
      // Spam guard: reject submissions where a honeypot field was filled in, and
      // strip honeypots so they're never stored. Runs before the plugin's own
      // beforeChange (which sends the emails), so spam never triggers a notification.
      beforeChange: [
        ({ data }) => {
          const rows: Array<{ field?: string; value?: unknown }> = Array.isArray(
            data?.submissionData,
          )
            ? data.submissionData
            : [];
          const tripped = rows.some(
            (r) => HONEYPOT_FIELDS.includes(String(r.field)) && r.value,
          );
          if (tripped) {
            throw new APIError("Submission rejected.", 400);
          }
          if (rows.length) {
            data.submissionData = rows.filter(
              (r) => !HONEYPOT_FIELDS.includes(String(r.field)),
            );
          }
          return data;
        },
      ],
    },
  },
});
