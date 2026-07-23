# Phase 00 — Foundations, Architecture & Design System

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | — (first phase) |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 1, 32, 33, 35, 36, 38 |
| **Modules touched** | All (scaffolding only) |

## Objective

Stand up the monorepo, ratify the architecture, design the full data model, and build the
design system — so that every later phase adds features into a structure that already
enforces module boundaries, tenancy, events, accessibility and testing. **No business
features ship in this phase**; the deliverables are the architecture documents (brief §35),
a bootable skeleton of every app, and the shared component library.

## In scope

### 1. Architecture documentation (`docs/architecture/`)

Produce the brief §35 deliverables as versioned markdown + Mermaid:

- [ ] `prd.md` — condensed product requirements (from the brief) with MVP scope marked
- [ ] `adr/` — ADRs ratifying stack choices in `README.md` §4 (or documenting deviations)
- [ ] `system-context.md` — C4 context diagram (customers, staff, payment provider, printers, delivery platforms)
- [ ] `containers.md` — container diagram (apps, api, db, redis, storage, print agent)
- [ ] `modules.md` — module map, responsibilities, allowed dependencies, boundary rules
- [ ] `journeys/` — sequence diagrams: customer ordering, shared table session, bill splitting, kitchen order flow, waiter flow, reservation flow, payment flow
- [ ] `erd.md` — full entity-relationship model covering every brief §36 entity (designed now, migrated incrementally by later phases)
- [ ] `api-conventions.md` — REST style, versioning, error envelope, pagination, idempotency keys, OpenAPI generation
- [ ] `events.md` — event catalogue seed + naming (`context.entity.action`), outbox semantics, consumer idempotency rules
- [ ] `permissions.md` — role list (brief §25, all 18 roles) × permission-code matrix
- [ ] `screens.md` — screen inventory per app; wireframe notes for the ~15 key screens
- [ ] `testing-strategy.md`, `security-model.md`, `deployment.md`, `scalability.md`, `monitoring.md`

### 2. Monorepo scaffold

- [ ] pnpm workspaces + Turborepo; strict TypeScript; ESLint + Prettier; commit hooks
- [ ] `apps/`: `api`, `customer`, `admin`, `kds`, `waiter`, `web`, `print-agent` — each boots with a placeholder screen/health endpoint
- [ ] `packages/`: `ui`, `domain` (types, zod schemas, permission codes, event names), `sdk` (generated API client), `i18n`, `config`
- [ ] **Module-boundary lint rule**: modules may only import each other's published `index` contracts; violations fail CI

### 3. API skeleton (`apps/api`)

- [ ] NestJS app with one Nest module folder per platform module (empty contracts)
- [ ] PostgreSQL + Prisma wired; UUIDv7 ids; migration workflow
- [ ] Redis + BullMQ wired; Socket.IO gateway with Redis adapter
- [ ] **Transactional outbox**: outbox table, publisher worker, in-process event bus, consumer registration pattern — with an example event round-trip test
- [ ] Request context: tenant resolution placeholder, actor, correlation id, structured logging
- [ ] Error envelope, validation pipes, OpenAPI generation feeding `packages/sdk`
- [ ] `docker-compose` dev stack: postgres, redis, MinIO (S3), Mailpit (SMTP)

### 4. Design system (`packages/ui` + Storybook)

- [ ] Tokens: colour (light / dark / **kitchen high-contrast dark**), status palettes with colour-blind-safe pairings, spacing, radii, type scale including distance-readable kitchen sizes
- [ ] Core components (accessible by construction, ≥44 px touch targets): Button, IconButton, Input, Select, Checkbox/Radio, Sheet/Modal, Toast, Card, Tabs, Table, Badge, **StatusPill (icon + label + colour, never colour-only)**, EmptyState, Skeleton, QuantityStepper, **ElapsedTimer**, NumericKeypad, Banner (connection status)
- [ ] Storybook with a11y addon; RTL rendering smoke story; theme switcher

### 5. CI + demo seed

- [ ] GitHub Actions: typecheck, lint, unit tests, build, Playwright smoke (all apps boot)
- [ ] Seed script skeleton for demo tenant **"Bella Vista"** (grows every phase)

## Out of scope

Any business endpoint or UI beyond scaffolding — tenancy/auth is Phase 01, menus Phase 02.

## Definition of done

- `pnpm i && docker compose up && pnpm dev` boots every app; CI green.
- Outbox event demo test passes; module-boundary lint demonstrably fails on a violation.
- Storybook renders all components in light/dark/kitchen themes and passes axe checks.
- All §35 documents exist and cross-reference the brief.
- Cross-cutting DoD (plan README §7) satisfied where applicable.

## Kickoff prompt

```text
You are building Phase 00 of the restaurant platform (fresh monorepo).
1. Read docs/restaurant-platform/README.md and docs/restaurant-platform/original-brief.md
   (especially sections 1, 32, 33, 35, 36, 38).
2. Read docs/restaurant-platform/phases/phase-00-foundations-and-design-system.md — your scope.
3. Produce the architecture documents first (docs/architecture/), then scaffold the
   monorepo, API skeleton with transactional outbox, design system and CI exactly as scoped.
4. Do not build business features. Finish with all apps booting, CI green, and the
   Definition of Done checklist satisfied.
```
