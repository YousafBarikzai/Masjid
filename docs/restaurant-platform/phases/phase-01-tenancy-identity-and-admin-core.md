# Phase 01 — Tenancy, Identity, RBAC & Restaurant Settings

| | |
|---|---|
| **Milestone** | A — Core Restaurant MVP |
| **Depends on** | Phase 00 |
| **Size** | L (2–4 sessions) |
| **Brief sections** | 1 (multi-tenancy), 25, 26 (wizard start), 30 |
| **Modules** | `tenancy`, `identity`, `settings`, `audit` + `apps/admin` shell |

## Objective

Build the multi-tenant backbone (group → restaurant → branch), staff authentication with
MFA, role-based access control with approval workflows, audit logging, and restaurant/
branch settings — plus the admin portal shell and the setup-wizard framework that later
phases plug their steps into. After this phase, a restaurant can be created, configured
and staffed, and every subsequent feature inherits tenancy + RBAC + audit for free.

## In scope

### Tenancy (`tenancy`)
- [ ] Entities: `restaurant_group`, `restaurant`, `brand` (optional, for multi-brand kitchens later), `branch`
- [ ] Tenant resolution middleware (host/header/token → tenant context) and **scoped repository layer** — no query runs unscoped; unit-test harness proves cross-tenant reads fail
- [ ] Branch lifecycle (create, archive), branch metadata (address, contact, timezone)

### Identity & RBAC (`identity`)
- [ ] Staff users: email + password (argon2id), secure httpOnly sessions, logout-everywhere
- [ ] TOTP MFA (mandatory for admin-tier roles), recovery codes
- [ ] Password reset, forced reset, account disable, login history (ip, device, time)
- [ ] Roles: the 18 predefined roles from brief §25 + custom roles per tenant
- [ ] Permission codes registry in `packages/domain` (single source; server guards + client hooks)
- [ ] Role assignments scoped to group / restaurant / branch (+ floor & station scopes reserved)
- [ ] **Approval workflow primitive**: sensitive action → approval request → manager approve/reject (used later for refunds, discounts, cancellations); brief §25 sensitive-action list wired as permission codes now
- [ ] Rate limiting on auth endpoints; secure headers; session fixation protection

### Audit (`audit`)
- [ ] Append-only audit log: actor, action, entity ref, before/after diff, ip, timestamp
- [ ] Audit decorator/helper so modules log with one line; viewer UI with filters; retention setting

### Settings (`settings`)
- [ ] Hierarchical settings with inheritance: group → restaurant → branch (override tracking)
- [ ] Currencies (per restaurant, multi-currency capable), languages (enabled locales, default)
- [ ] Tax categories & rates; service-charge rules (%/fixed, per order type, optional/removable flag)
- [ ] Operating hours per branch (weekly schedule + special dates/closures), timezone
- [ ] Order-type toggles (dine-in / collection / takeaway; delivery reserved)
- [ ] Branding basics (name, logo upload placeholder, primary colour)

### Admin portal shell (`apps/admin`)
- [ ] Auth screens (login, MFA enrol/challenge, reset), app frame with permission-driven navigation, restaurant/branch switcher
- [ ] Users & roles management UI (invite, assign roles/scopes, disable, force reset, login history)
- [ ] Audit log viewer; settings screens for everything above

### Setup wizard framework (brief §26)
- [ ] Wizard engine: ordered step registry, per-step completion state, resume; later phases register steps
- [ ] Steps live now: restaurant details, branch details, opening hours, taxes, service charges, users & roles

### Seed
- [ ] "Bella Vista" demo tenant: 1 group, 1 restaurant, 2 branches, owner + manager + waiter + chef users with correct roles

## Out of scope

Customer identity (Phase 10) · menus (02) · floors/QR (03) · any ordering behaviour.

## Data model (new)

`restaurant_group`, `restaurant`, `brand`, `branch`, `staff_user`, `staff_session`,
`role`, `role_assignment`, `approval_request`, `audit_log`, `setting`, `tax_category`,
`service_charge_rule`, `operating_hours`.

## Key events

`tenancy.restaurant.created`, `tenancy.branch.created`, `identity.user.created`,
`identity.user.disabled`, `identity.approval.requested/approved/rejected`,
`settings.updated` (scoped payloads).

## Definition of done

- Cross-tenant isolation test suite (tenant A can never read/write tenant B — API and repository level).
- Permission matrix tests: every role × representative endpoint (allow/deny snapshot).
- MFA E2E (enrol, challenge, recovery code); audit entries written for all sensitive actions.
- Wizard resumes mid-way; demo seed passes wizard steps automatically.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 01 of the restaurant platform.
1. Read docs/restaurant-platform/README.md (conventions + DoD) and original-brief.md §1, §25, §26, §30.
2. Read docs/restaurant-platform/phases/phase-01-tenancy-identity-and-admin-core.md — your scope.
3. Review Phase 00 output (docs/architecture/, run the apps).
4. Implement tenancy, identity+RBAC+approvals, audit, settings, the admin shell and the
   wizard framework. Cross-tenant isolation and permission tests are mandatory.
5. Update the Bella Vista seed and finish green.
```
