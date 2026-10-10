# System Architecture Specification

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Status**: Authoritative Architectural Baseline (Pre-Deployment Complete)

---

## 1. System Overview

Zavlio is a high-performance, privacy-first digital experience, CRM, and lead intelligence platform. It is engineered as a TypeScript monorepo with an editorial warm-ivory public web application, an in-house Postgres-backed CRM control plane, and a strictly isolated dry-run machine automation bridge.

```mermaid
graph TD
    Client[Web Browser / Visitor] -->|HTTPS| PublicApp[Next.js 16 Web Application]
    Staff[Staff Member / Operator] -->|Auth + SSR Cookies| CRMApp[CRM Control Plane /crm/*]

    subgraph Web Tier
        PublicApp -->|Public Forms| IngestionAPI[/api/forms/*]
        PublicApp -->|First-Party Analytics| AnalyticsAPI[/api/analytics/*]
        CRMApp -->|Server Actions / RLS| DBClient[Supabase Authenticated Client]
    end

    subgraph Data & Persistence Tier
        IngestionAPI -->|Security Definer RPC| PostgresDB[(PostgreSQL 17 / Supabase)]
        AnalyticsAPI -->|Session Atomic RPC| PostgresDB
        DBClient -->|Role-Based Access Control| PostgresDB
        OutboxWorker[Email Outbox Worker] -->|Poll Outbox| PostgresDB
    end

    subgraph Automation & Bridge Boundary
        CRMApp -->|Audit / Job Queue| PostgresDB
        PostgresDB -->|HMAC-SHA256 Signed API| Bridge[services/meta-bridge]
        Bridge -->|Child Process IPC| PinnedUpstream[external/meta-automation]
    end

    OutboxWorker -.->|SMTP Transactional| MailpitOrSMTP[Mailpit / Zoho ZeptoMail]
    PinnedUpstream -.->|CDP Synthetic / Dry-Run| LocalBrowser[Local Chromium / Dry-Run Only]
```

---

## 2. Monorepo Package Topology

Resolved via `pnpm` workspaces (`pnpm-workspace.yaml`):

| Package / App        | Path                       | Responsibility                                                                         | Boundaries & Invariants                                                          |
| :------------------- | :------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Web Application**  | `apps/web`                 | Next.js 16.3.8 App Router application; renders 27 public routes and 15 CRM workspaces. | Server components by default. Client components isolated to interactive inputs.  |
| **Database Tier**    | `packages/db`              | Supabase server/browser factories; generated TypeScript contracts.                     | `server-only` import guards. Service-role admin client never exposed to browser. |
| **CRM Domain**       | `packages/crm`             | Pure CRM scoring engine, lead normalization, pipeline invariants.                      | Zero external side effects. Deterministic logic.                                 |
| **Analytics Engine** | `packages/analytics`       | First-party telemetry taxonomy (20 typed events), queue, sanitizers.                   | Zero raw IP / user-agent storage. Consent-gated delivery.                        |
| **Automation Plane** | `packages/automation`      | Job policy evaluator, lease state machines, dry-run invariants.                        | Deny-by-default execution. No autonomous mass actions.                           |
| **Configuration**    | `packages/config`          | Non-secret constants, structured JSON logging, typed application errors.               | Compiles to ESM before consumer execution.                                       |
| **Validation**       | `packages/validation`      | Browser-safe Zod schemas for forms, environment, and API payloads.                     | Strict input parsing; strips unknown properties.                                 |
| **Email Interface**  | `packages/email`           | Outbox adapters, email template formatting, MIME definitions.                          | Never delivers synchronously inside database transactions.                       |
| **UI Primitives**    | `packages/ui`              | Semantic accessible container and layout primitives.                                   | Neutral primitives; styling governed by warm-ivory design tokens.                |
| **Meta Bridge**      | `services/meta-bridge`     | Separately compiled Node/TS machine supervisor; HMAC-SHA256 protocol.                  | Isolated port (loopback); loopback health check; no DB credentials.              |
| **Pinned Upstream**  | `external/meta-automation` | Detached checkout pinned to SHA `439c3bfaac...` and tree `e4f412b...`.                 | Strictly isolated child process; dry-run semantic primitives only.               |

---

## 3. Public Web Experience Tier

- **Art Direction**: Bespoke warm ivory aesthetic (`#FBF9F4` base, `#171614` text, `#9E5D2A` accent). Google Fonts (`Instrument Serif` and `Inter`) loaded with `display: swap`.
- **Route Architecture**: 27 statically generated public routes (SSG). Zero layout shift (CLS < 0.05).
- **Kinetic Spatial Visual**: Custom HTML5 2D canvas with parametric wave simulation on homepage hero; pauses automatically via `IntersectionObserver` when scrolled offscreen; disabled if `prefers-reduced-motion` is active.
- **Responsive Schematics**: 20+ responsive vector SVGs for architecture diagrams, case studies, and lab benchmarks. Zero stock photography or fabricated client outcomes.
- **Operating Cycle**: 7-stage interactive operational methodology (`01_ARCHITECTURAL_DISCOVERY` to `07_CONTINUOUS_VERIFICATION`).
- **Graceful Dynamic Fallback**: `apps/web/src/lib/content-resolver.ts` merges published database items with verified static baseline content, ensuring zero site disruption if database items are unseeded.

---

## 4. PostgreSQL & Supabase Data Layer

- **Authoritative Source**: 20 forward-only SQL migrations under `supabase/migrations/` (timestamps `20260927060100` through `20261001062000`).
- **Relational Invariants**: UUID primary keys (`gen_random_uuid()`), UTC `timestamptz`, `citext` for emails, `numeric(14,2)` for financial fields, explicit text/CHECK state machines.
- **Deny-by-Default RLS**: Row-Level Security enabled on all 39 application tables. Zero public/anon table grants.
- **Staff RBAC Model**:
  - `OWNER`: Full platform administration, policy activation, final-owner immutability trigger.
  - `ADMIN`: User management (OPERATOR/VIEWER only), audit explorer, CRM configuration.
  - `OPERATOR`: Operational CRM records (People, Organizations, Pipeline, Content drafts).
  - `VIEWER`: Read-only operational visibility.
- **Queue & Worker Architecture**: Security-definer `FOR UPDATE SKIP LOCKED` claim primitives with atomic leasing (`lease_expires_at`, `lease_token`) and exponential backoff retry caps.

---

## 5. Security & Isolation Invariants

1. **Secret Isolation**: Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `AUTOMATION_HMAC_SECRET`, `SMTP_PASSWORD`) are server-only. Client bundles include only `NEXT_PUBLIC_*` variables.
2. **Machine API Signing**: Machine communication between web application and Bridge is signed using HMAC-SHA256 (`/api/internal/automation/v1/*`), incorporating timestamp, nonce, path, agent identity, and body SHA-256. Replay window: ±300 seconds.
3. **Outbox Pattern**: Form submissions execute within an atomic database transaction (`intake_lead_submission`), writing an email outbox row. Email delivery is handled asynchronously by `scripts/email-outbox-worker.mjs`, preventing email failure from aborting lead capture.
4. **Zero Live Social Actions**: `LIVE_EXTERNAL_EXECUTION=false` is enforced at runtime and in configuration. Instagram integration is strictly unsupported.
5. **Content Security Policy**: Configured in `apps/web/next.config.ts` with report-only mode and strict HSTS (`max-age=31536000; includeSubDomains; preload`).
