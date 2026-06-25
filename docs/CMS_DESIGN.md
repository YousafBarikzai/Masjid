# Kingston Mosque — World‑Class CMS: Design & Architecture

> The mosque's website should be run **entirely from one admin portal**, by people
> who have never seen a line of code, and every change should appear on the live
> site within seconds. This document is the blueprint for that CMS: the design
> philosophy, the architecture decision behind it, a first‑class Arabic / Qur'anic
> typography strategy, the security model, and an honest phased roadmap of what is
> built today versus what comes next.

---

## 1. Vision & non‑negotiables

The brief was deliberately ambitious, and rightly so. Three principles govern every
decision below:

1. **It must feel like a premium product, not an admin panel.** Generous spacing,
   considered typography, brand colour, fast keyboard‑driven workflows, sensible
   defaults, and zero dead ends. A volunteer should be able to publish a notice on
   their phone in under a minute.
2. **Arabic and Qur'anic text are first‑class, not bolted on.** Right‑to‑left, mixed
   English/Arabic in one paragraph, full Unicode, ligatures and diacritics (ḥarakāt),
   and beautiful Qur'anic rendering — both in the editor and on the live site.
3. **Almost everything is editable without code.** Pages, navigation, news, events,
   services, prayer times, donations, broadcasts, contact details — all driven from
   the CMS, all live the moment they're saved.

---

## 2. The architecture decision (and why)

There are two ways to build "a world‑class CMS":

- **(A) Build a bespoke admin** from scratch — total control over every pixel, but
  also total responsibility for auth, permissions, validation, file uploads,
  versioning, audit, REST/GraphQL APIs, and years of edge cases. Months of work
  before the first notice is published, and a permanent maintenance burden.
- **(B) Stand on an enterprise CMS engine and make it ours** — take a mature,
  open‑source, self‑hosted headless CMS that already solves auth, RBAC, uploads,
  versioning, drafts, localisation and a typed API, then invest the effort where it
  actually differentiates: **the editing experience, the brand, Arabic support, and
  the website integration.**

**We chose (B), on Payload CMS** — and the codebase already runs on it (Payload 3.85
on Next.js 15, Postgres in production, SQLite locally). This is the senior‑engineer
call: the "world‑class" qualities the brief asks for live in UX, typography and
content modelling — *not* in re‑implementing a login form or a media uploader. Payload
gives us, for free and battle‑tested:

| Capability | Provided by Payload | What we add on top |
|---|---|---|
| Authentication & sessions | ✅ Built‑in | 2FA, SSO (roadmap) |
| Role‑based access control | ✅ Field‑ & collection‑level | Mosque‑specific roles |
| Media uploads + image resizing | ✅ Sharp + S3/R2 adapter | DAM: folders, alt‑text, focal point |
| Drafts, autosave, versions | ✅ Built‑in | Editorial workflow & approvals |
| Auto REST + GraphQL API | ✅ Every collection | Aggregated `/app-api` for apps & screens |
| Typed content (`payload-types.ts`) | ✅ Generated | Shared with website + mobile |
| Rich text editor (Lexical) | ✅ Extensible | Ribbon toolbar, colours, Arabic states |
| Admin UI | ✅ React, themeable | **Premium brand theme + Arabic fonts** |

Because Payload's admin is **fully themeable via CSS custom properties and React
component slots**, we can reach "premium commercial product" without forking it — and
without taking on the risk of a bespoke build. Every enhancement is **additive and
reversible**: the admin keeps working even if a theme file is removed.

---

## 3. What is built now — Phases 1 & 2

Phase 1 is live on the `claude/mosque-platform-architecture-85epxh` branch and verified
against a production build (the `/admin` route renders 200 with the theme applied).

### 3.1 Premium admin theme — `src/app/(payload)/admin-theme.css`

A single, surgical stylesheet imported **after** Payload's own CSS so our rules win, and
deliberately scoped to **fonts, brand colour, radii and RTL/Arabic** — it can restyle the
admin but cannot break its behaviour:

