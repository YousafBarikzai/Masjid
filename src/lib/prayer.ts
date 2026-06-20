import raw from "@data/prayer-times-2026.json";

export interface PrayerTime {
  begins: string;
  jamaah: string;
}

export interface PrayerDay {
  date: string; // YYYY-MM-DD
  weekday: string;
  fajr: PrayerTime;
  sunrise: string;
  dhuhr: PrayerTime;
  asr: PrayerTime;
  maghrib: PrayerTime;
  isha: PrayerTime;
}

interface Timetable {
  year: number;
  timezone: string;
  note: string;
  count: number;
  days: PrayerDay[];
}

export const timetable = raw as unknown as Timetable;
const byDate = new Map(timetable.days.map((d) => [d.date, d]));

/** The five obligatory prayers, in order, with Arabic labels. */
export const PRAYER_META = [
  { key: "fajr", en: "Fajr", ar: "الفجر" },
  { key: "sunrise", en: "Sunrise", ar: "الشروق", isInfo: true },
  { key: "dhuhr", en: "Dhuhr", ar: "الظهر" },
  { key: "asr", en: "Asr", ar: "العصر" },
  { key: "maghrib", en: "Maghrib", ar: "المغرب" },
  { key: "isha", en: "Isha", ar: "العشاء" },
] as const;

/** Current calendar date in Europe/London as YYYY-MM-DD (works on server & client). */
export function londonTodayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // en-CA gives YYYY-MM-DD
}

export function getDay(dateISO: string): PrayerDay | undefined {
  return byDate.get(dateISO);
}

/** Today's record, falling back to the nearest available day if outside the loaded year. */
export function getToday(now: Date = new Date()): PrayerDay {
  const iso = londonTodayISO(now);
  return (
    byDate.get(iso) ??
    // fall back to same month/day in the loaded year, else first day
    timetable.days.find((d) => d.date.slice(5) === iso.slice(5)) ??
    timetable.days[0]
  );
}

export function getNextDay(dateISO: string): PrayerDay {
  const i = timetable.days.findIndex((d) => d.date === dateISO);
  if (i >= 0 && i < timetable.days.length - 1) return timetable.days[i + 1];
  return timetable.days[0];
}

export function isFriday(dateISO: string): boolean {
  return new Date(dateISO + "T12:00:00Z").getUTCDay() === 5;
}

export function formatGregorian(dateISO: string): string {
  return new Date(dateISO + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatHijri(dateISO: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateISO + "T12:00:00"));
  } catch {
    return "";
  }
}

export interface SimplePrayer {
  key: string;
  en: string;
  ar: string;
  begins: string;
  jamaah: string | null;
  isInfo?: boolean;
}

/** Flatten a day into rows for display (begins + jamaah). */
export function dayRows(day: PrayerDay): SimplePrayer[] {
  return [
    { key: "fajr", en: "Fajr", ar: "الفجر", begins: day.fajr.begins, jamaah: day.fajr.jamaah },
    { key: "sunrise", en: "Sunrise", ar: "الشروق", begins: day.sunrise, jamaah: null, isInfo: true },
    { key: "dhuhr", en: "Dhuhr", ar: "الظهر", begins: day.dhuhr.begins, jamaah: day.dhuhr.jamaah },
    { key: "asr", en: "Asr", ar: "العصر", begins: day.asr.begins, jamaah: day.asr.jamaah },
    { key: "maghrib", en: "Maghrib", ar: "المغرب", begins: day.maghrib.begins, jamaah: day.maghrib.jamaah },
    { key: "isha", en: "Isha", ar: "العشاء", begins: day.isha.begins, jamaah: day.isha.jamaah },
  ];
}

/** Days grouped by month for the full timetable page. */
export function daysByMonth(): { label: string; days: PrayerDay[] }[] {
  const groups: Record<string, PrayerDay[]> = {};
  for (const d of timetable.days) {
    const key = d.date.slice(0, 7);
    (groups[key] ||= []).push(d);
  }
  return Object.entries(groups).map(([key, days]) => ({
    label: new Date(key + "-01T12:00:00").toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    }),
    days,
  }));
}

export const timetableYear = timetable.year;
