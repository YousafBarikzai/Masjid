import { existsSync, readdirSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";

/**
 * Production self-diagnostics — answers, in one page, the questions that
 * otherwise need dashboard access when the admin misbehaves:
 *   · which commit is actually running (Railway injects the SHA)
 *   · did the boot-time schema sync succeed / fall back / fail
 *   · can the database be READ and WRITTEN right now
 *   · do the "Show on" columns exist (the recent additive migration)
 * Statuses only — no data, no secrets — so it is safe to expose.
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function GET() {
  const out: Record<string, unknown> = {
    time: new Date().toISOString(),
    commit: (process.env.RAILWAY_GIT_COMMIT_SHA || "unknown").slice(0, 10),
    branch: process.env.RAILWAY_GIT_BRANCH || "unknown",
    schemaSyncOnBoot: (globalThis as Record<string, unknown>).__schemaSync ?? "not run (dev mode or pre-boot)",
    // The auth origins actually in effect — cookie-authenticated writes are
    // rejected (as "not allowed") when the admin's Origin isn't listed here,
    // so this line answers "why can't I save?" at a glance.
    authOrigins: (globalThis as Record<string, unknown>).__authConfig ?? "not initialised",
  };

  try {
    const p = await getPayloadClient();
    const adapter = p.db as unknown as {
      drizzle: unknown;
      execute: (args: { drizzle: unknown; raw: string }) => Promise<unknown>;
    };

    // Read check.
    try {
      await adapter.execute({ drizzle: adapter.drizzle, raw: "SELECT 1" });
      out.dbRead = "ok";
    } catch (e) {
      out.dbRead = `FAILED: ${(e as Error).message.slice(0, 120)}`;
    }

    // Write check — a zero-row UPDATE on a table that always exists. Proves
    // write permission without touching any data and, crucially, without
    // creating ANY table: an unknown table left behind makes the boot-time
    // schema diff stop at an interactive "create or rename?" prompt, hanging
    // a headless deploy. (Older scratch tables are dropped before every diff
    // by the schema-sync code as a second line of defence.)
    try {
      await adapter.execute({ drizzle: adapter.drizzle, raw: "UPDATE users SET updated_at = updated_at WHERE id = -1" });
      out.dbWrite = "ok";
    } catch (e) {
      out.dbWrite = `FAILED: ${(e as Error).message.slice(0, 160)}`;
    }

    // Do the new targeting columns exist?
    try {
      await adapter.execute({ drizzle: adapter.drizzle, raw: "SELECT show_on_website FROM announcements LIMIT 1" });
      out.showOnColumns = "present";
    } catch (e) {
      out.showOnColumns = `MISSING: ${(e as Error).message.slice(0, 120)}`;
    }

    // Media storage: answers "why don't uploaded images show?" at a glance.
    // Uploads live on the container's own disk unless S3 (or a mounted volume
    // via MEDIA_DIR) is configured — and Railway WIPES that disk on every
    // deploy, so DB records survive while their files vanish.
    try {
      const s3 = Boolean(process.env.S3_BUCKET);
      const dir = process.env.MEDIA_DIR || path.resolve(process.cwd(), "media");
      const media: Record<string, unknown> = {
        mode: s3 ? "S3 (persistent)" : process.env.MEDIA_DIR ? `volume at ${dir}` : `container disk at ${dir} — WIPED ON EVERY DEPLOY`,
      };
      if (!s3) {
        media.dirExists = existsSync(dir);
        media.filesOnDisk = existsSync(dir) ? readdirSync(dir).length : 0;
      }
      const docs = await p.find({ collection: "media" as never, limit: 100, depth: 0, overrideAccess: true });
      media.filesInDatabase = docs.totalDocs;
      if (!s3 && docs.docs.length) {
        const missing = (docs.docs as Array<{ filename?: string }>)
          .filter((d) => d.filename && !existsSync(path.join(dir, d.filename)))
          .map((d) => d.filename);
        media.missingFiles = missing.length
          ? { count: missing.length, examples: missing.slice(0, 5) }
          : "none — every database record has its file";
      }
      out.media = media;
    } catch (e) {
      out.media = `check failed: ${(e as Error).message.slice(0, 120)}`;
    }
  } catch (e) {
    out.payloadInit = `FAILED: ${(e as Error).message.slice(0, 160)}`;
  }

  return NextResponse.json(out, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
