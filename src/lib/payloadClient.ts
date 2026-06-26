import "server-only";
import type { Payload } from "payload";
import { getPayload } from "payload";
import config from "@payload-config";

let cached: Promise<Payload> | null = null;

/** Memoised Payload local-API client (server only). If initialisation fails (e.g.
 *  the database is briefly unreachable), the failure is NOT cached — the next call
 *  retries — so a transient hiccup can't permanently degrade the running instance. */
export function getPayloadClient(): Promise<Payload> {
  if (!cached) {
    cached = getPayload({ config }).catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
