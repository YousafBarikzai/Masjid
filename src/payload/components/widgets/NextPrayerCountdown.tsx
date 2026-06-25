"use client";

import React, { useEffect, useState } from "react";
import { findNext, londonSecondsNow, formatCountdown, type NextPrayer } from "@/lib/nextPrayer";
import type { SimplePrayer } from "@/lib/prayer";

/* Client leaf: live HH:MM:SS countdown to the next jamāʿah. The server passes the
   day's rows + tomorrow's Fajr (plain serializable data); the live clock runs only
   on the client behind a `mounted` gate, so SSR and first client render match. */

export function NextPrayerCountdown({
  rows,
  tomorrowFajr,
  arabicByName,
}: {
  rows: SimplePrayer[];
  tomorrowFajr: string;
  arabicByName: Record<string, string>;
}) {
  const [mounted, setMounted] = useState(false);
  const [np, setNp] = useState<NextPrayer | null>(null);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      try {
        setNp(findNext(rows, tomorrowFajr, londonSecondsNow()));
      } catch {
        setNp(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rows, tomorrowFajr]);

  const name = np?.name ?? "—";
  const time = np?.time ?? "";
  const ar = (np && arabicByName[np.name]) || "";
  const jamaahRows = rows.filter((r) => r.jamaah && !r.isInfo);

  return (
    <div className="kma-prayer">
      <div>
        <div className="kma-prayer__name">
          {name}
          {ar && <span className="kma-prayer__ar">{ar}</span>}
        </div>
        <div className="kma-prayer__time">
          {time ? `Jamāʿah ${time}${np?.tomorrow ? " (tomorrow)" : ""}` : "Prayer times"}
        </div>
        <div className="kma-prayer__rows">
          {jamaahRows.map((r) => (
            <span
              key={r.key}
              className={`kma-prayer__chip${mounted && np && r.en === np.name && !np.tomorrow ? " is-next" : ""}`}
            >
              {r.en} {r.jamaah}
            </span>
          ))}
        </div>
      </div>
      <div className="kma-prayer__count">
        {mounted && np ? formatCountdown(np.diffSeconds) : "—:—:—"}
        <small>until jamāʿah</small>
      </div>
    </div>
  );
}
