# Phase 11 — Loyalty, Marketing & Promotions

| | |
|---|---|
| **Milestone** | B — Enhanced Operations |
| **Depends on** | Phase 10 |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 20, 21 |
| **Modules** | `promotions`, `loyalty` (optional/flagged), `marketing` |

## Objective

Revenue and retention tooling: a promotion engine that evaluates at the bill (activating
the ports Phase 07 stubbed), voucher generation/redemption, an optional points-based
loyalty module, and consent-gated multi-channel campaigns with tracked ROI.

## In scope

### Promotions (`promotions`) — brief §20 types
- [ ] Engine + admin builder for: percentage / fixed discount, free item, BOGOF, meal bundle, happy hour (bridges Phase 02 price rules), birthday, welcome, loyalty reward, branch-specific, time-limited, product-specific, minimum-spend, segment-targeted, referral, voucher code, QR campaign (scannable promo QRs)
- [ ] Eligibility evaluation at bill time (Phase 07 integration): stacking rules, exclusions, rounding policy, per-customer usage limits, large-discount approval threshold (Phase 01 approvals)
- [ ] Vouchers: single/batch generation, formats, expiry, single/multi-use, redemption tracking, cancel/void; customer wallet view in PWA
- [ ] Redemption surfaces: customer bill screen (code entry / wallet pick), waiter-applied with permission

### Loyalty (`loyalty`) — brief §21, per-restaurant feature flag
- [ ] Earning: points per amount spent and/or per visit (on `payments.payment.captured`); tiers with thresholds + benefits; birthday reward; referral reward; product rewards; branch-specific rules
- [ ] **Immutable loyalty ledger** (`loyalty_transaction`), manual adjustments audited with reason; reward expiry jobs
- [ ] Redemption at bill (points → credit line via promotions engine); digital membership card page (QR, wallet-style) in PWA/account
- [ ] Receipts show points earned (activates Phase 07 placeholder)

### Marketing (`marketing`) — brief §20 channels
- [ ] Campaigns: audience = CRM segment (10), channel, template (merge fields), schedule, test-send; approval before send
- [ ] Channels behind the messaging ports: **email** adapter live; **SMS + WhatsApp** adapters (template messages) — same ports the receipts/reservations flows reuse; **web push** for installed PWA users; website banner + customer-account inbox placements (banner surfaces fully on the Phase 13 website)
- [ ] **Consent + unsubscribe enforcement per channel** (fail closed; Phase 10 records); quiet hours; per-customer frequency caps
- [ ] Tracking: sent/delivered/opened (where available)/clicked (tracked links)/voucher redemptions/attributed revenue/customers returned; campaign cost field → **ROI report**
- [ ] Post-payment rating prompt → public review nudge for happy customers (plan gap item)
- [ ] Wizard step: marketing consent settings (completes Phase 09 placeholder)

## Out of scope

Full website banner CMS placement (13) · delivery-channel promos (17) · group-level central campaigns (18).

## Data model (new)

`promotion`, `promotion_redemption`, `voucher`, `loyalty_account`, `loyalty_transaction`,
`loyalty_tier`, `campaign`, `campaign_message` (delivery log), `tracked_link`.

## Key events

`promotions.voucher.redeemed`, `loyalty.points.earned/redeemed/adjusted`,
`marketing.campaign.sent`, `marketing.message.delivered/opened/clicked`.

## Definition of done

- Promotion calculation golden tests: stacking, exclusions, rounding, usage limits, min-spend edges; bill totals stay penny-exact with Phase 07 suite re-run.
- No message ever sent without valid channel consent (tests incl. revocation mid-campaign); unsubscribe honoured across channels instantly.
- Loyalty ledger immutability + audited adjustments; expiry job tests.
- E2E: build segment → campaign with voucher → send (Mailpit) → click → redeem at bill → ROI report shows attribution.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 11 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §20–21.
2. Read docs/restaurant-platform/phases/phase-11-loyalty-marketing-and-promotions.md.
3. Review Phase 07 (bill engine ports) and Phase 10 (segments, consents) — you are
   activating their stubs.
4. Build the promotion engine + vouchers, the flag-gated loyalty module with an immutable
   ledger, and consent-gated multi-channel campaigns with ROI tracking.
5. Golden-test promotion maths; consent fail-closed tests mandatory. Finish green.
```
