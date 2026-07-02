"use client";

import { useEffect, useState } from "react";
import { toMinutes, londonSecondsNow } from "@/lib/nextPrayer";

/* Live Suhūr / Iftar countdown for Ramadan. Suhūr ends at Fajr (begins); Iftar
   is at Maghrib (begins). Counts down to whichever comes next and flips through
   the day. Times come from the prayer timetable (with any admin override). */

function fmt(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

export default function RamadanCountdown({
  fajr,
  maghrib,
}: {
  fajr: string; // HH:MM (Suhūr ends)
  maghrib: string; // HH:MM (Iftar)
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(londonSecondsNow());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fajrSec = toMinutes(fajr) * 60;
  const maghribSec = toMinutes(maghrib) * 60;

  let mode: "suhur" | "iftar" = "suhur";
  let target = "";
  let label = "";
  let at = "";
  if (now != null) {
    if (now < fajrSec) {
      mode = "suhur";
      label = "Suhūr ends in";
      at = fajr;
      target = fmt(fajrSec - now);
    } else if (now < maghribSec) {
      mode = "iftar";
      label = "Iftar in";
      at = maghrib;
      target = fmt(maghribSec - now);
    } else {
      // After Maghrib → count to tomorrow's Suhūr end (approx: next Fajr).
      mode = "suhur";
      label = "Suhūr ends in";
      at = fajr;
      target = fmt(fajrSec + 86400 - now);
    }
  }

  return (
    <div className={`ramcd ramcd--${mode}`}>
      <div className="ramcd__row">
        <div className={`ramcd__pill${mode === "suhur" ? " is-on" : ""}`}>
          <span className="ramcd__pill-ic" aria-hidden>🌙</span>
          <div>
            <span className="ramcd__pill-k">Suhūr ends</span>
            <span className="ramcd__pill-v">{fajr}</span>
          </div>
        </div>
        <div className={`ramcd__pill${mode === "iftar" ? " is-on" : ""}`}>
          <span className="ramcd__pill-ic" aria-hidden>🌅</span>
          <div>
            <span className="ramcd__pill-k">Iftar</span>
            <span className="ramcd__pill-v">{maghrib}</span>
          </div>
        </div>
      </div>
      <div className="ramcd__count">
        <span className="ramcd__label">{label || "Loading…"}</span>
        <span className="ramcd__time">{target || "—"}</span>
        {at && <span className="ramcd__at">at {at}</span>}
      </div>
    </div>
  );
}
