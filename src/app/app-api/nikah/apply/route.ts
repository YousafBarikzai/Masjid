import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { ageFromDob, sendNikahEmail } from "@/payload/nikah";

/* Public nikah application — website + apps, one central database. Creates
   the applicant's secure account (Payload hashes the password) with status
   "submitted"; everything else is mosque-review-driven. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => t > now - 60 * 60 * 1000);
  if (list.length >= 3) return true; // stricter than other forms — sensitive service
  list.push(now);
  hits.set(ip, list);
  return false;
}

const text = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: CORS });
  }
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }, { headers: CORS }); // honeypot
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many applications from this connection — please try later." }, { status: 429, headers: CORS });
  }

  const errors: Record<string, string> = {};
  const firstName = text(body.firstName, 60);
  const surname = text(body.surname, 60);
  if (!firstName) errors.firstName = "Please tell us your first name.";
  if (!surname) errors.surname = "Please tell us your surname (mosque-only — never shown to members).";
  const gender = body.gender === "male" || body.gender === "female" ? String(body.gender) : "";
  if (!gender) errors.gender = "Please select male or female.";
  const dob = text(body.dateOfBirth, 10);
  const age = ageFromDob(dob);
  if (age == null) errors.dateOfBirth = "Enter your date of birth.";
  else if (age < 18) errors.dateOfBirth = "You must be 18 or over to use this service.";
  else if (age > 90) errors.dateOfBirth = "Please check your date of birth.";
  const email = text(body.email, 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter a valid email address.";
  const telephone = text(body.telephone, 30);
  if (telephone.replace(/\D/g, "").length < 10) errors.telephone = "Enter a valid phone number.";
  const password = String(body.password || "");
  if (password.length < 8) errors.password = "Choose a password of at least 8 characters.";
  const maritalStatus = ["never-married", "divorced", "widowed"].includes(String(body.maritalStatus))
    ? String(body.maritalStatus)
    : "";
  if (!maritalStatus) errors.maritalStatus = "Please select your marital status.";

  // Wali details: required for sisters, strongly encouraged for brothers.
  const wali = (body.wali ?? {}) as Record<string, unknown>;
  const waliName = text(wali.name, 120);
  const waliPhone = text(wali.phone, 30);
  if (gender === "female" && (!waliName || !waliPhone)) {
    errors.wali = "Please provide your wali / family representative's name and contact number.";
  }

  const consents = (body.consents ?? {}) as Record<string, unknown>;
  if (!consents.accurate || !consents.terms || !consents.process) {
    errors.consent = "Please confirm the three declarations.";
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 400, headers: CORS });
  }

  try {
    const payload = await getPayloadClient();

    const clash = await payload.find({
      collection: "nikah-profiles" as never,
      where: { email: { equals: email } } as never,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (clash.totalDocs > 0) {
      return NextResponse.json(
        { ok: false, duplicate: true, error: "An application already exists with this email address — sign in instead, or contact the mosque office." },
        { status: 409, headers: CORS },
      );
    }

    const num = (v: unknown, min: number, max: number) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
    };

    const created = (await payload.create({
      collection: "nikah-profiles" as never,
      data: {
        email,
        password,
        firstName,
        surname,
        gender,
        dateOfBirth: dob,
        telephone,
        postcode: text(body.postcode, 12).toUpperCase(),
        townCity: text(body.townCity, 60),
        heightCm: num(body.heightCm, 100, 230),
        ethnicity: text(body.ethnicity, 60),
        languages: text(body.languages, 160),
        maritalStatus,
        hasChildren: Boolean(body.hasChildren),
        childrenDetails: Boolean(body.hasChildren) ? text(body.childrenDetails, 200) : "",
        practising: ["very", "practising", "moderate", "growing"].includes(String(body.practising)) ? String(body.practising) : undefined,
        background: ["born", "revert"].includes(String(body.background)) ? String(body.background) : undefined,
        educationLevel: ["secondary", "college", "vocational", "bachelors", "masters", "doctorate", "islamic-scholarship"].includes(String(body.educationLevel))
          ? String(body.educationLevel)
          : undefined,
        profession: text(body.profession, 100),
        faithNotes: text(body.faithNotes, 1200),
        aboutMe: text(body.aboutMe, 1500),
        familyBackground: text(body.familyBackground, 1200),
        timeframe: ["soon", "year", "1-2-years", "open"].includes(String(body.timeframe)) ? String(body.timeframe) : undefined,
        willingToRelocate: Boolean(body.willingToRelocate),
        relocateWhere: Boolean(body.willingToRelocate) ? text(body.relocateWhere, 160) : "",
        lookingFor: text(body.lookingFor, 1500),
        essentials: text(body.essentials, 1000),
        prefAgeMin: num(body.prefAgeMin, 18, 90),
        prefAgeMax: num(body.prefAgeMax, 18, 90),
        acceptsChildren: Boolean(body.acceptsChildren),
        managementMode: ["self", "joint", "wali"].includes(String(body.managementMode)) ? String(body.managementMode) : "joint",
        wali: { name: waliName, relationship: text(wali.relationship, 60), phone: waliPhone, email: text(wali.email, 160) },
        status: "submitted",
        source: ["website", "ios", "android"].includes(String(body.source)) ? String(body.source) : "website",
      } as never,
      overrideAccess: true,
    })) as Record<string, any>;

    await sendNikahEmail(
      payload,
      email,
      "Your Kingston Mosque nikah application has been received",
      `<p>As-salāmu ʿalaykum ${firstName},</p>
       <p>Thank you for applying to the Kingston Mosque Nikah Service. Your application has been received and will be reviewed personally and in confidence by our Nikah team.</p>
       <p>What happens next: we review your application, may contact you (and your wali/family, where provided) for verification, and email you as soon as a decision is made. Nothing about you is visible to anyone until your application is approved.</p>
       <p>May Allah put barakah in your intention.</p>`,
    );

    return NextResponse.json({ ok: true, id: created.id }, { headers: CORS });
  } catch (err) {
    if (/unique|duplicate/i.test((err as Error).message || "")) {
      return NextResponse.json({ ok: false, duplicate: true, error: "An application already exists with this email — sign in instead." }, { status: 409, headers: CORS });
    }
    return NextResponse.json({ ok: false, error: "Something went wrong — please try again." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
