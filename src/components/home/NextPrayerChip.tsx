"use client";

import { useEffect, useState } from "react";
import type { SimplePrayer } from "@/lib/prayer";
import { findNext, formatShort, londonSecondsNow } from "@/lib/nextPrayer";

export default function NextPrayerChip({
  rows,
  tomorrowFajr,
}: {
  rows: SimplePrayer[];
  tomorrowFajr: string;
}) {
  const [text, setText] = useState<{ name: string; time: string; short: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const n = findNext(rows, tomorrowFajr, londonSecondsNow());
      setText({ name: n.name, time: n.time, short: formatShort(n.diffSeconds) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rows, tomorrowFajr]);

  return (
    <div className="next-chip">
      <span className="dot" />
      Next prayer: <b>{text?.name ?? "—"}</b> jamā‘ah at <b>{text?.time ?? "—"}</b>
      {text ? <span> · in {text.short}</span> : null}
    </div>
  );
}
