import type { Router } from "expo-router";
import { openInApp } from "./actions";

/** Diacritic-stripping slugify — MUST match the server's (app-api/content),
 *  so "Tarāwīḥ Prayers" → "tarawih-prayers" on both sides. */
export function slugify(s: string): string {
  let out = s.toLowerCase();
  try {
    out = out.normalize("NFD").replace(/[̀-ͯ]/g, "");
  } catch {
    /* very old runtimes: fall through */
  }
  return out.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* Routes any CMS link, quick-action or content href to the right NATIVE screen.
   Known mosque destinations open as native screens; a genuinely external link
   (a full http(s) URL that isn't our own site) opens in the in-app browser
   sheet, which still presents over the app rather than leaving it. */

const NATIVE: { test: RegExp; to: (m: RegExpMatchArray) => string }[] = [
  { test: /^\/?(donate|give|giving)\/?$/i, to: () => "/donate" },
  { test: /^\/?(jumu?[aʿ']?ah|jummah|friday)\/?$/i, to: () => "/jummah" },
  { test: /^\/?qibla\/?$/i, to: () => "/qibla" },
  { test: /^\/?(prayer-times|prayer-timetable|timetable|prayers)\/?$/i, to: () => "/prayers" },
  { test: /^\/?(education|madrasah|classes|learn)\/?$/i, to: () => "/service/madrasah" },
  { test: /^\/?services\/?$/i, to: () => "/services" },
  { test: /^\/?service[s]?\/([\w-]+)\/?$/i, to: (m) => `/service/${m[1]}` },
  { test: /^\/?events?\/([\w-]+)\/?$/i, to: (m) => `/event/${m[1]}` },
  { test: /^\/?news\/([\w-]+)\/?$/i, to: (m) => `/article/${m[1]}` },
  { test: /^\/?(news|posts)\/?$/i, to: () => "/news" },
  { test: /^\/?(live|broadcast|watch|stream)\/?$/i, to: () => "/live" },
  { test: /^\/?khutbahs?\/?$/i, to: () => "/khutbahs" },
  { test: /^\/?(tasbih|tasbeeh|dhikr)\/?$/i, to: () => "/tasbih" },
  { test: /^\/?khutbahs?\/([\w-]+)\/?$/i, to: (m) => `/khutbah/${m[1]}` },
  { test: /^\/?(mosques|nearby-mosques|find-a-mosque|nearby)\/?$/i, to: () => "/mosques" },
  { test: /^\/?media\/?$/i, to: () => "/media" },
  { test: /^\/?(more|settings|about)\/?$/i, to: () => "/more" },
  { test: /^\/?(home|)\/?$/i, to: () => "/" },
];

/** True for a full URL that points somewhere other than our own site. */
function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url) && !/masjid-production\.up\.railway\.app|kingstonmosque|vnetechsolutions/i.test(url);
}

export function goTo(router: Router, urlOrPath: string): void {
  const raw = (urlOrPath || "").trim();
  if (!raw) return;

  // External payment / third-party link → in-app browser sheet.
  if (isExternal(raw)) return openInApp(raw);

  // Reduce a full own-site URL to its path so it can match a native route.
  const path = raw.replace(/^https?:\/\/[^/]+/i, "") || "/";

  for (const rule of NATIVE) {
    const m = path.match(rule.test);
    if (m) return router.push(rule.to(m) as never);
  }

  // Unknown own-site page: present it in the in-app browser sheet as a fallback
  // so the user still never leaves the app.
  openInApp(path);
}
