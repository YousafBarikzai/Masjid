"use client";

import "./timetable-grid.css";
import React, { useCallback, useEffect, useMemo, useState } from "react";

/* Spreadsheet-style prayer timetable editor, shown at the top of the Prayer
   Timetable list view. One row per date; TWO columns per salah — Begins (start)
   and Iqāmah (jamāʿah) — exactly like the paper timetable. Click any cell, type
   the new time, press Enter or click away and it saves instantly as that day's
   override (gold dot = day has an override). Fridays are tinted, today is
   highlighted, and the month tabs move through the year. */

type Row = {
  date: string;
  weekday: string;
  isOverride: boolean;
  note: string;
  [key: string]: string | boolean;
};

const COLS: { key: string; label: string }[] = [
  { key: "fajrBegins", label: "Begins" },
  { key: "fajrJamaah", label: "Iqāmah" },
  { key: "sunrise", label: "Sunrise" },
  { key: "dhuhrBegins", label: "Begins" },
  { key: "dhuhrJamaah", label: "Iqāmah" },
  { key: "asrBegins", label: "Begins" },
  { key: "asrJamaah", label: "Iqāmah" },
  { key: "maghrib", label: "Sunset" },
  { key: "ishaBegins", label: "Begins" },
  { key: "ishaJamaah", label: "Iqāmah" },
];

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type CellState = "saving" | "saved" | "error";

export function TimetableGrid() {
  const now = new Date();
  const [month, setMonth] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );
  const [year, setYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cellState, setCellState] = useState<Record<string, CellState>>({});
  const todayISO = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, []);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/app-api/timetable-grid?month=${m}`, { credentials: "include" });
      const data = await res.json();
      if (data?.days) {
        setRows(data.days as Row[]);
        if (data.year) setYear(data.year);
        // If the chosen month has no data (viewing a different year), snap to
        // the timetable's year.
        if (!data.days.length && data.year && !m.startsWith(String(data.year))) {
          const mm = m.slice(5);
          setMonth(`${data.year}-${mm}`);
        }
      }
    } catch {
      /* leave the previous rows */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  async function saveCell(date: string, field: string, value: string, revert: () => void) {
    const key = `${date}:${field}`;
    const trimmed = value.trim();
    if (!TIME_RE.test(trimmed)) {
      setCellState((s) => ({ ...s, [key]: "error" }));
      return;
    }
    setCellState((s) => ({ ...s, [key]: "saving" }));
    try {
      const res = await fetch("/app-api/timetable-grid", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, values: { [field]: trimmed } }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setCellState((s) => ({ ...s, [key]: "saved" }));
      setRows((rs) => rs.map((r) => (r.date === date ? { ...r, [field]: trimmed, isOverride: true } : r)));
      setTimeout(() => setCellState((s) => { const n = { ...s }; delete n[key]; return n; }), 1600);
    } catch {
      setCellState((s) => ({ ...s, [key]: "error" }));
      revert();
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  return (
    <div className="ttg">
      <div className="ttg__bar">
        <div className="ttg__title">
          <b>Edit the timetable like a spreadsheet</b>
          <span>Click a time, type the change, press Enter — it saves instantly. Begins = start of the salah · Iqāmah = jamāʿah.</span>
        </div>
        <div className="ttg__months" role="tablist">
          {months.map((m, i) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={month === m}
              className={`ttg__month${month === m ? " is-active" : ""}`}
              onClick={() => setMonth(m)}
            >
              {MONTH_NAMES[i]}
            </button>
          ))}
        </div>
      </div>

      <div className="ttg__scroll">
        <table className="ttg__table">
          <thead>
            <tr className="ttg__salah-row">
              <th rowSpan={2} className="ttg__day-head">{MONTH_NAMES[parseInt(month.slice(5), 10) - 1]} {year}</th>
              <th colSpan={2}>Fajr</th>
              <th rowSpan={2} className="ttg__sub">Sunrise</th>
              <th colSpan={2}>Dhuhr</th>
              <th colSpan={2}>ʿAsr</th>
              <th rowSpan={2} className="ttg__sub">Maghrib</th>
              <th colSpan={2}>ʿIshā</th>
            </tr>
            <tr className="ttg__sub-row">
              <th>Begins</th><th>Iqāmah</th>
              <th>Begins</th><th>Iqāmah</th>
              <th>Begins</th><th>Iqāmah</th>
              <th>Begins</th><th>Iqāmah</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={11} className="ttg__loading">Loading…</td></tr>
            ) : (
              rows.map((r) => {
                const isFri = r.weekday.startsWith("Fri");
                const isToday = r.date === todayISO;
                return (
                  <tr key={r.date} className={`${isFri ? "is-friday" : ""}${isToday ? " is-today" : ""}`}>
                    <td className="ttg__day">
                      <b>{parseInt(r.date.slice(8), 10)}</b> {r.weekday}
                      {r.isOverride && <span className="ttg__ovr" title="This day has a manual override">●</span>}
                    </td>
                    {COLS.map((c) => {
                      const key = `${r.date}:${c.key}`;
                      const st = cellState[key];
                      return (
                        <td key={c.key} className={st ? `is-${st}` : ""}>
                          <input
                            defaultValue={String(r[c.key] ?? "")}
                            inputMode="numeric"
                            aria-label={`${r.date} ${c.key}`}
                            onFocus={(e) => e.currentTarget.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                              if (e.key === "Escape") {
                                e.currentTarget.value = String(r[c.key] ?? "");
                                e.currentTarget.blur();
                              }
                            }}
                            onBlur={(e) => {
                              const v = e.currentTarget.value;
                              const el = e.currentTarget;
                              if (v.trim() === String(r[c.key] ?? "")) return;
                              saveCell(r.date, c.key, v, () => { el.value = String(r[c.key] ?? ""); });
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="ttg__legend">
        <span><i className="ttg__ovr">●</i> day has a manual override</span>
        <span><i className="ttg__swatch ttg__swatch--fri" /> Friday</span>
        <span><i className="ttg__swatch ttg__swatch--today" /> today</span>
        <span>Times are 24-hour, e.g. 13:30</span>
      </div>
    </div>
  );
}
