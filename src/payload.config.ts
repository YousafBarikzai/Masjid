import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
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
} from "./payload/collections";
import { SiteSettings, JummahSettings, DonationSettings } from "./payload/globals";

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
    Media,
    Users,
  ],
  globals: [SiteSettings, JummahSettings, DonationSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "dev-secret-change-me",
  db,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  sharp,
  plugins: [
    // On Vercel, set BLOB_READ_WRITE_TOKEN to store uploaded images/PDFs in
    // Vercel Blob. Locally (no token) Payload uses the local /media folder.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
