import AsyncStorage from "@react-native-async-storage/async-storage";

/* Small typed wrapper over AsyncStorage for user preferences. */

const TOPICS_KEY = "kma-topics";
const TASBIH_KEY = "kma-tasbih";

export const ALL_TOPICS = ["news", "events", "prayer"] as const;
export type Topic = (typeof ALL_TOPICS)[number];

export async function getTopics(): Promise<Topic[]> {
  try {
    const raw = await AsyncStorage.getItem(TOPICS_KEY);
    if (!raw) return ["news", "events"];
    const arr = JSON.parse(raw) as string[];
    return ALL_TOPICS.filter((t) => arr.includes(t));
  } catch {
    return ["news", "events"];
  }
}

export async function setTopics(topics: Topic[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  } catch {
    /* ignore */
  }
}

/* Tasbīḥ: each dhikr keeps its own running count, and the last-selected
   dhikr is remembered so the screen opens where the user left off. */
export interface TasbihPrefs {
  sel: string;
  counts: Record<string, number>;
}

export async function getTasbihPrefs(): Promise<TasbihPrefs> {
  try {
    const raw = await AsyncStorage.getItem(TASBIH_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<TasbihPrefs>;
      if (p && typeof p.sel === "string" && p.counts && typeof p.counts === "object") {
        return { sel: p.sel, counts: p.counts as Record<string, number> };
      }
    }
  } catch {
    /* ignore */
  }
  return { sel: "tasbih", counts: {} };
}

export async function setTasbihPrefs(prefs: TasbihPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(TASBIH_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
