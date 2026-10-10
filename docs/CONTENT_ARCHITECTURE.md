# Zavlio Content Architecture & Editorial Governance

**Document Version**: 2.0  
**Last Updated**: 2026-10-10  
**Authoritative Reference**: `MASTER_SPEC.md` (Content Architecture & Editorial Layer)

---

## 1. System Overview & Core Entities

Zavlio implements a resilient, dual-layer content architecture:

1. **Database Layer (PostgreSQL / Supabase)**: Structured tables (`projects`, `services`, `insights`, `lab_projects`, `authors`, `reusable_content_blocks`) manage editable content, metadata, publishing timestamps, and audit history.
2. **Editorial Fallback Layer (`apps/web/src/lib/content.ts`)**: Statically typed, verified editorial baseline. If the database is empty or unavailable during build/runtime, public routes fall back gracefully to this curated baseline.
3. **Content Resolver (`apps/web/src/lib/content-resolver.ts`)**: Mediates between the database and the public presentation layer, enforcing strict business rules and access controls.

---

## 2. Content Lifecycle & State Machine

Every content entity moves through an explicit state machine:

```
[ CREATION ] ──> DRAFT (Internal only, visible to OPERATOR+)
                    │
                    ├──> PUBLISHED (Live on public routes, requires ADMIN/OWNER)
                    │       │
                    │       └──> ARCHIVED (Withdrawn from public routes, requires ADMIN/OWNER)
                    │
                    └──> ARCHIVED (Direct archival from draft)
```

### State Definitions

- **`DRAFT`**: Work in progress. Retained strictly in CRM workspace (`/crm/content`). Never queryable by anonymous public visitors. Zero draft leakage enforced.
- **`PUBLISHED`**: Active and visible on public routes (`/work/*`, `/insights/*`, `/lab/*`). Requires `published_at` timestamp.
- **`ARCHIVED`**: Preserved for historical and audit purposes; excluded from sitemap and public queries.

---

## 3. Claim Classification & Truth-in-Marketing Tags

In compliance with the Master Specification boundaries, Zavlio forbids fabricating client outcomes or publishing unverified case claims. Every case item is explicitly tagged:

| Tag                            | Meaning                                                                   | Permitted Claims                                         |
| :----------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------- |
| **`STUDIO_CASE`**              | Deep architectural concept developed in-house by the studio               | Technical, visual, and architectural demonstrations      |
| **`REFERENCE_IMPLEMENTATION`** | Production-ready reference architecture solving real-world patterns       | Engineering benchmarks, code patterns, scalability       |
| **`PROTOTYPE_SYSTEM`**         | Functional exploratory software testing novel interfaces (e.g. AI agents) | Prototype user experience, telemetry visualization       |
| **`CONCEPT_ARCHITECTURE`**     | Design system and layout exploration                                      | Responsive layout behavior, motion tokens, accessibility |

### Database Claim Status (`claim_status`)

- `DEMO`: Concept or exploratory demonstrator.
- `UNVERIFIED`: Case details awaiting external legal/client validation.
- `VERIFIED`: Formally authorized production deliverable.
- `RETIRED`: Historical work no longer actively showcased.

---

## 4. Role-Based Publishing Governance (RBAC)

Content mutations are governed by server-side role validation in `apps/web/src/app/api/crm/content/route.ts`:

- **VIEWER**: Read-only inspection of content records in `/crm/content`. Mutation buttons are disabled.
- **OPERATOR**: May create new content drafts and edit existing drafts.
- **ADMIN / OWNER**: Authorized to transition content to `PUBLISHED` or `ARCHIVED` status.

All state transitions write immutable records to the `audit_logs` table (`CONTENT_PUBLISHED`, `CONTENT_UPDATED`), preserving `before_state` and `after_state` snapshots.

---

## 5. Resilient Public Resolution (`content-resolver.ts`)

The public website utilizes `getResolvedProjects`, `getResolvedServices`, `getResolvedInsights`, and `getResolvedLabProjects`:

1. Queries Supabase strictly with `.eq('status', 'PUBLISHED').eq('visibility', 'PUBLIC')`.
2. If records exist, maps them directly to the presentation interface.
3. If database query returns zero records, throws, or Supabase credentials are not provisioned in the current environment, seamlessly falls back to the static baseline in `content.ts`.
4. **Draft Guard**: Even if a database query is manipulated, items with `status !== 'PUBLISHED'` are excluded before reaching public components.
