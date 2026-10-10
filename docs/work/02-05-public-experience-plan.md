# Zavlio Public Experience Master Implementation Plan

## Packets 02 → 03 → 04 → 05: Design System, Homepage, Public Routes, Motion / 3D

Date: 2026-10-10  
Baseline Commit: `3eac36625a217c727638b433ec7f81f92dad125b` (`main`)  
Authoritative Baseline: `MASTER_SPEC.md` v2.0, `ARCHITECTURE.md`, `CRM_SPEC.md`, `LEAD_INTAKE.md`, `PRIVACY_AND_CONSENT.md`, `EVENT_TAXONOMY.md`

---

## 1. Current Routes

### Current Public Route Inventory (Apps/Web)

| Route              | Type           | Implementation Status at Baseline | Description / Role                                                                                        |
| :----------------- | :------------- | :-------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `/`                | Page (Static)  | Minimal placeholder shell         | Shell with "ZAVLIO" and `<h1>Build what's next.</h1>`. No header, footer, navigation, or visual identity. |
| `/contact`         | Page (Static)  | Functional intake placeholder     | Minimal functional form calling `/api/forms/contact`. Accessible but unstyled.                            |
| `/start-a-project` | Page (Static)  | Functional intake placeholder     | 6-step project wizard calling `/api/forms/start-project`. Accessible but unstyled.                        |
| `/login`           | Page (Dynamic) | Staff auth shell                  | Staff login form connecting to `/auth/login`.                                                             |
| `/auth/error`      | Page (Static)  | System auth error                 | Displays auth error code.                                                                                 |

### Master Specification Route Target (`MASTER_SPEC.md` §12)

The authoritative master specification defines the canonical public route inventory to be realized in this visual branch:

1. `/` — Signature Homepage
2. `/work` — Selected Work & Case Studies Index
3. `/work/[slug]` — Deep Project Case Study Presentation
4. `/services` — Services & Multidisciplinary Capabilities Overview
5. `/services/strategy` — Capability deep-dive: Strategy & Positioning
6. `/services/design` — Capability deep-dive: Identity, Systems & Product Design
7. `/services/technology` — Capability deep-dive: Platforms, AI, Systems & Engineering
8. `/services/growth` — Capability deep-dive: Performance, Content & Growth
9. `/about` — Multidisciplinary Company Philosophy & Operating Model
10. `/lab` — Zavlio Lab / Internal Research & Experiments Index
11. `/lab/[slug]` — Lab Experiment Story / Prototype Presentation
12. `/insights` — Editorial Insights Index
13. `/insights/[slug]` — Longform Insight / Article Reading Experience
14. `/start-a-project` — Premium 6-step Guided Project Scoping Engine
15. `/contact` — Direct Enquiry & Communication Channel
16. `/privacy` — Truthful Privacy Policy & Consent Disclosure
17. `/terms` — Terms of Engagement & Operational Policies
18. `/cookies` — Dedicated Cookie Policy & In-depth Preference Management
19. `/login` — Preserved Staff Login Route

---

## 2. Current Components

### Existing Baseline Public & Shared Components

- `apps/web/src/components/analytics-provider.tsx`: Client context managing consent banner (`ConsentControls`), automatic route view tracking via `tracker.page(pathname)`, and `useAnalytics()` hook.
- `apps/web/src/components/lead-intake-form.tsx`: Contains `StartProjectForm` and `ContactForm` with client state, idempotency UUID generation, honeypot inputs, Zod error rendering, and API submission.
- `packages/ui/src/index.tsx`: Neutral `Shell` container returning `<div>{children}</div>`.

### CRM Components (Frozen Boundary — Must Not Break)

- `crm-shell.tsx`, `crm-person-actions.tsx`, `crm-opportunity-actions.tsx`, `crm-task-actions.tsx`, `crm-identity-actions.tsx`, `automation-actions.tsx`, `social-reply-proposal.tsx`, `analytics-chart.tsx`.
- All CRM CSS selectors in `apps/web/src/app/globals.css` (`.crm-shell`, `.crm-header`, `.crm-layout`, `.crm-nav`, `.crm-main`, `.crm-stat`, `.analytics-caveat`, etc.).

---

## 3. Current Design Debt

1. **Absence of Shared Visual Language**: Neutral raw HTML elements with browser defaults (`Arial, Helvetica, sans-serif`), raw inputs with basic 1px gray borders.
2. **Missing Global Shell & Navigation**: No global header, brand mark, navigation system, mobile drawer, or cohesive footer.
3. **No Responsive Layout Grid**: No fluid container system, responsive column metrics, or editorial rhythm.
4. **No Semantic Design Tokens**: Hardcoded hex colors scattered across CSS without central design tokens for warm-ivory atmosphere.
5. **Placeholder Page Shells**: Homepage, contact, and start-a-project pages render unstyled text without brand art direction.
6. **No Typography Hierarchy**: Raw browser default sizes; missing editorial serif (`Newsreader`), characterful sans (`Hanken Grotesk`), and technical monospace/label font (`Space Grotesk`).