- **Typography:** Inter as the UI font, with Amiri/Scheherazade in the fallback stack so
  Arabic typed into *any* field renders with proper ligatures and ḥarakāt.
- **Brand:** the primary action button (Save / Create / Publish) becomes a mosque‑green
  gradient; the active nav item and document tabs pick up green and gold accents; focus
  rings are brand gold for a polished, accessible feel.
- **Softer surfaces:** larger corner radii on cards, lists and tables for a modern,
  less‑boxy look.
- **Arabic input handling:** `unicode-bidi: plaintext` on text areas and the rich‑text
  editor, so a field auto‑detects direction from its content — Arabic flows RTL and
  English LTR **in the same form**, with no mode switch.

It is imported in `src/app/(payload)/layout.tsx` directly after `@payloadcms/next/css`.
Removing that one import fully reverts the admin to stock — that is the safety guarantee.

### 3.2 First‑class Arabic & Qur'anic support

This is the part most CMSs get wrong. Our approach has three layers:

1. **The engine already handles RTL & Unicode.** Payload's Lexical editor stores and
   renders full Unicode and bidirectional text correctly out of the box. The hard part is
   never the bytes — it's the **fonts** and the **editing affordances**.
2. **The right fonts, loaded everywhere.** We load **Amiri** (a refined Naskh face,
   excellent for general Arabic prose) and **Scheherazade New** (designed for fully
   vocalised text — it places ḥarakāt beautifully, which is exactly what Qur'anic
   quotation needs). Both are loaded in the public site (`(frontend)/layout.tsx`) **and**
   the admin theme, so what an editor sees is what visitors see.
3. **One‑click Arabic & Qur'anic styles in the editor.** Using Payload's `TextStateFeature`
   we added a **"script" group** to the toolbar (`src/payload/richtext.ts`):
   - **Arabic (Amiri)** — applies the Amiri face, larger size, RTL direction and relaxed
     line height for comfortable reading.
   - **Qur'an (Uthmanic)** — Scheherazade New at a larger size and generous 2.2 line height
     so vocalised verses render with room for the diacritics.

   The same definitions are read by the **website renderer** (`RichTextRenderer`), so the
   styling an editor picks is exactly what renders on the live page — no drift between
   admin and site. Supporting CSS (`.quran`, `.verse`, `.rtl`, `[dir="rtl"]`) gives a
   centred, framed Qur'anic verse block on the public site.

