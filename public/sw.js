/* Service worker for the public site (PWA). Makes the site installable and
   keeps prayer times / pages available offline. Never touches the admin, the
   Payload API or the app feed — those always need live data. */
const CACHE = "kma-site-v1";
const PRECACHE = ["/", "/prayer-times", "/offline.html"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
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
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Leave dynamic/authved surfaces untouched.
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/app-api")
  ) {
    return;
  }

  // Page navigations: network-first so content is fresh, cache as fallback,
  // and an offline page as the last resort.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match("/")) ||
            (await caches.match("/offline.html")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Static assets: cache-first for instant loads.
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons") ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
  }
});
