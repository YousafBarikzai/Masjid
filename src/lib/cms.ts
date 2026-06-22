import "server-only";
import { cache } from "react";
import { getPayloadClient } from "./payloadClient";
import * as seed from "./content";
import type { CardItem } from "@/components/sections/CardGrid";
import type { PrayerDay } from "./prayer";

const val = <T>(v: T | undefined | null, fallback: T): T =>
  v === undefined || v === null || v === "" ? fallback : v;

/* ------------------------------ Site settings ----------------------------- */
export const getSite = cache(async (): Promise<typeof seed.site> => {
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "site-settings", depth: 0 })) as Record<string, any>;
    const c = g?.contact ?? {};
    const socials = Array.isArray(g?.socials) && g.socials.length
      ? g.socials.map((s: any) => ({ label: s.label, href: s.url }))
      : seed.site.social;
    const phone = val(c.phone, seed.site.phone);
    return {
      ...seed.site,
      phone,
      phoneHref: "tel:" + String(phone).replace(/\s+/g, ""),
      email: val(c.email, seed.site.email),
      address: {
        line1: val(c.addressLine1, seed.site.address.line1),
        city: val(c.city, seed.site.address.city),
        postcode: val(c.postcode, seed.site.address.postcode),
      },
      mapsQuery: val(c.mapsQuery, seed.site.mapsQuery),
      charity: val(g?.charityNumber, seed.site.charity),
      social: socials,
    };
  } catch {
    return seed.site;
  }
});

/* --------------------------------- Jummah --------------------------------- */
export const getJummah = cache(async (): Promise<typeof seed.jummah> => {
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "jummah-settings", depth: 0 })) as Record<string, any>;
    const congregations = Array.isArray(g?.congregations) && g.congregations.length
      ? g.congregations.map((c: any) => ({
          name: val(c.name, ""),
          language: val(c.language, ""),
          doors: val(c.doors, ""),
          khutbah: val(c.khutbah, ""),
        }))
      : seed.jummah.congregations;
    return { intro: val(g?.intro, seed.jummah.intro), congregations };
  } catch {
    return seed.jummah;
  }
});

/* -------------------------------- Donation -------------------------------- */
export const getDonation = cache(async (): Promise<typeof seed.donation> => {
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "donation-settings", depth: 0 })) as Record<string, any>;
    const bank = Array.isArray(g?.bankDetails) && g.bankDetails.length
      ? g.bankDetails.map((b: any) => ({ label: val(b.label, ""), value: val(b.value, "") }))
      : seed.donation.bank;
    return {
      heading: val(g?.heading, seed.donation.heading),
      body: val(g?.body, seed.donation.body),
      bank,
    };
  } catch {
    return seed.donation;
  }
});

/* ------------------------------ Announcement ------------------------------ */
export const getAnnouncement = cache(
  async (): Promise<{ enabled: boolean; label: string; message: string; href?: string }> => {
    try {
      const p = await getPayloadClient();
      const now = new Date().toISOString();
      const res = await p.find({
        collection: "announcements",
        where: { enabled: { equals: true } },
        sort: "-updatedAt",
        limit: 10,
        depth: 1, // populate relatedPage so we can resolve its slug
      });
      const active = res.docs.find((d: any) => {
        const startOk = !d.startDate || d.startDate <= now;
        const endOk = !d.endDate || d.endDate >= now;
        return startOk && endOk;
      });
      if (!active) return seed.alert;
      const rel = (active as any).relatedPage;
      const relSlug = rel && typeof rel === "object" ? rel.slug : undefined;
      const href = relSlug ? `/${relSlug}` : val((active as any).link, "") || undefined;
      return {
        enabled: true,
        label: val((active as any).label, "Notice"),
        message: (active as any).message,
        href,
      };
    } catch {
      return seed.alert;
    }
  },
);

/* --------------------------------- Events --------------------------------- */
export const getEvents = cache(async (): Promise<CardItem[]> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "events", sort: "-start", limit: 6, depth: 0 });
    if (!res.docs.length) return seed.events;
    return res.docs.map((e: any) => ({
      tag: e.category ?? "Event",
      title: e.title,
      body: val(e.summary, val(e.location ? `At ${e.location}` : "", "Details to follow.")),
      href: e.slug ? `/events/${e.slug}` : "/events",
    }));
  } catch {
    return seed.events;
  }
});

/* --------------------------------- Classes -------------------------------- */
const CLASS_ICON: Record<string, string> = {
  Children: "📖",
  Youth: "🧒",
  Sisters: "🌸",
  Adult: "🎓",
  Course: "📚",
  Lecture: "🎤",
};
export const getClasses = cache(async (): Promise<CardItem[]> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "classes", limit: 8, depth: 0 });
    if (!res.docs.length) return seed.classes;
    return res.docs.map((c: any) => ({
      icon: CLASS_ICON[c.category] ?? "📘",
      title: c.title,
      body: val(c.description, [c.ageRange, c.schedule].filter(Boolean).join(" · ")),
      href: "/education",
    }));
  } catch {
    return seed.classes;
  }
});

/* -------------------------------- Services -------------------------------- */
export const getServices = cache(async (): Promise<CardItem[]> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "services", limit: 8, depth: 0 });
    if (!res.docs.length) return seed.services;
    return res.docs.map((s: any) => ({
      icon: val(s.icon, "🕌"),
      title: s.title,
      body: val(s.summary, ""),
      href: s.slug ? `/services/${s.slug}` : "/services",
    }));
  } catch {
    return seed.services;
  }
});

