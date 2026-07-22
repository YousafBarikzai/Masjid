import { NextRequest, NextResponse } from "next/server";
import { donationSessionStatus, stripeEnabled } from "@/lib/stripe";

/** The app calls this after the checkout sheet closes to confirm the outcome:
 *  GET /app-api/donate/status?id=cs_… → { paid: boolean, status } */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!stripeEnabled() || !id.startsWith("cs_")) {
    return NextResponse.json({ paid: false, status: "unknown" }, { headers: CORS });
  }
  try {
    const s = await donationSessionStatus(id);
    return NextResponse.json(s, { headers: CORS });
  } catch {
    return NextResponse.json({ paid: false, status: "error" }, { headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
