import type { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, radius, space, type as t, aurora, shadowCard } from "./theme";

/* Shared UI kit — every screen composes these so the whole app feels like one
   product: aurora headers, glass cards, gold pills, quiet dividers. */

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Screen scaffold: aurora gradient header + scrollable dark body.
 *  Pass `back` to show a native back chevron (for pushed detail screens). */
export function Page({
  title,
  subtitle,
  eyebrow,
  headerExtra,
  children,
  offline,
  refreshing,
  onRefresh,
  back,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  headerExtra?: ReactNode;
  children: ReactNode;
  offline?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  back?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={s.root}>
      <LinearGradient colors={[...aurora]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <View style={[s.header, { paddingTop: insets.top + 14 }]}>
          {back ? (
            <Pressable
              onPress={() => {
                tap();
                router.back();
              }}
              hitSlop={12}
              style={({ pressed }) => [s.back, pressed && { opacity: 0.6 }]}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.goldSoft} />
              <Text style={s.backText}>Back</Text>
            </Pressable>
          ) : null}
          {eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}
          <Text style={s.headerTitle}>{title}</Text>
          {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
          {offline ? (
            <View style={s.offline}>
              <View style={s.offlineDot} />
              <Text style={s.offlineText}>Offline — showing saved copy</Text>
            </View>
          ) : null}
          {headerExtra}
        </View>
      </LinearGradient>
      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={colors.goldSoft}
              colors={[colors.gold]}
            />
          ) : undefined
        }
      >
        {children}
        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
}

/** Renders the uniform { heading?, body?[], bullets?[] } section shape used by
 *  every native service, information and article screen. */
export function Sections({ sections }: { sections: { heading?: string; body?: string[]; bullets?: string[] }[] }) {
  return (
    <View style={{ gap: space.md }}>
      {sections.map((sec, i) => (
        <View key={i} style={{ gap: 8 }}>
          {sec.heading ? <Text style={s.secHeading}>{sec.heading}</Text> : null}
          {sec.body?.map((p, j) => (
            <Text key={`b${j}`} style={s.secBody}>
              {p}
            </Text>
          ))}
          {sec.bullets?.length ? (
            <View style={{ gap: 7, marginTop: 2 }}>
              {sec.bullets.map((b, j) => (
                <View key={`l${j}`} style={s.bulletRow}>
                  <View style={s.bulletDot} />
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Glass card with soft elevation. */
export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** Section heading with optional trailing action. */
export function Section({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable
          onPress={() => {
            tap();
            onAction();
          }}
          hitSlop={10}
        >
          <Text style={s.sectionAction}>{action} →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Gold pill button. */
export function GoldButton({
  label,
  onPress,
  compact,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [s.goldBtn, compact && s.goldBtnCompact, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <Text style={[s.goldBtnText, compact && { fontSize: t.small }]}>{label}</Text>
    </Pressable>
  );
}

/** Tappable list row: icon bubble, title/sub, chevron. */
export function ListRow({
  icon,
  title,
  sub,
  onPress,
  right,
}: {
  icon: string;
  title: string;
  sub?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const content = (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {sub ? (
          <Text style={s.rowSub} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Text style={s.rowChev}>›</Text> : null)}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => pressed && { opacity: 0.75 }}
    >
      {content}
    </Pressable>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space.xl, paddingBottom: space.xl },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 10, marginLeft: -4 },
  backText: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700" },
  eyebrow: {
    color: colors.goldSoft,
    fontSize: t.tiny,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: { color: colors.text, fontSize: t.h1, fontWeight: "800", letterSpacing: -0.4 },
  headerSub: { color: colors.textDim, fontSize: t.small, marginTop: 4 },
  offline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(224,83,61,0.16)",
    borderColor: "rgba(224,83,61,0.4)",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  offlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  offlineText: { color: colors.text, fontSize: t.tiny, fontWeight: "600" },
  body: { flex: 1 },
  bodyContent: { padding: space.lg, gap: space.md },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadowCard,
  },
  section: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: space.md,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: { color: colors.text, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.3 },
  sectionAction: { color: colors.goldSoft, fontSize: t.small, fontWeight: "700" },
  goldBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  goldBtnCompact: { paddingVertical: 9, paddingHorizontal: 16 },
  goldBtnText: { color: colors.onGold, fontWeight: "800", fontSize: t.body },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(201,162,39,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: colors.text, fontSize: t.body, fontWeight: "700" },
  rowSub: { color: colors.textFaint, fontSize: t.small, marginTop: 1 },
  rowChev: { color: colors.textFaint, fontSize: 22, fontWeight: "300" },
  divider: { height: 1, backgroundColor: colors.line },
  empty: { padding: space.xl, alignItems: "center" },
  emptyText: { color: colors.textFaint, fontSize: t.small, textAlign: "center" },
  secHeading: { color: colors.goldSoft, fontSize: t.h2, fontWeight: "800", letterSpacing: -0.2 },
  secBody: { color: colors.textDim, fontSize: t.body, lineHeight: 24 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold, marginTop: 9 },
  bulletText: { color: colors.textDim, fontSize: t.body, lineHeight: 23, flex: 1 },
});
