import Constants from "expo-constants";
import type { Snapshot } from "./types";

// Base URL of the deployed website/CMS. Override per build with the env var
// EXPO_PUBLIC_API_BASE, else falls back to app.json's extra.apiBase.
const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
const fromConfig = (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase;
export const apiBase = (fromEnv || fromConfig || "https://kingstonmosque.org").replace(/\/$/, "");

export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch(`${apiBase}/app-api/snapshot`, { signal });
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  return (await res.json()) as Snapshot;
}

export async function registerDevice(token: string, platform: "ios" | "android"): Promise<void> {
  await fetch(`${apiBase}/app-api/register-device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform }),
  });
}
