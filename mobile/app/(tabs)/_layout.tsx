import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme";

/* Floating glass tab bar: translucent blur on iOS (content scrolls beneath it),
   solid raised surface on Android. Gold active state, outline→filled icons. */

export default function TabsLayout() {
  const ios = Platform.OS === "ios";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.goldSoft,
        tabBarInactiveTintColor: "rgba(244,239,226,0.45)",
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: ios ? "transparent" : colors.bgRaised,
          height: ios ? 84 : 66,
          paddingTop: 8,
          elevation: 12,
        },
        tabBarBackground: ios
          ? () => (
              <BlurView
                tint="dark"
                intensity={50}
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(8,31,21,0.72)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
                ]}
              />
            )
          : undefined,
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
