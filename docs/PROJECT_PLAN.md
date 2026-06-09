# Kingston Mosque (Kingston Muslim Association) — Website Rebuild Plan

**Status:** Proposal / pre-implementation. No application code is written yet.
**Prepared for:** Kingston Muslim Association (KMA), 55 East Rd, Kingston upon Thames, KT2 6EJ.
**Scope:** Full rebuild of https://www.kingstonmosque.org with a custom, easy-to-manage CMS, a prayer‑times engine driven by the supplied 365‑day calendar, and a premium Islamic design system.

---

## 1. Audit of the existing website

### 1.1 How the audit was performed
The live site blocks automated fetching (HTTP 403 / bot protection), so the current inventory was reconstructed from search‑engine indexes, public directory listings, and the site's own URL patterns. The site is built on **WordPress** (evidence: `/page/2/`, `/news/page/3/`, `/author/admin/`, year archives `/2021/`, `/2023/`). Before implementation we will do a **complete crawl with credentials/owner access** to capture every page, post, PDF, image, and menu item verbatim (see §1.4).

### 1.2 Pages & sections discovered (to be migrated — nothing dropped)

| Current page / URL | Purpose | Migrate to (new site) |
|---|---|---|
| `/` Home | Landing, prayer times, notices | **Homepage** (redesigned) |
| `/overview/` | About KMA — founded 1979, purpose‑built mosque 1985, accommodates 800+ worshippers | **About the Mosque** |
| `/congregational-prayers/` | Facilities & prayer hall info (men ground floor; women 2nd‑floor hall; new ablution facilities, disabled toilets, shower) | **Facilities** + **Prayer Times** |
| `/prayers/` | Prayer times / monthly timetable downloads | **Prayer Times** |
| `/sermon/` | Friday Khutbah info | **Jummah** |
| `/announcement-jummuah-prayer-guidelines/` | 1st Jummah doors 12:50 / khutbah ~1:10–1:20pm; 2nd Jummah doors 2:00 / khutbah 2:10pm; English + Arabic khutbahs | **Jummah** |
| `/madrasah/` | Islamic education, ages 6–16, evenings + weekends; Islamic Studies, Qur'an Recitation, Hifz; teacher vacancies | **Education / Children's Classes** |
| `/youth-programs/` | KMA Youth Club, weekly sessions (~35 attendees) | **Education / Youth** |
| `/sisters-circles/` | Sisters' Sunday Circle (faith, social events, Qiyam‑ul‑Lail, fundraisers) | **Community Support / Adult Classes** |
| `/marriage-services/` | Nikah services by local Imams | **Nikah** |
| *(Ghusl & burial info — referenced across site)* | Free Ghusl & burial arrangement assistance | **Funeral Services** |
| `/itikaaf-registration/` | I'tikaaf registration (Ramadan) | **Ramadan** |
| `/news/` (+ `/page/2`, `/page/3`) | Announcements & news (e.g., "KMA Announces Eid Al Adha 2026") | **News & Announcements** |
| `/blog/` | Blog posts | **News & Announcements** |
| `/media/` | Photos / media | **Facilities / About galleries** |
| `/contact/` | Address, phone, email, map | **Contact Us** |
| `/2021/`, `/2023/`, `/author/admin/` | WP archives | Replaced by tag/date filters; old URLs redirected |

### 1.3 Content, services & data to preserve

