# Phase 18 — Enterprise: Groups, Franchises & White-Label

| | |
|---|---|
| **Milestone** | C — Integrations & Scale (**Milestone C exit**) |
| **Depends on** | Phases 15 + 16 |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 1 (groups/franchise/brands), 34 Phase 3 items |
| **Modules** | group console, white-label theming, marketplace shell, POS/accounting ports |

## Objective

Scale the tenant model to its full shape: restaurant-group central management, franchise
operation, multiple brands from one kitchen, white-labelled customer surfaces with custom
domains, an integration marketplace shell, and first POS/accounting export adapters —
plus the horizontal-scaling review that keeps large groups fast.

## In scope

### Group central management
- [ ] Group console: portfolio dashboard (cross-restaurant KPIs on Phase 15 aggregates), drill-down to restaurant/branch
- [ ] **Central menu library**: publish menus/products group-wide with local override policies (locked fields vs branch-editable), drift reports (extends 15's propagation)
- [ ] Central promotions + campaigns (11) with per-restaurant opt-in; central user management + group-level roles honoured everywhere (01 scopes)
- [ ] Policy controls: which settings franchisees may change

### Franchise mode
- [ ] Owner vs franchisee permission split (templates over Phase 01 RBAC); franchise agreement fields (royalty %, fee rules) → **royalty/fee reporting** per period per franchisee; data visibility rules (franchisee sees own; franchisor sees portfolio)

### Multiple brands, one kitchen — brief §1
- [ ] `brand` entity (01) activated: brands own menus, theming, receipts, websites; orders/KDS cards/tickets show brand identity; brand-level reporting split (virtual-brand model)

### White-labelling
- [ ] Theming engine on customer surfaces (customer PWA, web, emails, receipts): per restaurant/brand tokens (logo, palette, typography), preview + publish; **custom domains** (verification, TLS automation) for web + ordering
- [ ] Platform branding fully removable per tenant plan

### Integration marketplace shell + first adapters
- [ ] Marketplace directory in admin: available integrations (ports from 16 + delivery from 17), enable/configure per restaurant, health status
- [ ] **Accounting export adapter** (e.g. Xero-style: daily journals — sales, tax, tips, fees) + **POS export** stub with documented contract; inventory port documented for future partners

### Scale & operations
- [ ] Horizontal-scaling review executed: socket sharding, queue partitioning by branch, read replicas for reporting, cache strategy; load test at group scale (20 branches busy simultaneously) with results committed
- [ ] Data retention/archival jobs (cold storage for old orders/events); per-tenant usage metering (billing-ready)

## Out of scope

Public marketplace for third-party developers (post-plan) · billing/subscription system (product decision) · first-party delivery.

## Data model (new/extended)

`brand` (activated), `franchise_agreement`, `royalty_report`, `theme`, `custom_domain`,
`marketplace_listing`, `usage_meter`, archival tables.

## Definition of done

- Brand isolation E2E: two brands, one kitchen — right branding on the right QR flow, receipts, emails, website; KDS distinguishes brands; reports split correctly.
- Override precedence tests: group policy vs restaurant vs branch — locked fields immutable downstream, audited.
- Franchise visibility tests: franchisee cannot see sibling data; royalty report matches fixtures.
- Custom-domain E2E (staging): domain verified → TLS issued → white-labelled ordering works; platform branding absent.
- Group-scale load test meets targets; archival job restores correctly on demand.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 18 — the enterprise closeout of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §1 and §34 (Phase 3 list).
2. Read docs/restaurant-platform/phases/phase-18-enterprise-groups-franchise-and-white-label.md.
3. Review Phases 01 (tenancy/brand/RBAC), 15 (aggregates/propagation), 16 (ports).
4. Build the group console, franchise mode, multi-brand activation, white-label theming
   with custom domains, the marketplace shell + accounting export, and execute the
   scaling review.
5. Brand/franchise isolation tests are the exit gate. Finish green.
```
