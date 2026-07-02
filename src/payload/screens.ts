import type { CollectionConfig } from "payload";
import { anyone, isAdmin, isEditor } from "./access";

/* Digital Screens — the MasjidBox replacement, screen by screen.
   Each screen document is one TV in the building (Mimbar & Outside, Sisters,
   Middle Masjid, Ablution Area) and holds a PLAYLIST of slides. Slides loop in
   order, each showing for its own number of seconds. Drag rows to reorder;
   untick "Show this slide" to pull one from rotation without deleting it.
   The TV plays the playlist at /display/<screen-slug>. */

export const Screens: CollectionConfig = {
  slug: "screens",
  labels: { singular: "Digital screen", plural: "Digital Screens" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Digital Screens",
    description:
      "One entry per TV in the mosque. Each has a playlist of slides that loop — drag to reorder, set seconds per slide. The TV shows it at /display/<slug>; changes reach the screen within about a minute.",
  },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: "name", type: "text", required: true, admin: { description: "e.g. Mimbar & Outside Screen" } },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "The TV opens /display/<slug> — e.g. mimbar-outside" },
    },
    {
      name: "slides",
      type: "array",
      labels: { singular: "Slide", plural: "Slides" },
      admin: {
        description:
          "The loop this screen plays, top to bottom. Drag the handle to reorder. Each slide shows for its own number of seconds, then the next one appears; after the last slide it starts again.",
        components: { RowLabel: "@/payload/components/SlideRowLabel#SlideRowLabel" },
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "type",
              type: "select",
              required: true,
              defaultValue: "announcement",
              admin: { width: "40%" },
              options: [
                { label: "Prayer times board", value: "prayer-board" },
                { label: "Announcement", value: "announcement" },
                { label: "Picture / poster", value: "image" },
                { label: "QR code", value: "qr" },
              ],
            },
            {
              name: "duration",
              type: "number",
              defaultValue: 10,
              min: 3,
              max: 600,
              admin: { width: "30%", description: "Seconds on screen" },
            },
            {
              name: "enabled",
              type: "checkbox",
              label: "Show this slide",
              defaultValue: true,
              admin: { width: "30%" },
            },
          ],
        },
        {
          name: "heading",
          type: "text",
          admin: {
            description: "Big title shown on the slide.",
            condition: (_data, sibling) => ["announcement", "qr"].includes(sibling?.type as string),
          },
        },
        {
          name: "body",
          type: "textarea",
          admin: {
            description: "The announcement text (keep it short — it's read from across the room).",
            condition: (_data, sibling) => sibling?.type === "announcement",
          },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          admin: {
            description: "Shown full screen. Landscape images work best on TVs.",
            condition: (_data, sibling) => sibling?.type === "image",
          },
        },
        {
          name: "url",
          type: "text",
          admin: {
            description: "The link the QR code opens (e.g. your donation page).",
            condition: (_data, sibling) => sibling?.type === "qr",
          },
        },
        {
          name: "label",
          type: "text",
          admin: {
            description: "Caption under the QR code, e.g. “Scan to donate”.",
            condition: (_data, sibling) => sibling?.type === "qr",
          },
        },
      ],
    },
  ],
};
