import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
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
} from "./payload/collections";
import { SiteSettings, JummahSettings, DonationSettings } from "./payload/globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

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
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URI || "file:./kma.db" },
  }),
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  sharp,
});
