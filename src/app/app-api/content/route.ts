import { NextResponse } from "next/server";
import { servicePages, donationCategories, type PageSection } from "@/lib/site-content";
import { getDonation, getJummah, getSite } from "@/lib/cms";
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
};

type Section = { heading?: string; body?: string[]; bullets?: string[] };

/** Flatten a Lexical rich-text tree into plain-text sections (paragraphs,
 *  headings and lists), defensively — any unknown node is walked for text. */
function lexicalToSections(node: unknown): Section[] {
  const root = (node as { root?: { children?: unknown[] } })?.root;
  const children = Array.isArray(root?.children) ? root!.children! : [];
  const out: Section[] = [];
  let current: Section = { body: [] };
  const pushCurrent = () => {
    if ((current.body && current.body.length) || (current.bullets && current.bullets.length)) out.push(current);
    current = { body: [] };
  };
  const textOf = (n: any): string => {
    if (!n) return "";
    if (typeof n.text === "string") return n.text;
    if (Array.isArray(n.children)) return n.children.map(textOf).join("");
    return "";
  };
  for (const raw of children) {
    const n = raw as any;
    const type = n?.type;
    if (type === "heading") {
      pushCurrent();
      current.heading = textOf(n).trim();
    } else if (type === "list") {
      const items = Array.isArray(n.children) ? n.children.map((li: any) => textOf(li).trim()).filter(Boolean) : [];
      if (items.length) (current.bullets ||= []).push(...items);
    } else if (type === "quote" || type === "paragraph") {
      const t = textOf(n).trim();
      if (t) (current.body ||= []).push(t);
    } else {
      const t = textOf(n).trim();
      if (t) (current.body ||= []).push(t);
    }
  }
  pushCurrent();
  return out.filter((s) => s.heading || (s.body && s.body.length) || (s.bullets && s.bullets.length));
}

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

  // News articles with full native body (rich text → sections).
  let articles: { slug: string; title: string; date: string; excerpt: string; sections: Section[] }[] = [];
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "posts", sort: "-publishedDate", limit: 12, depth: 0 });
    articles = res.docs.map((d: any) => ({
      slug: String(d.slug || ""),
      title: String(d.title || ""),
      date: d.publishedDate
        ? new Date(d.publishedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "News",
      excerpt: String(d.excerpt || ""),
      sections: d.content ? lexicalToSections(d.content) : [],
    }));
  } catch {
    articles = [];
  }

  const body = {
    generatedAt: new Date().toISOString(),
    services,
    articles,
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
