import path from "path";
import type { Block, CollectionConfig, Field } from "payload";
import {
  anyone,
  isAdmin,
  isAdminFieldLevel,
  isContributor,
  isEditor,
  isPrayerManager,
  isStaff,
} from "./access";
import { editorialFields, notifyReviewers, restrictPublish } from "./editorial";
import { parseTimetableCsv } from "../lib/parseTimetable";

const TIME_HINT = "Use 24-hour HH:MM, e.g. 13:30";

/* ---------------------------------- Users --------------------------------- */
export const Users: CollectionConfig = {
  slug: "users",
  // Security hardening: lock an account for 10 minutes after 5 failed logins
  // (blunts brute-force), expire sessions after 2 hours, and scope cookies.
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 2 * 60 * 60,
    cookies: { sameSite: "Lax" },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles"],
    group: "Administration",
    description:
      "Staff logins. To add a manager or editor: Create → enter their name, email and a password, then choose a role.",
  },
  access: {
    read: isStaff,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: ({ req: { user } }) => !!user,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // The very first account ever created is made a Super Admin
        // automatically — so whoever sets up the site can manage everything
        // (and create other staff) without a role having to be assigned first.
        if (operation === "create") {
          const { totalDocs } = await req.payload.count({ collection: "users" });
          if (totalDocs === 0) data.roles = ["super-admin"];
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["editor"],
      access: { update: isAdminFieldLevel },
      admin: {
        description:
          "Super Admin / Admin: full access incl. managing users. Editor: manages content (pages, news, events, services). Prayer Times Manager: edits the prayer timetable. Contributor: can create drafts only. (The first account is made Super Admin automatically.)",
      },
      options: [
        { label: "Super Admin", value: "super-admin" },
        { label: "Admin", value: "admin" },
        { label: "Editor / Manager", value: "editor" },
        { label: "Prayer Times Manager", value: "prayer-times-manager" },
        { label: "Contributor (drafts only)", value: "contributor" },
      ],
    },
  ],
};

/* ---------------------------------- Media --------------------------------- */
export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Content",
    useAsTitle: "filename",
    defaultColumns: ["filename", "alt", "tags", "updatedAt"],
    // Search the library by file name, alt text, caption or tag.
    listSearchableFields: ["filename", "alt", "caption", "tags"],
    description:
      "Image & document library. Drag several files in at once to bulk-upload, organise them into folders, tag them, and crop/set a focal point so they always frame well.",
  },
  // Native folders: organise media into folders (and browse by folder).
  folders: true,
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  upload: {
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*", "application/pdf"],
    // Drag-and-drop several files at once.
    bulkUpload: true,
    // Let editors crop and choose the focal point so images frame well at any size.
    crop: true,
    focalPoint: true,
    // Small square preview used in the admin list & relationship pickers.
    adminThumbnail: "thumbnail",
    // Responsive variants generated on upload (originals are kept untouched).
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 512, position: "centre" },
      { name: "feature", width: 1600, height: 900, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alt text",
      admin: { description: "Describe the image for screen readers and search engines." },
    },
    {
      name: "caption",
      type: "text",
      admin: { description: "Optional caption that can be shown beneath the image." },
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      admin: {
        description: "Add tags (e.g. ramadan, eid, hero) so you can find this again by searching.",
      },
    },
  ],
};

/* ------------------------------ Reusable blocks --------------------------- */
// Reusable "section background colour" control, used by several blocks.
const backgroundField: Field = {
  name: "background",
  type: "select",
  defaultValue: "none",
  admin: { description: "Optional background colour for this section.", width: "50%" },
  options: [
    { label: "None", value: "none" },
    { label: "Cream", value: "cream" },
    { label: "Soft green", value: "green" },
    { label: "Mosque green (dark)", value: "green-dark" },
    { label: "Gold tint", value: "gold" },
  ],
};

