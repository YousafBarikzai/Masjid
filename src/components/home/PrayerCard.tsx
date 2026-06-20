"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SimplePrayer } from "@/lib/prayer";
import { findNext, formatCountdown, londonSecondsNow } from "@/lib/nextPrayer";

export default function PrayerCard({
  gregorian,
  hijri,
  rows,
  tomorrowFajr,
}: {
  gregorian: string;
  hijri: string;
  rows: SimplePrayer[];
  tomorrowFajr: string;
}) {
  const [nextName, setNextName] = useState<string>("");
  const [label, setLabel] = useState<string>("Next jamā‘ah");
  const [timer, setTimer] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () => {
      const now = londonSecondsNow();
      const n = findNext(rows, tomorrowFajr, now);
      setNextName(n.name);
      setLabel(`${n.name} jamā‘ah at ${n.time}${n.tomorrow ? " (tomorrow)" : ""}`);
      setTimer(formatCountdown(n.diffSeconds));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rows, tomorrowFajr]);

  return (
    <div className="pcard">
      <div className="pc-top">
        <div className="eyebrow">Today at Kingston Mosque</div>
        <h3>{gregorian}</h3>
        {hijri && <div className="hijri">{hijri}</div>}
        <div className="countdown">
          ⏳ <span>{label}</span> · <b>{timer}</b>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Prayer</th>
            <th>Begins</th>
            <th>Jamā‘ah</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isNext = !r.isInfo && r.en === nextName;
            return (
              <tr key={r.key} className={`${r.isInfo ? "muted" : ""} ${isNext ? "next" : ""}`}>
                <td className="pname">
                  <span className="en">
                    {r.en}
                    {isNext && <span className="badge-next">NEXT</span>}
                  </span>
                  <span className="ar">{r.ar}</span>
                </td>
                <td className="ptime begins">{r.begins}</td>
                <td className="ptime jamaah">{r.jamaah ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pc-foot">
        <span>Times for Kingston upon Thames (KT2)</span>
        <Link href="/prayer-times">Full timetable →</Link>
      </div>
    </div>
  );
}
