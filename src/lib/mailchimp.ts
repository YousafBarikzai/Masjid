import "server-only";
import { createHash } from "crypto";

/* Mailchimp sync for the central mailing list.

   Env-gated like every other integration (SMTP, S3, Stripe): set
     MAILCHIMP_API_KEY      — e.g. abc123...-us21 (the -us21 suffix is the DC)
     MAILCHIMP_AUDIENCE_ID  — the List/Audience ID from Mailchimp settings
   and every Subscriber save mirrors to the Mailchimp audience; without them,
   everything silently no-ops and the CMS list remains the only record.

   Uses Mailchimp's canonical idempotent upsert: PUT /lists/{id}/members/{md5}
   where {md5} is the lowercase-email MD5 — safe to call repeatedly. */

function config(): { key: string; dc: string; list: string } | null {
  const key = process.env.MAILCHIMP_API_KEY || "";
  const list = process.env.MAILCHIMP_AUDIENCE_ID || "";
  const dc = key.split("-").pop() || "";
  if (!key || !list || !dc) return null;
  return { key, dc, list };
}

export function mailchimpEnabled(): boolean {
  return config() !== null;
}

function memberUrl(cfg: { dc: string; list: string }, email: string): string {
  const hash = createHash("md5").update(email.trim().toLowerCase()).digest("hex");
  return `https://${cfg.dc}.api.mailchimp.com/3.0/lists/${cfg.list}/members/${hash}`;
}

function headers(cfg: { key: string }): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`anystring:${cfg.key}`).toString("base64")}`,
  };
}

/** Create-or-update a member so Mailchimp always mirrors the CMS list. */
export async function upsertMailchimpMember(input: {
  email: string;
  name?: string;
  subscribed: boolean;
}): Promise<boolean> {
  const cfg = config();
  if (!cfg || !input.email) return false;
  const [fname, ...rest] = (input.name || "").trim().split(/\s+/);
  const res = await fetch(memberUrl(cfg, input.email), {
    method: "PUT",
    headers: headers(cfg),
    body: JSON.stringify({
      email_address: input.email.trim().toLowerCase(),
      status_if_new: input.subscribed ? "subscribed" : "unsubscribed",
      status: input.subscribed ? "subscribed" : "unsubscribed",
      merge_fields: {
        ...(fname ? { FNAME: fname } : {}),
        ...(rest.length ? { LNAME: rest.join(" ") } : {}),
      },
    }),
    signal: AbortSignal.timeout(10000),
  });
  return res.ok;
}

/** Archive a member when a subscriber is deleted from the CMS. */
export async function archiveMailchimpMember(email: string): Promise<boolean> {
  const cfg = config();
  if (!cfg || !email) return false;
  const res = await fetch(memberUrl(cfg, email), {
    method: "DELETE",
    headers: headers(cfg),
    signal: AbortSignal.timeout(10000),
  });
  return res.ok || res.status === 404;
}
