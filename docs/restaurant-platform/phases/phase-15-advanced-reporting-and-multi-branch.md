# Phase 15 — Advanced Reporting & Multi-Branch Operations

| | |
|---|---|
| **Milestone** | B — Enhanced Operations (**Milestone B exit**) |
| **Depends on** | Phase 09 (+ whichever of 10–14 have shipped) |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 24 (full), 1 (multi-branch operationalisation) |
| **Modules** | `reporting` (full), cross-branch admin |

## Objective

Complete the analytics suite (every brief §24 metric, comparisons, scheduled reports) and
turn the multi-branch data model — present since Phase 01 — into a real multi-branch
operation: consolidated dashboards, menu propagation with override review, settings
inheritance, and branch-isolation regression proof.

## In scope

### Full reporting — brief §24
- [ ] Revenue dimensions completed: by branch, floor, table, waiter, order type, category, product; food/drinks/dessert splits incl. alcoholic vs non-alcoholic; discounts, promotions, taxes, service charges, tips, refunds, failed payments
- [ ] Business metrics: AOV, average spend per guest, table turnover, guests, orders, bookings, no-shows, **customer registration rate, returning-customer rate, promotion redemption rate** (10/11/12 data)
- [ ] Operational suite completed: acceptance/prep/delivery averages, **SLA compliance by station** (14 data), delayed orders by station, food-waiting-for-collection, waiter collection time, **check-back completion** (14), cancelled/refunded/re-fired items, sold-out log, printer failures, screen outages
- [ ] Comparisons vs previous period/year; saved report views; **scheduled email reports** (recipients, cadence, format); exports (CSV/Excel/PDF) hardened; role-based dashboard packs (owner / branch manager / kitchen manager / finance / marketing / reporting-only)
- [ ] Warehouse-friendly daily extract (S3 drop) for BI tools (prepares Phase 16 integrations)
- [ ] **Tips distribution (tronc) report** and cross-branch **cash reconciliation** (plan gap items)

### Multi-branch operationalisation — brief §1
- [ ] Consolidated multi-branch dashboards + branch comparison views
- [ ] **Menu propagation**: publish a group/restaurant menu to selected branches with per-branch price/availability overrides and an override-review screen (drift visibility)
- [ ] Settings inheritance audit UI (group → restaurant → branch, override tracking from Phase 01 surfaced)
- [ ] Per-branch operating calendars honoured everywhere (ordering, reservations, reports)
- [ ] Branch-scoped roles verified across all Phase 10–14 features; **multi-branch isolation regression suite** re-run and extended (brief §37)

### Performance
- [ ] Seed a 1M-order synthetic dataset; dashboards < 2s p95; aggregate jobs idempotent + backfillable

## Out of scope

Group/franchise consoles, white-label, brand-level rollups (18) · public BI API (16).

## Data model (new/extended)

Aggregate tables per dimension, `report_schedule`, `report_view`, `menu_propagation`
(publish + override records), `branch_calendar`.

## Definition of done

- Golden-total tests: every dashboard number derivable from raw event fixtures (incl. VAT, tips, refunds, multi-branch splits).
- Scheduled report E2E (email with attachment on cron); export files open clean in Excel.
- Menu propagation E2E: publish → overrides preserved → drift report accurate.
- Isolation suite green: no metric, list or export ever leaks across branches/tenants.
- p95 dashboard latency target met on the synthetic dataset.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 15 of the restaurant platform — the Milestone B closeout.
1. Read docs/restaurant-platform/README.md and original-brief.md §24 and §1.
2. Read docs/restaurant-platform/phases/phase-15-advanced-reporting-and-multi-branch.md.
3. Review Phase 09's reporting foundation and the event streams from Phases 10–14.
4. Complete the full metric suite with comparisons + scheduled reports, operationalise
   multi-branch (propagation, inheritance, consolidated views), and prove isolation.
5. Golden-total tests against fixtures are the exit gate. Finish green.
```
