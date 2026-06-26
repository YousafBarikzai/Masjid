"use client";

import React, { useEffect, useState } from "react";
import { findNext, londonSecondsNow, formatCountdown, type NextPrayer } from "@/lib/nextPrayer";
import type { SimplePrayer } from "@/lib/prayer";

/* Client leaf: the live next-prayer panel inside the green hero card. The server
   passes the day's rows + tomorrow's Fajr; the clock runs only on the client behind
   a `mounted` gate so SSR and first client render agree. */

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
    <div className="kma-np">
      <div className="kma-np__name">
        {name}
        {ar && <span className="kma-np__ar">{ar}</span>}
      </div>
      <div className="kma-np__jamaah">{time ? `Jamāʿah at ${time}` : "Prayer times"}</div>

      <div className="kma-np__countlabel">Until jamāʿah</div>
      <div className="kma-np__count">{mounted && np ? formatCountdown(np.diffSeconds) : "—:—:—"}</div>

      <div className="kma-np__chips">
        {jamaahRows.map((r) => (
          <span
            key={r.key}
            className={`kma-np__chip${mounted && np && r.en === np.name && !np.tomorrow ? " is-next" : ""}`}
          >
            <span className="kma-np__chip-name">{r.en}</span>
            <span className="kma-np__chip-time">{r.jamaah}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
