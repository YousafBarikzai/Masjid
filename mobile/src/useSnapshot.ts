import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchSnapshot } from "./api";
import type { Snapshot } from "./types";

const CACHE_KEY = "kma-snapshot";
const POLL_MS = 60_000;

/**
 * Loads the snapshot feed, caches it on-device, and refreshes every 60s. Keeps
 * the last good copy on failure so the app stays useful offline.
 */
export function useSnapshot() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasData = useRef(false);

  const load = useCallback(async () => {
    try {
      const fresh = await fetchSnapshot();
      hasData.current = true;
      setData(fresh);
      setOffline(false);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Show cached data instantly while the first fetch runs.
    AsyncStorage.getItem(CACHE_KEY)
      .then((cached) => {
        if (active && cached && !hasData.current) {
          try {
            setData(JSON.parse(cached) as Snapshot);
          } catch {
            /* ignore corrupt cache */
          }
        }
      })
      .catch(() => {});

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [load]);

  return { data, offline, loading, refresh: load };
}