---

## 4. Reusable Backend Connections

The following verified backend endpoints and boundaries are strictly preserved:

- `POST /api/analytics/consent`: Preference updates (`ANALYTICS_ALLOWED`, `ANALYTICS_DENIED`, `WITHDRAWN`).
- `POST /api/analytics/events`: Ingestion of first-party events with 20-event batch limit and consent gating.
- `POST /api/forms/contact`: Packet 09 contact intake, creating person, identity, touchpoint, task, and Mailpit/SMTP outbox.
- `POST /api/forms/start-project`: Packet 09 start-a-project intake, creating person, identity, opportunity, touchpoint, task, and outbox.
- `POST /auth/login`, `POST /auth/logout`: Staff authentication session handlers.
- `GET /api/health`, `GET /api/ready`: Platform liveness and readiness health checks.

---

## 5. Current Analytics Hooks

Events defined in `docs/EVENT_TAXONOMY.md` and `@zavlio/analytics`:

- `session_started`, `page_viewed` (automatic via `AnalyticsProvider`).
- `service_viewed` with `{ serviceSlug }`.
- `project_viewed` with `{ projectSlug }`.
- `lab_project_viewed` with `{ projectSlug }`.
- `insight_viewed` with `{ insightSlug }`.
- `showreel_started`, `showreel_completed`.
- `cta_clicked` with `{ ctaId, placement, destination }`.
- `start_project_opened`.
- `project_form_started`, `project_form_step_completed`, `project_form_submitted`.
- `contact_form_submitted`.
- `outbound_social_click` with `{ platform, destination }`.
- `cookie_preferences_updated`.

_Invariant_: All event dispatches must remain consent-gated and strictly client-safe (no PII or raw form values in metadata).

---

## 6. Public Form Contracts

### Contact Form Contract (`/api/forms/contact`)

- Required: `idempotencyKey` (UUIDv4), `formVersion` (`CONTACT_V1`), `name` (min 2 chars), `email` (valid format), `message` (min 3 chars).
- Optional: `company`, `website` (http/https url), `role`, `honeypot` (silent rejection if populated).
- Success state: Returns HTTP 201 with `{ ok: true, submissionId }`.

### Start Project Form Contract (`/api/forms/start-project`)

- Step 1 (Services): At least one valid `ServiceKey` (`BRANDING`, `WEBSITE`, `MOBILE_APP`, `CUSTOM_SOFTWARE`, `AUTOMATION_AI`, `GROWTH_MARKETING`).
- Step 2 (Contact): `name` (min 2), `email` (valid), optional `company`, `website`, `role`.
- Step 3 (Goal): `goal` description (min 10 chars).
- Step 4 (Budget): Valid `BudgetKey` (`EXPLORING`, `INR_1_3_LAKH`, `INR_3_7_LAKH`, `INR_7_15_LAKH`, `INR_15_PLUS`, `DISCUSS`).
- Step 5 (Timing): Valid `TimingKey` (`ASAP`, `ONE_TO_TWO_MONTHS`, `THREE_TO_SIX_MONTHS`, `EXPLORING`).
- Step 6 (Source): Valid `SourceKey` (`INSTAGRAM`, `LINKEDIN`, `GOOGLE`, `REFERRAL`, `FRIEND_COLLEAGUE`, `EVENT`, `OTHER`, `PREFER_NOT_TO_SAY`).
- Success state: Returns HTTP 201 with `{ ok: true, submissionId }`.

---

## 7. Mobile Issues

- Baseline shells do not have viewport-tuned typography (text shrinks or wraps awkwardly).
- Consent banner on small viewports (390×844) can crowd touch targets without fluid padding.
- Multi-step form needs touch-friendly hit areas (min 44×44px) for radio pills and checkboxes.
- Navigation needs a dedicated mobile drawer with body scroll lock, Escape key dismissal, and seamless touch targets.
- Horizontal overflow prevention: `overflow-x: hidden` must be enforced across all breakpoints without clipping focus outlines.

---

## 8. Accessibility Issues

- Target: WCAG 2.2 AA compliance across all public pages.
- Headings: Strict single `<h1>` hierarchy per route, semantic `<h2>`, `<h3>` section structure.
- Landmarks: `<header role="banner">`, `<main id="main-content">`, `<nav aria-label="...">`, `<footer role="contentinfo">`, `<aside aria-label="...">`.
- Keyboard & Focus: Visible 2px focus rings (`outline-offset: 3px`), logical tab order, skip-to-content link.
- Contrast: Warm Ivory (`#F5F2EA`) background with Primary Ink (`#0D0D0D`) text yields > 15:1 contrast (exceeding WCAG AAA requirement of 7:1).
- Motion: Full `@media (prefers-reduced-motion: reduce)` support with instant transitions and zero animation dependency.
- Axe Core: Automated zero-violation enforcement in Playwright E2E suite.

