import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

/* Per-prayer bell notifications.

   Each of the five salah has its own bell on the Prayer Times screen. When a
   bell is on, the phone plays a simple beep (the standard notification sound
   — no adhan or other audio) at the moment that prayer BEGINS (never the
   iqāmah). Choices are saved per prayer and survive restarts; scheduling is
   local notifications for the coming days, so bells ring with the app closed. */

export const PRAYER_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerKey = (typeof PRAYER_KEYS)[number];

const BELLS_KEY = "kma-prayer-bells";
const LEGACY_ADHAN_KEY = "kma-adhan"; // the old all-prayers toggle, migrated below
const MAX_NOTIFS = 60; // stay comfortably under iOS's 64 pending-notification cap

export async function getBells(): Promise<PrayerKey[]> {
  try {
    const raw = await AsyncStorage.getItem(BELLS_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      return PRAYER_KEYS.filter((k) => arr.includes(k));
    }
    // One-time migration: if the previous release's single adhan toggle was
    // on, carry that intent over as "all five bells on".
    if ((await AsyncStorage.getItem(LEGACY_ADHAN_KEY)) === "1") {
      const all = [...PRAYER_KEYS];
      await setBells(all);
      return all;
    }
  } catch {
    /* fall through */
  }
  return [];
}

export async function setBells(keys: PrayerKey[]): Promise<void> {
  try {
    await AsyncStorage.setItem(BELLS_KEY, JSON.stringify(keys));
    await AsyncStorage.removeItem(LEGACY_ADHAN_KEY);
  } catch {
    /* ignore */
  }
}

export type DaySchedule = {
  dateISO: string;
  prayers: { key: PrayerKey; name: string; begins: string }[];
};

function parseWhen(dateISO: string, hhmm: string): Date | null {
  const dm = dateISO.split("-").map(Number);
  const tm = (hhmm || "").match(/(\d{1,2}):(\d{2})/);
  if (dm.length !== 3 || dm.some(Number.isNaN) || !tm) return null;
  const d = new Date(dm[0], dm[1] - 1, dm[2], Number(tm[1]), Number(tm[2]), 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Android needs a channel so the beep sounds on time. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("prayer-bell", {
      name: "Prayer time bell",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
      lightColor: "#c9a227",
    });
  }
}

/** Cancel every bell we've scheduled (also clears the previous release's
 *  adhan cues), leaving mosque announcements and other notifications alone. */
export async function cancelBells(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => {
          const type = (n.content.data as { type?: string } | undefined)?.type;
          return type === "prayer-bell" || type === "adhan";
        })
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
}

/** (Re)schedule beeps for the enabled prayers over the coming days —
 *  idempotent: clears the old ones first. Requests notification permission
 *  if needed; returns false when it isn't granted (so the UI can revert). */
export async function scheduleBells(days: DaySchedule[], enabled: PrayerKey[]): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return false;

  await ensureChannel();
  await cancelBells();
  if (!enabled.length) return true;

  const now = Date.now();
  const upcoming: { when: Date; name: string }[] = [];
  for (const day of days) {
    for (const p of day.prayers) {
      if (!enabled.includes(p.key)) continue;
      const when = parseWhen(day.dateISO, p.begins);
      if (when && when.getTime() > now + 5000) upcoming.push({ when, name: p.name });
    }
  }
  upcoming.sort((a, b) => a.when.getTime() - b.when.getTime());

  for (const item of upcoming.slice(0, MAX_NOTIFS)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 ${item.name}`,
        body: `${item.name} has begun`,
        sound: "default", // the simple beep — no adhan or other audio
        data: { type: "prayer-bell" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.when,
        channelId: Platform.OS === "android" ? "prayer-bell" : undefined,
      },
    });
  }
  return true;
}
