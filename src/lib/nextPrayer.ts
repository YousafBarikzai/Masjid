import type { SimplePrayer } from "./prayer";

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Seconds elapsed since midnight in Europe/London (handles any visitor timezone). */
export function londonSecondsNow(now: Date = new Date()): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);
  const [hh, mm, ss] = s.split(":").map(Number);
  return ((hh % 24) * 60 + mm) * 60 + ss;
}

export interface NextPrayer {
  name: string;
  time: string;
  diffSeconds: number;
  tomorrow: boolean;
}

export function findNext(
  rows: SimplePrayer[],
  tomorrowFajr: string,
  nowSeconds: number
): NextPrayer {
  const candidates = rows
    .filter((r) => r.jamaah && !r.isInfo)
    .map((r) => ({ name: r.en, time: r.jamaah as string, sec: toMinutes(r.jamaah as string) * 60 }));
  for (const c of candidates) {
    if (c.sec > nowSeconds) {
      return { name: c.name, time: c.time, diffSeconds: c.sec - nowSeconds, tomorrow: false };
    }
  }
  const sec = toMinutes(tomorrowFajr) * 60 + 86400;
  return { name: "Fajr", time: tomorrowFajr, diffSeconds: sec - nowSeconds, tomorrow: true };
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function formatShort(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
