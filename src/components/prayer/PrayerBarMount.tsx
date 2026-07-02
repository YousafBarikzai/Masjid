import { getToday, getNextDay, dayRows } from "@/lib/prayer";
import { getPrayerOverride } from "@/lib/cms";
import PrayerBar from "./PrayerBar";

// Server wrapper: computes today's rows + tomorrow's Fajr (same source as the
// home page) and hands them to the live client bar. Rendered once in the layout.
export default async function PrayerBarMount() {
  const base = getToday();
  const override = await getPrayerOverride(base.date);
  const today = override ?? base;
  const rows = dayRows(today);
  const tomorrowFajr = getNextDay(base.date).fajr.jamaah;
  return <PrayerBar rows={rows} tomorrowFajr={tomorrowFajr} />;
}
