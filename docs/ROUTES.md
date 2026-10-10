# Routes Inventory & Architectural Classification

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Status**: Authoritative (Full Monorepo Inventory)

---

## 1. Public Experience Routes (27 Routes)

All public routes are statically compiled (SSG) with ISR/fallback capabilities, full metadata, absolute canonical URLs (`https://zavlio.online/...`), structured JSON-LD schemas, and 0 axe accessibility violations.

| Route                                  | Rendering / Type | Purpose & Content                                                                                                                      | Status  |
| :------------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :------ |
| `/`                                    | Static (SSG)     | Narrative hero, kinetic canvas visual, capabilities, operating cycle (7 stages), case studies, editorial insights, contact CTA, footer | SHIPPED |
| `/services`                            | Static (SSG)     | Comprehensive services directory: 5 core engineering practices                                                                         | SHIPPED |
| `/services/digital-experience`         | Static (SSG)     | Editorial web applications, responsive craft, performance systems                                                                      | SHIPPED |
| `/services/enterprise-crm`             | Static (SSG)     | Custom Postgres/Supabase CRM, data pipelines, identity resolution                                                                      | SHIPPED |
| `/services/lead-intelligence`          | Static (SSG)     | Pure deterministic intent scoring, behavioral analytics, decay                                                                         | SHIPPED |
| `/services/automation-infrastructure`  | Static (SSG)     | Supervised control planes, signed machine bridges, safe dry-run                                                                        | SHIPPED |
| `/services/cloud-native-modernization` | Static (SSG)     | Resilient microservices, database architecture, multi-worker queues                                                                    | SHIPPED |
| `/work`                                | Static (SSG)     | Studio case studies index; tagged `STUDIO_CASE` & `REFERENCE_IMPLEMENTATION`                                                           | SHIPPED |
| `/work/nexus-telemetry`                | Static (SSG)     | High-volume ingestion engine case study with custom responsive SVG                                                                     | SHIPPED |
| `/work/strata-crm`                     | Static (SSG)     | Multi-tenant PostgreSQL CRM architecture case study                                                                                    | SHIPPED |
| `/work/vortex-lead-mesh`               | Static (SSG)     | Lead intent scoring & telemetry case study                                                                                             | SHIPPED |
| `/work/aegis-security`                 | Static (SSG)     | Zero-trust token rotation & bridge authentication case study                                                                           | SHIPPED |
| `/about`                               | Static (SSG)     | Studio philosophy, engineering leadership, architectural values                                                                        | SHIPPED |
| `/lab`                                 | Static (SSG)     | Experimental research benchmarks directory                                                                                             | SHIPPED |
| `/lab/zero-drift-state`                | Static (SSG)     | State synchronization & schema drift experiment                                                                                        | SHIPPED |
| `/lab/deterministic-intent`            | Static (SSG)     | Lead intent scoring algorithms experiment                                                                                              | SHIPPED |
| `/lab/low-overhead-rpc`                | Static (SSG)     | Postgres RPC benchmarks vs microservices experiment                                                                                    | SHIPPED |
| `/insights`                            | Static (SSG)     | Technical publications and editorial articles index                                                                                    | SHIPPED |
| `/insights/deterministic-lead-scoring` | Static (SSG)     | In-depth engineering essay on explainable intent models                                                                                | SHIPPED |
| `/insights/the-zero-churn-crm`         | Static (SSG)     | Essay on database invariants and canonical identity resolution                                                                         | SHIPPED |
| `/insights/safe-autonomous-agents`     | Static (SSG)     | Essay on supervised machine execution and kill-switch patterns                                                                         | SHIPPED |
| `/contact`                             | Dynamic / SSR    | Accessible direct inquiry form with Turnstile and honeypot                                                                             | SHIPPED |
| `/start-a-project`                     | Dynamic / SSR    | 4-step progressive project intake form with budget & timeline                                                                          | SHIPPED |
| `/privacy`                             | Static (SSG)     | Privacy Policy, data processing principles, DSR procedure                                                                              | SHIPPED |
| `/terms`                               | Static (SSG)     | Terms of Service, liability boundaries, service commitments                                                                            | SHIPPED |
| `/cookies`                             | Static / Client  | Cookie preference center; reads/writes first-party `zv_consent`                                                                        | SHIPPED |
| `/robots.txt`                          | Static           | Search crawler policy; disallows `/crm/`, allows public routes                                                                         | SHIPPED |
| `/sitemap.xml`                         | Dynamic XML      | Auto-generated sitemap listing all 27 public URLs                                                                                      | SHIPPED |

---

## 2. Staff CRM Workspaces (`/crm/**`)

Guarded by Next.js 16 `proxy.ts`, server-side session authentication (`auth.getClaims()`), and database RLS. Unauthenticated visitors are redirected to `/login?next=...`. Non-staff users receive 403 Forbidden.

