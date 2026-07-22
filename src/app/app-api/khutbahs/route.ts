import { NextRequest, NextResponse } from "next/server";
import { mapKhutbah } from "@/lib/app-content";
import { getPayloadClient } from "@/lib/payloadClient";

/**
 * Paginated Khutbah Archive for the app's Media area: every published Friday
 * sermon, newest first, 10 per page. Live content only — drafts stay private
 * and a future-dated khutbah is hidden until its day arrives (scheduling).
 *
 *   GET /app-api/khutbahs?page=1
 *   → { docs, page, totalPages, totalDocs, hasMore }
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function GET(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10) || 1);
  const limit = 10;
  try {
    const p = await getPayloadClient();
    const res = await p.find({
      collection: "khutbahs" as never,
      sort: "-date",
      page,
      limit,
      depth: 1,
      where: {
        and: [
          { _status: { equals: "published" } },
          { date: { less_than_equal: new Date().toISOString() } },
        ],
      } as never,
    });
    return NextResponse.json(
      {
        docs: res.docs.map(mapKhutbah),
        page: res.page ?? page,
        totalPages: res.totalPages ?? 1,
        totalDocs: res.totalDocs ?? res.docs.length,
        hasMore: (res.page ?? page) < (res.totalPages ?? 1),
      },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json(
      { docs: [], page: 1, totalPages: 1, totalDocs: 0, hasMore: false },
      { headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
