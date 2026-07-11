import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor, FixedToolbarFeature, TextStateFeature } from "@payloadcms/richtext-lexical";
import { textStates } from "./payload/richtext";
import { s3Storage } from "@payloadcms/storage-s3";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import sharp from "sharp";
import { formsPlugin } from "./payload/forms";

import {
  Users,
  Media,
  Pages,
  Posts,
  Khutbahs,
  Events,
  Classes,
  Services,
  Announcements,
  PrayerDays,
  TimetableUploads,
  ContactSubmissions,
  DeviceTokens,
  Subscribers,
  Broadcasts,
} from "./payload/collections";
import {
  SiteSettings,
  JummahSettings,
  DonationSettings,
  SpecialSchedule,
  BroadcastSettings,
  MainMenu,
  AppSettings,
} from "./payload/globals";
import { AuditLog, withAudit } from "./payload/audit";
import { Screens } from "./payload/screens";
import { withHelp, withHelpGlobal } from "./payload/help";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const rawDbUri =
  process.env.DATABASE_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
// A value with no "://" (e.g. the literal "Postgres.DATABASE_URL") is an
// UNRESOLVED variable reference — on Railway the value must be ${{Postgres.DATABASE_URL}}
// (with the $ and double braces) so it expands to the real connection string.
const dbLooksValid = rawDbUri.includes("://");
const dbUri = dbLooksValid ? rawDbUri : "file:./kma.db";
// Whether a real database is configured. Without one we fall back to a LOCAL
// SQLite file, which on most hosts (Railway/Vercel) lives on an EPHEMERAL disk
// that is wiped on every redeploy — taking the users and all content with it
// (that's why the admin keeps asking to "create the first user").
const dbConfigured = dbLooksValid;
const dbReferenceUnresolved = !!rawDbUri && !dbLooksValid;
// Use Postgres in production (Vercel/Neon/Railway), SQLite for local development.
// `push: true` keeps the schema in sync automatically — simplest for this site.
const db = /^postgres(ql)?:\/\//i.test(dbUri)
  ? postgresAdapter({
      pool: {
        connectionString: dbUri,
        // Fail fast if the database is unreachable or misconfigured (e.g. the
        // connection string points at the wrong service), so the site degrades to
        // built-in content instead of hanging and throwing a server-side exception.
        connectionTimeoutMillis: 10000,
      },
      push: true,
    })
  : sqliteAdapter({ client: { url: dbUri }, push: true });

// Persistent media storage (S3 / Cloudflare R2 / any S3-compatible). Activates
// only when S3_BUCKET is set, so it never blocks a deploy. Uses server-side
// uploads (no client component) to keep the admin bundle clean.
const plugins = [
  // No-code form builder (forms + form-submissions collections).
  formsPlugin,
  ...(process.env.S3_BUCKET
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
    : []),
];

