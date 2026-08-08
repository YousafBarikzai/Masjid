import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { nikahCard, nikahProfileView } from "@/lib/nikah";
import { LIVE_STATUSES } from "@/payload/nikah";
import { authedNikahMember } from "@/lib/nikah";

/* Privacy-preserving search & browse:
     GET ?filters…      → anonymised cards, OPPOSITE GENDER ONLY, approved &
                          not hidden, capped page size
     GET ?profile=<id>  → one full (still anonymous) profile view
   Only APPROVED members may browse — applicants see a friendly explanation.
   Server-side rules a client can never bypass: gender separation, live-status
   check, hidden-profile exclusion, anonymisation. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export async function GET(req: NextRequest) {
  try {
    const { payload, member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    if (!LIVE_STATUSES.includes(String(member.status))) {
      return NextResponse.json(
        { ok: false, notApproved: true, error: "Browsing opens once your application is approved by the Nikah team." },
        { status: 403, headers: CORS },
      );
    }

    const q = req.nextUrl.searchParams;
    const oppositeGender = member.gender === "male" ? "female" : "male";
    type AnyDoc = Record<string, any>;

    // Single profile view.
    const profileId = q.get("profile");
    if (profileId) {
      const p = (await payload
        .findByID({ collection: "nikah-profiles" as never, id: profileId, depth: 0, overrideAccess: true })
        .catch(() => null)) as AnyDoc | null;
      if (!p || p.gender !== oppositeGender || !LIVE_STATUSES.includes(String(p.status)) || p.profileHidden) {
        return NextResponse.json({ ok: false, error: "This profile is not available." }, { status: 404, headers: CORS });
      }
      return NextResponse.json({ ok: true, profile: nikahProfileView(p) }, { headers: CORS });
    }

    // Card search.
    const and: Record<string, unknown>[] = [
      { gender: { equals: oppositeGender } },
      { status: { in: LIVE_STATUSES } },
      { profileHidden: { not_equals: true } },
      { id: { not_equals: member.id } },
    ];
    const num = (k: string) => {
      const n = Number(q.get(k));
      return Number.isFinite(n) && n >= 18 && n <= 90 ? n : null;
    };
    // Age filters translate to DOB ranges server-side.
    const minAge = num("ageMin");
    const maxAge = num("ageMax");
    const now = new Date();
    if (minAge) and.push({ dateOfBirth: { less_than_equal: new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate()).toISOString() } });
    if (maxAge) and.push({ dateOfBirth: { greater_than_equal: new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate()).toISOString() } });
    if (["never-married", "divorced", "widowed"].includes(String(q.get("maritalStatus")))) {
      and.push({ maritalStatus: { equals: q.get("maritalStatus") } });
    }
    if (q.get("children") === "no") and.push({ hasChildren: { not_equals: true } });
    if (q.get("children") === "yes") and.push({ hasChildren: { equals: true } });
    if (["very", "practising", "moderate", "growing"].includes(String(q.get("practising")))) {
      and.push({ practising: { equals: q.get("practising") } });
    }
    if (q.get("area")) and.push({ townCity: { like: String(q.get("area")).slice(0, 60) } });
    if (q.get("relocate") === "yes") and.push({ willingToRelocate: { equals: true } });

    const page = Math.max(1, Math.min(10, Number(q.get("page")) || 1)); // hard cap — no endless scrolling
    const res = await payload.find({
      collection: "nikah-profiles" as never,
      where: { and } as never,
      limit: 12,
      page,
      sort: "-approvedAt",
      depth: 0,
      overrideAccess: true,
    });

    return NextResponse.json(
      {
        ok: true,
        cards: (res.docs as AnyDoc[]).map(nikahCard),
        page: res.page,
        totalPages: Math.min(10, res.totalPages),
        totalDocs: res.totalDocs,
      },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
