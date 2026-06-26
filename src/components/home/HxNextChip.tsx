"use client";

import { useEffect, useState } from "react";
import type { SimplePrayer } from "@/lib/prayer";
import { findNext, formatShort, londonSecondsNow } from "@/lib/nextPrayer";

/** Hero "Next prayer" pill, faithful to the design markup. */
export default function HxNextChip({
  rows,
  tomorrowFajr,
}: {
  rows: SimplePrayer[];
  tomorrowFajr: string;
}) {
  const [state, setState] = useState<{ name: string; time: string; short: string } | null>(null);

  useEffect(() => {
    const tick = () => {
      const n = findNext(rows, tomorrowFajr, londonSecondsNow());
      setState({ name: n.name, time: n.time, short: formatShort(n.diffSeconds) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rows, tomorrowFajr]);

  return (
    <div className="hx-nextchip">
      <span className="dot" />
      Next prayer: <b className="name">{state?.name ?? "—"}</b> jamāʿah at{" "}
      <b className="time">{state?.time ?? "—"}</b>
      {state ? <span className="pill">in {state.short}</span> : null}
    </div>
  );
}
