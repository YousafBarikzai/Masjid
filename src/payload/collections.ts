import path from "path";
import type { Block, CollectionConfig } from "payload";
import { anyone, isAdmin, isAdminFieldLevel, isEditor, isPrayerManager, isStaff } from "./access";

const TIME_HINT = "Use 24-hour HH:MM, e.g. 13:30";

/* ---------------------------------- Users --------------------------------- */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles"],
    group: "Administration",
  },
  access: {
    read: isStaff,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: ({ req: { user } }) => !!user,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["contributor"],
      access: { update: isAdminFieldLevel },
      options: [
        { label: "Super Admin", value: "super-admin" },
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Prayer Times Manager", value: "prayer-times-manager" },
        { label: "Contributor (drafts only)", value: "contributor" },
      ],
    },
  ],
};

/* ---------------------------------- Media --------------------------------- */
export const Media: CollectionConfig = {
  slug: "media",
  admin: { group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  upload: {
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [{ name: "alt", type: "text", label: "Alt text" }],
};

/* ------------------------------ Reusable blocks --------------------------- */
const RichTextBlock: Block = {
  slug: "content",
  labels: { singular: "Text", plural: "Text blocks" },
  fields: [{ name: "richText", type: "richText" }],
};
const MediaBlock: Block = {
  slug: "mediaBlock",
  labels: { singular: "Image", plural: "Images" },
  fields: [
    { name: "image", type: "upload", relationTo: "media" },
    { name: "caption", type: "text" },
  ],
};
const CallToActionBlock: Block = {
  slug: "cta",
  labels: { singular: "Button / Call to action", plural: "Buttons / CTAs" },
  fields: [
    { name: "heading", type: "text" },
    { name: "text", type: "textarea" },
    { name: "buttonLabel", type: "text" },
    { name: "buttonUrl", type: "text" },
  ],
};
const DownloadBlock: Block = {
  slug: "download",
  labels: { singular: "Download / PDF", plural: "Downloads" },
  fields: [
    { name: "label", type: "text" },
    { name: "file", type: "upload", relationTo: "media" },
  ],
};

/* ---------------------------------- Pages --------------------------------- */
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug", "_status"], group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "URL path, e.g. about-the-mosque" },
    },
    { name: "intro", type: "textarea" },
    {
      name: "layout",
      type: "blocks",
      labels: { singular: "Section", plural: "Sections" },
      blocks: [RichTextBlock, MediaBlock, CallToActionBlock, DownloadBlock],
    },
    {
      name: "meta",
      type: "group",
      label: "SEO",
      fields: [{ name: "description", type: "textarea" }],
    },
  ],
};

/* ------------------------------- Posts / News ----------------------------- */
export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "News post", plural: "News & Announcements" },
  admin: { useAsTitle: "title", defaultColumns: ["title", "publishedDate", "_status"], group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", unique: true },
    { name: "publishedDate", type: "date" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "excerpt", type: "textarea" },
    { name: "content", type: "richText" },
  ],
};

/* --------------------------------- Events --------------------------------- */
export const Events: CollectionConfig = {
  slug: "events",
  admin: { useAsTitle: "title", defaultColumns: ["title", "start", "category"], group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", unique: true },
    {
      name: "category",
      type: "select",
      options: ["Eid", "Ramadan", "Youth", "Community", "Lecture", "Fundraiser"],
    },
    { name: "start", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
    { name: "end", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
    { name: "location", type: "text" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "description", type: "richText" },
    { name: "registrationUrl", type: "text" },
  ],
};

/* --------------------------------- Classes -------------------------------- */
export const Classes: CollectionConfig = {
  slug: "classes",
  labels: { singular: "Class / Course", plural: "Classes & Courses" },
  admin: { useAsTitle: "title", defaultColumns: ["title", "category", "ageRange"], group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "category",
      type: "select",
      options: ["Children", "Youth", "Sisters", "Adult", "Course", "Lecture"],
    },
    { name: "ageRange", type: "text", admin: { description: "e.g. 6–16" } },
    { name: "schedule", type: "text", admin: { description: "e.g. Mon–Fri, 5–7pm" } },
    { name: "fees", type: "text" },
    { name: "description", type: "textarea" },
    { name: "enrolUrl", type: "text" },
  ],
};

/* -------------------------------- Services -------------------------------- */
export const Services: CollectionConfig = {
  slug: "services",
  admin: { useAsTitle: "title", defaultColumns: ["title", "slug"], group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", unique: true },
    { name: "icon", type: "text", admin: { description: "Emoji or icon name" } },
    { name: "summary", type: "textarea" },
    { name: "content", type: "richText" },
  ],
};

/* ------------------------------ Announcements ----------------------------- */
export const Announcements: CollectionConfig = {
  slug: "announcements",
  labels: { singular: "Announcement / Banner", plural: "Announcements & Banners" },
  admin: { useAsTitle: "message", defaultColumns: ["message", "severity", "enabled"], group: "Content" },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    { name: "label", type: "text", defaultValue: "Notice" },
    { name: "message", type: "textarea", required: true },
    {
      name: "severity",
      type: "select",
      defaultValue: "info",
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Urgent", value: "urgent" },
      ],
    },
    { name: "link", type: "text" },
    { name: "enabled", type: "checkbox", defaultValue: true },
    { name: "startDate", type: "date" },
    { name: "endDate", type: "date" },
  ],
};

/* ------------------------- Prayer days (overrides) ------------------------ */
export const PrayerDays: CollectionConfig = {
  slug: "prayer-days",
  labels: { singular: "Prayer day", plural: "Prayer Timetable" },
  admin: {
    useAsTitle: "date",
    defaultColumns: ["date", "fajrJamaah", "dhuhrJamaah", "asrJamaah", "ishaJamaah", "source"],
    group: "Prayer Times",
    description:
      "One record per day. Annual upload fills these in; managers can override any single day.",
  },
  access: { read: anyone, create: isPrayerManager, update: isPrayerManager, delete: isPrayerManager },
  fields: [
    { name: "date", type: "date", required: true, unique: true, admin: { date: { pickerAppearance: "dayOnly" } } },
    {
      type: "row",
      fields: [
        { name: "fajrBegins", type: "text", admin: { width: "50%", description: TIME_HINT } },
        { name: "fajrJamaah", type: "text", admin: { width: "50%" } },
      ],
    },
    { name: "sunrise", type: "text" },
    {
      type: "row",
      fields: [
        { name: "dhuhrBegins", type: "text", admin: { width: "50%" } },
        { name: "dhuhrJamaah", type: "text", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "asrBegins", type: "text", admin: { width: "50%" } },
        { name: "asrJamaah", type: "text", admin: { width: "50%" } },
      ],
    },
    { name: "maghrib", type: "text", admin: { description: "Maghrib jamā‘ah is at sunset (begins)" } },
    {
      type: "row",
      fields: [
        { name: "ishaBegins", type: "text", admin: { width: "50%" } },
        { name: "ishaJamaah", type: "text", admin: { width: "50%" } },
      ],
    },
    {
      name: "source",
      type: "select",
      defaultValue: "manual",
      options: [
        { label: "Annual import", value: "import" },
        { label: "Manual override", value: "manual" },
      ],
    },
    { name: "note", type: "text", admin: { description: "e.g. Ramadan, Eid" } },
  ],
};