const RichTextBlock: Block = {
  slug: "content",
  labels: { singular: "Text", plural: "Text blocks" },
  fields: [
    backgroundField,
    { name: "richText", type: "richText" },
  ],
};
const ColumnsBlock: Block = {
  slug: "columns",
  labels: { singular: "Columns", plural: "Column layouts" },
  fields: [
    backgroundField,
    {
      name: "columns",
      type: "array",
      minRows: 2,
      maxRows: 4,
      labels: { singular: "Column", plural: "Columns" },
      admin: {
        description: "Add 2–4 columns. Each has its own rich text (with the full toolbar) and an optional image. Columns stack on mobile.",
      },
      fields: [
        { name: "image", type: "upload", relationTo: "media", admin: { description: "Optional image, shown above the text." } },
        { name: "richText", type: "richText" },
      ],
    },
  ],
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
    backgroundField,
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

// The full set of layout blocks shared by Pages and News posts.
const layoutBlocks = [RichTextBlock, ColumnsBlock, MediaBlock, CallToActionBlock, DownloadBlock];

/* ---------------------------------- Pages --------------------------------- */
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "reviewStatus", "_status"],
    group: "Content",
  },
  access: { read: anyone, create: isContributor, update: isContributor, delete: isAdmin },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  hooks: { beforeChange: [restrictPublish], afterChange: [notifyReviewers] },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { description: "URL path, e.g. about-the-mosque" },
    },
    {
      name: "intro",
      type: "textarea",
      admin: { description: "Short summary shown under the page title." },
    },
    {
      name: "content",
      type: "richText",
      label: "Page content",
      admin: {
        description:
          "The main content. Use the toolbar for bold, headings, colours, lists, links and images.",
      },
    },
    {
      name: "layout",
      type: "blocks",
      label: "Page sections (text, columns, images, buttons)",
      labels: { singular: "Section", plural: "Sections" },
      admin: {
        description:
          "Build the page from sections: a Text block (full formatting toolbar), a Columns layout (2–4 columns), images, buttons or downloads — each with an optional background colour.",
      },
      blocks: layoutBlocks,
    },
    {
      name: "meta",
      type: "group",
      label: "SEO",
      fields: [{ name: "description", type: "textarea" }],
    },
    ...editorialFields,
  ],
};

/* ------------------------------- Posts / News ----------------------------- */
export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "News post", plural: "News & Announcements" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedDate", "reviewStatus", "_status"],
    group: "Content",
  },
  access: { read: anyone, create: isContributor, update: isContributor, delete: isAdmin },
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
  hooks: { beforeChange: [restrictPublish], afterChange: [notifyReviewers] },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", unique: true },
    { name: "publishedDate", type: "date" },
    { name: "image", type: "upload", relationTo: "media", admin: { description: "Lead image shown on the card and at the top of the article." } },
    { name: "excerpt", type: "textarea", admin: { description: "Short summary shown on the news card." } },
    {
      name: "content",
      type: "richText",
      admin: { description: "The article body. Use the toolbar for bold, headings, colours, lists, links and images." },
    },
    {
      name: "layout",
      type: "blocks",
      label: "Extra sections (optional)",
      labels: { singular: "Section", plural: "Sections" },
      admin: {
        description: "Optional richer layout below the article — columns, images, buttons or downloads, each with an optional background colour.",
      },
      blocks: layoutBlocks,
    },
    ...editorialFields,
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
    { name: "summary", type: "textarea", admin: { description: "Short text shown on cards" } },
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
    {
      name: "relatedPage",
      type: "relationship",
      relationTo: "pages",
      label: "Link to a page",
      admin: {
        description:
          "Optional: pick a page this announcement should open. The banner becomes clickable. (Takes priority over the link below.)",
      },
    },
    { name: "link", type: "text", admin: { description: "Or paste an external link (used only if no page is chosen above)." } },
    { name: "enabled", type: "checkbox", defaultValue: true },
    { name: "startDate", type: "date" },
    { name: "endDate", type: "date" },
    {
      name: "sendPush",
      type: "checkbox",
      defaultValue: false,
      label: "Send push notification to the apps",
      admin: { description: "Tick to alert everyone with the mobile app. Sends once." },
    },
    {
      name: "pushSent",
      type: "checkbox",
      defaultValue: false,
      admin: { readOnly: true, description: "Set automatically once the push has been sent." },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        // Fire a single push when an enabled announcement is flagged to notify.
        // The `pushSent` guard + skipPush context make this idempotent (no loops).
        if ((context as Record<string, unknown>)?.skipPush) return doc;
        const d = doc as Record<string, any>;
        if (!d.enabled || !d.sendPush || d.pushSent) return doc;
        try {
          const { sendPushToAll } = await import("../lib/push");
          await sendPushToAll(
            req.payload,
            { title: d.label || "Kingston Mosque", body: d.message, data: { type: "announcement", id: d.id } },
            "news",
          );
          await req.payload.update({
            collection: "announcements",
            id: d.id,
            data: { pushSent: true },
            context: { skipPush: true },
          });
        } catch (err) {
          req.payload.logger.error("Announcement push failed: " + (err as Error).message);
        }
        return doc;
      },
    ],
  },
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

