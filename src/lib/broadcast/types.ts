export type ChannelId = "push" | "email" | "telegram" | "facebook" | "instagram";

export interface BroadcastInput {
  title: string;
  body: string;
  imageUrl?: string | null;
}

export interface ChannelResult {
  channel: ChannelId;
  status: "sent" | "skipped" | "failed";
  detail: string;
  count?: number;
}
