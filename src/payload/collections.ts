import path from "path";
import type { Block, CollectionConfig } from "payload";
import { anyone, isAdmin, isAdminFieldLevel, isEditor, isPrayerManager, isStaff } from "./access";
import { parseTimetableCsv } from "../lib/parseTimetable";

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
    { name: "link", type: "text" },
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
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};
