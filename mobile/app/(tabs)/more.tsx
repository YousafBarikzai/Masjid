import { Fragment, useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable, Switch, Linking, Share } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { useSnapshot } from "../../src/useSnapshot";
import { apiBase, absUrl } from "../../src/api";
import { Page, Card, Section, ListRow, Divider, GoldButton, tap } from "../../src/ui";
import { colors, radius, space, type as t } from "../../src/theme";
import { ALL_TOPICS, getTopics, setTopics, getTasbih, setTasbih, type Topic, type TasbihState } from "../../src/prefs";
import { registerForPush } from "../../src/push";

/* More — notifications, digital tasbīḥ, giving, services & contact. */

const TOPIC_META: Record<Topic, { icon: string; title: string; sub: string }> = {
  news: { icon: "📰", title: "News & announcements", sub: "Community notices from the mosque" },
  events: { icon: "📅", title: "Events & programmes", sub: "Talks, classes and gatherings" },
  prayer: { icon: "🕌", title: "Prayer reminders", sub: "A nudge shortly before jamāʿah" },
};

const DHIKR = [
  { ar: "سُبْحَانَ الله", en: "SubḥānAllāh" },
  { ar: "الْحَمْدُ لِلَّه", en: "Alḥamdulillāh" },
  { ar: "اللَّهُ أَكْبَر", en: "Allāhu Akbar" },
];

function openLink(url: string) {
  WebBrowser.openBrowserAsync(absUrl(url)).catch(() => {});
}

/* ------------------------------ Notifications ----------------------------- */

function NotificationPrefs() {
  const [chosen, setChosen] = useState<Topic[] | null>(null);

  useEffect(() => {
    getTopics().then(setChosen);
  }, []);

  async function toggle(topic: Topic) {
    if (!chosen) return;
    tap();
    const next = chosen.includes(topic) ? chosen.filter((x) => x !== topic) : [...chosen, topic];
    setChosen(next);
    await setTopics(next);
    // Re-register so the server knows this device's new topic choices.
    registerForPush(next).catch(() => {});
  }

  return (
    <Card style={{ paddingVertical: 4 }}>
      {ALL_TOPICS.map((topic, i) => (
        <Fragment key={topic}>
          <ListRow
            icon={TOPIC_META[topic].icon}
            title={TOPIC_META[topic].title}
            sub={TOPIC_META[topic].sub}
            right={
              <Switch
                value={!!chosen?.includes(topic)}
                onValueChange={() => toggle(topic)}
                trackColor={{ false: "rgba(244,239,226,0.18)", true: colors.gold }}
                thumbColor={colors.text}
                ios_backgroundColor="rgba(244,239,226,0.18)"
              />
            }
          />
          {i < ALL_TOPICS.length - 1 ? <Divider /> : null}
        </Fragment>
      ))}
    </Card>
  );
}

/* --------------------------------- Tasbīḥ --------------------------------- */

function Tasbih() {
  const [st, setSt] = useState<TasbihState>({ idx: 0, count: 0, rounds: 0 });

  useEffect(() => {
    getTasbih().then(setSt);
  }, []);

  function save(next: TasbihState) {
    setSt(next);
    setTasbih(next).catch(() => {});
  }

  function press() {
    const count = st.count + 1;
    if (count >= 33) {
      // Round complete — heavier pulse, move to the next phrase.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      save({ idx: (st.idx + 1) % DHIKR.length, count: 0, rounds: st.rounds + 1 });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      save({ ...st, count });
    }
  }

  function reset() {
    tap();
    save({ idx: 0, count: 0, rounds: 0 });
  }

  const d = DHIKR[st.idx % DHIKR.length];

  return (
    <Card style={s.tasbihCard}>
      <Text style={s.tasbihAr}>{d.ar}</Text>
      <Text style={s.tasbihEn}>{d.en}</Text>
      <Pressable
        onPress={press}
        style={({ pressed }) => [s.tasbihBtn, pressed && { transform: [{ scale: 0.96 }] }]}
        accessibilityLabel="Count dhikr"
      >
        <Text style={s.tasbihCount}>{st.count}</Text>
        <Text style={s.tasbihOf}>of 33</Text>
      </Pressable>
      <View style={s.tasbihFoot}>
        <Text style={s.tasbihRounds}>
          {st.rounds} round{st.rounds === 1 ? "" : "s"} completed
        </Text>
        <Pressable onPress={reset} hitSlop={10}>
          <Text style={s.tasbihReset}>Reset</Text>
        </Pressable>
      </View>
    </Card>
  );
}

