import { APIError } from "payload";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  Field,
} from "payload";
import { userCanPublish } from "./access";

/* ----------------------------------------------------------------------------
   Editorial workflow (Phase 4) — a lightweight submit-for-review → approve →
   publish flow on top of Payload's native drafts. Shared by Pages and Posts.

   - Contributors can author and save *drafts* but cannot publish; clicking
     Publish submits the draft for review instead (restrictPublish).
   - A reviewStatus + reviewNote pair drives the hand-off, shown in the sidebar.
   - When something is submitted for review, the editors are emailed
     (notifyReviewers) — best-effort, never blocks the save.
   ---------------------------------------------------------------------------- */

export const REVIEW_STATUSES = {
  draft: "draft",
  inReview: "in-review",
  changesRequested: "changes-requested",
  approved: "approved",
} as const;

/** Sidebar fields added to every workflow-enabled collection. */
export const editorialFields: Field[] = [
  {
    name: "reviewStatus",
    type: "select",
    defaultValue: REVIEW_STATUSES.draft,
    options: [
      { label: "Draft (work in progress)", value: REVIEW_STATUSES.draft },
      { label: "Ready for review", value: REVIEW_STATUSES.inReview },
      { label: "Changes requested", value: REVIEW_STATUSES.changesRequested },
      { label: "Approved", value: REVIEW_STATUSES.approved },
    ],
    admin: {
      position: "sidebar",
      description:
        "Contributors: choose “Ready for review” and Save to ask an editor to publish. Editors: use “Changes requested” to send it back, or just Publish to take it live.",
    },
  },
  {
    name: "reviewNote",
    type: "textarea",
    admin: {
      position: "sidebar",
      description: "A note to the reviewer, or an editor's feedback to the author.",
    },
  },
];

/** beforeChange: contributors may only ever save *drafts* — never publish or unpublish.
 *  The admin's “Save Draft” sends `?draft=true` (writing to the versions table, leaving
 *  the live document untouched), so contributors using the UI are unaffected. Any
 *  non-draft write (Publish / Unpublish) by a non-publisher is refused, so a contributor
 *  can never change or take down what's live — an editor must publish.
 *
 *  System operations (no signed-in user / overrideAccess, e.g. seeds) are not gated. */
export const restrictPublish: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!req.user || userCanPublish(req.user)) return data;
  const draftFlag = (req?.query as Record<string, unknown> | undefined)?.draft;
  const isDraftSave = draftFlag === "true" || draftFlag === true;
  if (!isDraftSave) {
    throw new APIError(
      "You don't have permission to publish. Use “Save Draft”, set the status to “Ready for review”, and an editor will publish it for you.",
      403,
    );
  }
  return data;
};

/** afterChange: when a doc transitions into "Ready for review", email the editors so a
 *  contributor's submission doesn't sit unseen. Best-effort and fully guarded. */
export const notifyReviewers: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  collection,
}) => {
  try {
    const becameInReview =
      doc?.reviewStatus === REVIEW_STATUSES.inReview &&
      previousDoc?.reviewStatus !== REVIEW_STATUSES.inReview;
    if (!becameInReview) return doc;

    const editors = await req.payload.find({
      collection: "users",
      where: { roles: { in: ["super-admin", "admin", "editor"] } },
      limit: 50,
      depth: 0,
    });
    const to = (editors.docs as Array<{ email?: string }>)
      .map((u) => u.email)
      .filter((e): e is string => !!e);
    if (!to.length) return doc;

    const title = (doc as Record<string, unknown>).title || "Untitled";
    const who = (req.user as { name?: string } | undefined)?.name || "A contributor";
    const label = collection?.labels?.singular || collection?.slug || "content";

    await req.payload.sendEmail({
      to,
      subject: `Review requested: ${title}`,
      text: `${who} submitted the ${label} “${title}” for review.\n\nOpen the admin to review and publish it.`,
    });
  } catch {
    /* notification is best-effort — never block the save */
  }
  return doc;
};