/* --------------------- Timetable uploads (annual CSV) --------------------- */
export const TimetableUploads: CollectionConfig = {
  slug: "timetable-uploads",
  labels: { singular: "Timetable upload", plural: "Upload Annual Timetable" },
  admin: {
    useAsTitle: "filename",
    defaultColumns: ["filename", "mode", "importedCount", "createdAt"],
    group: "Prayer Times",
    description:
      "Upload the year's CSV (Day,Date,Fajr,Sunrise,Zawwal,Duhur,Asr,Sunset,Maghrib,Isha,J-Fajr,J-Duhur,J-Asr,J-Maghrib,J-Isha). It is parsed, validated and imported into the Prayer Timetable automatically. The report appears below after saving.",
  },
  access: { read: isPrayerManager, create: isPrayerManager, update: isPrayerManager, delete: isPrayerManager },
  upload: {
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"],
  },
  fields: [
    {
      name: "mode",
      type: "select",
      defaultValue: "create-missing",
      admin: { description: "Create only missing days, or replace existing days too." },
      options: [
        { label: "Add missing days only", value: "create-missing" },
        { label: "Replace existing days too", value: "replace-all" },
      ],
    },
    { name: "report", type: "textarea", admin: { readOnly: true, description: "Auto-filled after import" } },
    { name: "importedCount", type: "number", admin: { readOnly: true } },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation, context }) => {
        if (operation !== "create" || (context as Record<string, unknown>)?.imported) return;
        const buf = (req as unknown as { file?: { data?: Buffer } }).file?.data;
        if (!buf) return;

        const { days, warnings, errors } = parseTimetableCsv(buf.toString("utf8"));
        const mode = (doc as Record<string, unknown>).mode || "create-missing";

        const all = await req.payload.find({ collection: "prayer-days", limit: 100000, depth: 0 });
        const byDate = new Map<string, string | number>();
        for (const d of all.docs as Array<Record<string, unknown>>) {
          byDate.set(String(d.date).slice(0, 10), d.id as string | number);
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;
        for (const d of days) {
          const data = {
            date: d.date,
            fajrBegins: d.fajr.begins,
            fajrJamaah: d.fajr.jamaah,
            sunrise: d.sunrise,
            dhuhrBegins: d.dhuhr.begins,
            dhuhrJamaah: d.dhuhr.jamaah,
            asrBegins: d.asr.begins,
            asrJamaah: d.asr.jamaah,
            maghrib: d.maghrib.begins,
            ishaBegins: d.isha.begins,
            ishaJamaah: d.isha.jamaah,
            source: "import" as const,
          };
          const existingId = byDate.get(d.date);
          try {
            if (existingId !== undefined) {
              if (mode === "replace-all") {
                await req.payload.update({ collection: "prayer-days", id: existingId, data });
                updated++;
              } else skipped++;
            } else {
              await req.payload.create({ collection: "prayer-days", data });
              created++;
            }
          } catch {
            /* keep going */
          }
        }

        const lines = [`Parsed ${days.length} day(s). Created ${created}, updated ${updated}, skipped ${skipped}.`];
        if (errors.length) lines.push(`Errors (${errors.length}): ${errors.slice(0, 8).join("; ")}`);
        lines.push(warnings.length ? `Warnings (${warnings.length}): ${warnings.slice(0, 8).join("; ")}` : "No warnings.");

        await req.payload.update({
          collection: "timetable-uploads",
          id: doc.id,
          data: { report: lines.join("\n"), importedCount: created + updated },
          context: { imported: true },
        });
      },
    ],
  },
};

