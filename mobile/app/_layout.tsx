import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerForPush } from "@/push";
import { playTakbir } from "@/adhan";
import { colors } from "@/theme";
import { BrandIntro } from "@/BrandIntro";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    // Hide the static native splash the moment the animated intro is mounted —
    // same ground + same monogram, so the hand-off is seamless.
    SplashScreen.hideAsync().catch(() => {});
    // Register for announcement push notifications (no-op on simulator/declined).
    registerForPush().catch(() => {});
  }, []);

  // When a prayer-time adhan cue arrives while the app is open, speak the
  // short takbīr aloud (its notification banner shows either way).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      if ((n.request.content.data as { type?: string } | undefined)?.type === "adhan") playTakbir();
    });
    return () => sub.remove();
  }, []);

  const done = useCallback(() => setIntro(false), []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      {intro ? <BrandIntro onDone={done} /> : null}
    </SafeAreaProvider>
  );
}
