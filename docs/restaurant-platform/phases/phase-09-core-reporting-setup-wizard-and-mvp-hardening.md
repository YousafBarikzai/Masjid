# Phase 09 — Core Reporting, Setup Wizard Completion & MVP Hardening

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP (**Milestone A exit**) |
| **Depends on** | Phases 01–08 |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 24 (core), 26 (complete), 31, 37 |
| **Modules** | `reporting` + wizard completion + platform hardening |

## Objective

Close out the MVP: a daily-operations reporting dashboard, the finished setup wizard with
a go-live readiness check, reliability/offline hardening across all apps, and the test/
security/load hardening pass that makes Milestone A production-credible for a single
restaurant.

## In scope

### Core reporting (`reporting`) — brief §24 subset
- [ ] Event-consuming read models + daily aggregates (foundation the full Phase 15 suite extends)
- [ ] Revenue dashboard: today, by hour, by category/product, food vs drinks; order count, average order value, guests, average spend/guest, table turnover; taxes, service charges, tips, discounts, refunds, failed payments
- [ ] Operational board: average accept/prep/delivery times, SLA compliance (Phase 05 breach events), delayed orders by station, cancelled/re-fired items, sold-out log, printer failures, screen outages
- [ ] Filters: date range, branch, category, waiter, station; CSV + Excel + PDF export; role-based dashboard access (finance vs reporting-only vs managers)
- [ ] **End-of-day close (Z-report style)**: daily summary incl. recorded cash — cash reconciliation gap item

### Setup wizard completion — brief §26
- [ ] Remaining steps registered: payment provider, receipt templates, branding, marketing-consent settings placeholder, reservation settings placeholder, **test order step** (guided scan→order→KDS→pay in test mode)
- [ ] **Go-live readiness check**: automated verification — menu published, tables + QR active, stations + a paired screen, printer test-print OK, payment test OK, roles assigned, hours/taxes set; produces a pass/fail checklist

### Reliability & offline hardening — brief §31
- [ ] Connection-status UX audit across customer/KDS/waiter/admin (consistent banner + behaviour)
- [ ] Safe-retry audit: every mutating call idempotent or guarded; duplicate-order/payment regression suite re-run under packet loss (toxiproxy or equivalent)
- [ ] Menu offline cache validation; KDS action-queue replay chaos test (kill websocket mid-service); print-agent offline queue chaos test
- [ ] Reconciliation issue log (mismatches surfaced, not silently dropped); device-offline management alerts

### Test / security / performance hardening — brief §§30, 37
- [ ] Load test (k6): 100 concurrent sessions ordering + kitchen bumping + payments on one branch; document results + bottlenecks fixed
- [ ] Accessibility audit (axe + manual keyboard/screen-reader pass) on all four user-facing apps; fix to WCAG 2.1 AA
- [ ] Security pass: OWASP Top-10 checklist, rate limits verified, headers/CSP, dependency audit, secrets scan; pen-test-style abuse cases (QR token brute force, session join spam, IDOR sweeps)
- [ ] Backup/restore runbook — executed restore test; monitoring/alerting baseline (health checks, error rates, queue depths) per Phase 00 monitoring doc
- [ ] **MVP demo script** (`docs/demo.md`): full happy path + recovery paths, used as the regression walkthrough for every later phase

## Out of scope

Full §24 analytics (15) · scheduled email reports (15) · CRM/marketing consent flows (10/11).

## Data model (new)

`report_daily_aggregate` tables, `report_export`, `day_close_record`, `reconciliation_issue`.

## Definition of done

- Dashboard numbers proven against seeded fixture data (golden totals incl. VAT/tips/refund edge cases).
- Go-live check fails/passes correctly as prerequisites toggle; wizard completable start-to-finish on a fresh tenant in <30 min.
- Load/chaos/a11y/security tasks executed with results committed to `docs/architecture/hardening-report.md`.
- Milestone A demo: fresh tenant → wizard → QR scan → shared order → KDS → deliver → split pay (Stripe test) → receipt + printed ticket (emulator) → dashboard shows the day. **This demo is the milestone gate.**
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 09 — the MVP closeout of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §24, §26, §31, §37.
2. Read docs/restaurant-platform/phases/phase-09-core-reporting-setup-wizard-and-mvp-hardening.md.
3. Review everything Phases 01–08 built; run the demo flow first to find gaps.
4. Build core reporting + end-of-day close, finish the wizard with the go-live readiness
   check, then execute the reliability/load/a11y/security hardening passes and commit the
   hardening report and demo script.
5. Exit gate: the full Milestone A demo runs clean on staging. Finish green.
```
