"use client";

import { useCallback, useEffect, useState } from "react";

export interface Favourite {
  title: string;
  href: string;
}

const KEY = "kma:fav";
const MAX = 12;

function read(): Favourite[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((f) => f && f.href && f.title).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** localStorage-backed pinned admin links. Per-browser, no server model needed.
 *  All storage access is client-only and guarded so it never throws. */
export function useFavourites() {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavourites(read());
    setMounted(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setFavourites(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: Favourite[]) => {
    setFavourites(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next.slice(0, MAX)));
    } catch {
      /* storage full / blocked — keep in-memory state */
    }
  }, []);

  const isFav = useCallback(
    (href: string) => favourites.some((f) => f.href === href),
    [favourites],
  );

  const toggle = useCallback(
    (item: Favourite) => {
      const exists = favourites.some((f) => f.href === item.href);
      persist(
        exists
          ? favourites.filter((f) => f.href !== item.href)
          : [...favourites, item].slice(0, MAX),
      );
    },
    [favourites, persist],
  );

  return { favourites, isFav, toggle, mounted };
}
