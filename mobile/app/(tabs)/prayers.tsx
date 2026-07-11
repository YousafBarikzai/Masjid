import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActionSheetIOS, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSnapshot } from "../../src/useSnapshot";
import { fetchMonth } from "../../src/api";
import type { MonthGrid } from "../../src/types";
import { Page, Card, GoldButton, tap, Empty } from "../../src/ui";
import { colors, radius, space, type as t } from "../../src/theme";
import { shareTimetablePdf, printTimetable, emailTimetablePdf } from "../../src/pdf";

/* Prayers — today at a glance plus the FULL monthly timetable (begins + iqāmah
   per salah), with share + PDF download. Months are cached on-device so the
   timetable works offline. */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export default function Prayers() {
  const { data, offline, refresh } = useSnapshot();
  const now = new Date();
  const [month, setMonth] = useState(monthKey(now.getFullYear(), now.getMonth() + 1));
  const [grid, setGrid] = useState<MonthGrid | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    // Cached copy first (offline support), then refresh from the CMS.
    try {
      const cached = await AsyncStorage.getItem(`kma-month-${m}`);
      if (cached) setGrid(JSON.parse(cached) as MonthGrid);
    } catch {
      /* ignore */
    }
    try {
      const fresh = await fetchMonth(m);
      // The API snaps to the timetable's year if we asked for a different one.
      if (fresh.days.length === 0 && fresh.year && !m.startsWith(String(fresh.year))) {
        const snapped = `${fresh.year}-${m.slice(5)}`;
        setMonth(snapped);
        return;
      }
      setGrid(fresh);
      AsyncStorage.setItem(`kma-month-${m}`, JSON.stringify(fresh)).catch(() => {});
    } catch {
      /* keep cached */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const year = grid?.year ?? now.getFullYear();
  const todayISO = data?.date.iso;

  // All three PDF actions build the same branded PDF on-device from `grid`.
  async function doShare() {
    if (!grid) return;
    try {
      await shareTimetablePdf(grid);
    } catch {
      Alert.alert("Couldn't create the PDF", "Please try again in a moment.");
    }
  }
  async function doPrint() {
    if (!grid) return;
    try {
      await printTimetable(grid);
    } catch {
      /* user cancelled */
    }
  }
  async function doEmail() {
    if (!grid) return;
    try {
      const ok = await emailTimetablePdf(grid);
      if (!ok) {
        Alert.alert(
          "No email set up",
          "Add an email account in your device settings, or use “Share PDF” and pick Mail.",
        );
      }
    } catch {
      Alert.alert("Couldn't create the PDF", "Please try again in a moment.");
    }
  }

  // A single "PDF" button opens the native options: save/print, share, email.
  function openPdfMenu() {
    tap();
    if (!grid) return;
    const options = ["Save / Print PDF", "Share PDF", "Email me the PDF", "Cancel"];
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 3, title: "Prayer timetable PDF" },
        (i) => {
          if (i === 0) doPrint();
          else if (i === 1) doShare();
          else if (i === 2) doEmail();
        },
      );
    } else {
      Alert.alert("Prayer timetable PDF", undefined, [
        { text: "Save / Print PDF", onPress: doPrint },
        { text: "Share PDF", onPress: doShare },
        { text: "Email me the PDF", onPress: doEmail },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  return (
    <Page
      eyebrow="Prayer times"
      title="Timetable"
      subtitle={data?.date.gregorian}
      offline={offline}
      onRefresh={() => {
        refresh();
        load(month);
      }}
    >
      {/* Today */}
      {data ? (
        <Card style={{ gap: 2 }}>
          <Text style={s.todayLabel}>TODAY · {data.date.hijri}</Text>
          <View style={s.headRow}>
            <Text style={[s.hCell, { flex: 1.2, textAlign: "left" }]}>Prayer</Text>
            <Text style={s.hCell}>Begins</Text>
            <Text style={s.hCell}>Iqāmah</Text>
          </View>
          {data.prayers.map((p) => {
            const isNext = !data.nextPrayer.tomorrow && p.en === data.nextPrayer.name;
            return (
              <View key={p.key} style={[s.tRow, isNext && s.tRowNext, p.isInfo && { opacity: 0.55 }]}>
                <View style={{ flex: 1.2, flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <Text style={[s.tName, isNext && { color: colors.onGold }]}>{p.en}</Text>
                  <Text style={[s.tAr, isNext && { color: "rgba(12,51,34,0.65)" }]}>{p.ar}</Text>
                </View>
                <Text style={[s.tCell, isNext && { color: colors.onGold }]}>{p.begins}</Text>
                <Text style={[s.tCell, s.tCellBold, isNext && { color: colors.onGold }]}>
                  {p.jamaah ?? "—"}
                </Text>
              </View>
            );
          })}
        </Card>
      ) : (
        <Card>
          <Empty text="Loading today's times…" />
        </Card>
      )}

      {/* Actions — the timetable PDF is generated inside the app */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <GoldButton compact label="⬇︎  Get PDF" onPress={openPdfMenu} />
        </View>
        <Pressable
          style={({ pressed }) => [s.outlineBtn, pressed && { opacity: 0.8 }]}
          onPress={doEmail}
        >
          <Text style={s.outlineBtnText}>Email me the PDF</Text>
        </Pressable>
      </View>

      {/* Month picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {MONTHS.map((m, i) => {
          const key = monthKey(year, i + 1);
          const active = key === month;
          return (
            <Pressable
              key={m}
              onPress={() => {
                tap();
                setMonth(key);
              }}
              style={[s.monthChip, active && s.monthChipActive]}
            >
              <Text style={[s.monthChipText, active && { color: colors.onGold }]}>{m}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Month grid */}
      <Card style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
        <View style={[s.gRow, s.gHead]}>
          <Text style={[s.gDay, s.gHeadText]}>{MONTHS[parseInt(month.slice(5), 10) - 1]}</Text>
          {["Fajr", "Dhuhr", "ʿAsr", "Magh.", "ʿIshā"].map((h) => (
            <Text key={h} style={[s.gCell, s.gHeadText]}>
              {h}
            </Text>
          ))}
        </View>
        {loading && !grid ? (
          <Empty text="Loading month…" />
        ) : (
          (grid?.days ?? []).map((d) => {
            const isFri = d.weekday.startsWith("Fri");
            const isToday = d.date === todayISO;
            return (
              <View key={d.date} style={[s.gRow, isFri && s.gFri, isToday && s.gToday]}>
                <Text style={[s.gDay, isToday && { color: colors.goldHot }]}>
                  {parseInt(d.date.slice(8), 10)} {d.weekday.slice(0, 2)}
                </Text>
                <Text style={s.gCell}>{d.fajrJamaah}</Text>
                <Text style={s.gCell}>{d.dhuhrJamaah}</Text>
                <Text style={s.gCell}>{d.asrJamaah}</Text>
                <Text style={s.gCell}>{d.maghrib}</Text>
                <Text style={s.gCell}>{d.ishaJamaah}</Text>
              </View>
            );
          })
        )}
        <Text style={s.gNote}>Jamāʿah (iqāmah) times shown · Maghrib is at sunset</Text>
      </Card>
    </Page>
  );
}

const s = StyleSheet.create({
  todayLabel: {
    color: colors.goldSoft,
    fontSize: t.tiny,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  headRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.line },
  hCell: {
    flex: 1,
    textAlign: "right",
    color: colors.textFaint,
    fontSize: t.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: radius.sm,
  },
  tRowNext: { backgroundColor: colors.gold },
  tName: { color: colors.text, fontWeight: "700", fontSize: t.body },
  tAr: { color: colors.textFaint, fontSize: t.small },
  tCell: { flex: 1, textAlign: "right", color: colors.textDim, fontSize: t.body, fontVariant: ["tabular-nums"] },
  tCellBold: { color: colors.text, fontWeight: "800" },
  outlineBtn: {
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { color: colors.goldSoft, fontWeight: "800", fontSize: t.small },
  monthChip: {
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  monthChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  monthChipText: { color: colors.textDim, fontWeight: "800", fontSize: t.small },
  gRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  gHead: { borderBottomWidth: 1, borderColor: colors.line, marginBottom: 2 },
  gHeadText: { color: colors.textFaint, fontWeight: "800", fontSize: t.tiny, textTransform: "uppercase", letterSpacing: 0.5 },
  gFri: { backgroundColor: "rgba(201,162,39,0.10)" },
  gToday: { backgroundColor: "rgba(62,207,142,0.12)" },
  gDay: { width: 52, color: colors.textDim, fontSize: t.small, fontWeight: "700" },
  gCell: { flex: 1, textAlign: "center", color: colors.text, fontSize: t.small, fontVariant: ["tabular-nums"] },
  gNote: { color: colors.textFaint, fontSize: t.tiny, textAlign: "center", paddingVertical: 8 },
});
