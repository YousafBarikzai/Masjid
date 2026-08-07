# Phase 05 — Kitchen Display System & Stations

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phase 04 (parallel with 06/07 possible) |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 11, 12, 13 (core timers; advanced SLA → Phase 14) |
| **Modules** | `kitchen`, `devices` + `apps/kds` |

## Objective

Real-time kitchen operations: preparation stations, automatic routing of submitted order
items to station queues, and a touch-first KDS app for large kitchen screens — dark,
glanceable, colour-coded (never colour-only), with elapsed/target timers and audio alerts.
Includes the screen/workstation management module (device pairing + per-screen config).

## In scope

### Stations & routing (`kitchen`) — brief §12
- [ ] Station entities (main kitchen, grill, fry, pizza, dessert, bar, cold drinks, coffee, pastry, collection point — free-form per branch); upgrade Phase 02's station tags on products to real station assignments (multi-station capable)
- [ ] On `orders.order.submitted/accepted`: fan out order items into **preparation tasks** per station; station queues; order-card aggregation (a card shows its station's items, with sibling-station context)
- [ ] Priority flag; course info displayed if present (coordination logic itself is Phase 14)

### Kitchen actions — brief §11
- [ ] Accept order · start prep · pause · per-item preparing/ready · whole-order ready · recall/undo (permission-gated) · send back for clarification (reason → waiter notification) · flag missing ingredient → triggers `menu` sold-out signal · mark item unavailable · request waiter support · view previous/completed orders · reprint ticket hook (activates in Phase 08)
- [ ] All transitions flow through the Phase 04 workflow engine (permissions + audit; customer progress updates automatically)

### Timers core — brief §13 (subset)
- [ ] Effective target prep time resolution: product → category → station → restaurant default
- [ ] Card timers: time since submit, time since started, target, remaining/overdue
- [ ] Threshold states with **configurable colour tokens + mandatory icon/label**: waiting (grey), preparing (blue), approaching SLA (amber), exceeded (red), ready (green), awaiting collection (purple) — restaurant-configurable palette
- [ ] Audio + visual alerts on new order / approaching / exceeded; SLA breach events recorded for reporting (09/15)

### Screens & devices (`devices`) — brief §12
- [ ] Device registration via **pairing code** (no staff login typing in kitchens); device identity tokens; revoke
- [ ] Per-screen config: name, location, assigned station(s), branch/floor filter, order-type filter, service-period filter, view mode (all / ready / delayed / priority), layout columns, font scale, sound on/off + volume, SLA display, auto-refresh, full-screen, allowed users, backup station, printer assignment (used in 08)
- [ ] Heartbeats; offline detection → `devices.screen.offline` alert event (surfaces in 09 dashboards)

### KDS app (`apps/kds`)
- [ ] Kitchen dark theme, full-screen, wake-lock; huge touch targets; distance-readable type
- [ ] Order cards: table + order number, guest name, elapsed vs target timer, items with quantity, **modifiers and removed ingredients explicit**, allergen badges, notes, priority, status pill
- [ ] One-tap bump flow (start → ready), per-item taps, undo, filters (station/status), ready lane, recall lane
- [ ] **Offline resilience**: action queue with optimistic UI; replay-on-reconnect with idempotent server handling; visible connection state

### Wizard steps
- [ ] Preparation stations, kitchen screens (pair a screen)

## Out of scope

Course coordination & cross-station sync, peak-hour/weekend SLA schedules, escalation chains (→ 14) · printing (08) · waiter app (06).

## Data model (new)

`kitchen_station`, `preparation_task`, `kitchen_screen` (device + config), `sla_rule`
(core fields; extended in 14), `sla_breach_event`.

## Key events

`kitchen.order.accepted`, `kitchen.item.started/ready`, `kitchen.order.ready`,
`kitchen.order.sent_back`, `kitchen.item.flagged_unavailable`, `kitchen.sla.warning/exceeded`,
`devices.screen.online/offline`.

## Definition of done

- Routing tests: multi-station order splits correctly; single-station screens see only their items; whole-order readiness computed across stations.
- Transition permission + undo tests; sold-out flag from KDS reaches the menu resolver.
- Offline replay test: actions taken while disconnected apply exactly once after reconnect.
- Playwright E2E at kitchen-screen viewport (1080p touch): submit order (Phase 04 flow) → appears on correct station screen → bump to ready → customer sees "ready".
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 05 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §11–13.
2. Read docs/restaurant-platform/phases/phase-05-kitchen-display-system.md — your scope.
3. Review Phase 04's workflow engine and events — kitchen states must flow through it.
4. Build stations/routing, kitchen actions, core timers, device pairing + screen config,
   and the KDS app with offline action replay.
5. E2E the full order→kitchen→ready→customer loop. Finish green.
```