/* ---------------------------------- Screen --------------------------------- */

export default function More() {
  const { data, offline, refresh } = useSnapshot();
  const c = data?.contact;
  const donateUrl = data?.app?.donateUrl;

  async function shareApp() {
    tap();
    try {
      await Share.share({
        message: `Kingston Mosque — prayer times, news & events: ${apiBase}`,
      });
    } catch {
      /* cancelled */
    }
  }

  return (
    <Page eyebrow="Settings & tools" title="More" offline={offline} onRefresh={refresh}>
      <Section title="Notifications" />
      <NotificationPrefs />

      <Section title="Tasbīḥ counter" />
      <Tasbih />

      {donateUrl ? (
        <>
          <Section title="Support your masjid" />
          <Card style={{ gap: space.md }}>
            <Text style={s.giveText}>
              Every donation keeps the mosque open, warm and serving the community — and is an ongoing
              charity (ṣadaqah jāriyah) for you.
            </Text>
            <GoldButton label="💛  Donate now" onPress={() => openLink(donateUrl)} />
          </Card>
        </>
      ) : null}

      <Section title="Services" />
      <Card style={{ paddingVertical: 4 }}>
        {(data?.services ?? []).map((sv, i, arr) => (
          <Fragment key={`${sv.title}-${i}`}>
            <ListRow icon={sv.icon || "🕌"} title={sv.title} sub={sv.body} onPress={() => openLink(sv.href)} />
            {i < arr.length - 1 ? <Divider /> : null}
          </Fragment>
        ))}
        {(data?.classes ?? []).length && (data?.services ?? []).length ? <Divider /> : null}
        {(data?.classes ?? []).map((cl, i, arr) => (
          <Fragment key={`${cl.title}-${i}`}>
            <ListRow icon={cl.icon || "📖"} title={cl.title} sub={cl.body} onPress={() => openLink(cl.href)} />
            {i < arr.length - 1 ? <Divider /> : null}
          </Fragment>
        ))}
      </Card>

      {c ? (
        <>
          <Section title="Contact" />
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="📞" title="Call the mosque" sub={c.phone} onPress={() => Linking.openURL(c.phoneHref)} />
            <Divider />
            <ListRow icon="✉️" title="Email" sub={c.email} onPress={() => Linking.openURL(`mailto:${c.email}`)} />
            <Divider />
            <ListRow
              icon="📍"
              title="Directions"
              sub={`${c.address.line1}, ${c.address.city} ${c.address.postcode}`}
              onPress={() =>
                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(c.mapsQuery)}`)
              }
            />
          </Card>
        </>
      ) : null}

      <Section title="About" />
      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="🌐" title="Visit the website" sub={apiBase.replace(/^https?:\/\//, "")} onPress={() => openLink("/")} />
        <Divider />
        <ListRow icon="📤" title="Share this app" sub="Invite family & friends" onPress={shareApp} />
      </Card>
    </Page>
  );
}

const s = StyleSheet.create({
  giveText: { color: colors.textDim, fontSize: t.body, lineHeight: 22 },
  tasbihCard: { alignItems: "center", paddingVertical: space.xl },
  tasbihAr: { color: colors.goldSoft, fontSize: 30, fontWeight: "600" },
  tasbihEn: { color: colors.textDim, fontSize: t.small, marginTop: 4, marginBottom: space.lg },
  tasbihBtn: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  tasbihCount: { color: colors.text, fontSize: 44, fontWeight: "800", letterSpacing: -1 },
  tasbihOf: { color: colors.textFaint, fontSize: t.tiny, marginTop: -2 },
  tasbihFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    marginTop: space.lg,
  },
  tasbihRounds: { color: colors.textDim, fontSize: t.small },
  tasbihReset: {
    color: colors.goldSoft,
    fontSize: t.small,
    fontWeight: "700",
  },
});
