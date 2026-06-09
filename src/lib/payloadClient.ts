import "server-only";
import type { Payload } from "payload";
import { getPayload } from "payload";
import config from "@payload-config";

let cached: Promise<Payload> | null = null;

/** Memoised Payload local-API client (server only). */
export function getPayloadClient(): Promise<Payload> {
  if (!cached) cached = getPayload({ config });
  return cached;
}
