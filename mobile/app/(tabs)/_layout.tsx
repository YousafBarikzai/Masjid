import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.goldSoft,
        tabBarInactiveTintColor: "rgba(244,239,226,0.45)",
        tabBarStyle: {
          backgroundColor: colors.bgRaised,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: "Prayers",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "time" : "time-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "newspaper" : "newspaper-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: "Media",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "play-circle" : "play-circle-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "ellipsis-horizontal-circle" : "ellipsis-horizontal-circle-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
