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

export interface TasbihState {
  idx: number;
  count: number;
  rounds: number;
}

export async function getTasbih(): Promise<TasbihState> {
  try {
    const raw = await AsyncStorage.getItem(TASBIH_KEY);
    if (raw) return JSON.parse(raw) as TasbihState;
  } catch {
    /* ignore */
  }
  return { idx: 0, count: 0, rounds: 0 };
}

export async function setTasbih(state: TasbihState): Promise<void> {
  try {
    await AsyncStorage.setItem(TASBIH_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
