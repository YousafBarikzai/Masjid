# Phase 16 — Integration Platform, Public API & Webhooks

| | |
|---|---|
| **Milestone** | C — Integrations & Scale |
| **Depends on** | Milestone A complete + Phase 15 |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 29 (+30 hardening) |
| **Modules** | `integrations` + developer portal |

## Objective

Open the platform safely: a versioned public API with scoped keys and OAuth2, signed
webhooks with retries and replay, a formalised port/adapter registry (payments, messaging,
delivery, POS, accounting, BI), a sandbox mode, and generated developer documentation —
the foundation Phase 17's delivery adapters and Phase 18's marketplace build on.

## In scope

### Public API v1
- [ ] Scoped, rotatable, hashed **API keys** + OAuth2 client-credentials for partners; per-key rate limits + usage metering; full access audit
- [ ] Resources (read/write per scope): menus & availability, orders (create/read/status), table sessions (read), reservations, customers (**consent-guarded**), reports (read); consistent with internal API conventions (Phase 00) — public API is a facade over module contracts, never raw table access
- [ ] Versioning policy (v1 frozen contract + deprecation process); sandbox tenant mode with test data + fake payment/printer providers
- [ ] Developer portal: OpenAPI-generated reference + guides (auth, webhooks, ordering walkthrough, delivery-adapter guide placeholder)

### Webhooks
- [ ] Subscriptions per partner: event selection from the public event catalogue (curated subset of internal events), endpoint, secret
- [ ] Delivery: HMAC signatures, at-least-once with exponential backoff, dead-letter queue, **replay UI**, delivery logs + health dashboard

### Port/adapter registry
- [ ] Formalise existing ports (PaymentProvider, MessagingChannel, DeliveryProvider stub, PrinterTransport) + new ports: POS export, accounting export, inventory sync, BI extract (15's warehouse drop exposed properly)
- [ ] Registry with per-restaurant enablement, config schema, health checks; integration health dashboard in admin

### Security hardening pass — brief §30
- [ ] External-facing pen-test checklist executed (authz on every public route, SSRF/webhook abuse, replay attacks, rate-limit bypass)
- [ ] Secret rotation runbook (API keys, webhook secrets, provider keys); fraud-monitoring signals on payments (velocity rules, mismatch alerts)

## Out of scope

Actual delivery integrations (17) · marketplace UI + third-party app listings (18) · white-label API (18).

## Data model (new)

`api_client`, `api_key`, `api_usage`, `webhook_subscription`, `webhook_delivery`,
`integration_registration`.

## Key events

`integrations.webhook.delivered/failed`, `integrations.key.rotated`,
public catalogue: `order.created`, `order.status_changed`, `payment.captured`,
`reservation.created`, `menu.updated`, …

## Definition of done

- Contract tests freeze v1 (schema snapshots; breaking change fails CI).
- Webhook guarantees tested: signature verification, retry/backoff, dead-letter + replay, idempotent consumer guidance verified with a sample consumer.
- Key lifecycle E2E: create → scope-limited access → rotate → revoke (old key dead instantly, audited).
- Sandbox mode E2E: partner can walk the ordering guide end-to-end without touching real data.
- Docs portal builds from OpenAPI in CI.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 16 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §29–30.
2. Read docs/restaurant-platform/phases/phase-16-integration-platform-and-public-api.md.
3. Review Phase 00's API conventions and the module contracts — the public API is a
   facade over them.
4. Build API keys/OAuth2, the v1 public API + sandbox, signed webhooks with replay, the
   port registry + health dashboard, and run the security hardening pass.
5. Contract-freeze tests and webhook delivery-guarantee tests are mandatory. Finish green.
```
