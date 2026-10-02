# Packet 07 Result — Staff Authentication, RBAC & RLS Authorization

## Scope

Implemented invite-only Supabase email/password Auth integration, SSR cookie/PKCE handling, Next.js 16 `proxy.ts`, claims-based server guards, typed role authorization, explicit RLS/grants for all 39 application tables, staff administration, invite compensation/audit, owner bootstrap, recovery/password/logout flows, local Auth configuration, and runtime/unit/pgTAP evidence. Packet 08 was not started.

## Files Changed

- `apps/web/src/lib/supabase/*`: browser, SSR server, and proxy clients.
- `apps/web/src/lib/auth/*`: claims-based identity/staff guards, role helper, safe redirect policy.
- `apps/web/src/app/auth/*`: login, confirm, recovery, password setup, logout, and generic error flows.
- `apps/web/src/app/api/auth/*`: non-conflicting recovery/password mutation handlers.
- `apps/web/src/app/api/staff/*`, `apps/web/src/app/crm/settings/staff/page.tsx`: protected invite and role/deactivation administration.
- `supabase/migrations/20260927061000_staff_auth_rbac.sql`: helper functions, explicit grants, role policies, final-owner/security triggers.
- `supabase/config.toml`: invite-only email signup, confirmations, refresh rotation, and redirect allowlist.
- `scripts/bootstrap-owner.mjs`, `scripts/auth-runtime-test.mjs`: idempotent bootstrap and disposable Auth/JWT/RLS runtime verification.
- `tests/unit/auth-rbac.test.ts`, `supabase/tests/auth_rbac_test.sql`: focused tests.
- `docs/AUTHENTICATION.md`, `docs/SECURITY.md`, `docs/ENVIRONMENT.md`, `docs/IMPLEMENTATION_LEDGER.md`, `docs/PROGRESS_TRACKER.md`.

## Database Changes

One new migration after Packet 06. Four fixed-search-path helper functions resolve active staff from `auth.uid()`. Explicit authenticated grants and policies cover the documented role matrix. `automation_nonces` remains inaccessible to staff; audit logs are read-only to ADMIN/OWNER; the final active-owner invariant and non-owner security-field trigger are enforced by security-definer triggers.

## APIs Added/Changed

- POST `/auth/login`, `/auth/logout`, `/auth/confirm`.
- POST `/api/auth/forgot-password`, `/api/auth/set-password`.
- POST `/api/staff/invite`, `/api/staff/[id]`.
- GET/POST `/crm/settings/staff` through the protected App Router page and forms.

## UI Added/Changed

Accessible login, recovery, password setup, and a minimal staff administration page with invite, role, activate/deactivate controls. `/crm` and `/crm/**` resolve active staff server-side and redirect unauthorized users.

## Security/Privacy Impact

No signup/register route exists. Auth authority and Zavlio authorization are separate. No role decision uses email domain, user metadata, or client state. Redirects are internal-only; tokens are not logged; service-role imports are server-only. Consent/audit/automation-sensitive tables have no casual staff write path. No credentials or user records are seeded.

## Tests Run

```text
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
pnpm audit --audit-level high
pnpm db:reset
pnpm db:lint
pnpm db:test
pnpm db:types
pnpm db:types
node scripts/auth-runtime-test.mjs
node scripts/bootstrap-owner.mjs --email <disposable> --name "Packet 07 Owner" (twice)
```

## Test Results

- Install: PASS.
- Format: PASS.
- Lint: PASS, zero warnings.
- Workspace typecheck: PASS.
- Unit: PASS, 6 files / 13 tests.
- Production build: PASS; all auth, CRM, API, and proxy routes compiled.
- E2E/axe: PASS, 1 Chromium test.
- Dependency audit: PASS, no high vulnerabilities.
- Clean database reset: PASS, migration 61000 applied.
- Schema lint: PASS.
- pgTAP: PASS, 2 files / 19 tests.
- Generated DB types: PASS twice; identical SHA-256 `D0DF88E9CF818E47F1D518EE5144578F72CE27480D26F6D1E1635EFE6B2ADE6E`.
- Runtime RLS matrix: PASS for disposable owner/admin/operator/viewer/nonstaff/inactive Auth users using locally signed JWTs; operator insert allowed, viewer insert denied, audit/nonces protected, nonstaff/inactive denied, public signup denied, Mailpit reachable.
- Owner bootstrap: PASS; invite delivered to Mailpit and second invocation idempotently no-op.

## External Dependency

The local Supabase CLI 2.118.0 configuration maps `auth.enable_signup=false` to `GOTRUE_EXTERNAL_EMAIL_ENABLED=false`, so email/password login cannot be exercised in the local container without enabling public signup. The invite-only security requirement is preserved; hosted Supabase must verify email/password enabled with signup disabled. This is why the packet status is `PASS_WITH_EXTERNAL_DEPENDENCY`, not `PASS`.

## Known Limitations

- Hosted Supabase settings and SMTP are not configured in this workspace.
- Local email/password login is blocked by the CLI mapping defect above; application handlers are compiled and RLS/Auth user/JWT behavior is verified.
- MFA/step-up authentication is explicitly deferred to a later packet.
- The UI is intentionally minimal and does not claim final visual design.

## Rollback Notes

Revert the Packet 07 app/docs files and remove migration `20260927061000_staff_auth_rbac.sql`; then run a clean database reset. Do not modify Packet 06 migrations. Remove disposable local Auth users through the service client if a test exits before cleanup.

## Next Packet Readiness

Stop after Packet 07 for user review. Packet 08 is the next backend packet and was not started.

STATUS: PASS_WITH_EXTERNAL_DEPENDENCY
