import type { CollectionConfig, GlobalConfig } from "payload";
import { HELP_CONTENT } from "./help-content";

/* Injects the shared HelpPanel into a collection's list + edit views, and a global's
   edit view — slug-driven, so a collection/global without authored help is left
   untouched. One importMap entry (the same path#Export string) serves them all. */

export const HELP_REF = "@/payload/components/HelpPanel#HelpPanel";

export function withHelp(collection: CollectionConfig): CollectionConfig {
  if (!HELP_CONTENT[collection.slug]) return collection;
  const admin = collection.admin ?? {};
  const components = admin.components ?? {};
  return {
    ...collection,
    admin: {
      ...admin,
      components: {
        ...components,
        // The Description slot renders on BOTH the list view (sub-header) and the
        // edit/create view (document header) — one slot covers both, no duplicate.
        Description: HELP_REF,
      },
    },
  };
}

export function withHelpGlobal(global: GlobalConfig): GlobalConfig {
  if (!HELP_CONTENT[global.slug]) return global;
  const admin = global.admin ?? {};
  const components = admin.components ?? {};
  const elements = components.elements ?? {};
  return {
    ...global,
    admin: {
      ...admin,
      components: {
        ...components,
        // Globals nest Description under `elements`; there is no list view.
        elements: {
          ...elements,
          Description: HELP_REF,
        },
      },
    },
  };
}
