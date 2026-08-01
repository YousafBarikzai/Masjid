import { Tabs } from "expo-router";
import TabBar from "../../src/TabBar";

/* The five tabs, rendered by the custom floating-dock TabBar (src/TabBar.tsx):
   a rounded glass pill hovering above the content, SVG icons (immune to the
   missing-icon-font problem that left the old bar as bare text), a gold
   capsule behind the active tab, and a haptic tick on every switch. */

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="prayers" options={{ title: "Prayers" }} />
      <Tabs.Screen name="news" options={{ title: "News" }} />
      <Tabs.Screen name="media" options={{ title: "Media" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
