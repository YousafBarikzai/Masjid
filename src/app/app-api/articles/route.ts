import { NextRequest, NextResponse } from "next/server";
import { livePostsWhere } from "@/lib/cms";
import { mapPost } from "@/lib/app-content";
import { getPayloadClient } from "@/lib/payloadClient";

/**
 * Paginated news feed for the app's News tab: full native article bodies
 * (rich text → sections) with lead images, 10 per page, newest first.
 * Live content only — drafts and future-scheduled posts never appear, and
 * unpublished/deleted posts disappear on the next fetch.
 *
 *   GET /app-api/articles?page=1
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
      collection: "posts",
      sort: "-publishedDate",
      page,
      limit,
      depth: 1,
      where: livePostsWhere(),
    });
    return NextResponse.json(
      {
        docs: res.docs.map(mapPost),
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
