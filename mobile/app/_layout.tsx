import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { registerForPush } from "@/push";
import { colors } from "@/theme";
import { BrandIntro } from "@/BrandIntro";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    // Hide the static native splash the moment the animated intro is mounted —
    // same ground + same monogram, so the hand-off is seamless.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Defer push registration until the intro is finished, so a slow/broken
  // native module can never keep the splash on screen. Also delayed by 500ms
  // to keep it off the busy first-render frame.
  const done = useCallback(() => {
    setIntro(false);
    setTimeout(() => {
      try {
        registerForPush().catch(() => {});
      } catch {
        /* never let this reach the crash boundary */
      }
    }, 500);
  }, []);

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
