# Phase 14 — Advanced Kitchen & Service Coordination

| | |
|---|---|
| **Milestone** | B — Enhanced Operations |
| **Depends on** | Phases 05, 06, 08 |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 13 (full), 14, 16 (full), 27 |
| **Modules** | `kitchen` (SLA+courses), `service` (rules engine), `notifications` (full) |

## Objective

Precision service: full SLA management with schedules and escalation chains, course-based
serving with cross-station synchronisation ("grill and fryer finish together"), the
configurable service-task rules engine, and the platform-wide notification rules engine
covering every brief §27 trigger and channel.

## In scope

### Full SLA management — brief §13
- [ ] SLA schedules: peak-hour windows, weekday vs weekend, branch-specific, course-level targets; category/station/product overrides consolidated into one resolution order (documented)
- [ ] Warning + escalation thresholds → **escalation chains** (station screen → kitchen manager → duty manager) with acknowledgement tracking
- [ ] Alert conditions: approaching SLA, exceeded, **one station delaying a whole-table order**, food ready too long, waiter not collecting, customer waiting too long since submit
- [ ] Full-table coordination timer; SLA performance dataset finalised for Phase 15 analytics

### Course coordination — brief §14
- [ ] Courses on orders: starter/main/dessert/drinks/custom; customer or staff selects serve strategy per order: as-ready / together / hold / by-course / after-delay
- [ ] Fire control: auto-fire rules (e.g. fire mains when starters bumped + N min) and waiter "fire now" (Phase 06 integration)
- [ ] **Cross-station sync**: compute staggered start times from item prep times so a course completes together; KDS shows "hold n min" / "waiting on grill" dependency hints; recompute on delays
- [ ] Kitchen capacity throttling (plan gap item): max concurrent orders per station, pause station intake, customer-facing prep-time inflation when saturated

### Service-task rules engine — brief §16 full
- [ ] Visual rule builder: trigger event + delay + conditions → task (e.g. "5 min after food delivered → satisfaction check; 15 min later → second check; mains cleared → dessert offer")
- [ ] Drink-replenishment heuristic (elapsed since last drinks order vs table size); configurable per restaurant/branch
- [ ] Check-back **compliance recording** → management report (15)

### Notification rules engine — brief §27
- [ ] Rules: platform event (full §27 trigger list: new order, awaiting acceptance, SLA warnings/breaches, food ready/waiting, collection required, assistance, bill request, payment failure, refund request, sold out, printer offline, screen offline, new/cancelled booking, customer arrival, no-show risk, approval required) → audience (role / station / screen / specific users) → channels (in-app, screen alert, audio, email, SMS, WhatsApp, push) → throttle/dedupe/quiet hours
- [ ] Per-restaurant configuration UI with sensible defaults; delivery log + failure visibility; reuses messaging ports (11) and device channels (05/08)

## Out of scope

Marketing sends (11 owns customer-facing campaigns) · SLA analytics dashboards (15) · delivery-channel order alerts (17 adds its triggers to this engine).

## Data model (new/extended)

`sla_schedule`, `escalation_chain`, `course` (order dimension), `fire_plan`,
`service_rule`, `notification_rule`, `notification_delivery`.

## Key events

`kitchen.course.fired`, `kitchen.sync.recomputed`, `kitchen.station.saturated`,
`service.checkback.recorded`, `notifications.rule.triggered`.

## Definition of done

- Course-sync simulation tests: multi-station mains finish within tolerance under normal and delayed conditions; holds/dependency hints render on KDS.
- Escalation chain tests incl. acknowledgement stopping propagation.
- Rules-engine E2E: configure "check back 5 min after delivery" → task appears on waiter app on time; compliance recorded.
- Notification engine: every §27 trigger mapped in defaults; throttle/dedupe/quiet-hours tests; no channel bypasses consent for customer-facing messages.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 14 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §13, §14, §16, §27.
2. Read docs/restaurant-platform/phases/phase-14-advanced-kitchen-and-service-coordination.md.
3. Review Phases 05/06/08 (kitchen tasks, waiter tasks, device channels) — you are
   upgrading them, not rebuilding.
4. Build full SLA schedules + escalations, course coordination with cross-station sync,
   the service-task rules engine, and the platform notification rules engine.
5. Simulation-test course sync and escalations. Finish green.
```
