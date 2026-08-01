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
import { Members, MembershipSettings } from "./payload/membership";
import { MemberDocumentCategories, MemberDocuments, MemberNotices, seedMemberPortal } from "./payload/member-portal";
import { ResourceDocuments } from "./payload/documents";
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

/* The site's public URL. On Railway RAILWAY_PUBLIC_DOMAIN is injected
   automatically, so production gets a correct serverURL even when SERVER_URL
   was never set — which is what silently broke cookie-authenticated admin
   writes (CSRF origin rejection) before this fallback existed. */
const publicServerURL =
  process.env.SERVER_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined) ||
  (process.env.NODE_ENV === "production" ? "https://masjid-production.up.railway.app" : "http://localhost:3000");

/* Every origin the admin panel may legitimately be used from. */
const csrfOrigins = Array.from(
  new Set(
    [
      publicServerURL,
      "https://masjid-production.up.railway.app",
      "https://kingstonmosque.org",
      "https://www.kingstonmosque.org",
      "http://localhost:3000",
      ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()) : []),
      ...(process.env.CSRF_ORIGINS ? process.env.CSRF_ORIGINS.split(",").map((s) => s.trim()) : []),
    ].filter((o): o is string => Boolean(o) && o !== "*"),
  ),
);

// Surfaced by /app-api/diag so production can self-report its effective auth
// origins (this is exactly the setting whose absence broke admin saves).
(globalThis as Record<string, unknown>).__authConfig = { serverURL: publicServerURL, csrf: csrfOrigins };

