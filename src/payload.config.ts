import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
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

const dbUri =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "file:./kma.db";
// Use Postgres in production (Vercel/Neon), SQLite for local development.
// `push: true` keeps the schema in sync automatically — simplest for this site.
const db = dbUri.startsWith("postgres")
  ? postgresAdapter({ pool: { connectionString: dbUri }, push: true })
  : sqliteAdapter({ client: { url: dbUri }, push: true });

// Persistent media storage (S3 / Cloudflare R2 / any S3-compatible). Activates
// only when S3_BUCKET is set, so it never blocks a deploy. Uses server-side
// uploads (no client component) to keep the admin bundle clean.
const plugins =
  process.env.S3_BUCKET
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET,
          config: {
            region: process.env.S3_REGION,
            endpoint: process.env.S3_ENDPOINT || undefined,
            forcePathStyle: Boolean(process.env.S3_ENDPOINT),
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
            },
          },
        }),
      ]
    : [];

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
  plugins,
});
