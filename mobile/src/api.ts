import Constants from "expo-constants";
import type { ContentFeed, MonthGrid, Snapshot } from "./types";

// Base URL of the deployed website/CMS. Override per build with the env var
// EXPO_PUBLIC_API_BASE, else falls back to app.json's extra.apiBase.
const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
const fromConfig = (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase;
export const apiBase = (fromEnv || fromConfig || "https://masjid-production.up.railway.app").replace(/\/$/, "");

/** Turn a site path ("/donate") or full URL into an absolute URL. */
export function absUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${apiBase}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch(`${apiBase}/app-api/snapshot`, { signal });
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return (await res.json()) as Snapshot;
}

export async function fetchMonth(month: string, signal?: AbortSignal): Promise<MonthGrid> {
  const res = await fetch(`${apiBase}/app-api/timetable-grid?month=${month}`, { signal });
  if (!res.ok) throw new Error(`month ${res.status}`);
  return (await res.json()) as MonthGrid;
}

export async function fetchContent(signal?: AbortSignal): Promise<ContentFeed> {
  const res = await fetch(`${apiBase}/app-api/content`, { signal });
  if (!res.ok) throw new Error(`content ${res.status}`);
  return (await res.json()) as ContentFeed;
}

export async function registerDevice(
  token: string,
  platform: "ios" | "android",
  topics: string[],
): Promise<void> {
  await fetch(`${apiBase}/app-api/register-device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform, topics }),
  });
}
