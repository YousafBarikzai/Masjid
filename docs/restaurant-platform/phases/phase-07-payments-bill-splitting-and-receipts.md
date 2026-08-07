# Phase 07 — Payments, Bill Splitting & Digital Receipts

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phase 04 (06 useful; parallel with 05 possible) |
| **Size** | **XL** (4–6 sessions — plan first, split by workstream) |
| **Brief sections** | 7, 8 |
| **Modules** | `payments`, `receipts` + customer bill UX, waiter/admin payment surfaces |

## Objective

Money, done correctly: a session bill ledger with **per-item payment allocation** (double
paying an item is structurally impossible), every splitting mode from the brief, Stripe
integration behind a provider port (Apple/Google Pay, 3DS/SCA), tips, refunds with
approval, cash/terminal recording, reconciliation data, and configurable digital receipts.
This phase carries the highest correctness risk in the MVP — concurrency tests gate exit.

## Workstreams (suggested session split)

A. Bill ledger + allocation engine · B. Provider port + Stripe adapter + webhooks ·
C. Customer bill & splitting UX · D. Refunds, staff surfaces, receipts.

## In scope

### Bill ledger & allocation (`payments`)
- [ ] Session bill aggregation: items (snapshots from 04), taxes (per tax category), service-charge rules (from settings; **manager-removable with reason + audit** — plan gap item), discounts (from 06; voucher/loyalty/promotion hooks stubbed behind ports for Phase 11)
- [ ] **`payment_allocation`**: every paid pennyworth maps to order items / charge lines; DB constraints + serialised allocation prevent double-pay under concurrency
- [ ] Split modes (brief §7): pay full table · pay own items · pick specific items · split remainder equally n-ways (penny-exact distribution) · percentage · custom amount · fixed contribution · pay for another guest; multiple payers at different times; multiple methods per session
- [ ] Live bill state for all guests: total / paid / remaining / tax / service / tips / discounts / refunds / **who paid what, which items each payment covered**
- [ ] Idempotency keys on every payment mutation; optimistic locking on the bill; concurrent-payer safety (two guests grabbing the same items → one wins cleanly, other re-prompted)

### Provider integration
- [ ] `PaymentProvider` port (authorise, capture, refund, webhooks, saved-method hooks) + **Stripe adapter**: PaymentIntents, Payment Element, **Apple Pay / Google Pay**, 3DS/SCA
- [ ] Auth-then-capture and immediate capture modes (restaurant config: pay-first vs pay-later per order type)
- [ ] Webhook handling: idempotent, signature-verified, out-of-order tolerant; failed-payment recovery (retry, switch method) with waiter alert on final failure
- [ ] Cash + card-terminal recording by staff (attested, audited); "pay at counter" and "request card machine" customer flows; chargeback reference fields; reconciliation dataset (provider payout ↔ platform payments)

### Tips
- [ ] Preset % + custom tip at pay time; tips tracked per payment/waiter-section for reporting (tronc report in 15)

### Refunds
- [ ] Full/partial (item-level or amount), permission + approval workflow (01), reason codes, provider refund + allocation reversal, customer notification + refund receipt

### Customer UX (`apps/customer`)
- [ ] Bill screen: live totals, per-guest breakdown, remaining balance; split-mode picker designed for one hand and low friction (brief §32); tip step; Payment Element sheet; success state; partial-payment states visible to the whole table live; "request printed bill" (08)
- [ ] Payment status in session view: paid/unpaid per item (completes Phase 04 placeholders); table close state when balance reaches zero

### Staff surfaces
- [ ] Waiter: view live bill, record cash/terminal, trigger refund request, re-open bill (manager), close paid table (unblocks Phase 06 close-check)
- [ ] Admin: payments browser, refunds queue (approvals), reconciliation export, payment settings (provider keys, capture mode, tips presets, service-charge behaviour) — settings changes audited + permission-gated (brief §25)

### Receipts (`receipts`) — brief §8
- [ ] Receipt per payment + consolidated session receipt; branch-scoped sequential numbering (gap-tracked)
- [ ] Configurable template: restaurant/branch details, table, order numbers, items, VAT breakdown, service charge, tips, payment breakdown (who/method), refunds, loyalty placeholder, promotional footer message
- [ ] Delivery: email (Mailpit in dev), downloadable PDF, in-account (10), share link; WhatsApp/SMS behind the messaging port (wired when channels land, 11/14); print routing hook (08)
- [ ] Wizard steps: payment provider, receipt templates; **test-payment step**

## Out of scope

Voucher/loyalty/promotion redemption engines (11 — ports only) · printed output (08) · saved cards & customer accounts (10) · gift-card issuance (11+).

## Data model (new)

`bill` (or session-bill view), `payment`, `payment_allocation`, `refund`, `tip`,
`cash_record`, `receipt`, `receipt_template`, `reconciliation_entry`.

## Key events

`payments.payment.authorised/captured/failed`, `payments.allocation.created`,
`payments.refund.requested/completed`, `payments.bill.settled`, `receipts.receipt.issued`.

## Definition of done (exit gate)

- **Concurrency suite**: simultaneous payers on one session — same items targeted, equal-split race, pay-remainder race → no double-pay, penny-exact totals, everyone converges to the same live bill. Property-based tests over random split sequences: `Σ allocations = Σ paid`, remaining never negative.
- Stripe test-mode E2E incl. 3DS challenge and Apple/Google Pay (test cards); webhook replay/out-of-order tests.
- Refund E2E with approval + audit; reconciliation export matches provider fixture.
- Receipt snapshot tests (PDF + email) incl. VAT rounding cases; numbering continuity test.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 07 of the restaurant platform — the money phase.
1. Read docs/restaurant-platform/README.md and original-brief.md §7–8.
2. Read docs/restaurant-platform/phases/phase-07-payments-bill-splitting-and-receipts.md.
3. Review Phase 04 (order snapshots, session live-state) and Phase 01 (approvals, settings).
4. Propose a plan across the four workstreams, then build: the allocation ledger, the
   Stripe adapter behind the PaymentProvider port, all split modes, refunds, receipts.
5. The concurrent-payment property tests are the exit gate. Never store raw card data.
   Finish green with the full scan→order→pay→receipt demo working.
```
