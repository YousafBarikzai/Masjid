import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Share, ActivityIndicator, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { fetchKhutbahs, recallKhutbah, apiBase } from "../../src/api";
import type { Khutbah } from "../../src/types";
import { Page, Card, Section, Sections, GoldButton, Empty, Reveal, Press, tap } from "../../src/ui";
import { colors, radius, space, type as t } from "../../src/theme";

/* Khutbah detail — the sermon as a small, beautiful reading page:
   the video in the app's own player, the synopsis to READ at your own pace
   or LISTEN to (text-to-speech with play / pause / resume / speed — for the
   drive home), then the key lessons and topics. */

const SPEEDS = [0.8, 1, 1.2, 1.5] as const;

/** 16:9 embedded YouTube player in a rounded glass frame. */
function Player({ uri }: { uri: string }) {
  return (
    <View style={s.player}>
      <WebView
        source={{ uri }}
        style={s.playerWeb}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={s.playerLoading}>
            <ActivityIndicator color={colors.gold} />
          </View>
        )}
      />
    </View>
  );
}

/* ------------------------------ Listen (TTS) ------------------------------ */

/** The synopsis read aloud, paragraph by paragraph. Pause/resume are native
 *  on iOS; Android (no native pause) resumes from the current paragraph. */
function ListenBar({ paragraphs }: { paragraphs: string[] }) {
  const [mode, setMode] = useState<"idle" | "playing" | "paused">("idle");
  const [idx, setIdx] = useState(0);
  const [rate, setRate] = useState<number>(1);

  const session = useRef(0); // bumping it invalidates in-flight onDone callbacks
  const idxRef = useRef(0);
  const rateRef = useRef(1);

  const speakFrom = useCallback(
    (i: number) => {
      const my = ++session.current;
      const step = (j: number) => {
        if (session.current !== my) return;
        if (j >= paragraphs.length) {
          idxRef.current = 0;
          setIdx(0);
          setMode("idle");
          return;
        }
        idxRef.current = j;
        setIdx(j);
        Speech.speak(paragraphs[j], {
          language: "en-GB",
          rate: rateRef.current,
          onDone: () => step(j + 1),
          onStopped: () => {},
          onError: () => step(j + 1),
        });
      };
      step(i);
    },
    [paragraphs],
  );

  function play() {
    tap();
    if (mode === "paused" && Platform.OS === "ios") {
      Speech.resume().catch(() => {});
      setMode("playing");
      return;
    }
    // Fresh start, or Android "resume" — re-speak from the current paragraph.
    Speech.stop().catch(() => {});
    setMode("playing");
    speakFrom(idxRef.current);
  }

  function pause() {
    tap();
    if (Platform.OS === "ios") {
      Speech.pause().catch(() => {});
    } else {
      // Android has no native pause — stop, keep our place.
      session.current++;
      Speech.stop().catch(() => {});
    }
    setMode("paused");
  }

  function stop() {
    tap();
    session.current++;
    Speech.stop().catch(() => {});
    idxRef.current = 0;
    setIdx(0);
    setMode("idle");
  }

  function changeSpeed(r: number) {
    tap();
    rateRef.current = r;
    setRate(r);
    if (mode === "playing") {
      // Restart the current paragraph at the new speed.
      Speech.stop().catch(() => {});
      speakFrom(idxRef.current);
    }
  }

  // Never keep talking after the page is closed.
  useEffect(
    () => () => {
      session.current++;
      Speech.stop().catch(() => {});
    },
    [],
  );

  if (!paragraphs.length) return null;

  const active = mode !== "idle";
  const progress = paragraphs.length ? (active ? idx + 1 : 0) / paragraphs.length : 0;

  return (
    <Card style={s.listen}>
      <View style={s.listenRow}>
        <Press
          scaleTo={0.9}
          onPress={mode === "playing" ? pause : play}
          style={s.listenBtn}
        >
          <Ionicons
            name={mode === "playing" ? "pause" : "play"}
            size={22}
            color={colors.onGold}
            style={mode === "playing" ? undefined : { marginLeft: 2 }}
          />
        </Press>
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <Text style={s.listenTitle}>
            {mode === "idle"
              ? "Listen to this khutbah's synopsis"
              : mode === "paused"
                ? "Paused"
                : `Reading aloud — part ${idx + 1} of ${paragraphs.length}`}
          </Text>
          <View style={s.track}>
            <View style={[s.trackFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
        {active ? (
          <Press scaleTo={0.9} onPress={stop} style={s.stopBtn}>
            <Ionicons name="stop" size={16} color={colors.goldSoft} />
          </Press>
        ) : null}
      </View>

      <View style={s.speeds}>
        <Text style={s.speedsLabel}>Speed</Text>
        {SPEEDS.map((sp) => (
          <Press key={sp} scaleTo={0.92} onPress={() => changeSpeed(sp)}>
            <View style={[s.speedChip, rate === sp && s.speedChipOn]}>
              <Text style={[s.speedText, rate === sp && s.speedTextOn]}>{sp}×</Text>
            </View>
          </Press>
        ))}
        <Text style={s.speedsHint}>Ideal while driving or walking</Text>
      </View>
    </Card>
  );
}

/* --------------------------------- Screen ---------------------------------- */

export default function KhutbahDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [fetched, setFetched] = useState<Khutbah | null>(null);
  const [searching, setSearching] = useState(false);
  const k = recallKhutbah(slug) ?? fetched;

  // Deep link / cold start: the archive hasn't been opened yet, so walk the
  // first few pages until the slug turns up.
  useEffect(() => {
    if (k || !slug) return;
    let active = true;
    (async () => {
      setSearching(true);
      try {
        for (let p = 1; p <= 5 && active; p++) {
          const res = await fetchKhutbahs(p);
          const hit = res.docs.find((d) => d.slug === slug);
          if (hit) {
            if (active) setFetched(hit);
            return;
          }
          if (!res.hasMore) return;
        }
      } catch {
        /* offline with nothing cached */
      } finally {
        if (active) setSearching(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [k, slug]);

  if (!k) {
    return (
      <Page title="Khutbah" back>
        <Card>
          <Empty text={searching ? "Loading…" : "This khutbah couldn't be found."} />
        </Card>
      </Page>
    );
  }

  const paragraphs = [
    k.title,
    ...k.sections.flatMap((sec) => [
      ...(sec.heading ? [sec.heading] : []),
      ...(sec.body ?? []),
      ...(sec.bullets ?? []),
    ]),
  ].filter(Boolean);

  async function share() {
    await Share.share({
      title: k!.title,
      message: `${k!.title}${k!.khatib ? ` — ${k!.khatib}` : ""} (${k!.date})\n\n${k!.excerpt || ""}\n\n${
        k!.watchUrl || `Kingston Mosque · ${apiBase}`
      }`,
    }).catch(() => {});
  }

  return (
    <Page eyebrow={k.date} title={k.title} back>
      {k.khatib ? (
        <Reveal>
          <View style={s.khatib}>
            <View style={s.khatibIcon}>
              <Text style={{ fontSize: 16 }}>🎙️</Text>
            </View>
            <View>
              <Text style={s.khatibLabel}>Delivered by</Text>
              <Text style={s.khatibName}>{k.khatib}</Text>
            </View>
          </View>
        </Reveal>
      ) : null}

      {k.embedUrl ? (
        <Reveal delay={50}>
          <Player uri={k.embedUrl} />
        </Reveal>
      ) : null}

      {k.sections.length ? (
        <>
          <Section title="Synopsis" />
          <Reveal delay={90}>
            <ListenBar paragraphs={paragraphs} />
          </Reveal>
          <Reveal delay={120}>
            <Card style={{ gap: space.md }}>
              <Sections sections={k.sections} />
            </Card>
          </Reveal>
        </>
      ) : null}

      {k.lessons.length ? (
        <>
          <Section title="Key lessons" />
          <Reveal delay={140}>
            <Card style={{ gap: 12 }}>
              {k.lessons.map((l, i) => (
                <View key={i} style={s.lessonRow}>
                  <View style={s.lessonNum}>
                    <Text style={s.lessonNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.lessonText}>{l}</Text>
                </View>
              ))}
            </Card>
          </Reveal>
        </>
      ) : null}

      {k.tags.length ? (
        <View style={s.tags}>
          {k.tags.map((tag) => (
            <View key={tag} style={s.tag}>
              <Text style={s.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Reveal delay={170}>
        <GoldButton compact label="Share this khutbah" onPress={share} />
      </Reveal>
    </Page>
  );
}

const s = StyleSheet.create({
  khatib: { flexDirection: "row", alignItems: "center", gap: 10 },
  khatibIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(201,162,39,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  khatibLabel: { color: colors.textFaint, fontSize: t.tiny, fontWeight: "700" },
  khatibName: { color: colors.text, fontSize: t.body, fontWeight: "800" },

  player: {
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "#000",
  },
  playerWeb: { flex: 1, backgroundColor: "#000" },
  playerLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },

  listen: { gap: space.md },
  listenRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  listenBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  stopBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
  },
  listenTitle: { color: colors.text, fontSize: t.small, fontWeight: "700" },
  track: { height: 4, borderRadius: 2, backgroundColor: "rgba(244,239,226,0.12)", overflow: "hidden" },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: colors.gold },

  speeds: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  speedsLabel: { color: colors.textFaint, fontSize: t.tiny, fontWeight: "800", letterSpacing: 0.6 },
  speedChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  speedChipOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  speedText: { color: colors.textDim, fontSize: t.tiny, fontWeight: "800" },
  speedTextOn: { color: colors.onGold },
  speedsHint: { color: colors.textFaint, fontSize: t.tiny, marginLeft: "auto" },

  lessonRow: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  lessonNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(201,162,39,0.16)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  lessonNumText: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "800" },
  lessonText: { color: colors.textDim, fontSize: t.body, lineHeight: 23, flex: 1 },

  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tagText: { color: colors.goldSoft, fontSize: t.tiny, fontWeight: "700" },
});
