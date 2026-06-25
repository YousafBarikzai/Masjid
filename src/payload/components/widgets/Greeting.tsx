import React from "react";
import { londonTodayISO, formatGregorian, formatHijri } from "@/lib/prayer";

/* Server component: a warm, branded greeting with today's Gregorian + Hijri date. */

export function Greeting({ name }: { name?: string }) {
  const first = (name || "").trim().split(/\s+/)[0] || "";
  let gregorian = "";
  let hijri = "";
  try {
    const iso = londonTodayISO();
    gregorian = formatGregorian(iso);
    hijri = formatHijri(iso);
  } catch {
    /* dates are best-effort */
  }
  return (
    <div className="kma-hello">
      <h2 className="kma-hello__salaam">
        As-salāmu ʿalaykum{first ? <span className="kma-hello__name">, {first}</span> : ""}
      </h2>
      <div className="kma-hello__dates">
        {gregorian && <span>{gregorian}</span>}
        {hijri && <span className="kma-hello__hijri">{hijri}</span>}
      </div>
    </div>
  );
}
