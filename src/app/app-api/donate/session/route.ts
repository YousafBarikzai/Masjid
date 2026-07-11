import { NextRequest, NextResponse } from "next/server";
import { createDonationSession, stripeEnabled } from "@/lib/stripe";

/**
 * Creates a secure Stripe Checkout session for an in-app donation.
 * Body: { amount: number (£, 1..10000), interval: "one_off"|"month", campaign?: string }
 * → { configured: true, id, url }  — the app opens `url` in its sheet
 * → { configured: false }          — Stripe key not set; app falls back
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function POST(req: NextRequest) {
  if (!stripeEnabled()) {
    return NextResponse.json({ configured: false }, { headers: CORS });
  }
  let body: { amount?: unknown; interval?: unknown; campaign?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: CORS });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return NextResponse.json({ error: "invalid_amount" }, { status: 400, headers: CORS });
  }
  const interval = body.interval === "month" ? "month" : "one_off";
  const campaign = typeof body.campaign === "string" ? body.campaign.slice(0, 80) : "";
  const baseUrl =
    (process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || req.nextUrl.origin).replace(/\/$/, "");

  try {
    const session = await createDonationSession({
      amountPence: Math.round(amount * 100),
      interval,
      campaign,
      baseUrl,
    });
    return NextResponse.json({ configured: true, ...session }, { headers: CORS });
  } catch (err) {
    return NextResponse.json(
      { error: "session_failed", message: (err as Error).message },
      { status: 502, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
