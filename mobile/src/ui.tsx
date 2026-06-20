import type { ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "./theme";

/** Page scaffold: green header with title, then a scrollable cream body. */
export function Page({
  title,
  subtitle,
  children,
  offline,
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  offline?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
        {offline ? <Text style={styles.offline}>Offline — showing saved info</Text> : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.green2} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.green, paddingHorizontal: 20, paddingBottom: 18 },
  headerTitle: { color: colors.goldSoft, fontSize: 26, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.82)", fontSize: 14, marginTop: 4 },
  offline: { color: "#f3c1b6", fontSize: 12, marginTop: 6 },
  body: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.green, marginTop: 8, marginBottom: 2 },
  empty: { color: colors.muted, fontStyle: "italic", paddingVertical: 8 },
});
