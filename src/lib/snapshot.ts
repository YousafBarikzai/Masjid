import "server-only";
import {
  getToday,
  getNextDay,
  dayRows,
  londonTodayISO,
  formatGregorian,
  formatHijri,
  type PrayerDay,
} from "./prayer";
import { findNext, londonSecondsNow } from "./nextPrayer";
import { isFriday } from "./prayer";
import {
  getPrayerOverride,
  getAnnouncement,
  getEvents,
  getServices,
  getClasses,
  getPosts,
  getSite,
  getJummah,
  getDonation,
} from "./cms";
import { getPayloadClient } from "./payloadClient";
import { youtubeChannelUrl } from "./site-content";

/**
 * The single aggregated payload consumed by the mobile apps, the PWA and the
 * mosque display screens. One cheap call returns everything a "home" view needs:
 * today's prayer times (with any CMS override applied), the computed next
 * prayer, the active announcement, latest news, upcoming events, services,
 * classes and the mosque's contact details.
 *
 * Built entirely from the existing website helpers so there is one source of
 * truth and one set of business rules across every surface.
 */
export async function buildSnapshot(now: Date = new Date()) {
  const todayISO = londonTodayISO(now);

  // CMS per-day override (Prayer Timetable) wins over the static annual JSON.
  const override = await getPrayerOverride(todayISO);
  const today: PrayerDay = override ?? getToday(now);

  const rows = dayRows(today);
  const tomorrow = getNextDay(today.date);
  const nextPrayer = findNext(rows, tomorrow.fajr.jamaah, londonSecondsNow(now));

  const [announcement, events, services, classes, news, site, jummah, donation, appCfg] =
    await Promise.all([
      getAnnouncement(),
      getEvents(),
      getServices(),
      getClasses(),
      getPosts(),
      getSite(),
      getJummah(),
      getDonation(),
      getAppSettings(),
    ]);

  return {
    generatedAt: now.toISOString(),
    date: {
      iso: todayISO,
      gregorian: formatGregorian(todayISO),
      hijri: formatHijri(todayISO),
    },
    prayers: rows,
    nextPrayer,
    isFriday: isFriday(todayISO),
    jummah: jummah.congregations,
    announcement: announcement.enabled ? announcement : null,
    news,
    events,
    services,
    classes,
    contact: {
      phone: site.phone,
      phoneHref: site.phoneHref,
      email: site.email,
      address: site.address,
      mapsQuery: site.mapsQuery,
      social: site.social,
    },
    // Everything the mobile app needs that isn't already above — managed in
    // admin → Mobile App, so the app updates without an app-store release.
    app: {
      ...appCfg,
      donateUrl: donation.donateUrl || "",
      youtube: youtubeChannelUrl,
    },
  };
}

type AppCfg = {
  welcome: string;
  timetablePdfUrl: string;
  quickLinks: { icon: string; label: string; url: string }[];
  mediaLinks: { kind: string; label: string; url: string }[];
};

async function getAppSettings(): Promise<AppCfg> {
  const empty: AppCfg = { welcome: "As-salāmu ʿalaykum", timetablePdfUrl: "", quickLinks: [], mediaLinks: [] };
  try {
    const p = await getPayloadClient();
    const g = (await p.findGlobal({ slug: "app-settings" as never, depth: 0 })) as Record<string, any>;
    return {
      welcome: typeof g?.welcome === "string" && g.welcome ? g.welcome : empty.welcome,
      timetablePdfUrl: typeof g?.timetablePdfUrl === "string" ? g.timetablePdfUrl : "",
      quickLinks: Array.isArray(g?.quickLinks)
        ? g.quickLinks
            .filter((q: any) => q?.label && q?.url)
            .map((q: any) => ({ icon: String(q.icon || "•"), label: String(q.label), url: String(q.url) }))
        : [],
      mediaLinks: Array.isArray(g?.mediaLinks)
        ? g.mediaLinks
            .filter((m: any) => m?.label && m?.url)
            .map((m: any) => ({ kind: String(m.kind || "link"), label: String(m.label), url: String(m.url) }))
        : [],
    };
  } catch {
    return empty;
  }
}

export type Snapshot = Awaited<ReturnType<typeof buildSnapshot>>;
