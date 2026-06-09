import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

import {
  Users,
  Media,
  Pages,
  Posts,
  Events,
  Classes,
  Services,
  Announcements,
  PrayerDays,
  TimetableUploads,
} from "./payload/collections";
import { SiteSettings, JummahSettings, DonationSettings, SpecialSchedule } from "./payload/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const dbUri = process.env.DATABASE_URI || process.env.POSTGRES_URL || "file:./kma.db";
// Use Postgres in production (Vercel/Neon), SQLite for local development.
// `push: true` keeps the schema in sync automatically — simplest for this site.
const db = dbUri.startsWith("postgres")
  ? postgresAdapter({ pool: { connectionString: dbUri }, push: true })
  : sqliteAdapter({ client: { url: dbUri }, push: true });

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " · Kingston Mosque Admin",
    },
  },
  collections: [
    Pages,
    Posts,
    Events,
    Classes,
    Services,
    Announcements,
    PrayerDays,
    TimetableUploads,
    Media,
    Users,
  ],
  globals: [SiteSettings, JummahSettings, DonationSettings, SpecialSchedule],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "dev-secret-change-me",
  db,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  sharp,
  // Note: cloud media storage (Vercel Blob / S3) is a planned follow-up so that
  // uploaded images/PDFs persist on serverless hosting. Text content, prayer
  // times, events, etc. work fully without it.
});
