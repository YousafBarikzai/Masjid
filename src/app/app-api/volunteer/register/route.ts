import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import {
  AGE_GROUPS,
  DAYS,
  FREQUENCIES,
  LANGUAGES,
  TIMES,
  recordVolunteerContact,
  sendVolunteerEmail,
  volunteerConfirmationEmail,
} from "@/payload/volunteers";

/* Public volunteer registration — used by the website wizard AND the mobile
   apps, all writing to the SAME central volunteers database. Validated,
   rate-limited, honeypot-protected, duplicate-aware, and confirmed with a
   branded email. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Max 5 registrations per IP per hour — the same honest anti-script measure
// as the membership form.
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => t > now - 60 * 60 * 1000);
  if (list.length >= 5) return true;
  list.push(now);
  hits.set(ip, list);
  return false;
}

const inList = (v: unknown, list: readonly string[]) => typeof v === "string" && (list as readonly string[]).includes(v);
const pickList = (v: unknown, list: readonly string[], max = 10): string[] =>
  Array.isArray(v) ? v.filter((x) => inList(x, list)).slice(0, max) : [];
const text = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: CORS });
  }

  // Honeypot — a hidden field no human ever fills.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many registrations from this connection — please try again later." },
      { status: 429, headers: CORS },
    );
  }

  // ---- Validation ---------------------------------------------------------
  const errors: Record<string, string> = {};
  const fullName = text(body.fullName, 120);
  if (!fullName || fullName.split(/\s+/).length < 1) errors.fullName = "Please tell us your name.";
  const mobile = text(body.mobile, 30).replace(/[^\d+ ]/g, "");
  if (!mobile || mobile.replace(/\D/g, "").length < 10) errors.mobile = "Enter a valid mobile number.";
  const email = text(body.email, 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email address.";
  const ageGroup = inList(body.ageGroup, AGE_GROUPS) ? String(body.ageGroup) : "";
  if (!ageGroup) errors.ageGroup = "Please choose your age group.";
  const gender = body.gender === "male" || body.gender === "female" ? String(body.gender) : "";

  const underage = ["Under 16", "16–17"].includes(ageGroup);
  const guardian = (body.guardian ?? {}) as Record<string, unknown>;
  const guardianName = text(guardian.name, 120);
  const guardianPhone = text(guardian.phone, 30);
  if (underage && (!guardianName || !guardianPhone)) {
    errors.guardian = "For under-18s we need a parent or guardian's name and contact number.";
  }

  const consents = (body.consents ?? {}) as Record<string, unknown>;
  if (!consents.accurate) errors.consentAccurate = "Please confirm your information is accurate.";
  if (!consents.contact) errors.consentContact = "We can only match you to opportunities if we may contact you.";
  if (!consents.checks) errors.consentChecks = "Please confirm you understand some roles need checks.";

  const generalVolunteer = Boolean(body.generalVolunteer);
  const rawCategories = Array.isArray(body.categories) ? body.categories.slice(0, 40) : [];
  if (!generalVolunteer && rawCategories.length === 0) {
    errors.categories = "Choose at least one way you'd like to help — or pick “General volunteer”.";
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400, headers: CORS });
  }

  try {
    const payload = await getPayloadClient();
    type AnyDoc = Record<string, any>;

    // ---- Duplicate prevention --------------------------------------------
    const clash = await payload.find({
      collection: "volunteers" as never,
      where: {
        or: [{ email: { equals: email } }, { mobile: { equals: mobile } }],
      } as never,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (clash.totalDocs > 0) {
      return NextResponse.json(
        {
          ok: false,
          duplicate: true,
          error:
            "It looks like you're already registered as a volunteer — JazakAllahu Khairan! If you'd like to update your details or availability, just contact the mosque office.",
        },
        { status: 409, headers: CORS },
      );
    }

    // ---- Only accept real, active, publicly-selectable category ids ------
    let categoryIds: Array<number | string> = [];
    if (rawCategories.length) {
      const valid = await payload.find({
        collection: "volunteer-categories" as never,
        where: {
          and: [
            { id: { in: rawCategories } },
            { active: { equals: true } },
            { publiclySelectable: { equals: true } },
          ],
        } as never,
        limit: 100,
        depth: 0,
        overrideAccess: true,
      });
      categoryIds = (valid.docs as AnyDoc[]).map((c) => c.id);
    }

    const languages = pickList(body.languages, LANGUAGES);
    const source = ["website", "ios", "android"].includes(String(body.source)) ? String(body.source) : "website";

    const created = (await payload.create({
      collection: "volunteers" as never,
      data: {
        fullName,
        gender: gender || undefined,
        ageGroup,
        mobile,
        email,
        preferredContact: ["whatsapp", "phone", "email", "any"].includes(String(body.preferredContact))
          ? String(body.preferredContact)
          : "any",
        postcode: text(body.postcode, 12).toUpperCase(),
        languages,
        otherLanguage: languages.includes("Other") ? text(body.otherLanguage, 60) : "",
        guardian: underage ? { name: guardianName, phone: guardianPhone, email: text(guardian.email, 160) } : undefined,
        generalVolunteer,
        categories: categoryIds,
        days: pickList(body.days, DAYS),
        times: pickList(body.times, TIMES),
        frequency: inList(body.frequency, FREQUENCIES) ? String(body.frequency) : undefined,
        leadership: ["yes", "maybe", "no"].includes(String(body.leadership)) ? String(body.leadership) : undefined,
        previousVolunteer: Boolean(body.previousVolunteer),
        previousDetails: Boolean(body.previousVolunteer) ? text(body.previousDetails, 500) : "",
        skills: text(body.skills, 1500),
        additionalInfo: text(body.additionalInfo, 1500),
        consents: { accurate: true, contact: true, checks: true, recordedAt: new Date().toISOString() },
        status: "new",
        source,
      } as never,
      overrideAccess: true,
    })) as AnyDoc;

    // ---- Confirmation email (Phase 6) -------------------------------------
    const catNames = categoryIds.length
      ? ((await payload.find({
          collection: "volunteer-categories" as never,
          where: { id: { in: categoryIds } } as never,
          limit: 100,
          depth: 0,
          overrideAccess: true,
        })) as { docs: AnyDoc[] }).docs.map((c) => String(c.name))
      : [];
    const mail = volunteerConfirmationEmail({
      fullName,
      categories: catNames,
      generalVolunteer,
      days: pickList(body.days, DAYS),
      times: pickList(body.times, TIMES),
      frequency: inList(body.frequency, FREQUENCIES) ? String(body.frequency) : undefined,
    });
    const sent = await sendVolunteerEmail(payload, email, mail.subject, mail.html);
    if (sent) {
      await recordVolunteerContact(payload, created, {
        by: "system",
        channel: "email",
        note: "Registration confirmation email",
      });
    }

    return NextResponse.json({ ok: true, id: created.id }, { headers: CORS });
  } catch (err) {
    const msg = (err as Error).message || "";
    if (/unique|duplicate/i.test(msg)) {
      return NextResponse.json(
        { ok: false, duplicate: true, error: "You're already registered — contact the office to update your details." },
        { status: 409, headers: CORS },
      );
    }
    return NextResponse.json({ ok: false, error: "Something went wrong — please try again." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
