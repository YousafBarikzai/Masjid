# Phase 08 — Thermal Printing & Device Management

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phases 05 + 07 (tickets need kitchen flow; receipts need payments) |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 17 |
| **Modules** | `printing` + `apps/print-agent` |

## Objective

Kitchen tickets and customer receipts on real thermal hardware: an ESC/POS rendering
engine, category/station-based routing, a resilient on-site print agent (with an emulator
for CI), failover, health monitoring and reprints — brand-agnostic per the brief.

## In scope

### Printing module (`printing`)
- [ ] Printer registry (brief §17 fields): name, location, branch, assigned station(s), assigned menu categories, paper width (58/80 mm), copies, auto-print on/off, backup printer, connectivity type (Ethernet/Wi-Fi/USB/Bluetooth via agent)
- [ ] **ESC/POS rendering engine**: kitchen ticket template (big table number, order no, items ×qty, modifiers/removed ingredients indented, **allergens emphasised**, notes, course/priority, time) and customer receipt template (reuses Phase 07 receipt data + template config); code-page handling, cutter, buzzer flag, per-width layouts
- [ ] **Routing rules**: item station/category + order type → printer (mains → kitchen, drinks → bar, desserts → dessert, receipts → front desk); one order fans out to multiple tickets; unroutable items alert
- [ ] Print job queue: statuses (queued → sent → confirmed/failed), retries with backoff, **automatic failover to backup printer**, manual reprint from KDS (activates Phase 05 hook), waiter app and admin
- [ ] Triggers: order accepted → station tickets (auto-print config); payment captured / "request printed bill" → receipt/bill; test print
- [ ] Health: agent heartbeat, per-printer status (online/offline/error/paper-out where reported), `printing.job.failed` + `printing.printer.offline` alert events; health board in admin

### Print agent (`apps/print-agent`)
- [ ] On-site Node service: pairs to a branch with a pairing code (devices pattern from 05); receives jobs via websocket with offline queue + resume; drives network/USB ESC/POS printers; acknowledges/soft-fails jobs; auto-update-friendly config
- [ ] **Emulator mode**: renders tickets to text/PNG artefacts — used by CI snapshot tests and local dev (no hardware needed)

### Admin UI + docs
- [ ] Printers CRUD, routing matrix editor, health board, job log with reprint; wizard step: printers (+ test print in go-live check, Phase 09)
- [ ] `docs/hardware/printers.md`: recommended specs (80 mm, Ethernet, auto-cutter, ESC/POS, fast print, splash-resistant option, loud buzzer) with example models (e.g. Epson TM-T20III / TM-T88VII, Star TSP143IV) — **brands stay configurable**

## Out of scope

Notification rules engine (14) · fiscal/receipt compliance packs (16/18) · customer-facing displays (backlog).

## Data model (new)

`printer`, `print_job`, `print_template` (kitchen/receipt variants), `print_routing_rule`.

## Key events

`printing.job.queued/confirmed/failed`, `printing.printer.online/offline`.

## Definition of done

- Routing unit tests: multi-station order → correct ticket set; category overrides; backup failover on simulated failure; unroutable-item alert.
- Agent resilience tests: disconnect mid-queue → no lost or duplicated tickets on resume (idempotent job ids).
- Emulator snapshot tests: modifiers, removed ingredients, allergens, UTF-8/diacritics, 58 vs 80 mm.
- E2E: submit order → station tickets emitted (emulator artefacts); pay → receipt printed; reprint from KDS works.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 08 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §17.
2. Read docs/restaurant-platform/phases/phase-08-thermal-printing-and-devices.md — your scope.
3. Review Phase 05 (stations, device pairing) and Phase 07 (receipt data/templates).
4. Build the printing module (ESC/POS rendering, routing, queue+failover, health) and the
   print agent with emulator mode; wire KDS/waiter/admin reprints and auto-print triggers.
5. Snapshot-test tickets via the emulator. Finish green.
```
