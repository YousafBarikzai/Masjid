import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerDevice } from "./api";

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Ask for notification permission, get this device's Expo push token, and
 * register it with the website so the mosque can broadcast announcements.
 * Best-effort: returns null and stays silent on simulators or if declined.
 */
export async function registerForPush(): Promise<string | null> {
  if (!Device.isDevice) return null; // push doesn't work on simulators

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Announcements",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    const token = tokenResponse.data;
    await registerDevice(token, Platform.OS === "android" ? "android" : "ios");
    return token;
  } catch {
    return null;
  }
}
