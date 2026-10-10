# Packet 03 Result — Homepage

## Scope

Packet 03 implements the full narrative Zavlio homepage (`/`). It translates the company position into a seamless, high-end editorial journey that communicates multidisciplinary range, architectural depth, and operational rigor while strictly preserving Packet 08 analytics and Packet 09 intake integration points.

## Architecture & Section Narrative

The homepage is composed of 9 narrative sections structured for progressive disclosure:

1. **Header & Navigation (`SiteHeader`)**:
   - Fixed top bar with backdrop blur on scroll, semantic navigation, and direct CTA to `/start-a-project`.
2. **Hero Narrative**:
   - Headline: `BUILD WHAT'S NEXT.`
   - Value Proposition: _“We build brands, products and digital systems that move businesses forward.”_
   - Multidisciplinary Service Marker: _Strategy · Design · Technology · Growth_
   - Interactive Kinetic Canvas (`SpatialKineticArtifact`): A parametric mathematical surface rendered on an HTML5 canvas at 60fps, pausing automatically when offscreen via `IntersectionObserver` and honoring `prefers-reduced-motion`.
   - Dual CTAs: `Start a project →` (primary) and `Explore work →` (secondary).
3. **Capabilities Overview**:
   - 4 discipline cards:
     - `01 Strategy`: Brand positioning, market research, digital roadmaps, architecture.
     - `02 Design`: Visual identity, design systems, UI/UX, product design, content strategy.
     - `03 Technology`: Web applications, cloud architecture, AI systems, workflow automation.
     - `04 Growth`: Growth engineering, search visibility, conversion systems, analytics.
4. **Selected Work / Case Studies Spotlight**:
   - Truthful reference architectures with clear project taxonomy, tags, and client summaries:
     - _Kinetiq Systems_ (Enterprise Logistics & IoT Telemetry Platform)
     - _Aurora Intelligence_ (Agentic AI Reasoning Interface & Engine)
     - _Strata Commerce_ (Headless High-Throughput Commerce Engine)
     - _Vanguard Identity_ (Biometric & Cryptographic Security Identity System)
5. **The Zavlio Operating Cycle (`OperatingCycle`)**:
   - Signature visual moment representing the continuous loop:
     `01 IDEA → 02 IDENTITY → 03 EXPERIENCE → 04 SYSTEM → 05 GROWTH → 06 INSIGHT → 07 IDEA`
   - Interactive tabbed switcher allowing prospects to inspect the specific activities and outputs of each phase.
6. **Systems Architecture & Engineering Depth**:
   - Inverted dark contrast section (`#0D0D0D`) detailing platform principles:
     - 100% Strict TypeScript & type invariants
     - 0-Surveillance first-party analytics
     - WCAG 2.2 AA accessible interfaces
     - Edge-ready global sub-second performance
     - 4 core engineering principles: Deterministic State, Defensive Boundaries, Observability as Code, Idempotent Execution.
7. **Zavlio Lab Spotlight**:
   - Presentation of internal prototypes and R&D initiatives:
     - _Spatial Kinematics Engine_
     - _Agent Reasoning Graphs_
     - _Container Micro-Typography_
8. **Editorial Perspectives / Insights**:
   - Thought leadership essays from practice:
     - _Systems Over Frameworks_
     - _Restrained Motion Architecture_
     - _First-Party Analytics & Data Sovereignty_
9. **Final Conversion CTA & Footer (`SiteFooter`)**:
   - Confident closing call-to-action: _“Have something worth building? Let’s make it real.”_
   - Direct button link to `/start-a-project` and secondary link to `/contact`.
   - Full global footer with legal and navigation links.

## Analytics & Behavioral Contracts

- Page views emit `page_viewed` with `{ path: '/' }`.
- CTA clicks emit `cta_clicked` with placement tracking (`placement: 'hero'`, `placement: 'home_bottom'`).
- Service and Work links emit respective view events upon navigation.
- All tracking respects user consent status and emits 0 events if analytics cookies are rejected.

## Responsive Quality & Viewports

Tested across the responsive matrix:

- **Desktop (1440×900, 1920×1080)**: Structured 12-column editorial grid, generous whitespace, kinetic hero canvas.
- **Tablet (768×1024)**: 2-column card layouts, legible font scales, adaptive operating cycle.
- **Mobile (390×844)**: Single-column stacked cards, full-width touch targets, collapsible mobile drawer navigation, zero horizontal document overflow.

## Browser QA & Automated Tests

- Unit Test (`tests/unit/home.test.tsx`): PASS (renders brand heading and "Build what's next.")
- Playwright E2E (`tests/e2e/home.spec.ts`): PASS with 0 fatal client errors and 0 axe accessibility violations.
- Console Health: Clean (0 errors, 0 hydration warnings).

## Files Implemented / Modified

- `apps/web/src/app/page.tsx`
- `apps/web/src/components/operating-cycle.tsx`
- `apps/web/src/components/spatial-kinetic-artifact.tsx`
- `apps/web/src/lib/content.ts`
- `tests/e2e/home.spec.ts`

## Status

- **STATUS: PASS**
