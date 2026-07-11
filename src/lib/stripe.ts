import "server-only";

/**
 * Minimal Stripe Checkout integration (REST, no SDK dependency), env-gated by
 * STRIPE_SECRET_KEY — same pattern as SMTP/S3: absent key ⇒ feature off, the
 * app falls back gracefully. Checkout gives donors Apple Pay, Google Pay and
 * cards with Stripe-hosted security (PCI SAQ-A), inside the app's sheet.
 *
 * One-off  → mode=payment  (submit_type=donate)
 * Monthly  → mode=subscription (inline recurring price)
 */

const API = "https://api.stripe.com/v1";

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function form(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function stripe(path: string, params?: Record<string, string>): Promise<Record<string, unknown>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("stripe_not_configured");
  const res = await fetch(`${API}${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: params ? form(params) : undefined,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = (data as { error?: { message?: string } }).error;
    throw new Error(err?.message || `stripe_${res.status}`);
  }
  return data;
}

export async function createDonationSession(opts: {
  amountPence: number;
  interval: "one_off" | "month";
  campaign: string;
  baseUrl: string;
}): Promise<{ id: string; url: string }> {
  const name = opts.campaign ? `Donation — ${opts.campaign}` : "Donation to Kingston Mosque";
  const common: Record<string, string> = {
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "gbp",
    "line_items[0][price_data][unit_amount]": String(opts.amountPence),
    "line_items[0][price_data][product_data][name]": name,
    success_url: `${opts.baseUrl}/donate/thank-you?sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.baseUrl}/donate/thank-you?cancelled=1`,
    "metadata[campaign]": opts.campaign || "General",
    "metadata[source]": "mobile-app",
  };
  const params: Record<string, string> =
    opts.interval === "month"
      ? {
          ...common,
          mode: "subscription",
          "line_items[0][price_data][recurring][interval]": "month",
        }
      : {
          ...common,
          mode: "payment",
          submit_type: "donate",
        };
  const s = await stripe("/checkout/sessions", params);
  return { id: String(s.id), url: String(s.url) };
}

export async function donationSessionStatus(id: string): Promise<{ paid: boolean; status: string }> {
  const s = await stripe(`/checkout/sessions/${encodeURIComponent(id)}`);
  const payment = String(s.payment_status ?? "");
  const status = String(s.status ?? "");
  return { paid: payment === "paid" || payment === "no_payment_required", status: status || payment };
}
