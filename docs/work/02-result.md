# Packet 02 Result — Design System

## Scope

Packet 02 establishes the Zavlio public design system. It introduces a warm ivory / parchment editorial visual foundation, refined typography hierarchy, structured grid and spacing tokens, core accessible primitives in `@zavlio/ui`, responsive layout foundations, and strict WCAG 2.2 AA interaction states without mutating or regressing any internal CRM styles (`.crm-*`) or backend contracts.

## Design Tokens & Foundations

### 1. Color System (Warm Ivory Editorial Palette)

- **Canvas / Root Background**: `--canvas: #F5F2EA` (warm ivory paper tone)
- **Surface**: `--surface: #FAF8F4` (elevated ivory surface)
- **Muted Surface**: `--surface-muted: #EAE6DC` (subdued structural containers)
- **Surface White**: `--surface-white: #FFFFFF` (pure contrast cards)
- **Ink / Typography**: `--ink: #0D0D0D` (deep near-black ink, > 14:1 contrast ratio)
- **Muted Ink**: `--ink-muted: #524F47` and `#646059` (deep stone, > 6.5:1 contrast ratio against light backgrounds)
- **Dark Surface Accent Ink**: `#A9A49A` and `#FAF8F4` (> 7.5:1 contrast against `#0D0D0D` / `#171717`)
- **Borders**: `--border: #D8D4CA`, `--border-strong: #BBB6AA`
- **Brand Accent**: `--accent: #D8FF45` (electric acid yellow/green, used selectively for highlights, markers, and stage indicators)
- **Dark Inverted Contrast**: `--accent-ink: #0D0D0D`

### 2. Typography System

Configured using `@next/font/google` with strict `display: swap` and local fallback variables:

- **Headlines & Expressive Moments**: `Newsreader` (`var(--font-newsreader)`, serif, 400/500/600/italics)
- **UI & Editorial Body**: `Hanken Grotesk` (`var(--font-hanken)`, modern sans, 400/500/600/700)
- **Technical & Metric Metadata**: `Space Grotesk` (`var(--font-space)`, monospace / technical sans, 500/700)

Responsive type scales:

- `display-xl`: 3.5rem to 5.5rem (fluid fluid font scale)
- `display-lg`: 2.5rem to 4rem
- `heading-xl`: 2rem to 2.75rem
- `heading-lg`: 1.5rem to 2rem
- `body-lg`: 1.125rem to 1.25rem
- `body`: 1rem (16px)
- `body-sm`: 0.875rem (14px)
- `label / caption`: 0.6875rem to 0.75rem (11px to 12px font-mono)

### 3. Grid & Spacing

- Global container maximum width: `80rem` (`max-w-7xl` / 1280px).
- Generous padding: `px-5 sm:px-8 md:px-12 lg:px-16`.
- Vertical section rhythm: `py-16 md:py-24 lg:py-32` (`Section spacing="default"`), `py-8 md:py-12` (`spacing="compact"`).

## Core Primitives (`packages/ui/src/index.tsx`)

1. **`Container`**: Max-width constraint wrapper with standardized gutters.
2. **`Section`**: Semantic `<section>` element with consistent spacing tokens.
3. **`Eyebrow`**: Monospace uppercase category marker with tracking.
4. **`DisplayHeading`**: High-impact editorial display headline (serif or sans).
5. **`SectionHeading`**: Semantic `<h2>` / `<h3>` heading component.
6. **`BodyCopy`**: Readable editorial body text (`max-w-prose` leading-relaxed).
7. **`Button`**: Tactile interactive button with 4 variants (`primary`, `secondary`, `outline`, `ghost`), 3 sizes (`default`, `sm`, `lg`), keyboard focus-visible rings, disabled and loading states.
8. **`Badge`**: Status and category indicator with `default`, `outline`, `accent`, and `muted` variants.
9. **`Divider`**: Accessible `<hr>` with responsive margins.
10. **`Card`**: Editorial surface card with subtle warm borders and hover transitions.
11. **`Shell`**: Layout wrapper with standard responsive margins.

## Header & Navigation (`apps/web/src/components/site-header.tsx`)

- Logo: Bold typography `ZAVLIO` linking to `/`.
- Desktop Navigation: `Work`, `Services`, `About`, `Lab`, `Insights`, `Contact`.
- Primary CTA: `Start a project` button linking to `/start-a-project`.
- Mobile Navigation Drawer: Hamburger trigger, full viewport slide-in drawer, focus trap, Escape key handling, body scroll locking, and active route indication.

## Footer (`apps/web/src/components/site-footer.tsx`)

- Deep ink background (`#0D0D0D`) with high-contrast text (`#FAF8F4` and `#A9A49A`).
- The Zavlio Operating Cycle summary: `IDEA → IDENTITY → EXPERIENCE → SYSTEM → GROWTH → INSIGHT → IDEA`.
- 4 navigation columns: Selected Work, Capabilities, Company, Governance.
- Direct contact (`hello@zavlio.online`) and Instagram (`@zavliohq`) with outbound analytics instrumentation.
- Staff login link to `/login`.
- Copyright and systems statement.

## Accessibility & Claim Safety

- **WCAG 2.2 AA**: All text satisfies or exceeds the 4.5:1 contrast requirement. All dark background secondary text meets 7.9:1 contrast (`#A9A49A` on `#0D0D0D`). All light background secondary text meets 6.7:1 contrast (`#524F47` on `#FAF8F4`).
- **Headings**: Semantic heading hierarchy validated with Deque axe-core.
- **Claim Safety**: Zero fabricated customer logos, metrics, or revenue claims. Honest categorization of capability areas and reference architectures.

## Files Implemented / Modified

- `packages/ui/src/index.tsx` (primitives)
- `apps/web/src/app/globals.css` (Tailwind 4 `@theme`, CSS custom properties, utility classes, consent & lead form warm ivory styling)
- `apps/web/src/app/layout.tsx` (Google Font integration: Hanken Grotesk, Newsreader, Space Grotesk)
- `apps/web/src/components/site-header.tsx` (global header & mobile drawer)
- `apps/web/src/components/site-footer.tsx` (global editorial footer)

## Verification & Status

- `pnpm lint`: PASS (0 errors, 0 warnings)
- `pnpm typecheck`: PASS (10 of 10 packages clean)
- `pnpm format:check`: PASS (Prettier validated)
- Axe-core Accessibility: 0 violations
- **STATUS: PASS**