export default buildConfig({
  // Public URL of the deployed site (used in emails, previews, API links).
  serverURL: process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || undefined,
  // Allow the mobile apps, PWA and mosque screens to call the API from other
  // origins. Defaults to open ("*") since all app-facing data is public read;
  // set CORS_ORIGINS (comma-separated) to lock it down to known origins.
  cors: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()) : "*",
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    // Phase 2 admin UX: a personalised dashboard (greeting, next-prayer countdown,
    // quick actions, recent edits, drafts, favourites) and a global ⌘K command
    // palette. Both are additive — a missing importMap entry degrades to nothing
    // rather than breaking the admin (see admin/importMap.js).
    components: {
      beforeDashboard: ["@/payload/components/DashboardGrid#DashboardGrid"],
      // Waterfall navigation: a clear heading → sub-heading → child-link tree.
      // The default flat group list is hidden in admin-theme.css.
      beforeNavLinks: ["@/payload/components/AdminNav#AdminNav"],
      providers: ["@/payload/components/CommandPaletteProvider#CommandPaletteProvider"],
    },
    meta: {
      titleSuffix: " · Kingston Mosque Admin",
    },
  },
  collections: [
    // withAudit records every change to the Audit Log; withHelp injects the
    // in-CMS "how to use this page" panel (slug-driven, no-op without content).
    withHelp(withAudit(Pages)),
    withHelp(withAudit(Posts)),
    withHelp(withAudit(Khutbahs)),
    withHelp(withAudit(Events)),
    withHelp(withAudit(Classes)),
    withHelp(withAudit(Services)),
    withHelp(withAudit(Announcements)),
    withHelp(PrayerDays),
    withHelp(TimetableUploads),
    withHelp(ContactSubmissions),
    DeviceTokens,
    withHelp(Subscribers),
    withHelp(withAudit(Broadcasts)),
    withHelp(withAudit(Screens)),
    withHelp(withAudit(Media)),
    withHelp(withAudit(Users)),
    withHelp(AuditLog),
  ],
  globals: [
    withHelpGlobal(SiteSettings),
    withHelpGlobal(JummahSettings),
    withHelpGlobal(DonationSettings),
    withHelpGlobal(SpecialSchedule),
    withHelpGlobal(BroadcastSettings),
    withHelpGlobal(MainMenu),
    withHelpGlobal(AppSettings),
  ],
  // Rich editor for ALL richText fields: keeps every default feature (headings,
  // lists, links, images, alignment…), shows an always-visible toolbar so the
  // options are discoverable, and adds text/highlight colours. The same colour
  // map is reused by the website renderer so colours show on the live site.
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      TextStateFeature({ state: textStates }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || "dev-secret-change-me",
  // Email is optional: set SMTP_* env vars to enable real delivery (e.g. contact
  // form notifications). Without them, messages are still saved in the admin.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || "no-reply@kingstonmosque.org",
        defaultFromName: "Kingston Mosque",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === "465",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        },
      })
    : undefined,
  db,
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  sharp,
  plugins,
  // Payload's adapters only auto-create the schema in development. Production
  // (e.g. `next start` on Railway) expects migrations, which can't be generated
  // in this environment — so we sync the schema on first boot instead. This is
  // idempotent (applies only diffs) and keeps the managed DB in step with the code.
  onInit: async (payload) => {
    // Loudly flag the #1 deployment foot-gun: running in production with no
    // persistent database, so every redeploy wipes users + content.
    if (dbReferenceUnresolved) {
      payload.logger.error(
        `⚠ DATABASE_URI is set to "${rawDbUri}", which is not a valid connection string — ` +
          "it looks like an UNRESOLVED variable reference. On Railway the value must be " +
          "${{Postgres.DATABASE_URL}} (with the $ and double curly braces) so it expands to " +
          "the real Postgres URL. Until then the app falls back to a temporary SQLite file.",
      );
    } else if (process.env.NODE_ENV === "production" && !dbConfigured) {
      payload.logger.warn(
        "⚠ NO PERSISTENT DATABASE CONFIGURED — using a temporary SQLite file on the " +
          "container's disk. It is wiped on every redeploy, which is why the admin keeps " +
          "asking to create the first user and content does not persist. FIX: set a " +
          "DATABASE_URI (or POSTGRES_URL) pointing at a persistent Postgres database, and " +
          "set ADMIN_EMAIL + ADMIN_PASSWORD so your login is provisioned automatically.",
      );
    }
    if (process.env.NODE_ENV === "production" && process.env.PAYLOAD_MIGRATING !== "true") {
      try {
        const { pushDevSchema } = await import("@payloadcms/drizzle");
        await pushDevSchema(payload.db as never);
        payload.logger.info("✓ Database schema synced on boot.");
      } catch (err) {
        payload.logger.error("Schema sync on boot failed: " + (err as Error).message);
      }
    }

    // Make every website page editable: seed the Pages collection with the
    // site's built-in text once (never overwrites staff edits — see seed-pages.ts).
    try {
      const { seedWebsitePages, seedScreens, seedSampleKhutbahs } = await import("./payload/seed-pages");
      await seedWebsitePages(payload);
      await seedScreens(payload);
      await seedSampleKhutbahs(payload);
    } catch (err) {
      payload.logger.warn("Website page seeding failed: " + (err as Error).message);
    }

    // Optional: provision a Super Admin login from env vars, so there's a
    // guaranteed admin account without the first-time setup screen. Created once
    // (only if that email doesn't already exist), never overwritten — so a
    // password you later change in the admin is preserved.
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      try {
        const existing = await payload.find({
          collection: "users",
          where: { email: { equals: process.env.ADMIN_EMAIL } },
          limit: 1,
          depth: 0,
        });
        if (existing.totalDocs === 0) {
          await payload.create({
            collection: "users",
            data: {
              name: process.env.ADMIN_NAME || "Administrator",
              email: process.env.ADMIN_EMAIL,
              password: process.env.ADMIN_PASSWORD,
              roles: ["super-admin"],
            },
          });
          payload.logger.info("✓ Super Admin provisioned from ADMIN_EMAIL.");
        }
      } catch (err) {
        payload.logger.error("Admin bootstrap failed: " + (err as Error).message);
      }
    }
  },
});