**Recommended editor + font stack (the expert answer to "what's best"):**
> Keep **Lexical** (Payload's native editor) — it is modern, fast, React‑native and fully
> Unicode/RTL‑aware, and it avoids the bundle weight and integration friction of bolting on
> CKEditor/TipTap. Pair it with **Amiri** for Arabic prose and **Scheherazade New** for
> Qur'anic/vocalised text. If, later, the mosque wants the *exact* mushaf glyph shapes,
> the drop‑in upgrade is the **KFGQPC Uthmanic Script HAFS** font from the King Fahd
> Complex — self‑hosted as a `@font-face`, swapped into the "Qur'an" style with a one‑line
> change. No re‑architecture needed.

### 3.3 CMS Navigation Builder — `MainMenu` global

The site's top navigation is now **content, not code**. A new **Navigation Menu** global
(`src/payload/globals.ts`) lets an admin:

- add, rename, reorder (drag the ⠿ handles) and hide top‑level links,
- nest dropdown children under any item,
- set each link's URL and toggle visibility without deleting it.

The website header and mobile menu read it live via `getMainMenu()` (`src/lib/cms.ts`),
with a safe fallback to the built‑in default menu if the global is empty or unreachable —
so the nav can never render blank. (`SiteHeader.tsx`, `MobileMenu.tsx`.)

### 3.4 Personalised dashboard & ⌘K command palette (Phase 2)

Two custom admin surfaces, registered through `admin.components` (`beforeDashboard` and
`providers`) with matching `importMap` entries. Both are **additive and reversible**: a
missing importMap entry degrades to nothing rather than breaking the admin, and reverting
the single registration commit fully restores the stock admin.

**The dashboard** (`DashboardGrid`, a server component — Payload passes it the `payload`
and `user` instances directly) greets the editor and shows, in a responsive card grid:

- a **next‑prayer hero** with a live `HH:MM:SS` countdown to the next jamāʿah (CMS override
  wins over the static timetable; the clock ticks in a mount‑gated client leaf so SSR and
  hydration match);
- **role‑gated quick actions** (new post / event / page / announcement / broadcast / prayer
  day) filtered to the signed‑in user's roles — each opens a blank create form, so no
  `afterChange` side‑effects fire until the user saves;
- **recently edited** (across collections, by `updatedAt`) and **pending drafts**
  (pages + posts) with deep links;
- an **unhandled‑messages** callout and a localStorage‑backed **favourites** widget with a
  pin/unpin manager.

Every server widget catches its own errors and renders `null`, so one failing query can
never blank the dashboard.

**The command palette** (`CommandPaletteProvider` → `CommandPalette`) brings a Linear/Raycast
‑style **⌘K / Ctrl+K** launcher to every admin screen: quick actions, jump‑to navigation,
recently‑opened, and **debounced, abortable content search** across collections via the REST
API. It is fully keyboard‑driven (ARIA combobox/listbox, arrow‑key navigation, focus
restore, reduced‑motion aware), yields to Lexical's insert‑link only when text is selected
in an editor, and is wrapped in an error boundary so a palette fault can never break the
admin. Zero new dependencies — pure React + a portal + one scoped stylesheet.

### 3.5 Media library / DAM (Phase 3)

The `media` collection is upgraded into a proper digital-asset manager using Payload's native
capabilities (no plugins), so it's robust and upgrade-safe:

- **Folders** — `folders: true` enables a "Browse by folder" view; editors organise images and
  documents into folders.
- **Tags** — a searchable `hasMany` tag input (e.g. `ramadan`, `eid`, `hero`), plus a `caption`
  alongside the existing alt text.
- **Focal point + crop** — editors set the focal point and crop so an image always frames well
  at any size; `focalX/focalY` persist on the asset.
- **Responsive image sizes** — every upload generates `thumbnail` (400×300), `card` (768×512)
  and `feature` (1600×900) variants via Sharp; the original is kept untouched and the small
  variant is used as the admin thumbnail.
- **Bulk upload** — drag several files in at once.
- **Library search** — `listSearchableFields` searches by file name, alt, caption and tag.
- **Recent media** — a strip on the dashboard (Phase 2) shows the latest uploads as thumbnails,
  satisfying "recently-used media".

All changes are additive and sync via Payload's on-boot schema push; existing media and every
place that references it keep working.

---

## 4. The 13 capability areas — current state & roadmap

A frank map of the full brief. ✅ = working today, 🟡 = partially in place, ⬜ = roadmap.

| # | Area | Today | Plan |
|---|---|---|---|
| 1 | **Page management** | ✅ `pages` collection with block layouts (multi‑column, media, CTA, downloads, background colours), drafts & versions | ⬜ Live visual preview pane; reusable saved blocks; page templates |
| 2 | **Professional rich text** | ✅ Lexical with always‑on ribbon toolbar, headings/lists/links/images/alignment, **text & highlight colours**, Arabic/Qur'an styles | ⬜ Tables, callouts, embeds, "/" slash menu, paste‑from‑Word cleanup |
| 3 | **Navigation builder** | ✅ Drag‑reorder mega‑style menu with nested children & visibility toggles (Phase 1) | ⬜ Footer & utility menus; per‑item icons; role‑gated links |
| 4 | **Media library (DAM)** | ✅ Native **folders** (browse‑by‑folder), **tags** (searchable), **focal‑point + crop**, responsive image sizes (thumbnail/card/feature), **bulk upload**, library search, alt + caption, and a "Recent media" dashboard strip (Phase 3) | ⬜ S3/R2 in production; AI alt‑text suggestions |
| 5 | **News / announcements** | ✅ `posts` + `announcements` collections; site alert bar; push to apps via `afterChange` | ⬜ Scheduling (publish/expire), categories, featured ordering |
| 6 | **Social media centre** | 🟡 Broadcast model in place (`broadcasts`) | ⬜ Facebook/Instagram (Meta Graph API) + Telegram adapters, compose‑once‑post‑everywhere, per‑network preview |
| 7 | **WhatsApp integration** | 🟡 `broadcasts` + `BroadcastSettings` (group/target IDs); gateway microservice built (Baileys) | ⬜ Deploy gateway + pair number (mosque action); compliant Cloud‑API opt‑in broadcast path |
| 8 | **Forms builder** | 🟡 `contact-submissions` with stored entries + email notify | ⬜ Drag‑drop form designer, custom fields, spam protection, CSV export, per‑form recipients |
| 9 | **Users & permissions** | ✅ 5 roles (Super Admin, Admin, Editor/Manager, Prayer Times Manager, Contributor), field‑level access, first‑user auto‑admin, env‑provisioned admin | ⬜ Per‑section granular permissions; invite‑by‑email flow |
| 10 | **Workflow & approvals** | ✅ Submit‑for‑review → approve → publish on Pages & Posts; Contributors author drafts but **cannot publish/unpublish or change live content**; reviewStatus + reviewNote; editors emailed on submission; dashboard review queue (Phase 4) | ⬜ Per‑field review comments; scheduled publish |
| 11 | **CMS dashboard** | ✅ Personalised dashboard (greeting + Hijri date, **live next‑prayer countdown**, role‑gated quick actions, recently‑edited, pending drafts, unhandled messages, favourites) and a global **⌘K command palette** with content search (Phase 2) | ⬜ Drag‑to‑rearrange widgets; saved views; per‑user layout |
| 12 | **Technical architecture** | ✅ Next.js 15 + Payload 3.85 + Postgres, typed API, ISR revalidation, S3 media, app/screen snapshot API | Ongoing — see §6 |
| 13 | **Security** | ✅ Auth, RBAC, CSRF (Payload built‑in), access‑controlled APIs, env secrets | ⬜ 2FA/TOTP, audit log, login rate‑limiting, session policy — see §5 |

---

## 5. Security model

**Today (built‑in & working):**
- Cookie‑based auth with hashed passwords; CSRF protection on mutations.
- Role‑based access enforced at **collection and field level** (e.g. only Admins can
  change a user's role; only the Prayer Times Manager + Admins can edit the timetable).
- Public read is explicit and intentional per collection; everything else is gated.
- Secrets (DB, SMTP, S3, `PAYLOAD_SECRET`) live only in environment variables.
- CORS configurable to a known origin allow‑list (`CORS_ORIGINS`).

**Roadmap (to reach "enterprise"):**
- **2FA (TOTP)** for staff logins, enforced for Admin roles.
- **Audit log** — an append‑only `audit-log` collection written by a global `afterChange`
  hook: who changed what, when, with before/after — invaluable for a multi‑volunteer team.
- **Login rate‑limiting / lockout** to blunt brute‑force attempts.
- **Session policy** — shorter admin session TTL, "log out everywhere", optional SSO.
- **Content security headers** (CSP, HSTS) at the edge.

---

## 6. Technical foundation (how it all stays in sync)

```
            ┌──────────────────────────────────────────────┐
            │  PAYLOAD CMS  (the admin in this repo)         │
            │  Postgres · S3/R2 media · auto REST + GraphQL  │
            │  SINGLE SOURCE OF TRUTH                         │
            └───────────────┬──────────────────────────────┘
                            │ typed content + afterChange hooks
     ┌──────────┬───────────┼─────────────┬──────────────────┐
  Website     PWA        iOS/Android     /display          Broadcast
 (ISR, live) (installable) (Expo apps)   (mosque TVs)    (WA/email/social)
```

- **Live updates:** website pages read live globals/collections and use Next.js ISR with
  on‑demand revalidation — an edit appears in seconds. Apps and screens read an aggregated
  `/app-api/snapshot` so a single cheap call hydrates prayer times, news and events.
- **Schema sync:** Payload pushes schema diffs on boot in production (idempotent), so the
  managed database always matches the code without a manual migration step.
- **Additive everywhere:** new collections/globals/fields never break existing data; the
  theme and editor features degrade gracefully.

---

## 7. Honest phased roadmap

Phases 1–4 are done and verified. The rest is sequenced by **value to a non‑technical editor**:

1. **✅ Phase 1 — Foundation:** premium admin theme, first‑class Arabic/Qur'anic
   typography in editor + site, CMS Navigation Builder.
2. **✅ Phase 2 — Dashboard & search:** personalised dashboard (live next‑prayer countdown,
   role‑gated quick actions, recently‑edited, pending drafts, unhandled messages,
   favourites) and a global ⌘K command palette with content search.
3. **✅ Phase 3 — Media DAM:** native folders (browse‑by‑folder), searchable tags, focal‑point
   + crop, responsive image sizes, bulk upload, library search, alt + caption, and a "Recent
   media" dashboard strip.
4. **✅ Phase 4 — Editorial workflow:** submit‑for‑review → approve → publish on Pages & Posts,
   with a publish‑gate (contributors can only draft), reviewer email notifications, and a
   dashboard review queue.
5. **Phase 5 — Forms builder:** drag‑drop designer, spam protection, CSV export, per‑form
   recipients.
6. **Phase 6 — Social & WhatsApp centre:** compose‑once → Facebook/Instagram/Telegram +
   compliant WhatsApp broadcast; deploy + pair the gateway (mosque action).
7. **Phase 7 — Security hardening:** 2FA, audit log, rate‑limiting, CSP/HSTS.

Each phase ships as its own reviewed PR, so the live admin is never at risk and value
lands continuously.

---

## 8. Files touched in Phase 1

| File | Change |
|---|---|
| `src/app/(payload)/admin-theme.css` | **New** — premium admin theme (brand, fonts, RTL) |
| `src/app/(payload)/layout.tsx` | Import the admin theme after Payload CSS |
| `src/payload/globals.ts` | **New** `MainMenu` navigation global |
| `src/payload.config.ts` | Register `MainMenu` global |
| `src/lib/cms.ts` | `getMainMenu()` reader with safe fallback |
| `src/components/layout/SiteHeader.tsx` | Render nav from the CMS menu |
| `src/components/layout/MobileMenu.tsx` | Accept CMS menu items |
| `src/payload/richtext.ts` | Arabic + Qur'an editor text styles |
| `src/app/(frontend)/layout.tsx` | Load Amiri + Scheherazade New fonts |
| `src/app/globals.css` | `.quran` / `.verse` / RTL rendering styles |

## 9. Files added in Phase 2

| File | Change |
|---|---|
| `src/payload.config.ts` | Register `admin.components.beforeDashboard` + `providers` |
| `src/app/(payload)/admin/importMap.js` | Hand‑added the two component entries |
| `src/payload/components/DashboardGrid.tsx` | **New** — server dashboard orchestrator |
| `src/payload/components/widgets/*` | **New** — Greeting, NextPrayer(+Countdown), QuickActions, RecentlyEdited, PendingDrafts, UnhandledMessages, Favourites |
| `src/payload/components/CommandPalette*.tsx` | **New** — palette, provider, error boundary |
| `src/payload/components/destinations.ts` | **New** — shared admin‑destination registry |
| `src/payload/components/icons.tsx`, `WidgetCard.tsx`, `hooks/useFavourites.ts` | **New** — shared building blocks |
| `src/payload/components/dashboard.css`, `command-palette.css` | **New** — scoped `.kma-*` / `.cmdk-*` styles |
