# Phase 03 — Floors, Tables & QR Codes

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phase 01 (can run parallel with 02) |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 9, 10 |
| **Modules** | `floor`, `qr` + visual floor editor in admin |

## Objective

Model the physical restaurant — floors, areas, tables, waiter sections — with a visual
floor-plan editor, and give every table a secure, brandable, trackable QR code. The QR
scan endpoint resolves the full context (restaurant → branch → floor → table → menu)
that Phase 04's customer app lands on.

## In scope

### Floor domain (`floor`)
- [ ] Floors per branch; areas with flags: indoor/outdoor, private room, accessible
- [ ] Tables: number/name, seating capacity, shape (rect/round/bar), canvas position/size/rotation, accessible flag, active/out-of-service
- [ ] Waiter sections (named table groups, waiter assignment)
- [ ] Table status field with the full brief §9 vocabulary (Available … Out of service). This phase supports **manual** status set + real-time broadcast; live automatic transitions arrive with sessions (04), kitchen (05), waiter (06), payments (07)
- [ ] Table grouping for merge/split (linked-table group model; operational flows in 06)

### Visual floor editor (admin)
- [ ] Canvas editor: drag/resize/rotate, snap-to-grid, shapes, table numbers, capacity badges, area tabs + floor switcher, bulk "add N tables"
- [ ] Assign tables to waiter sections (colour + label overlay, not colour-only)
- [ ] Live floor view (read-only): real-time status via websocket, legend with icon + text per status, accessibility indicators

### QR codes (`qr`)
- [ ] One QR per table + QRs for counters/hotel rooms/custom locations
- [ ] **Opaque signed tokens** (random id + HMAC; no internal ids), per-QR menu override, active/disabled state, regenerate (old token immediately invalid)
- [ ] Scan endpoint: token → context payload (restaurant, branch, floor, table, assigned menu, ordering options, supported payment methods placeholder) + `qr.scanned` tracking event (conversion-to-order linked in Phase 04)
- [ ] Print/export: branded PNG/SVG/PDF — logo, table number, short instructions, size presets; single + full-sheet export; download bundle (zip)
- [ ] Scan analytics data captured for reporting (scans, unique devices, later conversion)

### Wizard steps
- [ ] Floors & areas, tables, QR codes

### Seed
- [ ] Bella Vista: 2 floors (Ground incl. outdoor terrace area, First incl. private room), 12 tables across areas, 2 waiter sections, QR codes generated

## Out of scope

Table sessions & customer landing UX (04) · live automatic status transitions (04–07) · reservation overlays (12).

## Data model (new)

`floor`, `restaurant_area`, `restaurant_table`, `table_group`, `waiter_section`,
`qr_code`, `qr_scan`.

## Key events

`floor.table.status_changed`, `qr.code.generated/disabled`, `qr.scanned`.

## Definition of done

- Token security tests: unguessable, HMAC-verified, disabled/regenerated tokens rejected.
- Editor E2E: create floor → add/drag tables → assign section → export QR sheet PDF.
- Scan endpoint returns correct context incl. per-QR menu override; disabled QR returns a friendly error state.
- Live floor view updates <1s on manual status change.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 03 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §9–10.
2. Read docs/restaurant-platform/phases/phase-03-floors-tables-and-qr-codes.md — your scope.
3. Review Phases 00–02. Build the floor domain, visual editor, live floor view, and the
   secure QR system with branded printing and the scan-context endpoint.
4. Security-test QR tokens; E2E the editor + QR sheet export. Update the seed. Finish green.
```