/* --------------------------- Contact submissions -------------------------- */
export const ContactSubmissions: CollectionConfig = {
  slug: "contact-submissions",
  labels: { singular: "Contact message", plural: "Contact Messages" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "subject", "handled", "createdAt"],
    group: "Content",
    description: "Messages sent from the website contact form.",
  },
  access: {
    create: () => true, // public can submit
    read: isStaff,
    update: isStaff,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "subject", type: "text" },
    { name: "message", type: "textarea", required: true },
    { name: "handled", type: "checkbox", defaultValue: false, admin: { description: "Tick once dealt with" } },
    // simple spam honeypot — real users leave this empty
    { name: "company", type: "text", admin: { hidden: true } },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.company) throw new Error("Spam detected.");
        return data;
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== "create" || !process.env.SMTP_HOST) return doc;
        const d = doc as Record<string, any>;
        try {
          await req.payload.sendEmail({
            to: process.env.CONTACT_TO || process.env.SMTP_FROM || "info@kingstonmosque.org",
            replyTo: d.email,
            subject: `Website enquiry: ${d.subject || d.name}`,
            text:
              `New message from the Kingston Mosque website contact form:\n\n` +
              `Name: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone || "-"}\nSubject: ${d.subject || "-"}\n\n${d.message}\n`,
          });
        } catch (err) {
          req.payload.logger.error("Contact email failed: " + (err as Error).message);
        }
        return doc;
      },
    ],
  },
};

/* ------------------------------ Device tokens ----------------------------- */
// Push tokens registered by the mobile apps. Write access is locked to staff in
// the admin UI; the apps self-register through the /app-api/register-device
// route, which upserts with overrideAccess so this stays clean and tamper-proof.
export const DeviceTokens: CollectionConfig = {
  slug: "device-tokens",
  labels: { singular: "App device", plural: "App Devices (Push)" },
  admin: {
    useAsTitle: "token",
    defaultColumns: ["platform", "token", "enabled", "createdAt"],
    group: "Administration",
    description: "Push tokens registered automatically by the mobile apps.",
  },
  access: { create: isStaff, read: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: "token", type: "text", required: true, unique: true, index: true },
    {
      name: "platform",
      type: "select",
      defaultValue: "ios",
      options: [
        { label: "iOS", value: "ios" },
        { label: "Android", value: "android" },
        { label: "Web", value: "web" },
      ],
    },
    {
      name: "topics",
      type: "select",
      hasMany: true,
      defaultValue: ["news", "events"],
      options: [
        { label: "News & announcements", value: "news" },
        { label: "Events", value: "events" },
        { label: "Prayer reminders", value: "prayer" },
      ],
    },
    // Web Push (browser/PWA) subscriptions store the endpoint in `token` and the
    // encryption keys here. Native (Expo) devices leave these blank.
    { name: "p256dh", type: "text", admin: { readOnly: true, condition: (d) => d?.platform === "web" } },
    { name: "auth", type: "text", admin: { readOnly: true, condition: (d) => d?.platform === "web" } },
    // Minutes before jamāʿah to send a prayer reminder (only used when the
    // "prayer" topic is selected). Default 15.
    { name: "reminderOffset", type: "number", defaultValue: 15, admin: { description: "Minutes before jamāʿah for prayer reminders." } },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

/* ------------------------------- Subscribers ------------------------------ */
// Opt-in contacts for the Broadcast Center (email + WhatsApp). The public can
// self-subscribe via a form; staff manage the list in the admin.
export const Subscribers: CollectionConfig = {
  slug: "subscribers",
  labels: { singular: "Subscriber", plural: "Subscribers (Broadcast)" },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email", "whatsapp", "emailOptIn", "whatsappOptIn", "unsubscribed"],
    group: "Broadcast",
    description: "People who opted in to email / WhatsApp updates.",
  },
  access: { create: () => true, read: isStaff, update: isStaff, delete: isAdmin },
  fields: [
    { name: "name", type: "text" },
    { name: "email", type: "email" },
    { name: "whatsapp", type: "text", admin: { description: "International format, e.g. 447700900000" } },
    { name: "emailOptIn", type: "checkbox", defaultValue: true, label: "Wants email updates" },
    { name: "whatsappOptIn", type: "checkbox", defaultValue: false, label: "Wants WhatsApp updates" },
    { name: "unsubscribed", type: "checkbox", defaultValue: false },
    { name: "source", type: "text", admin: { description: "How they joined (e.g. website form, QR)" } },
  ],
};

