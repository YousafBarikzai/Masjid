import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerForPush } from "@/push";
import { colors } from "@/theme";
import { BrandIntro } from "@/BrandIntro";

SplashScreen.preventAutoHideAsync().catch(() => {});

/* The animated BrandIntro is iOS-only for now — on some Android release
   builds the SVG-driven pillar animation hangs the JS thread and never
   fires its completion callback, leaving the app stuck on the splash. iOS
   is fine and there's no need to give Android a worse experience: it now
   goes straight to Home from the static native splash. */
const SHOW_INTRO = Platform.OS === "ios";

export default function RootLayout() {
  const [intro, setIntro] = useState(SHOW_INTRO);

  useEffect(() => {
    // Hide the static native splash the moment the intro is mounted —
    // same ground + same monogram, so the hand-off is seamless.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Defer push registration until AFTER the intro (or immediately on
  // Android where there is no intro), so a slow/broken native module can
  // never keep the splash on screen. Wrapped so registration errors can
  // never take the app down.
  const kickPush = useCallback(() => {
    setTimeout(() => {
      try {
        registerForPush().catch(() => {});
      } catch {
        /* never let this reach the crash boundary */
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (!SHOW_INTRO) kickPush();
  }, [kickPush]);

  const done = useCallback(() => {
    setIntro(false);
    kickPush();
  }, [kickPush]);

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
