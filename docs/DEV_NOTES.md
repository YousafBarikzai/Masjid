# Developer notes — prayer data pipeline & preview

This is early build scaffolding for the Kingston Mosque rebuild (Phase 1–2: data engine + homepage design). The full Next.js + Payload CMS app is the next step.

## Prayer timetable pipeline

The "annual upload" is modelled as a deterministic import step (the CMS will run the same logic when an admin uploads next year's CSV).

```
data/prayer-timetable-2026.csv      # raw annual timetable (source of truth)
scripts/generate-prayer-data.mjs    # parser + validator → JSON
data/prayer-times-2026.json         # generated, typed, validated data the site reads
```

Regenerate:

```bash
node scripts/generate-prayer-data.mjs data/prayer-timetable-2026.csv data/prayer-times-2026.json 2026
```

The importer validates: row count (365/366), contiguous dates, `HH:MM` format, ascending daily order, the `Maghrib begins == J-Maghrib` invariant, and **jamā'ah outlier detection**. It currently flags the known data slip on **2026-04-15** (Isha jamā'ah `22:30` vs `21:30` neighbours) for admin review — exactly the kind of human-correctable warning the CMS will surface before publishing.

Data model per day: `fajr/dhuhr/asr/maghrib/isha = { begins, jamaah }`, plus `sunrise`. Times are local wall-clock (Europe/London) with BST/GMT already applied, so no timezone maths is needed.

## Homepage preview

```
scripts/build-home-preview.mjs      # renders a self-contained homepage from the data
docs/home-preview.html              # open in any browser — design preview
```

```bash
node scripts/build-home-preview.mjs 2026-06-09
```

The preview reflects the proposed design system (emerald + gold, Islamic geometry, Cormorant/Inter/Amiri typography) and includes the live "next jamā'ah" countdown and next-prayer highlight. It is a **static preview for stakeholder sign-off**, not the production app.
