import { getPayloadClient } from "@/lib/payloadClient";

/* Plain-English database health check. Visit /health in the browser to see whether
   the app can reach the database, and — if not — the EXACT error (connection,
   authentication, or missing schema). Returns 200 with a JSON body either way so
   the message is readable in the browser rather than hidden behind a 500 page. */

export const dynamic = "force-dynamic";

function dbHost(): string {
  const uri = process.env.DATABASE_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL || "";
  try {
    // Show only the host (no credentials) so it's safe to paste.
    return new URL(uri).host || "(none)";
  } catch {
    return uri ? "(unparseable)" : "(no DATABASE_URI set)";
  }
}

export async function GET() {
  const started = Date.now();
  const base = {
    databaseConfigured: !!(process.env.DATABASE_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL),
    databaseHost: dbHost(),
    adminEnvProvisioned: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
  };
  try {
    const p = await getPayloadClient();
    const users = await p.count({ collection: "users" });
    return Response.json(
      { ok: true, database: "connected", users: users.totalDocs, ms: Date.now() - started, ...base },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const err = e as { message?: string; code?: string; name?: string };
    return Response.json(
      {
        ok: false,
        database: "ERROR",
        error: String(err?.message || e),
        code: err?.code ?? null,
        name: err?.name ?? null,
        ms: Date.now() - started,
        ...base,
        hint:
          "If 'error' mentions ENOTFOUND/ECONNREFUSED/timeout → DATABASE_URI points at an unreachable host (wrong Postgres reference). " +
          "If it mentions 'password authentication failed' → wrong credentials in DATABASE_URI. " +
          "If it mentions a relation/table 'does not exist' → the schema didn't get created.",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
