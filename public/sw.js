/* Service worker for the public site (PWA). Makes the site installable and
   keeps prayer times / pages available offline. Never touches the admin, the
   Payload API or the app feed — those always need live data. */
const CACHE = "kma-site-v2";
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

/* ── Web Push ────────────────────────────────────────────────────────────────
   Show a notification when the server pushes one, and focus/open the relevant
   page when it's tapped. Payload: { title, body, data: { url?, type?, id? } }. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Kingston Mosque", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Kingston Mosque";
  const data = payload.data || {};
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.type ? `kma-${data.type}` : "kma",
    renotify: true,
    data,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let target = "/";
  if (data.url) target = data.url;
  else if (data.type === "announcement") target = "/";
  else if (data.type === "event") target = "/events";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});
