import {
  lexicalEditor,
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  TextStateFeature,
} from "@payloadcms/richtext-lexical";
import { textStates } from "./richtext";
import { editorBlocks } from "./blocks";

/* The unified article editor: ONE writing surface, Word-style. Everything the
   default editor offers (headings, lists, checklists, links, inline images,
   alignment, indenting, quotes, dividers, sub/superscript) plus tables, the
   text/highlight colour palette, and — the point of the redesign — the layout
   blocks (images, galleries, videos, callouts, columns, buttons, downloads,
   coloured background sections) insertable inline by typing "/" or using the
   toolbar's + button, and draggable to reorder. The old separate "Extra
   sections" list below the editor is gone.

   Only apply this to TOP-LEVEL content fields. RichText fields nested inside
   the blocks themselves use the global default editor (no blocks feature), so
   the config can't recurse. */
export const articleEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    FixedToolbarFeature(),
    TextStateFeature({ state: textStates }),
    EXPERIMENTAL_TableFeature(),
    BlocksFeature({ blocks: editorBlocks }),
  ],
});

/** Shared field description for content fields using the unified editor. */
export const articleEditorHint =
  "Write everything here, like a Word document. Type “/” (or use the + button) to insert images, galleries, videos, tables, callouts, columns, buttons, downloads or a coloured background section — then drag blocks to rearrange.";