| Route                | RBAC Minimum                        | Capabilities                                                                                           |
| :------------------- | :---------------------------------- | :----------------------------------------------------------------------------------------------------- |
| `/crm`               | VIEWER                              | Executive operational dashboard: key intake volume, pipeline overview, active tasks                    |
| `/crm/people`        | VIEWER (Read) / OPERATOR+ (Write)   | Searchable person directory, 25/page pagination, status filters, canonical merge indicator             |
| `/crm/people/[id]`   | VIEWER (Read) / OPERATOR+ (Write)   | Person detail view, normalized timeline cursor, consent status, DNC badge, touchpoints                 |
| `/crm/organizations` | VIEWER (Read) / OPERATOR+ (Write)   | Organization list, associated contacts, domain lookups                                                 |
| `/crm/pipeline`      | VIEWER (Read) / OPERATOR+ (Write)   | Accessible pipeline stage transitions, monetary formatting (`numeric(14,2)`), optimistic preconditions |
| `/crm/tasks`         | VIEWER (Read) / OPERATOR+ (Write)   | Task management queue, priority indicators, completion toggle                                          |
| `/crm/conversations` | VIEWER (Read) / OPERATOR+ (Write)   | Multi-channel thread viewer, dry-run reply composer (no unverified external sends)                     |
| `/crm/content`       | OPERATOR (Draft) / ADMIN+ (Publish) | CMS workspace: draft/published/archived lifecycle, slug validator, claim status flags                  |
| `/crm/campaigns`     | OPERATOR (Draft) / ADMIN+ (Manage)  | Campaign planning workspace: date windows, member management, DNC suppression preview                  |
| `/crm/consent`       | VIEWER (Read) / ADMIN+ (Manage)     | Consent history audit, DSR data export trigger, anonymize dry-run preview                              |
| `/crm/audit`         | ADMIN / OWNER                       | Immutable audit log explorer: actor, action, entity filters, recursively redacted payloads             |
| `/crm/settings`      | ADMIN / OWNER                       | Unified administration hub: staff management, scoring settings, bridge settings                        |
| `/crm/automation`    | OPERATOR+ (View) / ADMIN+ (Manage)  | Worker leases, job queue monitor, dry-run agent inspector, kill switch (`DISABLED`)                    |
| `/crm/reports`       | VIEWER+ (All staff)                 | 5 security-invoker aggregate reports (Overview, Acquisition, Leads, Pipeline, Operations)              |
| `/crm/staff`         | ADMIN (Ops/Viewers) / OWNER (All)   | Staff list, invite modal, role assignment (VIEWER, OPERATOR, ADMIN, OWNER), final-owner protection     |

---

## 3. Authentication Routes (`/login`, `/auth/**`)

| Route                   | Rendering     | Purpose                                                                            |
| :---------------------- | :------------ | :--------------------------------------------------------------------------------- |
| `/login`                | Dynamic / SSR | Invite-only email & password login with PKCE session establishment                 |
| `/auth/set-password`    | Dynamic / SSR | Password setup / reset screen for invited staff members                            |
| `/auth/callback`        | Server Route  | PKCE code exchange endpoint; verifies auth token and issues secure session cookies |
| `POST /api/auth/logout` | Server Route  | Destroys active SSR session, clears auth cookies, redirects to `/login`            |

---

## 4. Public API Endpoints (`/api/**`)

| Endpoint                   | Method | Rate Limit | Purpose & Security Checks                                                                      |
| :------------------------- | :----: | :--------: | :--------------------------------------------------------------------------------------------- |
| `/api/forms/contact`       | `POST` |  5 / min   | Contact form intake: validates honeypot, Turnstile token, body schema, creates lead submission |
| `/api/forms/start-project` | `POST` |  5 / min   | 4-step project intake: atomic security-definer transaction, deduplicated person creation       |
| `/api/analytics/consent`   | `POST` |  20 / min  | Records consent preference history (`zv_consent` key)                                          |
| `/api/analytics/events`    | `POST` |  60 / min  | 20-event allowlisted telemetry ingestion; batches up to 20 events, validates UUIDs, no raw IP  |

---

## 5. Private Signed Machine Routes (`/api/internal/**`)

These are server-to-server machine routes signed with HMAC-SHA256. They reject query strings, public cookies, and browser access.

| Endpoint                                       | Method |   Protocol   | Purpose                                                               |
| :--------------------------------------------- | :----: | :----------: | :-------------------------------------------------------------------- |
| `/api/internal/automation/v1/handshake`        | `POST` | HMAC-SHA256  | Agent handshake, negotiates capabilities, verifies agent active state |
| `/api/internal/automation/v1/heartbeat`        | `POST` | HMAC-SHA256  | Liveness ping; verifies host clock skew within ±300s                  |
| `/api/internal/automation/v1/claim`            | `POST` | HMAC-SHA256  | Claims due jobs via `FOR UPDATE SKIP LOCKED` database queue           |
| `/api/internal/automation/v1/jobs/[id]/lease`  | `POST` | HMAC-SHA256  | Renews bounded job lease during long-running execution                |
| `/api/internal/automation/v1/jobs/[id]/start`  | `POST` | HMAC-SHA256  | Marks job execution started; re-checks policy eligibility             |
| `/api/internal/automation/v1/jobs/[id]/result` | `POST` | HMAC-SHA256  | Records job result, target proof evidence, or error                   |
| `/api/internal/outbox/process`                 | `POST` | Secret Token | Internal runner endpoint for processing queued email outbox items     |
| `/api/health`                                  | `GET`  |     Open     | Health check reporting service status and git SHA                     |
| `/api/ready`                                   | `GET`  |     Open     | Readiness check verifying database connectivity and configuration     |