---

## 9. SEO / Metadata Issues

- Currently, root `layout.tsx` has static title "Zavlio" and description. Sub-routes lack route-specific metadata.
- Needs:
  - Dynamic route metadata with clean titles: `[Page Title] — Zavlio | Build What's Next`.
  - Canonical URLs pointing to `https://zavlio.online/[path]`.
  - OpenGraph and Twitter card metadata for rich previews.
  - Semantic structured data (`Schema.org` `Organization` and `WebSite` JSON-LD).
  - Robots configuration and sitemap.

---

## 10. Visual Opportunities & Implementation Architecture

### Atmospheric Identity: Warm Ivory Editorial

- **Background**: Warm Ivory `#F5F2EA` (canvas), Elevated Ivory `#FAF8F4` (cards/surfaces), Pure White `#FFFFFF` (highlight elements).
- **Ink**: Primary Ink `#0D0D0D`, Graphite `#171717`, Warm Neutral `#78746B` / `#5A5750` for secondary metadata.
- **Accents**: Acid Citrus `#D8FF45` (selective brand signal), Warm Ochre `#C28B38`, Rule Border `#D8D4CA`.
- **Typography**: Editorial serif for expressive narrative statements, clean contemporary sans for functional reading and UI, monospaced/technical sans for badges and cycle indicators.
- **Graphic Depth**: Vector system architecture diagrams, geometric cycle compositions, selective Canvas/SVG interactive artifacts.

---

## Sequential Execution Roadmap

### Packet 02 — Design System

1. Establish design tokens in Tailwind 4 / CSS variables in `@zavlio/ui` and `globals.css`.
2. Implement core UI primitives: `Container`, `Section`, `Eyebrow`, `DisplayHeading`, `Button`, `Badge`, `Card`, `MediaFrame`, `Divider`.
3. Build global `Header`, `MobileMenu`, and `Footer` with verified route linkages.
4. Verify accessibility, contrast, and unit tests.

### Packet 03 — Homepage

1. Build full narrative sequence:
   - Header with quick navigation and "Start a project" CTA
   - Hero: "BUILD WHAT'S NEXT." with primary positioning and capability pills
   - Credibility & Discipline Framework: Strategy · Design · Technology · Growth
   - Selected Work: Editorial case study showcases (honestly labeled demo/concept projects)
   - The Zavlio Operating Cycle: Interactive / visual progression (`IDEA → IDENTITY → EXPERIENCE → SYSTEM → GROWTH → INSIGHT → IDEA`)
   - Technology & Architecture: Product engineering depth and modern infrastructure narrative
   - Zavlio Lab: Innovation and AI prototyping spotlight
   - Editorial Insights: Thought leadership preview
   - High-confidence Final CTA & Comprehensive Footer
2. Integrate analytics event hooks on CTA clicks, navigation, and scroll highlights.

### Packet 04 — Public Routes

1. `/services` and sub-routes (`/services/strategy`, `/services/design`, `/services/technology`, `/services/growth`).
2. `/work` index and `/work/[slug]` dynamic project detail pages.
3. `/about` multidisciplinary philosophy and operating model.
4. `/lab` index and `/lab/[slug]` experiment detail pages.
5. `/insights` index and `/insights/[slug]` editorial reading experience.
6. `/start-a-project` styled multi-step intake wizard preserving Packet 09 contract.
7. `/contact` styled enquiry form preserving Packet 09 contract.
8. `/privacy`, `/terms`, `/cookies` operational policy pages.
9. Route metadata, OpenGraph, JSON-LD structured data, and sitemap.

### Packet 05 — Premium Motion / 3D & Polish

1. CSS / Motion primitives: smooth entry reveals, staggered text treatments, tactile button interactions.
2. The Signature Zavlio Cycle: kinetic / scroll-responsive visual journey.
3. Selective Interactive Spatial/3D Component: lightweight Canvas/WebGL mathematical kinetic artifact with full fallback and pause-when-offscreen behavior.
4. Full `prefers-reduced-motion` fallbacks across all motion components.
5. Zero layout shifts, LCP optimization, and Core Web Vitals audit.

### Release Validation & Release Gates

1. Unit tests: Verify and expand component tests.
2. Playwright E2E: Verify home, forms, analytics, and navigation with Axe accessibility checks.
3. Manual browser QA matrix: Test routes on desktop, tablet, and mobile viewports.
4. Full release gates: reset, lint, typecheck, pgTAP, build, security scan, Meta pin verification.
5. Documentation update: `02-result.md`, `03-result.md`, `04-result.md`, `05-result.md`, `PROGRESS_TRACKER.md`.
6. Push to `origin/main` and verify GitHub Actions.
