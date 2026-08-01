import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { userIsMembershipStaff } from "@/payload/access";
import { APPROVED_MEMBER_STATUSES } from "@/payload/member-portal";

/* The members-only portal feed: document categories with their published
   members-visible documents, plus member notices. ONLY approved members
   (active / renewal-due / renewal-pending) and membership staff get anything
   back — applicants, expired and rejected accounts get a 403 with a friendly
   reason, and the public gets a 401.

   File links point at Payload's own access-controlled file endpoint
   (/api/member-documents/file/<name>), which re-checks the caller's session
   on EVERY download — there are no public URLs for these files. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const payload = await getPayloadClient();
    const h = new Headers(await nextHeaders());
    if (!h.get("origin")) h.set("origin", payload.config.serverURL || "");
    const { user } = await payload.auth({ headers: h });

    if (!user) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    const isMember = (user as { collection?: string }).collection === "members";
    const approved = isMember && APPROVED_MEMBER_STATUSES.includes(String((user as { status?: string }).status));
    const staff = !isMember && userIsMembershipStaff(user);
    if (!approved && !staff) {
      return NextResponse.json(
        {
          ok: false,
          error: isMember
            ? "The members' area opens once your membership is active. You'll be able to see everything here as soon as your application is approved and your payment is verified."
            : "Not allowed.",
        },
        { status: 403, headers: CORS },
      );
    }

    const [cats, docs, notices] = await Promise.all([
      payload.find({
        collection: "member-document-categories" as never,
        limit: 100,
        sort: "order",
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "member-documents" as never,
        where: { and: [{ published: { equals: true } }, { visibility: { equals: "members" } }] } as never,
        limit: 500,
        sort: "order",
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "member-notices" as never,
        where: { published: { equals: true } } as never,
        limit: 100,
        sort: "-publishedDate",
        depth: 0,
        overrideAccess: true,
      }),
    ]);

    type AnyDoc = Record<string, any>;
    const byCat = new Map<string, AnyDoc[]>();
    for (const d of docs.docs as AnyDoc[]) {
      const key = String(d.category);
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push({
        id: d.id,
        title: d.title,
        year: d.year || null,
        version: d.version || null,
        publishedDate: d.publishedDate || null,
        filename: d.filename,
        mimeType: d.mimeType || "",
        filesize: d.filesize || 0,
        // Access-controlled download — Payload re-checks the session per request.
        url: `/api/member-documents/file/${encodeURIComponent(String(d.filename))}`,
      });
    }

    const categories = (cats.docs as AnyDoc[])
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        documents: byCat.get(String(c.id)) || [],
      }))
      .filter((c) => c.documents.length > 0);

    const noticeList = (notices.docs as AnyDoc[])
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
      .map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body || null,
        publishedDate: n.publishedDate || null,
        pinned: Boolean(n.pinned),
      }));

    return NextResponse.json({ ok: true, categories, notices: noticeList }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