/* ------------------------------- Broadcasts ------------------------------- */
// Compose once, send to chosen channels. Env-gated adapters fan out via the
// afterChange hook; the per-channel result is written back to the report.
export const Broadcasts: CollectionConfig = {
  slug: "broadcasts",
  labels: { singular: "Broadcast", plural: "Broadcasts" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "sentAt", "createdAt"],
    group: "Broadcast",
    description: "Write a notice, pick channels, tick 'Send now' and save. It sends once; the report appears below.",
  },
  access: { read: isEditor, create: isEditor, update: isEditor, delete: isAdmin },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "body", type: "textarea", required: true },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: { description: "Optional. Required for Instagram; used by Facebook/Telegram/WhatsApp if set." },
    },
    {
      name: "channels",
      type: "select",
      hasMany: true,
      admin: { description: "Where to send this." },
      options: [
        { label: "App notification (push)", value: "push" },
        { label: "Email", value: "email" },
        { label: "Telegram", value: "telegram" },
        { label: "WhatsApp", value: "whatsapp" },
        { label: "Facebook", value: "facebook" },
        { label: "Instagram", value: "instagram" },
      ],
    },
    {
      name: "send",
      type: "checkbox",
      defaultValue: false,
      label: "Send now",
      admin: { description: "Tick and save to dispatch. Sends once." },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      admin: { readOnly: true },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Sent", value: "sent" },
      ],
    },
    { name: "report", type: "textarea", admin: { readOnly: true, description: "Per-channel result, filled after sending." } },
    { name: "sentAt", type: "date", admin: { readOnly: true } },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, context }) => {
        if ((context as Record<string, unknown>)?.broadcastDone) return doc;
        const d = doc as Record<string, any>;
        if (!d.send || d.status === "sent") return doc;

        // Resolve a public image URL if an image is attached.
        let imageUrl: string | null = null;
        if (d.image) {
          const media =
            typeof d.image === "object"
              ? d.image
              : await req.payload.findByID({ collection: "media", id: d.image, depth: 0 }).catch(() => null);
          const url = (media as Record<string, any> | null)?.url as string | undefined;
          if (url) {
            const base = (process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "").replace(/\/$/, "");
            imageUrl = url.startsWith("http") ? url : `${base}${url}`;
          }
        }

        const channels = Array.isArray(d.channels) ? d.channels : [];
        let report: string;
        try {
          const { runBroadcast } = await import("../lib/broadcast");
          const results = await runBroadcast(req.payload, { title: d.title, body: d.body, imageUrl }, channels);
          report = results.length
            ? results.map((r) => `${r.channel}: ${r.status}${r.detail ? ` — ${r.detail}` : ""}`).join("\n")
            : "No channels selected.";
        } catch (err) {
          report = "Send failed: " + (err as Error).message;
        }

        await req.payload.update({
          collection: "broadcasts",
          id: d.id,
          data: { status: "sent", send: false, report, sentAt: new Date().toISOString() },
          context: { broadcastDone: true },
        });
        return doc;
      },
    ],
  },
};
