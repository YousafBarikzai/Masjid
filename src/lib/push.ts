import "server-only";
import type { Payload } from "payload";

// Expo's free push service. Tokens look like `ExponentPushToken[xxxx]` and are
// registered by the mobile apps via /app-api/register-device.
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to every enabled device, optionally filtered to a
 * topic (e.g. "news", "events"). Best-effort: failures are swallowed so a push
 * outage never breaks the content save that triggered it. Returns how many
 * tokens were dispatched.
 */
export async function sendPushToAll(
  payload: Payload,
  message: PushMessage,
  topic?: string,
): Promise<{ sent: number }> {
  const where: Record<string, unknown> = { enabled: { equals: true } };
  if (topic) where.topics = { contains: topic };

  const res = await payload.find({
    collection: "device-tokens" as never,
    where: where as never,
    limit: 10000,
    depth: 0,
    overrideAccess: true,
  });

  const tokens = (res.docs as Array<{ token?: string }>)
    .map((d) => d.token)
    .filter((t): t is string => !!t && t.startsWith("ExponentPushToken"));

  if (!tokens.length) return { sent: 0 };

  // Expo accepts up to 100 messages per request.
  let sent = 0;
  for (let i = 0; i < tokens.length; i += 100) {
    const chunk = tokens.slice(i, i + 100);
    const messages = chunk.map((to) => ({
      to,
      sound: "default",
      title: message.title,
      body: message.body,
      data: message.data ?? {},
    }));
    try {
      const r = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      if (r.ok) sent += chunk.length;
    } catch {
      /* ignore this chunk; keep sending the rest */
    }
  }
  return { sent };
}
