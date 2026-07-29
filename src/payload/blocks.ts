import type { Block, Field } from "payload";

/* The layout building blocks editors can insert. Since the unified-editor
   redesign these live INSIDE the main rich-text editor (via BlocksFeature —
   type "/" or use the + button), so a whole article or page is written in one
   place, Word-style. The same definitions still power the legacy "sections"
   arrays on Pages, so nothing already published changes shape. */

// Reusable "section background colour" control. The coloured dot in each label
// is the visual swatch — what you pick is what the section sits on.
export const backgroundField: Field = {
  name: "background",
  type: "select",
  defaultValue: "none",
  admin: { description: "Optional background colour for this section.", width: "50%" },
  options: [
    { label: "⚪ None (plain)", value: "none" },
    { label: "🟡 Cream", value: "cream" },
    { label: "🟢 Soft green", value: "green" },
    { label: "🟩 Mosque green (dark, white text)", value: "green-dark" },
    { label: "🟨 Gold tint", value: "gold" },
  ],
};

export const RichTextBlock: Block = {
  slug: "content",
  labels: { singular: "Background section", plural: "Background sections" },
  admin: { disableBlockName: true },
  fields: [backgroundField, { name: "richText", type: "richText" }],
};

export const ColumnsBlock: Block = {
  slug: "columns",
  labels: { singular: "Columns", plural: "Column layouts" },
  admin: { disableBlockName: true },
  fields: [
    backgroundField,
    {
      name: "columns",
      type: "array",
      minRows: 2,
      maxRows: 4,
      labels: { singular: "Column", plural: "Columns" },
      admin: {
        description:
          "Add 2–4 columns. Each has its own rich text (with the full toolbar) and an optional image. Columns stack on mobile.",
      },
      fields: [
        { name: "image", type: "upload", relationTo: "media", admin: { description: "Optional image, shown above the text." } },
        { name: "richText", type: "richText" },
      ],
    },
  ],
};

export const MediaBlock: Block = {
  slug: "mediaBlock",
  labels: { singular: "Image (with caption)", plural: "Images" },
  admin: { disableBlockName: true },
  fields: [
    { name: "image", type: "upload", relationTo: "media" },
    {
      type: "row",
      fields: [
        { name: "caption", type: "text", admin: { width: "60%" } },
        {
          name: "position",
          type: "select",
          defaultValue: "full",
          admin: { width: "40%", description: "Where the image sits; text flows around left/right." },
          options: [
            { label: "Full width", value: "full" },
            { label: "Centred (smaller)", value: "center" },
            { label: "Left, text wraps", value: "left" },
            { label: "Right, text wraps", value: "right" },
          ],
        },
      ],
    },
  ],
};

export const CallToActionBlock: Block = {
  slug: "cta",
  labels: { singular: "Button / Call to action", plural: "Buttons / CTAs" },
  admin: { disableBlockName: true },
  fields: [
    backgroundField,
    { name: "heading", type: "text" },
    { name: "text", type: "textarea" },
    {
      type: "row",
      fields: [
        { name: "buttonLabel", type: "text", admin: { width: "50%" } },
        { name: "buttonUrl", type: "text", admin: { width: "50%" } },
      ],
    },
  ],
};

export const DownloadBlock: Block = {
  slug: "download",
  labels: { singular: "Download / PDF", plural: "Downloads" },
  admin: { disableBlockName: true },
  fields: [
    { name: "label", type: "text" },
    { name: "file", type: "upload", relationTo: "media" },
  ],
};

export const CalloutBlock: Block = {
  slug: "callout",
  labels: { singular: "Callout / Note box", plural: "Callouts" },
  admin: { disableBlockName: true },
  fields: [
    {
      name: "tone",
      type: "select",
      defaultValue: "info",
      admin: { width: "50%", description: "The box's colour and mood." },
      options: [
        { label: "💡 Tip (gold)", value: "tip" },
        { label: "ℹ️ Information (green)", value: "info" },
        { label: "⚠️ Important (amber)", value: "warning" },
        { label: "📖 Quote / Ayah (cream)", value: "quote" },
      ],
    },
    { name: "richText", type: "richText" },
  ],
};

export const VideoBlock: Block = {
  slug: "videoEmbed",
  labels: { singular: "Video (YouTube)", plural: "Videos" },
  admin: { disableBlockName: true },
  fields: [
    {
      name: "url",
      type: "text",
      required: true,
      admin: { description: "Paste any YouTube link (watch, youtu.be, live or shorts). It plays right on the page." },
    },
    { name: "caption", type: "text" },
  ],
};

export const GalleryBlock: Block = {
  slug: "gallery",
  labels: { singular: "Image gallery", plural: "Galleries" },
  admin: { disableBlockName: true },
  fields: [
    {
      name: "images",
      type: "array",
      minRows: 2,
      labels: { singular: "Image", plural: "Images" },
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "caption", type: "text" },
      ],
    },
  ],
};

/** Blocks insertable INSIDE the unified rich-text editor ("/" or the + menu). */
export const editorBlocks: Block[] = [
  MediaBlock,
  GalleryBlock,
  VideoBlock,
  CalloutBlock,
  ColumnsBlock,
  CallToActionBlock,
  DownloadBlock,
  RichTextBlock,
];

/** The legacy section list still used by the Pages "layout" array. */
export const layoutBlocks: Block[] = [RichTextBlock, ColumnsBlock, MediaBlock, CallToActionBlock, DownloadBlock];
