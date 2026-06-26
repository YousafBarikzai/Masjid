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
} from "./cms";

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

  const [announcement, events, services, classes, news, site, jummah] = await Promise.all([
    getAnnouncement(),
    getEvents(),
    getServices(),
    getClasses(),
    getPosts(),
    getSite(),
    getJummah(),
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
  };
}

export type Snapshot = Awaited<ReturnType<typeof buildSnapshot>>;
