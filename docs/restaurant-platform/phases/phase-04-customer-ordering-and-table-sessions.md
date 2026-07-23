# Phase 04 — Customer Ordering PWA & Shared Table Sessions

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phases 02 + 03 |
| **Size** | **XL** (4–6 sessions — plan first, split by workstream) |
| **Brief sections** | 2, 3, 6 |
| **Modules** | `sessions`, `orders` (workflow engine), `notifications` (foundation) + `apps/customer` |

## Objective

The heart of the product: a customer scans the table QR, joins the shared table session,
browses the effective menu, builds a personal or shared basket, submits orders (alone or
together), and watches live progress — all as a fast, installable, guest-first PWA. This
phase also builds the **configurable order-workflow engine** that kitchen (05), waiter
(06) and payments (07) plug into.

## Workstreams (suggested session split)

A. Table sessions & guests · B. Order domain + workflow engine · C. Customer PWA (menu →
basket → submit) · D. Real-time + live progress + assistance/bill/feedback.

## In scope

### Table sessions (`sessions`) — brief §3
- [ ] `table_session` lifecycle: open → locked → closed / expired; staff reopen (permission); inactivity expiry job
- [ ] Guests: nickname, assigned colour/avatar, device binding via signed cookie; rejoin-safe
- [ ] Join via QR scan, share link, or short code; **invite sharing**: WhatsApp / SMS / email deep links, native share sheet, copyable link, on-screen QR
- [ ] Session view data: who's at the table, everything ordered (per guest attribution), paid/unpaid markers (placeholders until Phase 07)
- [ ] Guest departure; session event feed; anti-abuse (join rate limits, token rotation on regenerate)
- [ ] Model hooks for staff transfer/move/merge/split of sessions (operations UI in Phase 06)

### Order domain + workflow engine (`orders`) — brief §6
- [ ] `order` + `order_item`: immutable snapshots at submit time (name, price, tax, modifiers, removed ingredients, notes, allergens) so later menu edits never mutate history
- [ ] Personal baskets + **shared table basket** (session-scoped, per-guest attribution); submit separately or together; multiple sequential orders per session ("add more drinks later")
- [ ] **Duplicate-submission prevention**: idempotency keys per submit + optimistic versioning on baskets (brief §37 concurrency scenario is a mandatory test)
- [ ] **Configurable workflow engine**: state-machine definitions per restaurant × order type; default = brief §6's 14 stages; validated transitions, per-transition permissions, full transition audit trail
- [ ] Order types: dine-in fully live; collection/takeaway/pre-order/scheduled supported by the engine and API (customer surfaces for them arrive with the website, Phase 13); delivery reserved (17)
- [ ] Staff order entry + authorised manual adjustments at API level (waiter UI in Phase 06)

### Customer PWA (`apps/customer`) — brief §2
- [ ] Scan landing: resolve QR context → restaurant branding, table, join/create session, pick nickname, "continue as guest" (account entry point stubbed for Phase 10)
- [ ] Menu browse: category navigation, search, filters (category, dietary, allergen-exclusion, price), product cards with images; product detail sheet: variants, modifier groups (min/max enforced), extras, remove ingredients, cooking instructions, kitchen notes, quantity, prep time; **prominent allergen warnings**
- [ ] Basket: sticky access, personal vs table view, who-ordered-what, edit/remove, clear totals incl. tax/service-charge preview (rules from settings)
- [ ] Submit + live order progress: per-order and per-item status timeline driven by workflow events ("preparing", "ready", "delivered")
- [ ] Table screen: guests present, full table order history, running total (payment actions arrive Phase 07 — show "pay at counter/ask for bill" affordances)
- [ ] Request assistance + request bill (creates waiter-facing flags; consumed in Phase 06)
- [ ] End-of-visit rating + free-text feedback
- [ ] PWA: installable, **offline menu cache** (ETag versioned), connection-status banner, submit-queue guard (never double-submits offline)
- [ ] UX bar (brief §32): one-handed, minimal typing, large targets, fast first load
- [ ] QR-scan → order **conversion tracking** (completes Phase 03's analytics)

### Real-time & notifications foundation
- [ ] Socket rooms: session, table, branch; server fan-out from order/session events
- [ ] `notifications` module foundation: persistent in-app notification records + websocket delivery (KDS/waiter consume in 05/06); assistance/bill-request notification types live now
- [ ] Live floor view (from Phase 03) now shows real statuses: browsing / ordering / order submitted

## Out of scope

Payments & bill view with real balances (07) · kitchen/waiter UIs (05/06) · customer accounts & saved preferences (10) · courses & coordination (14).

## Data model (new)

`table_session`, `session_guest`, `session_invite`, `basket`, `basket_item`, `order`,
`order_item`, `order_status_definition` (workflow config), `order_status_transition`
(audit), `notification`.

## Key events

`sessions.session.opened/closed/expired`, `sessions.guest.joined/left`,
`orders.order.submitted/accepted/status_changed`, `orders.item.status_changed`,
`service.assistance.requested`, `service.bill.requested`.

## Definition of done

- **Concurrency suite**: 4 guests, same session — simultaneous joins, simultaneous edits to shared basket, simultaneous submits → no duplicates, no lost items, consistent totals (this is the phase's exit gate).
- E2E: scan → join → browse → modify product with modifiers → shared submit → live status updates on a second device.
- Workflow engine: transition validation + permission tests; custom per-restaurant flow honoured end-to-end.
- Offline: menu browsable offline; submit blocked with clear state; no duplicate order after reconnect.
- Mobile Lighthouse on menu page: performance ≥ 90, a11y ≥ 95.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 04 of the restaurant platform — the largest MVP phase.
1. Read docs/restaurant-platform/README.md and original-brief.md §2, §3, §6.
2. Read docs/restaurant-platform/phases/phase-04-customer-ordering-and-table-sessions.md.
3. Review Phases 00–03 (effective-menu resolver, QR scan context, floor statuses — consume them).
4. Propose an implementation plan split across the four workstreams, then build:
   sessions, the order workflow engine, the customer PWA, real-time updates.
5. The concurrency test suite (simultaneous shared-session ordering) is the exit gate.
   Update the Bella Vista seed with a scripted demo session. Finish green.
```