/* ----------------------------- News / posts ------------------------------ */
export interface NewsItem {
  date: string;
  title: string;
  body: string;
  slug?: string;
}
export const getPosts = cache(async (): Promise<NewsItem[]> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "posts", sort: "-publishedDate", limit: 9, depth: 0 });
    if (!res.docs.length) return [];
    return res.docs.map((d: any) => ({
      date: d.publishedDate
        ? new Date(d.publishedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "News",
      title: d.title,
      body: val(d.excerpt, ""),
      slug: d.slug,
    }));
  } catch {
    return [];
  }
});

/* ----------------------- Event / post detail lookups ---------------------- */
export const getEventBySlug = cache(async (slug: string): Promise<Record<string, any> | null> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({ collection: "events", where: { slug: { equals: slug } }, limit: 1, depth: 2 });
    return (res.docs[0] as Record<string, any>) ?? null;
  } catch {
    return null;
  }
});

export const getPostBySlug = cache(async (slug: string): Promise<Record<string, any> | null> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({
      collection: "posts",
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
      limit: 1,
      depth: 2,
    });
    return (res.docs[0] as Record<string, any>) ?? null;
  } catch {
    return null;
  }
});

/* ----------------------------- Ramadan & Eid ----------------------------- */
export interface SpecialSchedule {
  ramadanEnabled: boolean;
  ramadanHeading: string;
  ramadanIntro: string;
  ramadanItems: { label: string; value: string }[];
  eidEnabled: boolean;
  eidTitle: string;
  eidDateText: string;
  eidPrayers: { label: string; time: string; location?: string }[];
  eidNotes: string;
}
export const getSpecialSchedule = cache(async (): Promise<SpecialSchedule> => {
  const empty: SpecialSchedule = {
    ramadanEnabled: false,
    ramadanHeading: "Ramadan at Kingston Mosque",
    ramadanIntro: "",
    ramadanItems: [],
    eidEnabled: false,
    eidTitle: "",
    eidDateText: "",
    eidPrayers: [],
    eidNotes: "",
  };
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "special-schedule", depth: 0 })) as Record<string, any>;
    return {
      ramadanEnabled: Boolean(g?.ramadanEnabled),
      ramadanHeading: val(g?.ramadanHeading, empty.ramadanHeading),
      ramadanIntro: val(g?.ramadanIntro, ""),
      ramadanItems: Array.isArray(g?.ramadanItems)
        ? g.ramadanItems.map((i: any) => ({ label: val(i.label, ""), value: val(i.value, "") }))
        : [],
      eidEnabled: Boolean(g?.eidEnabled),
      eidTitle: val(g?.eidTitle, ""),
      eidDateText: val(g?.eidDateText, ""),
      eidPrayers: Array.isArray(g?.eidPrayers)
        ? g.eidPrayers.map((i: any) => ({ label: val(i.label, ""), time: val(i.time, ""), location: val(i.location, "") }))
        : [],
      eidNotes: val(g?.eidNotes, ""),
    };
  } catch {
    return empty;
  }
});

/* ------------------------------ About page ------------------------------- */
const DEFAULT_ABOUT_PARAS = [
  "The Kingston Muslim Association (KMA) was founded in 1979 and converted into a purpose-built mosque in 1985. Today the mosque can accommodate more than 800 worshippers, many of whom travel from surrounding areas to pray and learn here.",
  "Over four decades, KMA has grown into a hub for worship, Islamic education and community life — offering daily prayers, a thriving Madrasah, youth and sisters' programmes, and essential services such as Nikah and free funeral support.",
];
export interface AboutContent {
  heading: string;
  paragraphs: string[];
  facilities: string[];
}
export const getAbout = cache(async (): Promise<AboutContent> => {
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "site-settings", depth: 0 })) as Record<string, any>;
    const a = g?.about ?? {};
    const paragraphs = a.historyBody
      ? String(a.historyBody).split(/\n\s*\n/).map((s: string) => s.trim()).filter(Boolean)
      : DEFAULT_ABOUT_PARAS;
    const facilities = Array.isArray(a.facilities) && a.facilities.length
      ? a.facilities.map((f: any) => f.item).filter(Boolean)
      : seed.facilities;
    return { heading: val(a.historyHeading, "Our story"), paragraphs, facilities };
  } catch {
    return { heading: "Our story", paragraphs: DEFAULT_ABOUT_PARAS, facilities: seed.facilities };
  }
});

/* ------------------------------ CMS Pages -------------------------------- */
export const getPageBySlug = cache(async (slug: string): Promise<Record<string, any> | null> => {
  try {
    const p = await getPayloadClient();
    const res = await p.find({
      collection: "pages",
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
      limit: 1,
      depth: 2,
    });
    return (res.docs[0] as Record<string, any>) ?? null;
  } catch {
    return null;
  }
});

/* --------------------- Prayer override for a given day -------------------- */
export const getPrayerOverride = cache(async (dateISO: string): Promise<PrayerDay | null> => {
  try {
    const p = await getPayloadClient();
    const start = `${dateISO}T00:00:00.000Z`;
    const end = `${dateISO}T23:59:59.999Z`;
    const res = await p.find({
      collection: "prayer-days",
      where: { and: [{ date: { greater_than_equal: start } }, { date: { less_than_equal: end } }] },
      limit: 1,
      depth: 0,
    });
    const d = res.docs[0] as any;
    if (!d) return null;
    return {
      date: dateISO,
      weekday: new Date(dateISO + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short" }),
      fajr: { begins: d.fajrBegins, jamaah: d.fajrJamaah },
      sunrise: d.sunrise,
      dhuhr: { begins: d.dhuhrBegins, jamaah: d.dhuhrJamaah },
      asr: { begins: d.asrBegins, jamaah: d.asrJamaah },
      maghrib: { begins: d.maghrib, jamaah: d.maghrib },
      isha: { begins: d.ishaBegins, jamaah: d.ishaJamaah },
    };
  } catch {
    return null;
  }
});
