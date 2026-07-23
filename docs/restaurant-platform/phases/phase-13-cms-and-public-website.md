# Phase 13 — CMS, Media Library & Public Website

| | |
|---|---|
| **Milestone** | B — Enhanced Operations |
| **Depends on** | Phase 02 (12 for reservations widget; 10/11 for login/offers, all optional) |
| **Size** | M (1–2 sessions) |
| **Brief sections** | 18 (full), 23 |
| **Modules** | `cms`, `media` (full) + `apps/web` |

## Objective

The restaurant's public face: a block-based CMS with draft/publish and translations, the
full media library, and a fast, SEO-strong website — menus, branches, reservations,
offers, loyalty signup, customer login, legal/allergen pages — architected for future
expansion and per-restaurant theming (white-label arrives in Phase 18).

## In scope

### CMS (`cms`) — brief §18
- [ ] Content models: homepage (hero/blocks), restaurant story, branch pages (hours from settings, address, directions/map link, contact), offers/promotional banners (tie into Phase 11 promotions), reservation content, legal pages (privacy, terms, **allergen notice**), contact + social links
- [ ] Block-based editor with live preview; draft → publish workflow; version history + rollback; per-language content with fallback; SEO fields (title/description/OG image); scheduling (publish at)
- [ ] Content-editor role honoured (Phase 01 RBAC); banner placement slots consumed by website + customer PWA + account inbox (11)

### Media library full (`media` upgrade) — brief §18
- [ ] Folders, tags, search; crop + focal point; auto-compression + responsive sizes (extends Phase 02 pipeline); alt-text enforcement; **usage tracking** (where is this asset used); duplicate detection (content hash); video embed (YouTube/Vimeo) + direct upload (size-capped); brand assets area; archive; permission-controlled access

### Public website (`apps/web`) — brief §23
- [ ] Pages: home, restaurant info, branches, **digital menu** (read-only effective menu with prices, dietary + allergen info per branch), reservations (Phase 12 widget), offers, loyalty registration (11), customer login/account entry (10 — links into PWA account area), contact, opening hours, directions, social links, legal
- [ ] Guest ordering path: QR-context aware — the site never replaces table QR flow, but offers "order at the table? scan your table's QR" guidance + collection/takeaway entry point (activating the Phase 04 engine's non-dine-in types when the restaurant enables them)
- [ ] SEO: metadata, sitemap, robots, **schema.org Restaurant/Menu structured data**; performance budget (LCP < 2.5s); cookie/analytics **consent banner** with consent-gated analytics (plan gap item)
- [ ] Theming from restaurant branding settings (logo, colours, typography scale)

## Out of scope

Multi-brand/white-label theming + custom domains (18) · marketing campaign landing-page builder (backlog) · delivery ordering (17).

## Data model (new)

`cms_page`, `cms_block`, `cms_version`, `banner_placement`; media additions:
`media_folder`, `media_tag`, `media_usage`.

## Key events

`cms.page.published/unpublished`, `media.asset.archived`.

## Definition of done

- Publish flow E2E: edit draft → preview → publish → live site updates (ISR/cache invalidation); rollback works.
- Menu page renders from the effective-menu resolver with allergen info; branch hours always match settings (single source of truth test).
- Lighthouse on home + menu + branch pages: performance ≥ 90, SEO ≥ 95, a11y ≥ 95; schema.org validates.
- Analytics fire only after consent; media usage-tracking prevents deleting in-use assets.
- Cross-cutting DoD (plan README §7).

## Kickoff prompt

```text
You are building Phase 13 of the restaurant platform.
1. Read docs/restaurant-platform/README.md and original-brief.md §18, §23.
2. Read docs/restaurant-platform/phases/phase-13-cms-and-public-website.md — your scope.
3. Review Phase 02 (effective menu, media basics), 11 (banners), 12 (booking widget).
4. Build the block CMS with draft/publish/versioning, the full media library, and the
   public website with SEO, structured data, theming and the consent banner.
5. Meet the Lighthouse budgets. Finish green.
```
