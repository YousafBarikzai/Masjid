import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchContent, rememberArticles } from "./api";
import type { ContentFeed } from "./types";

const CACHE_KEY = "kma-content";

/**
 * Loads the native content feed (services, articles, events, donation, jummah,
 * contact) once and caches it on-device, so every detail screen opens instantly
 * and keeps working offline. Refreshes quietly in the background on mount, and
 * exposes refresh() for pull-to-refresh — a fresh fetch replaces the cache, so
 * edited content updates and unpublished content disappears.
 */
export function useContent() {
  const [content, setContent] = useState<ContentFeed | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchContent();
      setContent(fresh);
      rememberArticles(fresh.articles);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
    } catch {
      /* offline: keep the cached copy */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((cached) => {
        if (active && cached) {
          try {
            const feed = JSON.parse(cached) as ContentFeed;
            setContent(feed);
            rememberArticles(feed.articles);
          } catch {
            /* ignore corrupt cache */
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) refresh();
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  return { content, loading, refresh };
}