- **Identity / history:** KMA founded 1979; converted to purpose‑built mosque 1985; capacity 800+ (some sources 1,000+). Registered charity (capture Charity Commission number during migration).
- **Services:** Madrasah (ages 6–16), Nikah, free Ghusl & burial assistance, school visits, Youth Club, Sisters' Circle, two Jummahs (English + Arabic), Taraweeh & I'tikaaf in Ramadan, Eid prayers.
- **Facilities:** Separate men's (ground floor) and women's (2nd‑floor hall) prayer areas; new ablution facilities; disabled toilets; shower.
- **Prayer schedule:** Daily begins + jamaah times (from the supplied calendar); two‑Jummah schedule; seasonal jamaah changes.
- **Contact details:** 55 East Rd, Kingston upon Thames, KT2 6EJ · **020 8549 5315** · **info@kingstonmosque.org**.
- **Donations:** In person (Iftar donation box by the main office door) and bank transfer — *account name / sort code / account number to be re‑confirmed from the live site during migration*.
- **Social / external:** Facebook (`/kmosque/`), Telegram (`t.me/kingstonmosque`), existing mobile app (link if retained).
- **Assets:** All existing photos, logos, PDFs (monthly timetables), and any embedded videos.

> ⚠️ Specific figures above (exact Jummah khutbah minute, bank details, capacity, charity number) were read from third‑party indexes and **must be verified against the live site** before go‑live.

