# Packet 06R Result — Database Runtime Verification & Closure

## Scope

Runtime-only verification of the Packet 06 database foundation. No Packet 07 authentication, RBAC, CRM UI, or new product functionality was started.

## Docker and Supabase status

- Docker: Docker Desktop server available, version `29.8.0`, Linux engine healthy.
- Supabase CLI: `2.118.0`.
- Local services: database/API/REST/Auth/Studio/Realtime/Storage/Kong/Mailpit healthy enough for verification; optional imgproxy/analytics/vector/pooler services are stopped by the local configuration.
- PostgreSQL: `17.6`.
- URLs: database `127.0.0.1:54322`, API/REST `127.0.0.1:54321`, Studio `127.0.0.1:54323`, Mailpit `127.0.0.1:54324`. No credentials are recorded here.

## Migration and reset evidence

There are 9 migrations, applied in order:

`20260927060100_extensions_helpers.sql` → `20260927060200_staff_content.sql` → `20260927060300_visitors_identity.sql` → `20260927060400_crm_pipeline.sql` → `20260927060500_conversations_campaigns.sql` → `20260927060600_automation_foundation.sql` → `20260927060700_audit_utilities.sql` → `20260927060800_indexes.sql` → `20260927060900_rls_baseline.sql`.

- Initial startup exposed and fixed two source defects: the missing extensions migration was restored, and citext references were qualified to the actual extension schema contract.
- Required clean reset #1: PASS; all 9 migrations and seed applied.
- Required independent clean reset #2: PASS; all 9 migrations and seed applied again.
- Additional post-trigger-fix clean reset: PASS.

## Runtime catalog inventory

- Application tables: exactly 39, matching `docs/DATA_MODEL.md` and the migration inventory.
- Foreign keys: 67 cataloged relationships with intentional `RESTRICT`, `SET NULL`, or narrowly scoped `CASCADE` behavior; no unexpected circular dependency was found.
- RLS: 39/39 application tables enabled; `force_rls=false` on all; policy count 0 on all; anon and authenticated SELECT privileges false on all.
- Money: opportunity values are `numeric(14,2)` and probabilities `numeric(5,2)`; 0 business floating-point columns.
- Time: inspected business time columns are `timestamptz`; no critical `timestamp without time zone` columns.
- Email: people, staff, and provider identity email fields are `citext`; runtime duplicate `John@Example.com`/`john@example.com` was rejected.

## Seed verification

Exactly seven pipeline stages exist with stable slugs/order: `new`, `qualified`, `discovery`, `proposal`, `negotiation`, `won`, `lost`. `won` is closed/won; `lost` is closed/not-won; the other five are open. Seed settings are `content_mode=demo`, automation `enabled=false`, and `dry_run=true`. No auth users, customer records, SMTP/HMAC/social credentials, real leads, or production claims were seeded.

## Constraint, trigger, and history verification

`scripts/runtime_constraints.sql` executes in a rollback-safe transaction and passed live PostgreSQL checks for score bounds, probability bounds, self-match rejection, consent subject requirement, lifecycle/job/task states, case-insensitive email uniqueness, updated-at monotonicity, appendable consent history, form/job idempotency, nonce uniqueness, and campaign membership uniqueness.

`public.database_health()` returned true. The immutable/history tables have no mutable updated-at trigger requirement; mutable site settings updated automatically.

## RLS and role evidence

- Anonymous REST read of `site_settings`: HTTP 401.
- Direct `anon` reads of people, organizations, identities, events, consents, opportunities, messages, automation jobs, and audit logs: all denied (exit code 1); anon insert into people denied.
- Direct `authenticated` read of opportunities: denied (exit code 1). No temporary authenticated user was created because Packet 07 owns Auth/RBAC workflow setup; the database role-level denial is stronger for this baseline.
- Server-side service-role REST read of `site_settings`: HTTP 200; disposable insert: HTTP 201; cleanup delete: HTTP 200. The key was used only in the local test process, never printed or stored.
- Browser bundle scan: 0 service-role-key hits. Source scan found only variable names/empty example values, no credentials.

## Atomic automation claim evidence

Two competing claimers called `public.claim_next_automation_job(uuid, integer)` against two due jobs. Each received exactly one distinct job; both became `CLAIMED` with the expected agent, `claimed_at`, and five-minute `lease_expires_at`. The future-scheduled job remained `QUEUED`; the `AWAITING_APPROVAL` job remained untouched; a disabled agent was rejected. No job was claimed twice. The function is `SECURITY DEFINER`, fixed-search-path, lease-bounded, and uses `FOR UPDATE SKIP LOCKED`.

Lease reclaim/backoff is not implemented in Packet 06 and remains a later automation responsibility.

## Lint, pgTAP, generation, and drift

- `pnpm db:lint`: PASS; no schema errors, 0 warnings/errors reported.
- `pnpm db:test`: PASS; 1 pgTAP file, 11 planned, 11 passed, 0 failed, 0 skipped.
- `pnpm db:types`: PASS; provisional contract replaced by actual Supabase CLI output. A second generation produced the identical SHA-256 hash `CC3B4CA4784F6AC72AFA1BD53D82E911A5C2F83BB83E47298DB448B3BF6ABA25`.
- `pnpm db:verify`: PASS.
- `pnpm exec supabase db diff --local`: only expected `drop extension if exists "pg_net"` system-extension drift; no application-schema drift.

## Repository regression gates

- `pnpm install --frozen-lockfile`: PASS.
- `pnpm format:check`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test:unit`: PASS — 5 files, 10 tests.
- `pnpm build`: PASS.
- `pnpm test:e2e`: PASS — 1 Chromium/axe test.
- `pnpm audit --audit-level high`: PASS — no known vulnerabilities.

## Documentation fixes

Replaced the actual skeletons in `docs/DATA_MODEL.md`, `docs/SECURITY.md`, `docs/CRM_SPEC.md`, `docs/IDENTITY_RESOLUTION.md`, `docs/LEAD_SCORING.md`, `docs/AUTOMATION_ARCHITECTURE.md`, and `docs/PRIVACY_AND_CONSENT.md`. Updated architecture, environment, risks, limitations, progress, decisions, and the implementation ledger. The historical `docs/work/06-result.md` remains unchanged as the original external-dependency record.

## Remaining limitations and risks

- No hosted Supabase project, deployment, performance run, or restore rehearsal.
- Staff Auth/RBAC policies are intentionally absent; deny-by-default remains the safe posture.
- Exact legal retention and outreach policies remain pending qualified approval.
- Local runtime secrets are ephemeral and were not recorded.

## Packet 07 readiness

The database foundation is trustworthy for review and Packet 07 planning. Packet 07 is marked `NEXT_BACKEND_PACKET` but was not started. Do not begin it automatically.

## STATUS

**PASS** — all required runtime database checks and full repository regression gates passed. Stop after Packet 06R.
