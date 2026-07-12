import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerDevice } from "./api";
import { getTopics } from "./prefs";

// Show notifications while the app is foregrounded too (the prayer bell's
// beep included).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for notification permission, get this device's Expo push token, and
 * register it (with the user's chosen topics) so the mosque can notify it.
 * Best-effort: returns null on simulators or if permission is declined.
 */
export async function registerForPush(topics?: string[]): Promise<string | null> {
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Mosque announcements",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#c9a227",
    });
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    const chosen = topics ?? (await getTopics());
    await registerDevice(token, Platform.OS === "android" ? "android" : "ios", chosen);
    return token;
  } catch {
    return null;
  }
}
