/* Service worker for the mosque display screens. Scope: /display.
   Network-first so the board updates within ~60s when online, with a cache
   fallback so a Wi-Fi blip or power-cycle never leaves a blank screen. */
const CACHE = "kma-display-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.add("/display"))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isDisplay = url.pathname === "/display";
  const isSnapshot = url.pathname === "/app-api/snapshot";
  if (!isDisplay && !isSnapshot) return;

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("/display");
          if (fallback) return fallback;
        }
        throw new Error("offline and uncached");
      }
    })(),
  );
});
