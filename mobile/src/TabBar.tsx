import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "./theme";
import { tap } from "./ui";

/* Floating dock tab bar — a rounded, elevated pill that hovers above the
   content (blur glass on iOS, raised surface on Android), with hand-drawn SVG
   icons and a soft gold capsule behind the active tab that springs into
   place. SVG means the icons are part of the JS bundle — they can never
   disappear the way icon FONTS can when a release build misses the font
   asset (the bug that left the old bar as bare text). */

const GOLD = colors.goldSoft;
const DIM = "rgba(244,239,226,0.52)";

function Icon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const sw = focused ? 2.2 : 1.9;
  const common = { stroke: color, strokeWidth: sw, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" as const };
  switch (name) {
    case "index": // Home
      return (
        <Svg width={23} height={23} viewBox="0 0 24 24">
          <Path {...common} d="M3.5 10.6 12 3.4l8.5 7.2" />
          <Path {...common} d="M5.5 9.2V20.5h13V9.2" />
          <Path {...common} fill={focused ? color : "none"} fillOpacity={focused ? 0.25 : 0} d="M9.8 20.5v-5.2a2.2 2.2 0 0 1 4.4 0v5.2" />
        </Svg>
      );
    case "prayers": // Mosque
      return (
        <Svg width={23} height={23} viewBox="0 0 24 24">
          <Path {...common} d="M12 3.2c3.1 2.3 5.4 4.3 5.4 7.4v4.9H6.6v-4.9c0-3.1 2.3-5.1 5.4-7.4Z" />
          <Path {...common} d="M4 20.7v-5.2M20 20.7v-5.2M4 20.7h16" />
          <Path {...common} fill={focused ? color : "none"} fillOpacity={focused ? 0.25 : 0} d="M9.8 20.7v-3.1a2.2 2.2 0 0 1 4.4 0v3.1" />
        </Svg>
      );
    case "news": // Newspaper
      return (
        <Svg width={23} height={23} viewBox="0 0 24 24">
          <Path {...common} d="M4 5h13v12.5a2.5 2.5 0 0 0 2.5 2.5H6.5A2.5 2.5 0 0 1 4 17.5V5Z" />
          <Path {...common} d="M17 8.5h3v9a2.5 2.5 0 0 1-2.5 2.5" />
          <Path {...common} strokeWidth={focused ? 2 : 1.7} d="M7.2 9h6.6M7.2 12.2h6.6M7.2 15.4h4" />
        </Svg>
      );
    case "media": // Play
      return (
        <Svg width={23} height={23} viewBox="0 0 24 24">
          <Circle {...common} cx="12" cy="12" r="8.6" />
          <Path d="M10.3 8.9l5 3.1-5 3.1Z" fill={color} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
        </Svg>
      );
    default: // More — grid
      return (
        <Svg width={23} height={23} viewBox="0 0 24 24">
          <Rect {...common} x="4" y="4" width="6.6" height="6.6" rx="2.1" />
          <Rect {...common} x="13.4" y="4" width="6.6" height="6.6" rx="2.1" />
          <Rect {...common} x="4" y="13.4" width="6.6" height="6.6" rx="2.1" />
          <Rect {...common} fill={focused ? color : "none"} fillOpacity={focused ? 0.25 : 0} x="13.4" y="13.4" width="6.6" height="6.6" rx="2.1" />
        </Svg>
      );
  }
}

function Tab({
  routeName,
  label,
  focused,
  onPress,
}: {
  routeName: string;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 90,
    }).start();
  }, [focused, anim]);

  return (
    <Pressable
      onPress={onPress}
      style={s.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={6}
    >
      {/* Gold capsule glides in behind the active tab */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.pill,
          {
            opacity: anim,
            transform: [
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
          ],
        }}
      >
        <Icon name={routeName} color={focused ? GOLD : DIM} focused={focused} />
      </Animated.View>
      <Text style={[s.label, { color: focused ? GOLD : DIM, fontWeight: focused ? "800" : "600" }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === "ios";
  const bottom = Math.max(insets.bottom, 10) + (ios ? 0 : 4);

  return (
    <View pointerEvents="box-none" style={[s.wrap, { paddingBottom: bottom }]}>
      <View style={s.dock}>
        {ios ? (
          <BlurView tint="dark" intensity={55} style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(8,31,21,0.66)" }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0e2f20" }]} />
        )}
        {/* top shine line for depth */}
        <View style={s.shine} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = String(options.title ?? route.name);
          const focused = state.index === index;
          return (
            <Tab
              key={route.key}
              routeName={route.name}
              label={label}
              focused={focused}
              onPress={() => {
                tap();
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name as never);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  dock: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: 14,
    alignSelf: "stretch",
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(244,239,226,0.16)",
    paddingVertical: 9,
    paddingHorizontal: 6,
    // Android elevation; iOS gets its depth from the blur + border
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 18,
    right: 18,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(244,239,226,0.22)",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
    borderRadius: 22,
  },
  pill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 6,
    right: 6,
    borderRadius: 22,
    backgroundColor: "rgba(201,162,39,0.16)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.28)",
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
});
