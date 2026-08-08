import { headers as nextHeaders } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { userIsVolunteerManager, userIsVolunteerStaff } from "@/payload/access";
import { recordVolunteerContact, sendVolunteerEmail } from "@/payload/volunteers";

/* Staff-only volunteer admin API (powers the Volunteers dashboard):
     GET  ?view=stats   → dashboard counts + the find-volunteers panel data
     POST {action:"email", ids, subject, message}
                        → email the SELECTED volunteers individually (each
                          volunteer gets their own email — addresses are never
                          exposed to each other), recording the contact and
                          lastContactedAt on every profile
   Viewers may read stats; only volunteer managers/admins may send email. */

export const dynamic = "force-dynamic";

async function authed() {
  const payload = await getPayloadClient();
  const h = new Headers(await nextHeaders());
  if (!h.get("origin")) h.set("origin", payload.config.serverURL || "");
  const { user } = await payload.auth({ headers: h });
  const staff = user && (user as { collection?: string }).collection === "users" && userIsVolunteerStaff(user);
  return { payload, user: staff ? user : null };
}

export async function GET(req: NextRequest) {
  const { payload, user } = await authed();
  if (!user) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  type AnyDoc = Record<string, any>;

  const q = req.nextUrl.searchParams;
  if ((q.get("view") || "stats") !== "stats") {
    return NextResponse.json({ ok: false, error: "Unknown view." }, { status: 400 });
  }

  const count = async (where: Record<string, unknown>) =>
    (await payload.count({ collection: "volunteers" as never, where: where as never, overrideAccess: true })).totalDocs;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [total, fresh, reviewed, approved, active, followUp, inactive, thisMonth, leaders, general] = await Promise.all([
    count({}),
    count({ status: { equals: "new" } }),
    count({ status: { equals: "reviewed" } }),
    count({ status: { equals: "approved" } }),
    count({ status: { equals: "active" } }),
    count({ status: { equals: "follow-up" } }),
    count({ status: { equals: "inactive" } }),
    count({ createdAt: { greater_than_equal: monthStart.toISOString() } }),
    count({ leadership: { equals: "yes" } }),
    count({ generalVolunteer: { equals: true } }),
  ]);

  // Category options for the quick-filter dropdown (id → name, grouped).
  const cats = await payload.find({
    collection: "volunteer-categories" as never,
    where: { active: { equals: true } } as never,
    limit: 500,
    sort: "order",
    depth: 1,
    overrideAccess: true,
  });
  const categories = (cats.docs as AnyDoc[]).map((c) => ({
    id: c.id,
    name: c.name,
    group: typeof c.group === "object" && c.group ? String((c.group as AnyDoc).name || "") : "",
  }));

  return NextResponse.json({
    ok: true,
    canEmail: userIsVolunteerManager(user),
    stats: { total, fresh, reviewed, approved, active, followUp, inactive, thisMonth, leaders, general },
    categories,
  });
}

export async function POST(req: NextRequest) {
  const { payload, user } = await authed();
  if (!user) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
  if (!userIsVolunteerManager(user)) {
    return NextResponse.json({ ok: false, error: "Volunteer viewers can't send email — ask a volunteer manager." }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    ids?: Array<string | number>;
    subject?: string;
    message?: string;
  };
  if (body.action !== "email") return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });

  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 200) : [];
  const subject = String(body.subject || "").trim().slice(0, 150);
  const message = String(body.message || "").trim().slice(0, 5000);
  if (!ids.length) return NextResponse.json({ ok: false, error: "Select at least one volunteer." }, { status: 400 });
  if (!subject || !message) return NextResponse.json({ ok: false, error: "Add a subject and a message." }, { status: 400 });

  type AnyDoc = Record<string, any>;
  const res = await payload.find({
    collection: "volunteers" as never,
    where: { id: { in: ids } } as never,
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });

  const site = process.env.SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || "https://masjid-production.up.railway.app";
  const by = (user as { email?: string }).email || "staff";
  let sent = 0;
  let failed = 0;
  for (const v of res.docs as AnyDoc[]) {
    // One INDIVIDUAL email per volunteer — no shared To/CC, so no volunteer
    // ever sees another volunteer's address.
    const firstName = String(v.fullName || "").trim().split(/\s+/)[0] || "volunteer";
    const ok = await sendVolunteerEmail(
      payload,
      String(v.email),
      subject,
      `<div style="background:#f4f1e8;padding:24px 12px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e7dfcb;">
          <div style="background:#0b3d2e;padding:18px 26px;">
            <div style="color:#e8d59a;font-size:12px;letter-spacing:.12em;font-weight:700;">KINGSTON MOSQUE · VOLUNTEERING</div>
          </div>
          <div style="padding:22px 26px;color:#2b2922;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 10px;">As-salāmu ʿalaykum ${firstName},</p>
            <div>${message.replace(/\n/g, "<br/>")}</div>
            <p style="margin:16px 0 0;color:#6f6c63;font-size:13px;">You're receiving this because you registered as a Kingston Mosque volunteer. If you'd rather not be contacted, reply to let us know.</p>
          </div>
          <div style="background:#f7f6f3;border-top:1px solid #ecebe6;padding:12px 26px;color:#6f6c63;font-size:12.5px;">
            Kingston Muslim Association · <a href="${site}" style="color:#157f54;">${site.replace(/^https?:\/\//, "")}</a>
          </div>
        </div>
      </div>`,
    );
    if (ok) {
      sent++;
      await recordVolunteerContact(payload, v, { by, channel: "email", note: subject });
    } else failed++;
  }

  return NextResponse.json({ ok: true, result: { sent, failed, considered: res.docs.length } });
}
