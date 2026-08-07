# Phase 06 — Waiter Operations

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phase 04 (05 useful for collection alerts) |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 15, 16 (core; configurable rules engine → Phase 14) |
| **Modules** | `service` + `apps/waiter` |

## Objective

Give waiters a phone/tablet-first command centre: their tables at a glance, a priority
task feed (assistance, bill, food ready, check-backs), full table operations (seat, order
on behalf, deliver, move/merge/split, close), and the approval-gated actions (cancel,
discount) — plus a large-screen waiter-station view.

## In scope

### Service domain (`service`) — brief §16 core
- [ ] Waiter task engine with default triggers: greet on seat → drinks check → "has food arrived" X min after kitchen-ready/delivered → satisfaction check-back (configurable delay) → dessert offer after mains cleared → present bill on request → mark-for-cleaning after close
- [ ] Simple per-restaurant timing settings now (numbers, on/off per task type); full visual rules engine arrives in Phase 14
- [ ] Task outcomes (brief §16 list: completed, satisfied, issue reported, manager required, replacement requested, follow-up, declined); outcomes feed reporting (09/15)
- [ ] Task assignment by waiter section (Phase 03); unassigned-table fallback pool; escalation to duty manager if unacknowledged (basic timer)

### Waiter capabilities — brief §15
- [ ] Open table / seat guests (creates or attaches table session); add guests
- [ ] **Order on behalf**: same effective-menu + basket flow as customers, with waiter shortcuts (recent items, numeric keypad quantities, per-seat attribution, kitchen notes); edit before submit; send to kitchen
- [ ] Mark items/orders delivered (drives workflow + check-back timers)
- [ ] Re-fire request (reason → kitchen); cancel item (permission + reason; **approval workflow** from Phase 01 when beyond threshold)
- [ ] Authorised discounts (%/amount, threshold-gated manager approval, audited); service-charge removal hook (finalised with bills in 07)
- [ ] Move order to another table · **merge/split tables · transfer full session** (activates Phase 04's model hooks; statuses + QR routing stay correct)
- [ ] Record cash/terminal payment **placeholder** (real recording lands with the ledger in 07); reprint receipt hook (08); request printed bill hook (08)
- [ ] Close table (blocked while unpaid items exist once 07 lands — feature-flag the check until then); reopen (manager); record customer feedback; mark cleaned

### Waiter app (`apps/waiter`)
- [ ] **My tables board**: live status per table (from floor + session + kitchen events), badges for assistance / bill / ready items / overdue / failed payment (07) / arriving reservation (12 — placeholder)
- [ ] **Priority task feed**: single ordered list (assistance > bill > ready-to-collect > check-backs), one-tap acknowledge/complete with outcome picker
- [ ] Table detail: guests, orders, item states, actions above; mobile-first, thumb-reachable, minimal navigation (brief §32)
- [ ] Ready-for-collection notifications with audio/vibration; "waiting too long" overdue emphasis
- [ ] Large-screen waiter-station mode: section-wide wallboard (read-mostly)
- [ ] Mobile floor view (Phase 03 canvas, tap table → detail)

### Wizard step
- [ ] Waiter sections & task timing defaults

## Out of scope

Real payment recording & bill state (07) · printed bills/receipts (08) · configurable rules engine + drink-replenish heuristics (14) · reservation arrivals (12).

## Data model (new)

`waiter_task` (type, trigger ref, due, assignee, outcome), `service_request`
(assistance/bill — formalises Phase 04 flags), `table_transfer_log`.

## Key events

`service.task.created/completed/escalated`, `service.order.delivered`,
`service.refire.requested`, `orders.item.cancelled`, `orders.discount.applied`,
`sessions.session.transferred/merged/split`.

## Definition of done

- E2E waiter journey: seat walk-in → order on behalf → kitchen ready (05) → collect + deliver → check-back task appears on schedule → close table.
- Permission tests: cancel/discount thresholds require approval; approvals audited.
- Merge/split/transfer tests: item attribution, statuses and customer session views stay consistent (customers on moved table keep working sessions).
- Assistance request (Phase 04 customer tap) reaches the right section's waiter in <2s; escalates if unacknowledged.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 06 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §15–16.
2. Read docs/restaurant-platform/phases/phase-06-waiter-operations.md — your scope.
3. Review Phases 04–05: sessions, workflow engine, kitchen events — the waiter app is a
   consumer of all three.
4. Build the service task engine, waiter capabilities (incl. merge/split/transfer and
   approval-gated cancel/discount) and the waiter app (mobile + station modes).
5. E2E the full waiter journey. Finish green.
```