### 1.4 Pre‑build audit checklist (to run with owner access)
1. Authenticated crawl of every URL (Screaming Frog / WP export) → full page & media inventory.
2. Export WordPress content (XML) + media library; list all PDFs and downloads.
3. Capture the full navigation menu (primary, footer, mobile) and any widgets.
4. Record all forms (contact, I'tikaaf, madrasah enrolment) and where submissions go.
5. Note Google Analytics/Search Console, any embedded maps, social embeds, donation links.
6. Pull top‑landing URLs (Search Console) to plan **301 redirects** and protect SEO.
7. Photograph/screenshot every page for design reference and a "nothing lost" sign‑off.

---

## 2. Proposed sitemap

```
Home
├─ Prayer Times
│   ├─ Daily & Monthly Timetable (download)
│   ├─ Jummah Times
│   └─ Ramadan Timetable
├─ About
│   ├─ About the Mosque (history & vision)
│   ├─ Imam & Team
│   ├─ Facilities
│   └─ Annual Reports / Governance (charity info)
├─ Services
│   ├─ Nikah (Marriage)
│   ├─ Funeral Services (Ghusl & Burial)
│   ├─ New Muslims / Reverts
│   └─ School & Community Visits
├─ Education
│   ├─ Children's Classes (Madrasah)
│   ├─ Adult Classes & Circles
│   ├─ Youth Programmes
│   ├─ Sisters' Circle
│   └─ Courses, Lectures & Programmes
├─ Events
│   ├─ Upcoming Events
│   ├─ Ramadan (Taraweeh, I'tikaaf, Iftar)
│   └─ Eid (announcements & prayer details)
├─ Donate
│   ├─ Donation Campaigns / Appeals
│   ├─ Zakat & Sadaqah
│   └─ How to Give (bank / in person / online)
├─ Community Support
│   ├─ Welfare & Food support
│   └─ Volunteering
├─ News & Announcements
├─ Contact Us
└─ Admin Dashboard (private)
```

**Redirects:** every old URL (`/overview/`, `/madrasah/`, `/marriage-services/`, `/congregational-prayers/`, `/sermon/`, `/itikaaf-registration/`, `/news/…`, etc.) → mapped 301 to its new home so no links or search rankings break.

---

## 3. Proposed homepage layout (top → bottom)

1. **Top utility bar** — phone, email, "Donate" button, language/social icons.
2. **Sticky header** — logo (KMA), primary nav, prominent **Donate** CTA.
3. **Hero banner** — mosque imagery + Islamic geometric motif, name, tagline (e.g. *"Serving the Muslim community of Kingston since 1979"*), and a compact **"Next prayer in 02:14"** chip. Admin‑editable headline, sub‑text, background image, and two buttons.
4. **Today's Prayer Times** — the centrepiece card (see §5): all five daily prayers with **Begins** and **Jamā'ah** columns, today's date (Gregorian + Hijri), sunrise, the **next prayer highlighted** with a live countdown. "View full timetable" link.
5. **Jummah times** — two‑Jummah block (English / Arabic), doors & khutbah times, plus a download for the monthly PDF.
6. **Important announcements / alert banner** — dismissible site‑wide alert for urgent notices (e.g. Eid moon sighting, closures); managed in admin.
7. **Donation call‑to‑action** — featured campaign with progress bar + "Donate now"; Zakat/Sadaqah quick links.
8. **Upcoming events** — 3 cards (Ramadan, Eid, classes), date chips, "All events".
9. **Education & classes** — Madrasah, Youth, Sisters' Circle, Adult courses tiles.
10. **Our services** — Nikah, Funeral (Ghusl & burial), New Muslims, Community support icons.
11. **Latest news** — 3 most recent posts.
12. **About / community impact** — short history, capacity, a few stats (since 1979, 800+ capacity).
13. **Location & contact** — embedded map, address, phone, email, opening times, "Get directions".
14. **Footer** — quick links, prayer summary, social, charity number, newsletter sign‑up, copyright.

All numbered blocks are **reorderable / hideable** from the admin (block‑based homepage — see §4).

---

## 4. Admin / CMS structure

A single, **WordPress‑like but purpose‑built** admin tailored to KMA. Left‑nav sections:

- **Dashboard** — at‑a‑glance: today's prayer times, next event, draft items, recent edits.
- **Pages** — create / edit / **reorder (drag‑drop)** / hide / delete; each page is built from **reusable blocks** (Rich Text, Image, Image+Text, Gallery, Button/CTA, Video embed, PDF/Download, Accordion/FAQ, Quote/Ayah, Prayer‑times block, Event list, Donation block, Map, Contact block, Alert). *(Admin capability #1, #3, #4)*
- **Homepage** — manage the homepage sections (the §3 blocks): edit content, toggle visibility, reorder. *(#2)*
- **Prayer Times**
  - **Annual Timetable** — upload/replace the yearly CSV; preview & validation report. *(#8)*
  - **Daily overrides** — edit any single day's begins/jamaah times. *(#9)*
  - **Jummah** — 1st/2nd Jummah doors, khutbah, language, seasonal rules. *(#10)*
  - **Special prayers** — Ramadan (Taraweeh, Suhūr/Iftar), Eid (date, time, location, overflow). *(#11, #12)*
- **Announcements** — site alerts/banners with start/end dates, severity, target pages. *(#5, #15)*
- **Events** — title, date/time, location, description, image, registration link, recurring. *(#6)*
- **Education** — classes, courses, lectures, programmes (age group, schedule, fees, enrol link). *(#7)*
- **Services** — Nikah, Funeral, New Muslims, Community service pages. *(#14)*
- **Donations** — campaigns (goal, raised, image, link), Zakat/Sadaqah, bank details, donation buttons. *(#13)*
- **Media Library** — images, PDFs, downloads, video links; reused across blocks. *(#4)*
- **Site Settings** — contact details, opening times, address, map coords, social links, header/footer. *(#16)*
- **Users & Roles** — invite users, assign roles & permissions. *(#19)*

**Cross‑cutting editor features:** every content item supports **Save Draft**, **Preview** (renders the exact public layout via a secure preview link), **Publish**, **version history / revert**, and **scheduled publish**. *(#17, #18)*

---

## 5. Prayer‑timetable handling (the 365‑day calendar)

### 5.1 What the file contains (validated)
- **365 rows, contiguous 01/01/2026 → 31/12/2026**, UK date format `DD/MM/YYYY`.
- Columns: `Day, Date, Fajr, Sunrise, Zawwal, Duhur, Asr, Sunset, Maghrib, Isha, J‑Fajr, J‑Duhur, J‑Asr, J‑Maghrib, J‑Isha`.
  - **Begins**: Fajr, Sunrise, Dhuhr (`Duhur`), Asr, Maghrib, Isha.
  - **Jamā'ah** (congregation): `J‑Fajr, J‑Duhur, J‑Asr, J‑Maghrib, J‑Isha`.
  - `Zawwal` and `Sunset` columns are **empty placeholders** (kept for layout; ignored).
- **Maghrib begins == J‑Maghrib on every row** (jamaah at sunset).
- Times are **local wall‑clock (Europe/London)** with **BST/GMT already baked in** — confirmed by the hour‑jumps on **29/03/2026** (clocks forward) and **25/10/2026** (clocks back). ➜ **No timezone maths needed**: simply show today's row as‑is.
- **One data anomaly to fix on import:** `J‑Isha = 22:30` on **15/04/2026** (neighbours are 21:30) — the validator will flag it for the admin to confirm or correct.

### 5.2 Storage model
Each day stored as one **PrayerDay** record keyed by full date (so the yearly upload and per‑day overrides coexist):

```
PrayerDay {
  date              # 2026-04-15
  weekday
  fajrBegins, fajrJamaah
  sunrise
  dhuhrBegins, dhuhrJamaah
  asrBegins, asrJamaah
  maghribBegins (= maghribJamaah)
  ishaBegins, ishaJamaah
  source: "import" | "manual"   # manual overrides win
  note                          # e.g. "Eid", "Ramadan"
}
```
Jummah is **not** in the CSV (the `J‑Duhur` column is the regular Dhuhr jamaah). The two‑Jummah schedule (doors/khutbah/language, seasonal) is stored separately in **JummahSetting** and shown on Fridays.

### 5.3 Upload & validation flow (admin)
1. Admin uploads the yearly CSV (or pastes a Google‑Sheet export).
2. System **parses & validates**: 365/366 rows, contiguous dates, `HH:MM` format, sane ordering (Fajr < Sunrise < Dhuhr < Asr < Maghrib < Isha), and **outlier detection** (e.g. the 22:30 case) with a clear pre‑publish report.
3. **Preview diff** vs current data → **Publish** (replaces that year; previous version retained for revert).
4. Per‑day **manual override** UI for ad‑hoc changes; clearly badged so it survives re‑imports.

### 5.4 Display logic
- **Homepage "Today" widget:** look up today's date → render five prayers (Begins + Jamā'ah), sunrise, Hijri date, and **highlight the next prayer with a live countdown**; after Isha, roll to tomorrow's Fajr.
- **Fridays:** swap the Dhuhr row for the **Jummah** block (1st & 2nd).
- **Ramadan/Eid:** when an active Ramadan/Eid record exists, surface Suhūr/Iftar and Eid prayer details.
- **Annual rollover:** the calendar is year‑specific. Admin uploads next year's file each year; if a date has no record (e.g. before upload), the UI shows a graceful "timetable updating" state and the monthly PDF. **Leap years (Feb 29)** are supported by the date‑keyed model.

---

## 6. Recommended roles & permissions

| Role | Capabilities |
|---|---|
| **Super Admin** | Everything: users/roles, site settings, delete, publish, billing/integrations. |
| **Admin** | All content + prayer times + settings; manage Editors/Contributors; cannot manage Super Admins. |
| **Prayer Times Manager** | Upload annual timetable, daily overrides, Jummah, Ramadan/Eid only. |
| **Editor** | Create/edit/**publish** pages, posts, events, announcements, classes; media library. |
| **Contributor** | Create/edit **drafts only**; cannot publish (submits for review). |
| **Viewer / Auditor** | Read‑only access to admin (for trustees/oversight). |

Role‑based access control enforced **server‑side** on every collection and action; granular per‑collection permissions (e.g. an Editor for "Events" but not "Donations"). All logins protected (strong passwords, optional 2FA, audit log of changes).

---

## 7. Recommended content / database structure

Core collections (relational, Postgres):

- **Page** (slug, title, status, order, parent, blocks[], SEO, draft/version)
- **HomepageSection** (type, order, visible, content JSON)
- **Block** library (polymorphic; embedded in pages/sections)
- **PrayerDay** (see §5.2) and **TimetableImport** (file, year, status, validation report)
- **JummahSetting** (seasonal rules, 1st/2nd doors/khutbah/language)
- **SpecialSchedule** (Ramadan/Eid: type, dates, times, location, notes)
- **Announcement** (message, severity, start/end, target, dismissible)
- **Event** (title, start/end, location, description, image, registration URL, recurring)
- **Class** (name, category=children/adult/youth/course, ages, schedule, fees, enrol URL)
- **Service** (Nikah/Funeral/NewMuslim/Community: body blocks, contact, downloads)
- **DonationCampaign** (title, goal, raised, image, link, active) + **DonationSettings** (bank details, Zakat/Sadaqah copy)
- **Post** (news/blog: title, body, date, tags, author, image)
- **Media** (image/pdf/file/videoEmbed, alt, caption)
- **SiteSettings** (singleton: contact, address, geo, opening times, socials, header/footer, theme)
- **User** + **Role** (RBAC), **AuditLog**

All content types support **draft / published / scheduled**, **revisions**, and a **preview token**.

---

## 8. Design style & UI/UX direction

- **Mood:** Islamic, elegant, sophisticated, calm, modern, trustworthy — premium but uncluttered.
- **Colour:** soft, refined palette — deep teal/emerald **green** and warm **gold** accents on generous off‑white/cream backgrounds, with a calm dark mode. High contrast for accessibility.
- **Pattern:** tasteful **Islamic geometric** motifs and subtle arabesque borders used sparingly (hero, section dividers, cards) — never busy. SVG patterns for crispness on all screens.
- **Typography:** refined serif/display for headings (with an Arabic‑friendly companion for Bismillah/āyāt), clean humanist sans for body; strong type scale; comfortable line length.
- **Layout:** spacious grid, soft shadows, rounded cards, clear hierarchy; the **prayer‑times card** is the visual anchor.
- **Imagery:** real photography of the mosque + community (replace stock over time).
- **Mobile‑first & accessible:** WCAG 2.1 AA, keyboard nav, semantic HTML, large tap targets, fast on 3G. Hijri + Gregorian dates; English first, with structure ready for additional languages.
- **Performance:** static/ISR pages, optimised images, minimal JS → fast on phones in the prayer hall car park.

A small **design system** (tokens, components, pattern library) will be built first so the look is consistent and the admin's blocks always render beautifully.

---

## 9. Recommended technical approach

**Recommendation: a single integrated app — Next.js (App Router) frontend + Payload CMS, with PostgreSQL.**

- **Why this stack:**
  - **Payload** gives a **WordPress‑like admin** that is fully **custom to KMA** (custom collections for Prayer Times, Events, Donations, etc.), with **drafts, versions, live preview, scheduled publish, media library, and role‑based access control built in** — covering admin requirements #1–#19 without plugin sprawl.
  - **Next.js** delivers a **fast, SEO‑friendly, mobile‑first** public site (static + incremental regeneration), and Payload runs **inside the same Next.js app** → one codebase, one deploy, lower cost and maintenance.
  - **PostgreSQL** for reliable relational content; **self‑hostable** (no vendor lock‑in).
  - **Secure & scalable:** modern stack, far smaller attack surface than a plugin‑heavy WordPress; scales from a single VPS to managed hosting.
- **Styling:** Tailwind CSS + a custom design‑system/component library (§8).
- **Prayer engine:** custom CSV importer/validator + override UI + "today" API (§5).
- **Hosting options:** (a) **Vercel + managed Postgres (Neon/Supabase)** — easiest, scalable; or (b) a single **VPS** (cheaper, more ops). Either supports daily backups and staging.
- **Integrations:** donations via **a hosted provider** (e.g. Stripe, GoCardless, or an Islamic‑charity platform) to avoid handling card data; email for forms; Google Maps embed; analytics (privacy‑friendly).

**Alternative (lower budget / max familiarity):** keep **WordPress** with a premium theme + ACF + a **custom prayer‑times plugin**. Cheaper hosting and very familiar, but more ongoing security/plugin maintenance and a less bespoke "premium" feel. *Recommended only if budget or in‑house WP familiarity is the deciding factor.*

---

## 10. Phased development plan

| Phase | Deliverables |
|---|---|
| **0 — Discovery & sign‑off** | Authenticated audit (§1.4), confirm content/bank/charity details, lock sitemap, tech & hosting decision, brand assets. |
| **1 — Foundations** | Repo, Next.js + Payload + Postgres scaffold, hosting/staging, design tokens & component library, base layout/nav/footer. |
| **2 — Prayer engine** | CSV import + validation + override UI, JummahSetting, Today widget, full timetable page, monthly PDF. *(highest‑value, do early)* |
| **3 — Core pages & blocks** | Block system, Homepage builder, Pages CMS, About/Facilities/Services/Education, News, Contact. |
| **4 — Events, donations, announcements** | Events, donation campaigns + provider, site‑wide alert banners, Ramadan/Eid schedules. |
| **5 — Roles, drafts, preview** | RBAC, draft/preview/version/scheduling polish, audit log, 2FA. |
| **6 — Content migration & redirects** | Move all existing content/media, set 301 redirects, SEO metadata, accessibility pass. |
| **7 — QA, training & launch** | Cross‑device/perf/security testing, admin training + short guide, backups, DNS cutover, post‑launch monitoring. |

Each phase ships behind staging with stakeholder review; the prayer engine and homepage are prioritised because they are the most‑used features.

---

## 11. Risks, assumptions & questions

**Assumptions**
- The supplied CSV is the authoritative source for 2026; a new file will be supplied each year (admin upload covers this).
- Times are intentionally local wall‑clock with BST/GMT baked in (validated) — we will **not** apply timezone shifts.
- KMA wants to **own and self‑host** the site (no proprietary lock‑in).
- Existing branding (logo/colours) can be refined but the KMA identity is retained.

**Risks & mitigations**
- *Content loss* → full authenticated crawl + export + screenshot sign‑off before launch (§1.4).
- *SEO/link loss* → comprehensive 301 redirect map from old WordPress URLs.
- *Prayer‑time errors* (e.g. the 22:30 outlier) → import validation, preview diff, per‑day overrides, version revert.
- *Maintenance burden* → integrated single‑app stack, managed DB/backups, minimal third‑party plugins.
- *Donations/PCI* → use a hosted payment provider; never store card data.
- *Unverified figures* (bank details, capacity, charity no., exact Jummah minutes) → confirm with KMA before go‑live.

**Questions for KMA (before implementation)**
1. **Tech direction:** approve **Next.js + Payload (custom CMS)**, or prefer to stay on **WordPress**?
2. **Hosting & budget:** managed (Vercel + managed Postgres) or a self‑managed VPS? Rough annual budget?
3. **Donations:** which provider/links should we use (Stripe / GoCardless / existing platform)? Provide live bank details & Zakat/Sadaqah wording.
4. **Migration access:** can you grant WordPress admin/FTP (or a full export) so nothing is missed?
5. **Prayer details:** confirm the exact **two‑Jummah** times/languages and whether the calculation method/jamaah rules ever change mid‑year.
6. **Branding:** existing logo/brand guidelines, or shall we refresh the identity?
7. **Languages:** English only at launch, or also Arabic/Urdu/others?
8. **Domains/email:** keep `kingstonmosque.org` and `info@` mailbox? Who controls DNS?
9. **Charity governance:** Charity Commission number and any required trustee/financial disclosures to display.
10. **Existing app:** keep linking the current mobile app, or fold its function into the new site?
```
