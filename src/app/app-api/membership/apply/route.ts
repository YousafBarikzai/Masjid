import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";

/* Public application endpoint used by the website wizard and the mobile apps.
   Creates the member account (status: pending-review) after validation,
   uniqueness checks and light anti-spam. Payload hashes the password; it is
   never stored or logged in clear. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Small in-memory rate limit: max 5 applications per IP per hour. Honest
// protection against scripts without punishing shared connections too hard.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => t > windowStart);
  if (list.length >= 5) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

const REQUIRED = ["firstName", "surname", "email", "username", "password"] as const;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: CORS });
  }

  // Honeypot: real people never fill a field their screen doesn't show.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many applications from this connection — please try again later." },
      { status: 429, headers: CORS },
    );
  }

  const errors: Record<string, string> = {};
  for (const f of REQUIRED) {
    if (typeof body[f] !== "string" || !(body[f] as string).trim()) errors[f] = "This field is required.";
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email address.";
  const username = String(body.username || "").trim().toLowerCase();
  if (username && !/^[a-z0-9._-]{3,30}$/.test(username))
    errors.username = "3–30 characters: letters, numbers, dots, dashes.";
  const password = String(body.password || "");
  if (password && password.length < 8) errors.password = "Use at least 8 characters.";
  if (body.passwordConfirm !== undefined && body.passwordConfirm !== password)
    errors.passwordConfirm = "Passwords don't match.";
  const consents = (body.consents ?? {}) as Record<string, unknown>;
  if (!consents.accurate) errors.consentAccurate = "Please confirm your information is accurate.";
  if (!consents.terms) errors.consentTerms = "Please agree to the membership terms.";
  if (!consents.privacy) errors.consentPrivacy = "Please agree to the privacy policy.";
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400, headers: CORS });
  }

  try {
    const payload = await getPayloadClient();

    // Uniqueness with a friendly message (the DB constraint is the backstop).
    const clash = await payload.find({
      collection: "members" as never,
      where: { or: [{ email: { equals: email } }, { username: { equals: username } }] } as never,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (clash.totalDocs > 0) {
      const doc = clash.docs[0] as { email?: string };
      const which = doc.email === email ? "email address" : "username";
      return NextResponse.json(
        { ok: false, errors: { [doc.email === email ? "email" : "username"]: `That ${which} is already registered — try signing in instead.` } },
        { status: 409, headers: CORS },
      );
    }

    const pick = (k: string, max = 200) =>
      typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : undefined;
    const proposer = (p: unknown) => {
      const o = (p ?? {}) as Record<string, unknown>;
      const s = (k: string) => (typeof o[k] === "string" ? (o[k] as string).trim().slice(0, 120) : "");
      return { fullName: s("fullName"), telephone: s("telephone"), email: s("email"), membershipNumber: s("membershipNumber") };
    };

    const doc = await payload.create({
      collection: "members" as never,
      overrideAccess: true,
      data: {
        title: pick("title", 10),
        firstName: pick("firstName", 60),
        surname: pick("surname", 60),
        gender: ["male", "female", "other", "not-said"].includes(String(body.gender)) ? body.gender : undefined,
        dateOfBirth: pick("dateOfBirth", 30),
        address1: pick("address1"),
        address2: pick("address2"),
        townCity: pick("townCity", 80),
        county: pick("county", 80),
        postcode: pick("postcode", 12),
        email,
        telephone: pick("telephone", 30),
        username,
        password,
        proposer1: proposer(body.proposer1),
        proposer2: proposer(body.proposer2),
        consents: {
          accurate: true,
          terms: true,
          privacy: true,
          marketing: Boolean(consents.marketing),
          recordedAt: new Date().toISOString(),
        },
      } as never,
    });

    const d = doc as { applicationNumber?: string };
    return NextResponse.json({ ok: true, applicationNumber: d.applicationNumber }, { status: 201, headers: CORS });
  } catch (err) {
    const msg = (err as Error).message || "";
    if (/unique|duplicate/i.test(msg)) {
      return NextResponse.json(
        { ok: false, errors: { email: "That email or username is already registered — try signing in instead." } },
        { status: 409, headers: CORS },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Something went wrong saving your application — please try again." },
      { status: 500, headers: CORS },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
