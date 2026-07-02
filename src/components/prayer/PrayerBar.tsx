"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SimplePrayer } from "@/lib/prayer";
import { findNext, londonSecondsNow } from "@/lib/nextPrayer";
import { useI18n } from "@/lib/i18n";

/* Slim, sticky "next prayer" bar shown under the header on phones — the
   at-a-glance answer a mosque app exists to give. Ticks every second and links
   through to the full timetable. Mobile-only (see .praybar in globals.css). */

function format(diff: number): string {
  const s = Math.max(0, Math.floor(diff));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

export default function PrayerBar({
  rows,
  tomorrowFajr,
}: {
  rows: SimplePrayer[];
  tomorrowFajr: string;
}) {
  const { t } = useI18n();
  const [state, setState] = useState<{ name: string; time: string; left: string; soon: boolean } | null>(
    null,
  );

  useEffect(() => {
    const tick = () => {
      const n = findNext(rows, tomorrowFajr, londonSecondsNow());
      setState({
        name: n.name,
        time: n.time,
        left: format(n.diffSeconds),
        soon: n.diffSeconds <= 15 * 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rows, tomorrowFajr]);

  return (
    <Link href="/prayer-times" className={`praybar${state?.soon ? " is-soon" : ""}`} aria-label="View prayer times">
      <span className="praybar__dot" aria-hidden />
      <span className="praybar__label">{t("prayer.next")}</span>
      <span className="praybar__name">{state?.name ?? "—"}</span>
      <span className="praybar__sep" aria-hidden>·</span>
      <span className="praybar__jamaah">
        {t("prayer.jamaah")} <b>{state?.time ?? "—"}</b>
      </span>
      <span className="praybar__count">{state ? `in ${state.left}` : "—"}</span>
      <svg className="praybar__chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}
