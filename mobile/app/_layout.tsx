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
    // Register for announcement push notifications (no-op on simulator/declined).
    registerForPush().catch(() => {});
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
