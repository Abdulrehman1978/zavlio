# Zavlio Asset Register & Visual Provenance Inventory

**Last Updated**: 2026-10-10  
**Verification Status**: **100% In-House Vector Schematics & Open-Source Typography**  
**Third-Party Media Dependencies**: **Zero External Photo/Stock Dependencies**

---

## 1. Typography & Web Fonts

Zavlio utilizes a curated, harmonious typographic system hosted via `@next/font/google` (zero external font-foundry network requests at runtime; fonts are self-hosted within the application build):

| Font Family        | Usage                                                | License                   | Source       | Subsets / Formats                 |
| :----------------- | :--------------------------------------------------- | :------------------------ | :----------- | :-------------------------------- |
| **Hanken Grotesk** | Primary sans-serif UI, body copy, technical labels   | SIL Open Font License 1.1 | Google Fonts | Latin (`woff2`, variable)         |
| **Newsreader**     | Editorial serif display headings, high-end accents   | SIL Open Font License 1.1 | Google Fonts | Latin, italic (`woff2`, variable) |
| **Space Grotesk**  | Numeric badges, statistics, code metrics, timestamps | SIL Open Font License 1.1 | Google Fonts | Latin (`woff2`, variable)         |

---

## 2. Vector Graphics & SVG Schematics

All visual schematics on Zavlio are engineered as lightweight, responsive, accessible SVGs embedded directly in the application bundle. They introduce zero network roundtrips, scale losslessly across high-DPI displays, and contain zero unverified stock imagery:

| Asset Name                        | Component / File                     | ViewBox           | Purpose                                      | Provenance & License                        |
| :-------------------------------- | :----------------------------------- | :---------------- | :------------------------------------------- | :------------------------------------------ |
| **Zavlio Wordmark**               | `site-header.tsx`, `site-footer.tsx` | Native Text / CSS | Brand identity header & footer               | In-house proprietary brand asset            |
| **Kinetiq Systems Schematic**     | `components/project-visual.tsx`      | `0 0 800 500`     | Design system token hierarchy visual         | In-house architectural vector graphic (MIT) |
| **Aurora Intelligence Schematic** | `components/project-visual.tsx`      | `0 0 800 500`     | Multi-agent AI supervisory cluster schematic | In-house architectural vector graphic (MIT) |
| **Strata Commerce Schematic**     | `components/project-visual.tsx`      | `0 0 800 500`     | Composable edge commerce architecture visual | In-house architectural vector graphic (MIT) |
| **Vanguard Identity Schematic**   | `components/project-visual.tsx`      | `0 0 800 500`     | Architectural geometric elevations visual    | In-house architectural vector graphic (MIT) |
| **Operating Cycle Visuals (7)**   | `components/operating-cycle.tsx`     | Native SVG Nodes  | Stage deliverable indicators (01–07)         | In-house diagrammatic primitives (MIT)      |
| **Interactive UI Icons**          | Header, Drawer, Footer, CRM          | `0 0 24 24`       | Navigation arrows, checkmarks, warning icons | In-house clean geometric SVG icons (MIT)    |

---

## 3. Kinetic & Interactive Artifacts

| Artifact Name                | Component File                            | Engine                | Fallback Behavior                 | Performance Budget                                             |
| :--------------------------- | :---------------------------------------- | :-------------------- | :-------------------------------- | :------------------------------------------------------------- |
| **Spatial Kinetic Artifact** | `components/spatial-kinetic-artifact.tsx` | HTML5 Canvas 2D / RAF | Static vector geometric wireframe | Offscreen pause via `IntersectionObserver`; capped at 1.5x DPR |

---

## 4. Production Asset Deployment Rules

1. **No External CDN Links**: All visual assets and typography are served directly from the same-origin build bundle.
2. **Strict Licensing Compliance**: Every font and vector artifact has verified open-source (OFL 1.1 / MIT) or first-party studio provenance.
3. **Owner Asset Placeholders**: Any future client-specific brand photography or external case video deliverables require formal owner upload via the `/crm/content` media pipeline; unverified external media is strictly rejected.
