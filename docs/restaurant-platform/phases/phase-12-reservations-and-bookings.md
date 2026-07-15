# Phase 12 — Reservations & Bookings

| | |
|---|---|
| **Milestone** | B — Enhanced Operations |
| **Depends on** | Phase 03 (10 useful for account bookings; 07 for deposits) |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 22 |
| **Modules** | `reservations` + booking widget, staff diary & floor overlay |

## Objective

Online booking with a real availability engine (durations, buffers, table combinations,
overbooking rules), deposits, reminders, waiting lists and no-show tracking — plus the
staff-side diary and floor-plan overlay, walk-in seating, and conversion of a reservation
into a live table session (with optional pre-orders fired to the kitchen on arrival).

## In scope

### Availability engine
- [ ] Inputs: table inventory + capacities (03), seating duration by party size/service period, buffer time, **table combinations** (linked groups), per-service max capacity, overbooking rules, branch operating hours + special dates (01)
- [ ] Slot search API (branch, date, party size → offered times/areas); hold-while-booking (short TTL locks); **no double-booking under concurrency** (property tests)

### Booking lifecycle — brief §22 customer list
- [ ] Guest or account booking: branch, date, time, party size, indoor/outdoor preference, area request, accessibility requirements, high chair, dietary notes, celebration details
- [ ] Deposits where rules require (Stripe via Phase 07 port: pre-auth or charge; refund per cancellation policy); cancellation windows; modify/cancel by customer (secure link) or staff
- [ ] Confirmations + **automated reminders** (email/SMS/WhatsApp via messaging ports; consent-aware); add-to-calendar (ICS)
- [ ] Waiting list: join, auto-offer on release (expiring offers); booking sources (web/phone/walk-in) + notes; no-show tracking (+ repeat no-show flag in CRM)

### Staff surfaces
- [ ] **Reservation diary**: day/week views, timeline per area, create/edit/move, colour+icon status (booked/confirmed/arrived/seated/no-show/cancelled)
- [ ] **Floor-plan overlay** (Phase 03 canvas): upcoming reservations on tables, conflicts highlighted; walk-in seating
- [ ] Arrival flow: mark arrived → seat → **convert to table session** (Phase 04) on the assigned table(s); QR scan at table attaches to the reserved session; waiter app shows "reservations arriving soon" (activates Phase 06 placeholder); no-show risk alert after grace period
- [ ] **Pre-orders for reservations**: attach menu selections at booking or via a pre-order link; on seating, fire to kitchen per configured timing (Phase 05)

### Customer surfaces
- [ ] Booking widget (embeddable; used standalone now, on the website in Phase 13), manage-booking page, waitlist state; account booking history (activates Phase 10 placeholder)
- [ ] Wizard step: reservation settings (durations, buffers, deposits, policies) — completes Phase 09 placeholder

## Out of scope

Website shell around the widget (13) · central group-level reservation views (18) · table-optimising auto-assignment beyond rules (backlog).

## Data model (new)

`reservation`, `reservation_table_assignment`, `reservation_policy` (durations/buffers/
deposit/cancellation rules), `waitlist_entry`, `reservation_reminder`.

## Key events

`reservations.booking.created/confirmed/modified/cancelled`, `reservations.guest.arrived`,
`reservations.booking.no_show`, `reservations.waitlist.offered`,
`reservations.session.converted`.

## Definition of done

- Concurrency property tests: parallel booking attempts on the last slot/table combination → exactly one succeeds; holds expire cleanly.
- Policy tests: deposit charge/refund per cancellation window; overbooking rule boundaries; combination allocation (2+2 → 4-top vs combined tables).
- E2E: book online (with deposit, Stripe test) → reminder scheduled → arrive → seat → session conversion → pre-order fires to KDS → complete; no-show path records correctly.
- Diary + overlay update in real time; reminders respect consent and quiet hours.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 12 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §22.
2. Read docs/restaurant-platform/phases/phase-12-reservations-and-bookings.md — your scope.
3. Review Phases 03/04/05/07 (tables, sessions, kitchen firing, payment port) — the
   reservation→session conversion must reuse them, not duplicate them.
4. Build the availability engine (concurrency-safe), booking lifecycle with deposits and
   reminders, waitlist, staff diary + floor overlay, and pre-order firing.
5. Property-test availability under parallel load. Finish green.
```
