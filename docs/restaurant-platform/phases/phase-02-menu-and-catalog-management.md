# Phase 02 — Menu & Catalog Management

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phase 01 (can run parallel with 03) |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 4 (all), 18 (media basics only) |
| **Modules** | `menu`, `media` (basics) + admin menu builder |

## Objective

Build the full catalog domain — menus, nested categories, products, variants, modifiers,
allergens, dietary tags, availability scheduling, branch/order-type pricing — the admin
menu builder, and the **effective-menu resolver** that Phase 04's customer app consumes.
This is the data heart of the platform: model it richly now so ordering, kitchen routing,
pricing and delivery mapping never need schema rework.

## In scope

### Catalog domain (`menu`)
- [ ] Menus → sections/categories nested to ≥3 levels; display order everywhere
- [ ] Products: descriptions, multiple images, prices **per order type** (dine-in/takeaway/delivery), tax category, prep-time estimate + product SLA fields, prep instructions (kitchen-facing), station assignment tags (station entities arrive Phase 05 — store as routable tags now)
- [ ] Variants/sizes; add-ons; **modifier groups** with min/max selection rules, price deltas, per-variant applicability
- [ ] Ingredients (marked removable → "remove X" options); allergens (UK 14 + custom) at product AND modifier level; dietary tags (vegetarian, vegan, halal, gluten-free…)
- [ ] Age-restricted flag (alcohol) — plan gap item; enforced at service time in later phases
- [ ] Upsell products & recommended pairings; combo meals / meal deals (bundle pricing)
- [ ] Specials, limited-time offers, seasonal products; **happy-hour price rules** (time-boxed price overrides)
- [ ] Branch scoping: per-branch availability + price overrides
- [ ] Availability: menu-level scheduling (dayparts: breakfast/lunch/dinner, weekly patterns), product-level time windows, sold-out flag, temporary pause, stock limits (simple counters)
- [ ] Translations for names/descriptions (all enabled locales, fallback chain)
- [ ] Duplicate menu; assign menus to branches; schedule menus

### Effective-menu resolver (the contract Phase 04 consumes)
- [ ] `GET effective-menu(branch, orderType, at)` → fully resolved tree: visible items, resolved prices (incl. happy hour), availability, allergens, translations
- [ ] Aggressive caching + invalidation on `menu.*` events; versioned payload (ETag) for PWA offline cache

### Media basics (`media`)
- [ ] S3-compatible storage, upload pipeline (sharp: sizes/webp), alt text, simple folders/tags
- [ ] Attach multiple images to products/categories (full library UX in Phase 13)

### Admin UI
- [ ] Menu builder: tree navigation, drag-to-reorder, inline availability toggles
- [ ] Product editor (tabs: details, pricing, variants & modifiers, availability, images, allergens & dietary, translations)
- [ ] Modifier-group library (reusable across products); allergen & dietary tag managers
- [ ] "Service mode" availability dashboard: fast sold-out/pause toggles for mid-service use
- [ ] Wizard steps registered: menus, categories, products, modifiers

### Seed
- [ ] Bella Vista full menu: ~40 products across starters/mains/sides/desserts/kids/hot & cold drinks/alcohol/cocktails/specials, with variants, modifiers, allergens, images, translations (EN + one more), happy-hour rule, one combo

## Out of scope

Ordering/baskets (04) · station entities & KDS routing (05) · full media library, CMS (13) · delivery price sync (17).

## Data model (new)

`menu`, `menu_category`, `product`, `product_variant`, `modifier_group`, `modifier`,
`ingredient`, `allergen`, `dietary_tag`, `product_price` (order-type/branch/happy-hour
dimensions), `availability_rule`, `media_asset`, `product_media`, `translation`.

## Key events

`menu.menu.published`, `menu.product.updated`, `menu.product.sold_out`,
`menu.availability.changed` (drive cache invalidation + later KDS/delivery sync).

## Definition of done

- Resolver golden tests: dayparts, branch overrides, order-type prices, happy hour boundaries, sold-out, translation fallback.
- Modifier rule validation tests (min/max, required groups).
- E2E: build a category + product with modifiers in admin → appears in resolver output.
- Service-mode sold-out toggle reflects in resolver within 1s (event-driven invalidation).
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 02 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §4 (+§18 media items).
2. Read docs/restaurant-platform/phases/phase-02-menu-and-catalog-management.md — your scope.
3. Review Phases 00–01 (architecture docs, tenancy/RBAC/settings — reuse them).
4. Build the catalog domain, effective-menu resolver (with caching + invalidation),
   media basics and the admin menu builder. Seed the full Bella Vista menu.
5. Golden-test the resolver thoroughly. Finish green.
```
