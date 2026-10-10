# SEO Architecture, Metadata & Crawl Governance

**Platform Domain**: `https://zavlio.online`  
**Last Verified Audit**: 2026-10-10  
**Verification Tool**: `scripts/seo-crawl-audit.mjs` (Automated 27-route static HTML audit)  
**Status**: **VERIFIED — 27/27 PASS**

---

## 1. Architectural Strategy & Metadata Principles

Zavlio enforces a strictly disciplined, server-rendered and statically generated SEO architecture:

1. **Root `metadataBase`**: Configured as `https://zavlio.online` in `apps/web/src/app/layout.tsx`. All relative and absolute URL derivations resolve unambiguously against this production origin.
2. **Deterministic Canonical URLs**: Every public route declares explicit `alternates: { canonical: ... }` pointing to its absolute canonical target. Trailing slashes are normalized, preventing duplicate content indexing across search engine spiders.
3. **OpenGraph & Social Meta**: Standardized `openGraph: { title, description, url, siteName, type }` metadata is emitted across every route segment.
4. **Zero Draft Leakage**: CRM drafts and internal content are excluded from public routes via `apps/web/src/lib/content-resolver.ts`.
5. **No Synthetic Reviews or Fake Ratings**: Schema.org data contains only truthful entity descriptions (`Organization`, `WebSite`, `Service`, `CreativeWork`, `BreadcrumbList`). No artificial 5-star ratings or fabricated client reviews exist.

---

## 2. Robots & Crawl Control (`/robots.txt`)

Generated dynamically via `apps/web/src/app/robots.ts`:

```txt
User-Agent: *
Allow: /
Disallow: /crm/
Disallow: /api/internal/
Disallow: /auth/

Sitemap: https://zavlio.online/sitemap.xml
```

### Security & Privacy Enforcements

- All internal CRM administration routes (`/crm/*`) are disallowed to prevent indexing of operational workflows.
- Internal machine automation protocol endpoints (`/api/internal/*`) are disallowed.
- Auth endpoints (`/auth/*`) are disallowed.
- Root sitemap link points directly to `https://zavlio.online/sitemap.xml`.

---

## 3. Dynamic Sitemap (`/sitemap.xml`)

Generated via `apps/web/src/app/sitemap.ts`, emitting all 25 public content routes with strict priorities and update frequencies:

| URL Path                                                           | Priority | Frequency | Entity Category                     |
| :----------------------------------------------------------------- | :------- | :-------- | :---------------------------------- |
| `https://zavlio.online`                                            | `1.0`    | weekly    | Primary Editorial Homepage          |
| `https://zavlio.online/services`                                   | `0.8`    | weekly    | Capabilities Overview               |
| `https://zavlio.online/services/strategy`                          | `0.8`    | weekly    | Service Capability Detail           |
| `https://zavlio.online/services/design`                            | `0.8`    | weekly    | Service Capability Detail           |
| `https://zavlio.online/services/technology`                        | `0.8`    | weekly    | Service Capability Detail           |
| `https://zavlio.online/services/growth`                            | `0.8`    | weekly    | Service Capability Detail           |
| `https://zavlio.online/work`                                       | `0.8`    | weekly    | Case Studies & Work Index           |
| `https://zavlio.online/work/kinetiq-systems`                       | `0.7`    | monthly   | Project Case Detail                 |
| `https://zavlio.online/work/aurora-intelligence`                   | `0.7`    | monthly   | Project Case Detail                 |
| `https://zavlio.online/work/strata-commerce`                       | `0.7`    | monthly   | Project Case Detail                 |
| `https://zavlio.online/work/vanguard-identity`                     | `0.7`    | monthly   | Project Case Detail                 |
| `https://zavlio.online/about`                                      | `0.8`    | weekly    | Company Narrative & Operating Cycle |
| `https://zavlio.online/lab`                                        | `0.8`    | weekly    | Research & Experiments Index        |
| `https://zavlio.online/lab/spatial-kinematics`                     | `0.6`    | monthly   | Lab Prototype Detail                |
| `https://zavlio.online/lab/agent-reasoning-graphs`                 | `0.6`    | monthly   | Lab Prototype Detail                |
| `https://zavlio.online/lab/container-micro-typography`             | `0.6`    | monthly   | Lab Prototype Detail                |
| `https://zavlio.online/insights`                                   | `0.8`    | weekly    | Perspectives Index                  |
| `https://zavlio.online/insights/systems-over-frameworks`           | `0.7`    | monthly   | Editorial Essay Detail              |
| `https://zavlio.online/insights/restrained-motion-architecture`    | `0.7`    | monthly   | Editorial Essay Detail              |
| `https://zavlio.online/insights/first-party-analytics-sovereignty` | `0.7`    | monthly   | Editorial Essay Detail              |
| `https://zavlio.online/contact`                                    | `0.8`    | weekly    | Direct Studio Contact               |
| `https://zavlio.online/start-a-project`                            | `0.8`    | weekly    | 6-Step Project Scoping Form         |
| `https://zavlio.online/privacy`                                    | `0.8`    | weekly    | Privacy Policy & Data Governance    |
| `https://zavlio.online/terms`                                      | `0.8`    | weekly    | Terms of Service                    |
| `https://zavlio.online/cookies`                                    | `0.8`    | weekly    | Cookie Preferences & Disclosure     |

---

## 4. Structured Data (Schema.org JSON-LD)

High-fidelity JSON-LD schemas are baked directly into the static HTML for crawl reliability without client JavaScript execution:

1. **Homepage (`/`)**:
   - `Organization`: Legal identity, official name "Zavlio", canonical URL `https://zavlio.online`, logo, contact point, foundational description.
   - `WebSite`: Name "Zavlio", official URL, search capability placeholder.
2. **Capability Detail (`/services/[slug]`)**:
   - `Service`: Service name, provider Organization reference, descriptive capability breakdown, deliverables.
   - `BreadcrumbList`: Positional hierarchy (`Home` → `Capabilities` → `[Service Title]`).
3. **Case Studies (`/work/[slug]`)**:
   - `CreativeWork`: Case title, author Zavlio, publication date, descriptive overview, tags.
   - `BreadcrumbList`: Positional hierarchy (`Home` → `Selected Work` → `[Project Title]`).

---

## 5. Automated Crawl Verification Results

Executed via `node scripts/seo-crawl-audit.mjs`:

- Total Public Endpoints Audited: **27 / 27**
- HTTP / Asset Status: **100% PASS**
- Unique Titles & Meta Descriptions: **100% Present**
- Absolute Canonical Tags: **100% Verified against `https://zavlio.online`**
- Localhost References in Static Content: **0 detected**
- JSON-LD Structured Data: **Validated on all required entity detail pages**
- Full raw crawl evidence recorded at `docs/work/seo-crawl-report.json`.
