import { NextResponse, type NextRequest } from "next/server";
import { nikahCard } from "@/lib/nikah";
import { LIVE_STATUSES, sendNikahEmail } from "@/payload/nikah";
import { authedNikahMember } from "@/lib/nikah";

/* Structured expressions of interest — the ONLY member-to-member action on
   the platform. No messages, no contact details, no photographs.

     GET            → my interests: received (pending), sent, and mutual
     POST {to}      → express interest (caps + dedupe + no-repeat-after-decline)
     PATCH {id, action: "accept"|"decline"|"withdraw"}
                    → recipient decides / sender withdraws
   A mutual acceptance automatically opens an Introduction case (NI-#####)
   for the Nikah team, who involve the walis — nothing else changes for the
   members until the team makes contact. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

const MAX_ACTIVE_OUTGOING = 3; // dignity by design: no scatter-gun interest

type AnyDoc = Record<string, any>;

export async function GET() {
  try {
    const { payload, member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });

    const mine = await payload.find({
      collection: "nikah-interests" as never,
      where: { or: [{ from: { equals: member.id } }, { to: { equals: member.id } }] } as never,
      limit: 100,
      sort: "-createdAt",
      depth: 1,
      overrideAccess: true,
    });

    const view = (i: AnyDoc) => {
      const sent = String((i.from as AnyDoc)?.id ?? i.from) === String(member.id);
      const other = (sent ? i.to : i.from) as AnyDoc;
      return {
        id: i.id,
        direction: sent ? "sent" : "received",
        status: i.status,
        createdAt: i.createdAt,
        card: other && typeof other === "object" ? nikahCard(other) : null,
      };
    };
    const all = (mine.docs as AnyDoc[]).map(view);
    return NextResponse.json(
      {
        ok: true,
        received: all.filter((i) => i.direction === "received" && i.status === "pending"),
        sent: all.filter((i) => i.direction === "sent" && ["pending", "declined", "withdrawn"].includes(i.status)),
        mutual: all.filter((i) => i.status === "accepted"),
      },
      { headers: CORS },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { payload, member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    if (!LIVE_STATUSES.includes(String(member.status))) {
      return NextResponse.json({ ok: false, error: "Expressions of interest open once your application is approved." }, { status: 403, headers: CORS });
    }
    const body = (await req.json().catch(() => ({}))) as { to?: string | number };
    if (!body.to) return NextResponse.json({ ok: false, error: "Missing profile." }, { status: 400, headers: CORS });

    const target = (await payload
      .findByID({ collection: "nikah-profiles" as never, id: body.to, depth: 0, overrideAccess: true })
      .catch(() => null)) as AnyDoc | null;
    const oppositeGender = member.gender === "male" ? "female" : "male";
    if (!target || target.gender !== oppositeGender || !LIVE_STATUSES.includes(String(target.status)) || target.profileHidden) {
      return NextResponse.json({ ok: false, error: "This profile is not available." }, { status: 404, headers: CORS });
    }

    // History between this pair — never allow a repeat after a decline, and
    // never a duplicate while one is pending/accepted.
    const between = await payload.find({
      collection: "nikah-interests" as never,
      where: {
        or: [
          { and: [{ from: { equals: member.id } }, { to: { equals: target.id } }] },
          { and: [{ from: { equals: target.id } }, { to: { equals: member.id } }] },
        ],
      } as never,
      limit: 20,
      depth: 0,
      overrideAccess: true,
    });
    for (const i of between.docs as AnyDoc[]) {
      if (i.status === "pending" || i.status === "accepted") {
        return NextResponse.json({ ok: false, error: "There is already an expression of interest between you and this member." }, { status: 409, headers: CORS });
      }
      if (i.status === "declined" && String(i.from) === String(member.id)) {
        return NextResponse.json({ ok: false, error: "This introduction was not taken forward previously, so it can't be sent again." }, { status: 409, headers: CORS });
      }
    }

    const active = await payload.count({
      collection: "nikah-interests" as never,
      where: { and: [{ from: { equals: member.id } }, { status: { equals: "pending" } }] } as never,
      overrideAccess: true,
    });
    if (active.totalDocs >= MAX_ACTIVE_OUTGOING) {
      return NextResponse.json(
        { ok: false, error: `You can have up to ${MAX_ACTIVE_OUTGOING} expressions of interest awaiting a reply at a time — this keeps the service respectful for everyone.` },
        { status: 429, headers: CORS },
      );
    }

    const created = (await payload.create({
      collection: "nikah-interests" as never,
      data: { from: member.id, to: target.id, status: "pending" } as never,
      overrideAccess: true,
    })) as AnyDoc;

    // Notify the recipient — WITHOUT any identifying details in the email.
    if (target.email) {
      await sendNikahEmail(
        payload,
        String(target.email),
        "Kingston Mosque Nikah Service — you have received an expression of interest",
        `<p>As-salāmu ʿalaykum ${target.firstName},</p>
         <p>An approved member has expressed interest in your profile. Sign in to your account to view their (anonymous) profile and decide whether to take it forward. Nothing is shared with them unless you accept.</p>
         <p>There is no pressure and no time limit — take your time, consult your family, and decide in comfort.</p>`,
      );
    }

    return NextResponse.json({ ok: true, id: created.id }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { payload, member } = await authedNikahMember();
    if (!member) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401, headers: CORS });
    const body = (await req.json().catch(() => ({}))) as { id?: string | number; action?: string };
    if (!body.id || !["accept", "decline", "withdraw"].includes(String(body.action))) {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400, headers: CORS });
    }
    const interest = (await payload
      .findByID({ collection: "nikah-interests" as never, id: body.id, depth: 0, overrideAccess: true })
      .catch(() => null)) as AnyDoc | null;
    if (!interest || interest.status !== "pending") {
      return NextResponse.json({ ok: false, error: "This expression of interest is no longer open." }, { status: 404, headers: CORS });
    }

    const isRecipient = String(interest.to) === String(member.id);
    const isSender = String(interest.from) === String(member.id);
    if (body.action === "withdraw" && !isSender) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403, headers: CORS });
    if (body.action !== "withdraw" && !isRecipient) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403, headers: CORS });

    const status = body.action === "accept" ? "accepted" : body.action === "decline" ? "declined" : "withdrawn";
    await payload.update({
      collection: "nikah-interests" as never,
      id: interest.id,
      data: { status, decidedAt: new Date().toISOString() } as never,
      overrideAccess: true,
      context: { internal: true } as never,
    });

    const other = (await payload
      .findByID({ collection: "nikah-profiles" as never, id: isRecipient ? interest.from : interest.to, depth: 0, overrideAccess: true })
      .catch(() => null)) as AnyDoc | null;

    if (status === "accepted" && other) {
      // Mutual interest → open the official introduction case for the team.
      const brother = member.gender === "male" ? member : other;
      const sister = member.gender === "female" ? member : other;
      await payload.create({
        collection: "nikah-introductions" as never,
        data: { brother: brother.id, sister: sister.id, interest: interest.id, status: "new" } as never,
        overrideAccess: true,
      });
      for (const p of [member, other]) {
        if (!p.email) continue;
        await sendNikahEmail(
          payload,
          String(p.email),
          "Kingston Mosque Nikah Service — mutual interest, alhamdulillah",
          `<p>As-salāmu ʿalaykum ${p.firstName},</p>
           <p>Good news — an expression of interest has been accepted by both sides. The Nikah team will now review the introduction and contact you and your wali/family to take the next step properly.</p>
           <p><b>No contact details have been shared</b> — everything continues through the mosque until both families are ready.</p>`,
        );
      }
    } else if (status === "declined" && other?.email) {
      // Neutral, kind wording — the sender never learns details.
      await sendNikahEmail(
        payload,
        String(other.email),
        "Kingston Mosque Nikah Service — an update on an expression of interest",
        `<p>As-salāmu ʿalaykum ${other.firstName},</p>
         <p>One of your expressions of interest was not taken forward on this occasion. This is a normal part of the search — may Allah decree what is best for you.</p>`,
      );
    }

    return NextResponse.json({ ok: true, status }, { headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
