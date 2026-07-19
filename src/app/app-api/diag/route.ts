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

    // Write check — its own scratch table, no real data touched.
    try {
      await adapter.execute({ drizzle: adapter.drizzle, raw: "CREATE TABLE IF NOT EXISTS _diag_probe (ts text)" });
      await adapter.execute({ drizzle: adapter.drizzle, raw: "INSERT INTO _diag_probe (ts) VALUES ('probe')" });
      await adapter.execute({ drizzle: adapter.drizzle, raw: "DELETE FROM _diag_probe" });
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
  } catch (e) {
    out.payloadInit = `FAILED: ${(e as Error).message.slice(0, 160)}`;
  }

  return NextResponse.json(out, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
