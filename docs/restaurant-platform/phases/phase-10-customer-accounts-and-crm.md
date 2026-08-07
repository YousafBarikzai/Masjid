# Phase 10 — Customer Accounts, CRM & Consent

| | |
|---|---|
| **Milestone** | B — Enhanced Operations |
| **Depends on** | Phases 04 + 07 |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 5, 19 |
| **Modules** | `customers`, `crm` + PWA account area, admin CRM |

## Objective

Turn anonymous guests into known customers — optional, never blocking ordering: accounts
with OTP/social sign-in, saved preferences and payment methods, order/receipt history,
configurable registration incentives, granular consent records, GDPR self-service, and a
consent-aware CRM with segmentation for Phase 11's marketing.

## In scope

### Customer accounts (`customers`) — brief §5
- [ ] Registration/sign-in: email or mobile + **one-time verification code**; optional password; social login (Google/Apple) behind feature flags; guest → account upgrade mid-session without losing basket/session
- [ ] Profile: personal details, saved dietary preferences + allergens (auto-applies menu filters/warnings in the PWA), favourite products/branch, language preference
- [ ] Saved payment methods via provider tokens only (Stripe Customer + SetupIntents; toggleable per restaurant)
- [ ] Order history, digital receipts, booking history placeholder (12), vouchers/rewards placeholders (11)
- [ ] **Consent records** (brief §5/§19): marketing, email, SMS, WhatsApp, privacy — each with timestamp, source, policy version; granular update UI; unsubscribe status
- [ ] **Configurable registration incentives**: admin-defined (percentage discount / free item / loyalty points / birthday reward / welcome voucher — type + rules, not hard-coded); simple % welcome discount redeems now via the Phase 07 bill discount line; voucher/points types issue as grants that activate with Phase 11
- [ ] GDPR self-service: **data export** (JSON/PDF) and **account deletion** (grace period, anonymisation that preserves financial/audit records) — plan gap item
- [ ] Guest-order claiming: verify email/phone → link past session orders to the new account

### CRM (`crm`) — brief §19
- [ ] Customer 360 record: identity, registration date, branch visits, frequency, last visit, total/average spend, favourite items/branch/dining time, order + booking history, promotions used, feedback & complaints (Phase 04/06 feedback feeds in), dietary preferences, communication preferences, consent + unsubscribe state
- [ ] **Segmentation engine**: rule-based saved segments (new / returning / frequent / high-spend / inactive-N-days / birthday this month / product affinity / branch affinity), scheduled refresh, export; consumed by Phase 11 campaigns
- [ ] Privacy guardrails: behavioural fields only populated with consent; retention rules from settings; every staff access to a customer record auditable
- [ ] Admin UI: customer search/browse, 360 view, segment builder, consent audit view

### Data-residency decision
- [ ] ADR: customer identity is **scoped per restaurant group** (same email at two groups = two records); document rationale + future account-linking path

## Out of scope

Loyalty engine, vouchers, campaigns (11) · reservations history source (12) · website login surface (13).

## Data model (new)

`customer`, `customer_auth` (otp/social), `customer_payment_method` (token refs),
`consent_record`, `incentive_config`, `incentive_grant`, `crm_profile` (aggregates),
`segment`, `segment_membership`, `feedback`.

## Key events

`customers.account.created/deleted`, `customers.consent.granted/revoked`,
`crm.segment.refreshed`, `customers.incentive.granted`.

## Definition of done

- Ordering never requires an account (guest path regression); mid-session upgrade keeps session + basket.
- Consent enforcement tests: revoked/absent consent excludes the customer from every messaging API (hard fail closed).
- DSAR E2E: export contains all personal data; deletion anonymises PII while financial records survive; audit trail intact.
- Incentive config drives issuance (no hard-coded 5%); welcome discount applies at bill.
- Cross-tenant/customer isolation suite extended to customer data.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 10 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §5, §19.
2. Read docs/restaurant-platform/phases/phase-10-customer-accounts-and-crm.md — your scope.
3. Review Phases 04/07 (sessions, bill discounts) — accounts must never block guest flow.
4. Build accounts + OTP auth, preferences, saved payment tokens, configurable incentives,
   consent records with GDPR export/delete, and the consent-aware CRM with segments.
5. Consent fail-closed tests and DSAR E2E are mandatory. Finish green.
```
