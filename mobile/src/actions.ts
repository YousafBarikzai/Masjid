import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { tap } from "./ui";
import { absUrl } from "./api";

/* OS-level handoffs that are inherently native to iOS/Android — the phone
   dialler, mail composer and maps. These are the platform's own apps, not the
   web, so the experience stays native. Payment checkout opens in the in-app
   browser sheet (SFSafariViewController) — it presents over the app without
   leaving it, which is also the compliant way to take charitable donations. */

export function callMosque(phoneHref: string) {
  tap();
  Linking.openURL(phoneHref).catch(() => {});
}

export function emailMosque(email: string, subject?: string, body?: string) {
  tap();
  const q: string[] = [];
  if (subject) q.push(`subject=${encodeURIComponent(subject)}`);
  if (body) q.push(`body=${encodeURIComponent(body)}`);
  Linking.openURL(`mailto:${email}${q.length ? `?${q.join("&")}` : ""}`).catch(() => {});
}

export function openMaps(query: string) {
  tap();
  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(query)}`).catch(() => {});
}

/** In-app browser sheet for a payment checkout or external media link. */
export function openInApp(url: string) {
  openSheet(url).catch(() => {});
}

/** Awaitable sheet — resolves when the user dismisses it (used by the donation
 *  flow to confirm the payment outcome natively afterwards). */
export async function openSheet(url: string): Promise<void> {
  const abs = absUrl(url);
  try {
    await WebBrowser.openBrowserAsync(abs, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: "#c9a227",
      toolbarColor: "#0e3d29",
      dismissButtonStyle: "close",
    });
  } catch {
    await Linking.openURL(abs).catch(() => {});
  }
}
