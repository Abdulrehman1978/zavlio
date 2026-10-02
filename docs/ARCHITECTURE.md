# Architecture

## Packet 17 operational closure

Production deployment is provider-neutral and split into web/control plane, hosted PostgreSQL/Auth, email, Turnstile, observability, and a separately supervised local Bridge. Production configuration is validated fail-fast; live social execution remains disabled.

Last verified: Packet 09 (local Supabase/PostgreSQL, intake, email outbox, and browser runtime verification)

## Implemented

- A pnpm workspace resolves `apps/*`, `packages/*`, and `services/*`.
- `apps/web` is a Next.js 16 App Router application. Components are server components unless explicitly marked otherwise.
- `/` remains a temporary server-rendered shell; `/login` is a functional invite-only login; `/crm` and `/crm/**` resolve active staff server-side and are protected by `proxy.ts` plus route guards.
- `packages/config` owns non-secret constants, structured JSON logging, typed application errors, safe public-error conversion, and correlation ID creation. It compiles to ESM before runtime consumers start.
- `packages/validation` owns browser-safe Zod foundation/environment schemas and opt-in integration-secret checks.
- `packages/ui` exposes only a neutral shell primitive. It intentionally carries no design-system direction.
- `packages/db` imports `server-only` and exposes typed Supabase browser/server and service-role admin factories. The admin factory is never browser-safe and requires `SUPABASE_SERVICE_ROLE_KEY` at call time.
- `supabase/migrations` is the sole schema source of truth. PostgreSQL uses UUID keys, UTC `timestamptz`, `citext` email values, `numeric` money, explicit text/CHECK state machines, updated-at triggers, relational indexes, and a security-definer queue claim primitive.
- Every app-facing public table has RLS enabled. Packet 07 adds explicit authenticated grants and role-aware policies; anon, nonstaff, and inactive staff remain denied by effective policy.
- `supabase/seed.sql` contains only stable pipeline stages and non-secret default settings. It creates no auth users, customer records, claims, or secrets.
- `packages/analytics` contains the browser-safe consent-aware queue, event allowlists, sanitizers, first-party cookie handling, and bounded delivery client. `packages/automation` contains the pure deterministic policy evaluator and safe dry-run executor; `packages/email` remains the outbox adapter boundary.

Packet 13 makes PostgreSQL the automation control plane: immutable policy/approval/event evidence, guarded RPC transitions, atomic leasing, and RLS-safe CRM projections. External agents remain non-authoritative clients; Packet 14 will define machine authentication.

- `/api/analytics/consent` records append-only preference history; `/api/analytics/events` is the only public ingestion boundary. It validates origin, consent, payload size, event names, metadata, timestamps, and UUIDs before using a narrow server-only admin client and the atomic database session function.
- `/start-a-project` and `/contact` are neutral functional shells backed by `/api/forms/start-project` and `/api/forms/contact`. Both routes share server-only orchestration: strict Zod parsing, same-origin/body/rate checks, honeypot and Turnstile verification, consent-aware visitor resolution, one security-definer intake RPC, and post-commit email outbox delivery.
- `intake_lead_submission` is the transaction boundary for form submission, exact-email person/identity resolution, exact-domain organization matching, visitor backfill/conflict candidates, touchpoints, opportunities/tasks, score snapshots, audit records, and idempotent outbox rows. Email delivery never runs inside the transaction.
- `services/meta-bridge` is independently compiled Node/TypeScript with validated local host/port, structured logging, `/health`, and idempotent start/clean stop behavior.
- `external/meta-automation` is a documented `NOT_PINNED` placeholder with no upstream source.
- Root tooling provides strict TypeScript, ESLint, Prettier, Vitest/RTL, Playwright/axe, a frozen lockfile, and GitHub Actions CI.

## Security boundaries implemented

- `.env*` is ignored except `.env.example`.
- Server environment and database entry points import `server-only`.
- Public environment parsing returns only an explicit `NEXT_PUBLIC_*` allowlist.
- Future secrets are optional until an integration is enabled, then checked centrally.
- Public error conversion never exposes arbitrary internal messages or stack traces.
- Logs are structured by timestamp, level, and component; callers must pass only safe scalar context.

## Planned backend-first

Packet 06 adds the database foundation. Packet 07 adds staff auth/RBAC policies. Packet 08 adds anonymous first-party analytics. Packet 09 adds functional intake and bounded CRM linking. Packet 10 adds the first CRM workspace and safe merge. Packets 11–17 add full scoring, dashboards, queue, bridge connectivity, upstream adapter, social ingestion, and hardening.

## Deferred by user

## Packet 10 CRM operations

The CRM is server-first: guarded App Router pages call an authenticated Supabase client, keep RLS active, and pass typed bounded data to neutral UI components. People lists use the `crm_people_projection` view, allowlisted sorting, indexed bounded search, and page-size 25 pagination. Person timelines use one normalized cursor function rather than N+1 client queries. Identity review and merge actions are explicit server mutations; the `merge_people` security-definer function locks both rows, reparents relations, archives the source, and records an audit/merge history row in one transaction.

Packets 02–05 (design system, homepage, public routes, premium motion/3D) are `DEFERRED_BY_USER`, not failed or cancelled. The approved visual direction remains governed by `MASTER_SPEC.md`, and the temporary shell must not become the final design by accident.

## Packet 11 lead operations slice

packages/crm owns the pure scoring domain and bounded server extraction. Next.js server components render current projections through authenticated RLS clients; client components are limited to accessible mutation controls. A narrow service-only persist_lead_score RPC is the sole elevated scoring write. Opportunity and task business mutations remain authenticated RPCs with role checks, row locks, optimistic preconditions, history, and audit in PostgreSQL transactions.

## Packet 12 reporting slice

`/crm/analytics` is a dynamic staff-only Server Component with five URL-addressable tabs. Five security-invoker PostgreSQL RPCs aggregate bounded ranges under authenticated RLS; raw events and CRM records never enter chart components. RLS keeps the same active-staff predicate while using a scalar subquery for once-per-statement evaluation. Recharts is isolated to one small client renderer; exact tables and metric definitions remain authoritative. See `docs/ANALYTICS_REPORTING.md` and `docs/METRICS_DICTIONARY.md`.

## Packet 15 adapter boundary

The pinned Meta Automation source runs only behind a Zavlio-owned isolated child process. The Bridge remains the policy and CRM authority; the child receives an allowlisted environment with no Packet 14 HMAC or Supabase service-role credentials, connects only to local CDP, and executes fixed dry-run semantic primitives. The upstream full runner, planner, identity graph, follow-up scheduler, browser manager, AI runtime, and local state are not part of the normal path.

# Packet 16 social integration

Packet 16 adds isolated Threads, Facebook, and LinkedIn providers for bounded observation and exact target/control proof. CRM, Packet 13 policy, Packet 14 signed execution, and Packet 15R.1 adapter boundaries remain authoritative; live execution is disabled.
