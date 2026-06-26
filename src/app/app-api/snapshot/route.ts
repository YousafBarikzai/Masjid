import { NextResponse } from "next/server";
import { buildSnapshot } from "@/lib/snapshot";

// Mounted at /app-api/* (not /api/*) so it never collides with Payload's REST
// catch-all. Always computed fresh per request; the CDN may hold it for 60s,
// which is well inside the 5–10 minute sync target. Clients recompute the
// live countdown locally from `nextPrayer.time`.
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  try {
    const data = await buildSnapshot();
    return NextResponse.json(data, {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "snapshot_failed", message: (err as Error).message },
      { status: 500, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
