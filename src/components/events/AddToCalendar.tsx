"use client";

import { useState } from "react";

/* "Add to calendar" for an event — a Google Calendar link plus a one-tap .ics
   download that works with Apple Calendar, Outlook and the rest. All client-side
   from the event's start/end, so it needs no extra API. */

type Props = {
  title: string;
  start: string; // ISO
  end?: string; // ISO
  location?: string;
  details?: string;
};

function toUtcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export default function AddToCalendar({ title, start, end, location, details }: Props) {
  const [open, setOpen] = useState(false);
  if (!start) return null;

  const startStamp = toUtcStamp(start);
  const endStamp = toUtcStamp(end || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString());

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", title);
  google.searchParams.set("dates", `${startStamp}/${endStamp}`);
  if (details) google.searchParams.set("details", details);
  if (location) google.searchParams.set("location", location);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kingston Mosque//Events//EN",
    "BEGIN:VEVENT",
    `UID:${startStamp}-${title.replace(/\s+/g, "")}@kingstonmosque.org`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${startStamp}`,
    `DTEND:${endStamp}`,
    `SUMMARY:${title.replace(/([\\;,])/g, "\\$1")}`,
    location ? `LOCATION:${location.replace(/([\\;,])/g, "\\$1")}` : "",
    details ? `DESCRIPTION:${details.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  const fileName = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;

  return (
    <div className="atc">
      <button type="button" className="btn btn-gold atc__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4M12 13v4M10 15h4" />
        </svg>
        Add to calendar
      </button>
      {open && (
        <div className="atc__menu">
          <a href={google.toString()} target="_blank" rel="noopener noreferrer" className="atc__item">
            Google Calendar
          </a>
          <a href={icsHref} download={fileName} className="atc__item">
            Apple / Outlook (.ics)
          </a>
        </div>
      )}
    </div>
  );
}
