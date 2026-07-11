import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchContent } from "./api";
import type { ContentFeed } from "./types";

const CACHE_KEY = "kma-content";

/**
 * Loads the native content feed (services, articles, donation, jummah, contact)
 * once and caches it on-device, so every detail screen opens instantly and
 * keeps working offline. Refreshes quietly in the background on mount.
 */
export function useContent() {
  const [content, setContent] = useState<ContentFeed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((cached) => {
        if (active && cached) {
          try {
            setContent(JSON.parse(cached) as ContentFeed);
          } catch {
            /* ignore corrupt cache */
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchContent()
          .then((fresh) => {
            if (!active) return;
            setContent(fresh);
            AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
          })
          .catch(() => {})
          .finally(() => {
            if (active) setLoading(false);
          });
      });
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
}
