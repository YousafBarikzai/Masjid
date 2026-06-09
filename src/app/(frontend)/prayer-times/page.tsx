import type { Metadata } from "next";
import PageHero from "@/components/layout/PageHero";
import PrayerCard from "@/components/home/PrayerCard";
import MonthlyTimetable from "@/components/prayer/MonthlyTimetable";
import { getToday, getNextDay, dayRows, formatGregorian, formatHijri, timetableYear } from "@/lib/prayer";

export const metadata: Metadata = { title: "Prayer Times" };
export const dynamic = "force-dynamic";

export default function PrayerTimesPage() {
  const today = getToday();
  const rows = dayRows(today);
  const tomorrowFajr = getNextDay(today.date).fajr.jamaah;

  return (
    <>
      <PageHero
        title="Prayer Times"
        crumb="Prayer Times"
        intro={`Daily salah and jamā‘ah times for Kingston Mosque. Full ${timetableYear} timetable below.`}
      />
      <section>
        <div className="wrap">
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <PrayerCard
              gregorian={formatGregorian(today.date)}
              hijri={formatHijri(today.date)}
              rows={rows}
              tomorrowFajr={tomorrowFajr}
            />
          </div>
          <MonthlyTimetable />
        </div>
      </section>
    </>
  );
}
