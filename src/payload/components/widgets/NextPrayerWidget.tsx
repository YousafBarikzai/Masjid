import React from "react";
import { NextPrayerCountdown } from "./NextPrayerCountdown";
import { IconClock } from "../icons";
import { getToday, getNextDay, dayRows, londonTodayISO } from "@/lib/prayer";
import { getPrayerOverride } from "@/lib/cms";

/* Server component: resolves today's prayer rows (CMS override wins over the static
   timetable) and tomorrow's Fajr, then renders the green "Next prayer" hero card with
   the live countdown leaf. Self-contained and fail-safe. */

export async function NextPrayerWidget() {
  try {
    const now = new Date();
    const override = await getPrayerOverride(londonTodayISO(now)).catch(() => null);
    const today = override ?? getToday(now);
    const rows = dayRows(today);
    const tomorrowFajr = getNextDay(today.date).fajr.jamaah;
    if (!rows.some((r) => r.jamaah)) return null;

    const arabicByName: Record<string, string> = {};
    for (const r of rows) if (!r.isInfo) arabicByName[r.en] = r.ar;

    return (
      <section className="kma-card kma-card--prayer">
        <header className="kma-card__head">
          <span className="kma-card__title">
            <IconClock size={15} /> Next prayer
          </span>
        </header>
        <NextPrayerCountdown rows={rows} tomorrowFajr={tomorrowFajr} arabicByName={arabicByName} />
      </section>
    );
  } catch {
    return null;
  }
}