export default buildConfig({
  // Public URL of the deployed site (used in emails, previews, API links —
  // and, crucially, CSRF origin checks on cookie-authenticated writes).
  serverURL: publicServerURL,
  // Allow the mobile apps, PWA and mosque screens to call the API from other
  // origins. Defaults to open ("*") since all app-facing data is public read;
  // set CORS_ORIGINS (comma-separated) to lock it down to known origins.
  cors: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()) : "*",
  // Origins allowed to send cookie-authenticated requests. Payload rejects
  // the auth cookie on any mutation whose Origin header isn't in this list —
  // browsers always send Origin on POST/PATCH/DELETE, so if the deployed
  // domain is missing every admin save fails with "You are not allowed to
  // perform this action" (and logout fails) even though reads still work.
  csrf: csrfOrigins,
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
    withHelp(withAudit(Members)),
    withHelp(withAudit(MemberDocuments)),
    withHelp(withAudit(MemberDocumentCategories)),
    withHelp(withAudit(MemberNotices)),
    withHelp(withAudit(ResourceDocuments)),
    withHelp(AuditLog),
  ],
  globals: [
    MembershipSettings,
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
    // Membership housekeeping: run the renewal sweep (status transitions +
    // reminder emails) shortly after boot and then twice a day. Guarded so hot
    // reloads never stack intervals; the sweep itself is idempotent.
    const g = globalThis as Record<string, unknown>;
    if (!g.__membershipSweepTimer) {
      const run = async () => {
        try {
          const { runMembershipSweep } = await import("./lib/membership");
          const result = await runMembershipSweep(payload);
          if (result.remindersSent || result.markedRenewalDue || result.markedExpired) {
            payload.logger.info(`Membership sweep: ${JSON.stringify(result)}`);
          }
        } catch (err) {
          payload.logger.warn(`Membership sweep failed: ${(err as Error).message}`);
        }
      };
      setTimeout(run, 30_000);
      g.__membershipSweepTimer = setInterval(run, 12 * 60 * 60 * 1000);
    }


    // Make sure the public menu is complete and offers the membership page.
    // The site header falls back to the built-in default menu ONLY while the
    // CMS menu is empty — so seeding must always write the FULL menu, never a
    // single item (a one-item menu would replace the whole navigation).
    try {
      const menu = (await payload.findGlobal({ slug: "main-menu" as never })) as {
        items?: Array<{ label?: string; url?: string; children?: Array<{ label?: string; url?: string }> }>;
      };
      const items = menu?.items ?? [];
      // Self-heal: empty, or exactly the lone "/membership" item an earlier
      // version of this seed wrote — replace with the complete default menu.
      const needsFullSeed =
        items.length === 0 || (items.length === 1 && items[0]?.url === "/membership");
      if (needsFullSeed) {
        const { nav } = await import("./lib/content");
        const full = nav.map((i) => ({
          label: i.label,
          url: i.href,
          children: i.children?.map((c) => ({ label: c.label, url: c.href })),
        }));
        await payload.updateGlobal({ slug: "main-menu" as never, data: { items: full } as never });
        payload.logger.info("Seeded the full site menu (incl. Resources → Membership Form).");
      } else {
        // Admin-managed menu: just make sure membership is reachable.
        const has = items.some(
          (i) => i.url === "/membership" || (i.children ?? []).some((c) => c.url === "/membership"),
        );
        if (!has) {
          const resources = items.find((i) => /resources/i.test(String(i.label)) && Array.isArray(i.children));
          if (resources) {
            resources.children = [...(resources.children ?? []), { label: "Membership Form", url: "/membership" }];
          } else {
            items.push({ label: "Membership", url: "/membership" });
          }
          await payload.updateGlobal({ slug: "main-menu" as never, data: { items } as never });
          payload.logger.info("Added “Membership Form” to the site menu.");
        }
      }
    } catch {
      /* menu is admin-managed — never block boot over it */
    }

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
        // Push the schema WITHOUT the interactive confirm that pushDevSchema
        // uses. On a headless server that prompt cannot be answered and its
        // fallback is process.exit(0) — which would kill the boot the first
        // time a change involves a data-loss warning (e.g. dropping a removed
        // feature's columns). We call drizzle-kit's pushSchema directly and
        // auto-accept, logging exactly what was accepted.
        const adapter = payload.db as unknown as {
          requireDrizzleKit: () => {
            pushSchema: (
              schema: unknown,
              drizzle: unknown,
              schemaName?: string[],
            ) => Promise<{
              apply: () => Promise<void>;
              hasDataLoss: boolean;
              warnings: string[];
              statementsToExecute: string[];
            }>;
          };
          schema: unknown;
          drizzle: unknown;
          schemaName?: string;
          execute: (args: { drizzle: unknown; raw: string }) => Promise<unknown>;
        };
        // The diag endpoint's scratch table must never exist when the schema
        // diff runs: drizzle can mistake a brand-new collection table for a
        // RENAME of it and stop at an interactive "create or rename?" prompt,
        // hanging a headless boot. Removing it first keeps the diff
        // unambiguous (diag recreates it on demand).
        try {
          await adapter.execute({ drizzle: adapter.drizzle, raw: "DROP TABLE IF EXISTS _diag_probe" });
        } catch {
          /* nothing to drop */
        }
        const { pushSchema } = adapter.requireDrizzleKit();
        const { apply, hasDataLoss, warnings, statementsToExecute } = await pushSchema(
          adapter.schema,
          adapter.drizzle,
          adapter.schemaName ? [adapter.schemaName] : undefined,
        );
        if (warnings?.length) {
          payload.logger.warn(
            `Schema push warnings (auto-accepted on boot${hasDataLoss ? ", includes data loss" : ""}): ${warnings.join(" | ")}`,
          );
        }
        try {
          // Fast path: apply everything at once.
          await apply();
          payload.logger.info("✓ Database schema synced on boot.");
          (globalThis as Record<string, unknown>).__schemaSync = { status: "ok", at: new Date().toISOString() };
        } catch (applyErr) {
          // apply() is all-or-nothing: one failing statement (typically a
          // destructive DROP that the driver refuses) blocks EVERY other
          // change — including the additive ADD COLUMNs new features need,
          // which then makes saving those records fail. Re-run each statement
          // individually so the additive changes always land even when a drop
          // can't complete.
          payload.logger.warn(
            "Batch schema apply failed — applying statements individually: " + (applyErr as Error).message,
          );
          let applied = 0;
          let skipped = 0;
          for (const stmt of statementsToExecute ?? []) {
            try {
              await adapter.execute({ drizzle: adapter.drizzle, raw: stmt });
              applied += 1;
            } catch (stmtErr) {
              skipped += 1;
              payload.logger.warn(
                `  · schema statement skipped: ${stmt.slice(0, 90)} … (${(stmtErr as Error).message.slice(0, 140)})`,
              );
            }
          }
          payload.logger.info(
            `✓ Database schema synced statement-by-statement: ${applied} applied, ${skipped} skipped.`,
          );
          (globalThis as Record<string, unknown>).__schemaSync = {
            status: `fallback: ${applied} applied, ${skipped} skipped`,
            at: new Date().toISOString(),
          };
        }
      } catch (err) {
        payload.logger.error("Schema sync on boot failed: " + (err as Error).message);
        (globalThis as Record<string, unknown>).__schemaSync = {
          status: `failed: ${(err as Error).message.slice(0, 160)}`,
          at: new Date().toISOString(),
        };
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

    // Members-portal categories (Financial accounts, AGM minutes, …) — seeded
    // once so the portal has its agreed structure; admins extend via the CMS.
    // Runs AFTER the schema sync above so the tables exist on first boot.
    try {
      await seedMemberPortal(payload);
    } catch (err) {
      payload.logger.warn(`Member portal seed failed: ${(err as Error).message}`);
    }

    // Optional: provision a Super Admin login from env vars, so there's a
    // guaranteed admin account without the first-time setup screen. Created
    // once; the password is never overwritten. Crucially, the account's ROLE
    // is also repaired on every boot: if the ADMIN_EMAIL account exists but
    // has somehow lost its admin role (e.g. it was edited, or created before
    // roles were assigned), Super Admin is restored — this is the safety net
    // that guarantees the named administrator can always approve, publish and
    // manage users.
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
        } else {
          const account = existing.docs[0] as { id: string | number; roles?: string[] };
          const roles = Array.isArray(account.roles) ? account.roles : [];
          payload.logger.info(
            `Admin account ${process.env.ADMIN_EMAIL} roles: [${roles.join(", ") || "none"}]`,
          );
          if (!roles.includes("super-admin") && !roles.includes("admin")) {
            await payload.update({
              collection: "users",
              id: account.id,
              data: { roles: [...roles, "super-admin"] },
              overrideAccess: true,
            });
            payload.logger.warn(
              `⚠ ADMIN_EMAIL account was missing its admin role (had: ${roles.join(", ") || "none"}) — Super Admin restored.`,
            );
          }
        }
      } catch (err) {
        payload.logger.error("Admin bootstrap failed: " + (err as Error).message);
      }
    }
  },
});
