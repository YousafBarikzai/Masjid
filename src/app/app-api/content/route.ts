import { NextResponse } from "next/server";
import { servicePages, donationCategories, eventsSeed, type PageSection } from "@/lib/site-content";
import { getDonation, getJummah, getSite, livePostsWhere } from "@/lib/cms";
import { lexicalToSections, imageUrlOf, mapPost } from "@/lib/app-content";
import { getPayloadClient } from "@/lib/payloadClient";

/**
 * Everything the mobile app needs to render its service, information, donation
 * and article screens NATIVELY — no web views. One cached call the app fetches
 * on launch and stores on-device, so pages open instantly and work offline.
 *
 * Sections are a uniform shape ({ heading?, body?[], bullets?[] }) reused by
 * both the static service pages and the (rich-text) news articles, so the app
 * has a single native renderer for all of them.
 */
export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Admin edits must reach phones on the next poll — never serve a stale copy.
  "Cache-Control": "no-store",
};

type Section = { heading?: string; body?: string[]; bullets?: string[] };

function normSections(sections: PageSection[]): Section[] {
  return sections.map((s) => ({
    heading: s.heading,
    body: s.body?.filter(Boolean),
    bullets: s.bullets?.filter(Boolean),
  }));
}

export async function GET() {
  const [donation, jummah, site] = await Promise.all([getDonation(), getJummah(), getSite()]);

  // Service & information pages — the canonical structured content the website
  // renders at /services/<slug>, delivered native.
  const services = servicePages.map((p) => ({
    slug: p.slug,
    title: p.title,
    icon: p.icon,
    intro: p.intro,
    sections: normSections(p.sections),
    cta: p.ctaHeading || p.ctaBody ? { heading: p.ctaHeading || "", body: p.ctaBody || "" } : null,
  }));

  // News articles with full native body (rich text → sections) + lead image.
  // Live only: never drafts, never posts scheduled for a future date.
  let articles: ReturnType<typeof mapPost>[] = [];
  try {
    const p = await getPayloadClient();
    const res = await p.find({
      collection: "posts",
      sort: "-publishedDate",
      limit: 12,
      depth: 1,
      where: livePostsWhere(),
    });
    articles = res.docs.map(mapPost);
  } catch {
    articles = [];
  }

  // Events with full native detail (Eid Prayer, Tarāwīḥ, Iʿtikāf…): rich-text
  // description → sections, plus when/where/registration for the detail screen.
  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  type EventOut = {
    slug: string;
    title: string;
    tag: string;
    when: string;
    where: string;
    summary: string;
    image: string;
    sections: Section[];
    registrationUrl: string;
  };
  let events: EventOut[] = [];
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "events", sort: "-start", limit: 20, depth: 1 });
    events = res.docs.map((e: any) => ({
      slug: String(e.slug || slugify(String(e.title || "event"))),
      title: String(e.title || ""),
      tag: String(e.category || "Event"),
      when: e.start
        ? new Date(e.start).toLocaleString("en-GB", {
            weekday: "short", day: "numeric", month: "short",
            hour: "2-digit", minute: "2-digit",
          })
        : "",
      where: String(e.location || ""),
      summary: String(e.summary || ""),
      image: imageUrlOf(e.image),
      sections: e.description ? lexicalToSections(e.description) : [],
      registrationUrl: typeof e.registrationUrl === "string" ? e.registrationUrl : "",
    }));
  } catch {
    events = [];
  }
  if (!events.length) {
    events = eventsSeed.map((e) => ({
      slug: slugify(e.title),
      title: e.title,
      tag: e.tag,
      when: [e.date, e.time].filter(Boolean).join(" · "),
      where: "Kingston Mosque",
      summary: e.body,
      image: "",
      sections: [{ body: [e.body] }],
      registrationUrl: "",
    }));
  }

  const body = {
    generatedAt: new Date().toISOString(),
    services,
    articles,
    events,
    donation: {
      heading: donation.heading,
      body: donation.body,
      donateUrl: donation.donateUrl || "",
      presets: donation.presets,
      giftAid: donation.giftAid,
      monthly: donation.monthly,
      bank: donation.bank,
      categories: donationCategories,
    },
    jummah: {
      intro: jummah.intro || "",
      congregations: jummah.congregations,
    },
    contact: {
      phone: site.phone,
      phoneHref: site.phoneHref,
      email: site.email,
      address: site.address,
      mapsQuery: site.mapsQuery,
    },
    // Fixed reference points for the native Qibla compass (the Kaʿbah). The
    // device supplies the user's own location + heading.
    qibla: { kaabaLat: 21.4225, kaabaLng: 39.8262 },
  };

  return NextResponse.json(body, { headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}
