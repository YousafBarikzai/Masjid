# Phase 17 — Delivery Platform Adapters

| | |
|---|---|
| **Milestone** | C — Integrations & Scale |
| **Depends on** | Phase 16 |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 28 |
| **Modules** | `delivery` (adapter framework) + channel ops UX |

## Objective

Third-party delivery without coupling: a `DeliveryProvider` adapter framework (Uber Eats,
Deliveroo, Just Eat, regional providers) that ingests channel orders into the normal
kitchen flow, maps external products to internal ones, syncs availability/prices where
supported, and reports revenue/commissions by channel. One simulator adapter ships for
tests and demos; a real sandbox adapter ships if credentials are available.

## In scope

### Adapter framework
- [ ] `DeliveryProvider` port: order ingest (webhook/poll), accept/reject, status push (accepted → preparing → ready → collected), cancellation handling both directions, menu/price/availability push where the provider supports it, commission + payout fields
- [ ] **Adapter conformance test suite** — any new provider adapter must pass it (ingest idempotency, out-of-order events, cancellation races, mapping gaps)
- [ ] Reference adapters: (a) **simulator** (drives demos/CI, generates realistic channel orders), (b) one real provider sandbox if credentials are available (e.g. Deliveroo/Uber Eats) — otherwise document the certification steps

### Order flow integration
- [ ] Activate the `delivery` order type in the workflow engine (04); channel orders enter station routing (05) with **distinct channel badges** on KDS/waiter surfaces + pickup-time countdown
- [ ] Idempotent ingest (provider event ids); quarantine queue for unmappable orders with staff resolution UI; refund/cancellation propagation to the channel

### Product mapping
- [ ] Mapping UI: external item/modifier ↔ internal product/modifier (suggestions by name/price), coverage report, unmapped-item alerts; per-branch channel menus (subset selection + channel-specific pricing)
- [ ] Availability sync: internal sold-out/pause (02) propagates to channels; channel-side pauses reflected internally; price sync where supported

### Channel operations & reporting
- [ ] Channel dashboard: connection health, paused items, sync errors, rejected/failed orders; per-branch channel settings (hours, auto-accept rules, prep-time defaults)
- [ ] Reporting **by channel** (15 integration): orders, revenue, commissions, net payout, cancellations; reconciliation against provider statements (fixture-based)
- [ ] §27 notification triggers added: new channel order, channel disconnect, sync failure

## Out of scope

First-party delivery/driver management (backlog) · aggregator dispatch optimisation (backlog) · marketplace listing UX (18).

## Data model (new)

`delivery_channel`, `channel_credential`, `channel_order_link`, `product_mapping`,
`channel_menu`, `channel_sync_log`, `channel_settlement`.

## Key events

`delivery.order.received/accepted/rejected/cancelled`, `delivery.sync.failed`,
`delivery.channel.disconnected`.

## Definition of done

- Conformance suite green for both reference adapters; documented steps to add a third.
- Ingest chaos tests: duplicate webhooks, out-of-order status, cancel-after-ready → kitchen state stays consistent, no ghost orders.
- E2E (simulator): channel order → mapped → KDS shows channel badge → ready → status pushed back → appears in channel revenue report with commission.
- Sold-out propagation < 60s to channels; unmapped item lands in quarantine with alert, resolvable without code.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 17 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §28.
2. Read docs/restaurant-platform/phases/phase-17-delivery-platform-adapters.md — your scope.
3. Review Phase 16 (ports/webhooks) and Phases 04/05 (workflow engine, routing) — channel
   orders must flow through the normal kitchen pipeline.
4. Build the DeliveryProvider framework + conformance suite, the simulator adapter (and a
   real sandbox adapter if credentials exist), mapping UI, sync, and channel reporting.
5. Ingest idempotency and cancellation-race tests are mandatory. Finish green.
```
