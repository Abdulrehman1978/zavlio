# Zavlio

Zavlio is a modular platform for a premium public experience, first-party analytics, CRM and revenue operations, and policy-controlled automation. The repository is currently at **Packet 11 — lead intelligence and operations**; it is not production-ready.

Public visual design is intentionally **DEFERRED_BY_USER**. The `/` route is a temporary structural shell and does not attempt to recreate the missing Stitch design.

## Implemented foundation

- pnpm workspace with `apps/*`, `packages/*`, and `services/*` boundaries.
- Next.js 16 App Router application with strict TypeScript, React Server Components by default, Tailwind CSS, metadata, and minimal `/`, `/login`, and guarded `/crm` shells.
- Shared configuration, validation, UI, database-boundary, analytics-boundary, automation-contract, and email-provider packages.
- Typed public/server environment parsing with an explicit `server-only` boundary.
- Typed application errors, structured logging, and request/correlation IDs.
- Independent Node/TypeScript Meta Bridge health/start/stop skeleton.
- Supabase/PostgreSQL migration foundation with deny-by-default RLS, seed-only defaults, server/admin client boundaries, an atomic automation-job claim function, and a documented generated-type contract.
- Consent-gated anonymous first-party analytics with typed event validation, bounded browser queue/batches, first/latest attribution, atomic sessionization, and append-only preference history.
- Functional `/start-a-project` and `/contact` intake routes with server-only Zod validation, honeypot/Turnstile boundary, idempotent transactional CRM intake, exact-email person resolution, conservative organization matching, consent-aware visitor linking, lead scores, opportunities/tasks/touchpoints, and durable email outbox delivery.
- Server-rendered CRM people, organizations, identity review, unified timeline, DNC controls, immutable notes, and explicit transactional person merge workflows with canonical redirects and audit history.
- Deterministic versioned lead scoring with decay, explainable history, declared/behavioral service affinity, manual and bounded CLI recalculation.
- Server-rendered Pipeline Kanban/table, guarded opportunity transitions/history, and task workload/completion/reopen workflows with role/RLS enforcement.
- Vitest, React Testing Library, Playwright, axe, ESLint, Prettier, and GitHub Actions CI.

## Requirements

- Node.js `24.13.0` (pinned in `.node-version` and `package.json`)
- pnpm `11.19.0` (pinned by `packageManager`)
- Git
- Docker Desktop (required for local Supabase runtime tests and migration reset evidence)

Enable the pinned Node version through your version manager, then let Corepack provide the pinned package manager where applicable.

## Setup

```powershell
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
```

The example environment contains no real secrets. Future integration variables remain optional until their owning packet is enabled.

## Commands

```powershell
pnpm dev           # Next.js development server
pnpm build         # Production web build + Meta Bridge compilation
pnpm lint          # ESLint with zero warnings allowed
pnpm typecheck     # Strict workspace typecheck
pnpm test          # Unit/smoke suite
pnpm test:integration # Local Supabase analytics consent/session/attribution integration
pnpm test:integration:lead-intake # Packet 09 intake, linking, idempotency, concurrency, and Mailpit runtime
pnpm test:integration:crm # Packet 10 CRM role, merge, timeline, and intake regression
pnpm test:integration:operations # Packet 11 scoring, pipeline, task, role, and concurrency runtime
pnpm test:performance:operations # Disposable 1,000-record local operations evidence
pnpm leads:recalculate -- --stale --limit 100 # Bounded lead score batch
pnpm test:integration:lead-intake:email-failure # CRM commit/outbox failure-path runtime check
pnpm test:e2e      # Playwright Chromium smoke + axe scan (build first)
pnpm format        # Apply Prettier
pnpm format:check  # Verify formatting
pnpm audit         # High/critical dependency audit
pnpm db:verify     # Static database-foundation verification (always runnable)
pnpm db:start      # Start local Supabase (requires Docker)
pnpm db:status     # Inspect local Supabase (requires Docker)
pnpm db:reset      # Reset/apply migrations + seed (requires Docker)
pnpm db:lint       # Supabase SQL lint (requires Docker)
pnpm db:test       # pgTAP database tests (requires Docker)
pnpm db:types      # Generate packages/db/src/generated/database.types.ts (requires Docker)
```

Install the browser once before local E2E execution:

```powershell
pnpm exec playwright install chromium
pnpm build
pnpm test:e2e
```

## Architecture

- `apps/web`: deployable Next.js application.
- `packages/config`: non-secret shared config, typed errors, logging, and request IDs.
- `packages/validation`: browser-safe Zod schemas and environment validation.
- `packages/ui`: deliberately minimal shell primitives; no final visual system.
- `packages/db`: server-only Supabase client/admin factories and generated-type contract.
- `packages/analytics`: consent-aware browser queue, event contracts, sanitizers, and bounded delivery.
- `packages/automation`, `packages/email`: contracts only.
- `services/meta-bridge`: independent health/logging runtime; polling begins in Packet 14.
- `external/meta-automation`: `NOT_PINNED`; Packet 15 owns the approved upstream revision.

Read `MASTER_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/ENVIRONMENT.md`, `docs/DATA_MODEL.md`, `docs/EVENT_TAXONOMY.md`, `docs/PRIVACY_AND_CONSENT.md`, and `docs/PROGRESS_TRACKER.md` before implementation.
