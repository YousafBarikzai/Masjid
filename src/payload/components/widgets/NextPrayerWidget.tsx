import React from "react";
import { WidgetCard } from "../WidgetCard";
import { NextPrayerCountdown } from "./NextPrayerCountdown";
import { IconClock } from "../icons";
import { getToday, getNextDay, dayRows, londonTodayISO } from "@/lib/prayer";
import { getPrayerOverride } from "@/lib/cms";
import { collectionHref } from "../destinations";

/* Server component: resolves today's prayer rows (CMS override wins over the static
   timetable) and tomorrow's Fajr, then hands them to the client countdown leaf.
   Self-contained and fail-safe — any error renders nothing rather than breaking the
   dashboard. */

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
      <WidgetCard
        title="Next prayer"
        icon={<IconClock />}
        className="kma-card--prayer kma-grid__wide"
        action={{ label: "Prayer times →", href: collectionHref("prayer-days") }}
      >
        <NextPrayerCountdown rows={rows} tomorrowFajr={tomorrowFajr} arabicByName={arabicByName} />
      </WidgetCard>
    );
  } catch {
    return null;
  }
}
