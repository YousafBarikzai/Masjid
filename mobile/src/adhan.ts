import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Speech from "expo-speech";

/* Short-adhan prayer cue.

   The user opts in from the Prayer Times screen (default: Mute). When on, we:
     • speak the opening takbīr — "Allāhu Akbar, Allāhu Akbar" — the moment a
       prayer time arrives while the app is open (a short, respectful cue, not
       the full adhan); and
     • schedule local notifications at each prayer's begin time for the coming
       days, so the cue still reaches the phone when the app is closed.
   The preference is saved, so it survives app restarts. */

const ADHAN_KEY = "kma-adhan";
const TAKBIR = "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَر"; // "Allāhu Akbar, Allāhu Akbar"
const MAX_NOTIFS = 60; // stay comfortably under iOS's 64 pending-notification cap

export async function getAdhan(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ADHAN_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setAdhan(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ADHAN_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Speak the opening takbīr — the short, respectful prayer cue. */
export function playTakbir(): void {
  try {
    Speech.stop();
    Speech.speak(TAKBIR, { language: "ar", rate: 0.82, pitch: 1.0 });
  } catch {
    /* speech unavailable — the notification banner still shows the takbīr */
  }
}

export type DaySchedule = { dateISO: string; prayers: { name: string; begins: string }[] };

function parseWhen(dateISO: string, hhmm: string): Date | null {
  const dm = dateISO.split("-").map(Number);
  const tm = (hhmm || "").match(/(\d{1,2}):(\d{2})/);
  if (dm.length !== 3 || dm.some(Number.isNaN) || !tm) return null;
  const d = new Date(dm[0], dm[1] - 1, dm[2], Number(tm[1]), Number(tm[2]), 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Android needs a dedicated channel so the cue sounds + vibrates on time. */
async function ensureChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("adhan", {
      name: "Adhan — prayer time",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#c9a227",
    });
  }
}

/** Cancel every adhan cue we've scheduled (leaves other notifications alone). */
export async function cancelAdhan(): Promise<void> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => (n.content.data as { type?: string } | undefined)?.type === "adhan")
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
}

/** (Re)schedule the short-adhan cues for the coming days — idempotent: it
 *  clears the old ones first. Requests notification permission if needed;
 *  returns false when permission isn't granted (so the UI can revert). */
export async function scheduleAdhan(days: DaySchedule[]): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  let status = perm.status;
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return false;

  await ensureChannel();
  await cancelAdhan();

  const now = Date.now();
  const upcoming: { when: Date; name: string }[] = [];
  for (const day of days) {
    for (const p of day.prayers) {
      const when = parseWhen(day.dateISO, p.begins);
      if (when && when.getTime() > now + 5000) upcoming.push({ when, name: p.name });
    }
  }
  upcoming.sort((a, b) => a.when.getTime() - b.when.getTime());

  for (const item of upcoming.slice(0, MAX_NOTIFS)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 ${item.name} — it's time to pray`,
        body: "Allāhu Akbar, Allāhu Akbar",
        sound: "default",
        data: { type: "adhan" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.when,
        channelId: Platform.OS === "android" ? "adhan" : undefined,
      },
    });
  }
  return true;
}
