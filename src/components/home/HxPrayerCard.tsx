"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SimplePrayer } from "@/lib/prayer";
import { findNext, formatCountdown, londonSecondsNow } from "@/lib/nextPrayer";

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function HxPrayerCard({
  gregorian,
  hijri,
  rows,
  tomorrowFajr,
  location = "Kingston upon Thames (KT2)",
}: {
  gregorian: string;
  hijri: string;
  rows: SimplePrayer[];
  tomorrowFajr: string;
  location?: string;
}) {
  const [nextName, setNextName] = useState<string>("");
  const [nextTime, setNextTime] = useState<string>("—");
  const [tomorrow, setTomorrow] = useState<boolean>(false);
  const [timer, setTimer] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () => {
      const now = londonSecondsNow();
      const n = findNext(rows, tomorrowFajr, now);
      setNextName(n.name);
      setNextTime(n.time);
      setTomorrow(n.tomorrow);
      setTimer(formatCountdown(n.diffSeconds));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rows, tomorrowFajr]);

  return (
    <div className="hx-prayer-card">
      <div className="pc-head">
        <div className="dots" aria-hidden />
        <div className="inner">
          <div className="pc-eyebrow">TODAY AT KINGSTON MOSQUE</div>
          <div className="pc-greg">{gregorian}</div>
          {hijri && <div className="pc-hijri">{hijri}</div>}
          <div className="pc-count">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E6C879" strokeWidth="1.8" aria-hidden>
              <path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2" />
            </svg>
            <span>
              {nextName ? (
                <>
                  {nextName} jamāʿah at <b>{nextTime}</b>
                  {tomorrow ? " (tomorrow)" : ""} ·{" "}
                </>
              ) : null}
              <b className="timer hx-tnum">{timer}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="pc-body">
        <div className="hx-prow-head">
          <span>PRAYER</span>
          <span>BEGINS</span>
          <span>JAMĀʿAH</span>
        </div>
        {rows.map((r) => {
          const isNext = !r.isInfo && r.en === nextName && !tomorrow;
          const cls = `hx-prow${r.isInfo ? " info" : ""}${isNext ? " next" : ""}`;
          return (
            <div key={r.key} className={cls}>
              <div className="pname">
                {isNext && <span className="badge">NEXT</span>}
                <span className="en">{r.en}</span>
                <span className="ar">{r.ar}</span>
              </div>
              <span className="begins hx-tnum">{r.begins}</span>
              <span className="jamaah hx-tnum">{r.jamaah ?? "—"}</span>
            </div>
          );
        })}
      </div>

      <div className="pc-foot">
        <span className="loc">Times for {location}</span>
        <Link href="/prayer-times">
          Full timetable
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
