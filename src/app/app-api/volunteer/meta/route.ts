import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payloadClient";
import { AGE_GROUPS, CONTACT_METHODS, DAYS, FREQUENCIES, LANGUAGES, TIMES } from "@/payload/volunteers";

/* Public metadata for the volunteer registration form — website AND the
   iOS/Android apps all render from this one feed, so the CMS-managed areas
   and activities stay identical everywhere. Only active, publicly-selectable
   activities are exposed; sensitive roles (janazah team etc.) never leave
   the CMS. */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const payload = await getPayloadClient();
    type AnyDoc = Record<string, any>;
    const [groups, cats] = await Promise.all([
      payload.find({
        collection: "volunteer-category-groups" as never,
        where: { active: { equals: true } } as never,
        sort: "order",
        limit: 100,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: "volunteer-categories" as never,
        where: {
          and: [{ active: { equals: true } }, { publiclySelectable: { equals: true } }],
        } as never,
        sort: "order",
        limit: 500,
        depth: 0,
        overrideAccess: true,
      }),
    ]);

    const byGroup = new Map<string, AnyDoc[]>();
    for (const c of cats.docs as AnyDoc[]) {
      const key = String(c.group);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key)!.push({
        id: c.id,
        name: c.name,
        audience: c.audience || "general",
        safeguarding: Boolean(c.safeguarding),
        requiresDbs: Boolean(c.requiresDbs),
        popular: Boolean(c.popular),
      });
    }

    const areas = (groups.docs as AnyDoc[])
      .map((grp) => ({
        id: grp.id,
        name: grp.name,
        icon: grp.icon || "🤲",
        description: grp.description || "",
        categories: byGroup.get(String(grp.id)) || [],
      }))
      .filter((a) => a.categories.length > 0);

    return NextResponse.json(
      {
        ok: true,
        areas,
        options: {
          ageGroups: AGE_GROUPS,
          days: DAYS,
          times: TIMES,
          frequencies: FREQUENCIES,
          languages: LANGUAGES,
          contactMethods: CONTACT_METHODS,
        },
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
