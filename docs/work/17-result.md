# Zavlio Packet 17 result

## Scope

Packet 17 closes backend/platform production-readiness engineering without starting Packet 18, redesigning the public site, enabling mass automation, or enabling live social execution. The final status is PASS_WITH_EXTERNAL_DEPENDENCY.

## Packet 16 Documentation Correction

Packet 16 rollback documentation now names both migrations: 20261001061900_social_integration.sql and 20261001062000_social_ingestion_materialization.sql. Migration history was not rewritten.

## Source Control State

The workspace is on branch main with no configured remote shown by git remote -v. Source files remain uncommitted/untracked in this workspace. No automatic commit was made.

## Release Identifier

RELEASE_SOURCE_NOT_COMMITTED. A user-authorized immutable release commit is required before deployment.

## Runtime Versions

Node 24.13.0 and pnpm 11.19.0 match the repository pins. The managed launcher may report a different embedded engine warning, but the project executable reported the pinned Node version.

## Database Startup

pnpm db:start failed because Docker Desktop Linux engine was unavailable at npipe:////./pipe/dockerDesktopLinuxEngine. The database release gate is NOT VERIFIED.

## Full Migration Replay

Not executed. pnpm db:reset, db:lint, db:test, and both db:types attempts could not connect without Docker/Postgres. No manual SQL or schema surgery was performed.

## Final Migration Count

Twenty SQL migration files are present, spanning 20260927060100_extensions_helpers.sql through 20261001062000_social_ingestion_materialization.sql. This is a repository count, not an applied database count.

## Final Table Count

Static migration text contains 52 create-table statements. Final application table count is NOT VERIFIED because no clean database catalog was available.

## Views

Static migration text contains 12 view definitions/replacements. Applied view count is NOT VERIFIED.

## Functions/RPCs

Static migration text contains approximately 64 function definitions/replacements. Applied function/RPC count is NOT VERIFIED.

## RLS Matrix

The repository contains explicit RLS/policy migrations and role-specific grants from prior packets. The required anon, nonstaff, inactive staff, VIEWER, OPERATOR, ADMIN, OWNER, and service/internal runtime matrix was not rerun without PostgreSQL. NOT VERIFIED.

## pgTAP

NOT RUN. Docker/Postgres was unavailable.

## Generated Types

Fresh types were NOT regenerated. The existing checked-in generated declaration remains present, but it is not claimed current after Packet 16.

## Generated Type Hash

Existing file SHA-256: 15ACA49C6EAE7DAD4EBF979D1BE6E1942AB161C42F6B0F8FA7D402ED337E48B2. Two-run fresh hash comparison: NOT AVAILABLE.

## Database Performance

EXPLAIN ANALYZE/Buffers review was NOT RUN. Required people, timeline, pipeline, tasks, analytics, queue, conversation, message-dedupe, and identity lookup checks remain a database dependency.

## Packet 16 Database Verification

Provider settings, observations, cursors, canary permits, identity observations, nullable conversation/message links, record_social_observation, review_social_identity_observation, consume_social_canary_permit, materialization, and dedupe were not replayed against PostgreSQL. Synthetic provider checks passed separately.

## Social Ingestion Runtime

The deterministic provider harness passed 31 checks, including repeated observation/message/touchpoint dedupe and merged-survivor resolution. Database-backed ingestion evidence is NOT VERIFIED.

## Canary Atomicity

The synthetic one-use permit test passed. Required two concurrent PostgreSQL consumers with exactly one success are NOT VERIFIED.

## Hosted Supabase Auth

NOT CONFIGURED in this workspace. Hosted invite login, recovery, PKCE, inactive denial, role claims, and final-owner protection remain external.

## Staff Login

NOT VERIFIED against hosted Supabase.

## Public Signup Disabled

Local Supabase config declares signup disabled; hosted setting is NOT VERIFIED.

## SMTP Production Verification

NOT CONFIGURED. Local Mailpit evidence from Packet 09 remains historical local evidence only. No production SMTP connection or controlled recipient was used.

## Turnstile Production Verification

NOT CONFIGURED. Production valid, invalid, and missing-token checks remain external. The production validator requires Turnstile enabled and server/client keys.

## Environment Validation

Implemented packages/validation production checks and pnpm env:check for development, test, production, and bridge modes. Development/test checks passed. Production check correctly failed closed with missing hosted secrets and unsafe local defaults.

## Production Unsafe-Flag Checks

PASS locally through unit tests and production validator logic. Demo content, Mailpit, localhost endpoints, disabled Turnstile, example secrets, and LIVE_EXTERNAL_EXECUTION=true are rejected or remain disabled.

## Secret Inventory

The authoritative inventory is provider-neutral: Supabase service role is web server-only; SMTP credentials are web/outbox worker-only; Turnstile secret is server-only; machine HMAC and agent keys are control-plane/Bridge-only; social browser credentials remain user-controlled and never enter Zavlio; observability DSN/token is server-only. No values are documented.

## Secret Rotation

Rotation procedures are documented for Supabase, SMTP, Turnstile, machine HMAC current/previous overlap, Bridge credentials, and observability tokens. No destructive real rotation was attempted.

## Structured Logging

Structured logger fields remain timestamp, level, component, message/event, and bounded context. Packet 17 adds recursive redaction for authorization, cookies, passwords, tokens, JWTs, service-role, HMAC, SMTP, Turnstile, and session values.

## Log Redaction

pnpm test:security:redaction passed 6 cases. The adapter and Bridge harnesses also passed secret-redaction checks.

## Observability

docs/OBSERVABILITY.md defines bounded HTTP, forms, outbox, database/RPC, queue, Bridge, machine-auth, manual-action, provider-health, and slow-query categories. A vendor is optional and no raw PII is required.

## Health

Added safe no-store web liveness endpoint /api/health and Bridge /health. Health surfaces do not expose secrets, connection strings, raw payloads, or stack traces.

## Readiness

Added /api/ready with process/config/database-unverified/Bridge-independent/social-disabled states. Social degradation is independent of core web readiness.

## Automation Scheduling

The existing PostgreSQL automation tick and lead recalculation commands remain the simple worker boundaries. Production scheduling is provider-neutral cron/scheduler invocation with bounded overlap, lease recovery, nonce cleanup, and outbox processing; no Redis/Kafka/Temporal was added.

## Email Outbox Worker

Transactional intake remains committed before delivery, with durable idempotent outbox rows and failure states. A production scheduler/worker must process retryable rows outside request lifetime. Production delivery was not configured.

## Bridge Supervision

Deployment docs specify one intended compiled instance, bounded restart backoff, graceful SIGTERM, loopback health/readiness, redacted logs, isolated secrets, and signed HTTPS control-plane access.

## Bridge Key Rotation

Packet 14 current/previous HMAC overlap, expiry, replay denial, and NTP requirements remain documented. Real production keys were not used.

## Backup Strategy

Provider-managed encrypted PostgreSQL backups plus scheduled logical exports are documented. Secret-manager backups remain separate.

## Restore Rehearsal

NOT RUN because Docker/Postgres and a disposable hosted project were unavailable. No production database was overwritten.

## RPO/RTO

Engineering targets only: provider PITR plus last logical export for RPO, and measured disposable restore/redeploy duration for RTO. No contractual guarantee is claimed.

## Data Retention

Created DATA_RETENTION.md with analytics, sessions, forms, CRM, messages, notes, consent/DNC, automation/audit, social observations, and logs. No automatic destructive purge was enabled.

## Data Subject Operations

Export, correction, deletion/anonymization, and suppression-history handling are documented as explicit reviewed operations. Audit, security, financial, consent, and DNC evidence is not automatically cascaded.

## Disaster Recovery

Created backup/restore, deployment, and incident procedures for database outage, migration failure, deployment failure, Bridge compromise, machine-HMAC compromise, SMTP/Turnstile outage, and social checkpoint.

## Incident Response

Created INCIDENT_RESPONSE.md with detect, contain, disable, rotate, recover, and review phases plus emergency kill-switch, agent disable, canary revoke, and form-protection controls.

## Security Headers

Next.js now emits X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options, and production-only HSTS. A restrictive CSP remains an explicit follow-up after deployed asset inventory rather than an untested breaking default.

## Cookie Security

Existing analytics cookies remain consent-gated, bounded, and Secure in production. Auth cookie behavior remains delegated to Supabase SSR; hosted verification is external.

## CSRF / Same-Origin

State-changing routes remain POST/RPC/server-authorized; machine routes use HMAC rather than browser cookies. Public forms retain same-origin/Turnstile/rate controls.

## Public Rate Limiting

The local process limiter remains useful test evidence but is not treated as a multi-instance production solution. Production deployment must use platform/WAF or another centrally shared bounded limiter.

## Machine Rate Limiting

Packet 14 per-agent machine bounds remain in force and were covered by prior Bridge harness evidence. Hosted deployment proof is external.

## Dependency Audit

pnpm audit --audit-level high passed with no known vulnerabilities. The pinned upstream audit/source evidence remains unchanged; broad upstream runtime remains environment-dependent.

## License / Dependency Inventory

Lockfiles, Node/pnpm pins, and the pinned upstream MIT license/manifest remain preserved. No dependency replacement was introduced.

## Meta Pin Verification

pnpm meta:verify-pin passed: origin, commit 439c3bfaacb1caabef25a7d67c3f204916a5a168, tree e4f412bc7ff86261f0753a1f088c5f271af9246c, package/hash/license/README/source-clean checks all passed.

## CI Pipeline

Updated GitHub Actions with frozen install, formatting, lint, typecheck, unit, redaction, secret scan, environment test mode, adapter/provider tests, build, E2E, pin verification, and a disposable database job.

## CI Database Tests

CI now attempts db:start, db:reset, db:lint, db:test, and generated types twice with byte/hash and git-diff checks on Ubuntu Docker. This workflow was not executed by this local run.

## CI Type Drift Gate

The database CI job compares two generated-type hashes and rejects a diff against committed declarations. Local execution was unavailable.

## CI Secret Scan

The repository includes a bounded source scan that ignores only documented specs, docs/examples, deterministic fake-secret fixtures, lock metadata, and ignored Supabase runtime artifacts. Local scan passed 512 files.

## Production Build

pnpm build passed after adding health/readiness routes and security headers. The web and Bridge packages compiled successfully.

## Deployment Architecture

Provider-neutral web/control plane, hosted Supabase/Postgres/Auth, email, Turnstile, observability, and separately supervised local/controlled Bridge are documented. Windows is development-only except the user-controlled browser runtime.

## Migration Deployment

Deployment requires backup, ordered migration review/application, schema/types/RLS verification, application deploy, then smoke checks. No destructive down-migration promise is made.

## Rollback Strategy

Application/config/Bridge rollback uses prior immutable artifacts/config. Database rollback uses forward-fix or a rehearsed restore, not ad hoc schema surgery.

## Post-Deploy Smoke Plan

The deployment runbook covers homepage, login, staff access, controlled form validation, consent analytics, readiness, test-recipient email, automation disabled/dry-run, Bridge health, and live social disabled.

## Production Seed Safety

Production must not load demo people/messages/jobs or test permits. Only reviewed reference policy/stage configuration may be seeded.

## Test Backdoor Scan

Production checks reject demo/test credentials, localhost/Mailpit, synthetic/live unsafe combinations, and service-role use outside server paths. No test backdoor was added.

## PII Review

Logs, health, machine protocol, analytics, and social observation contracts remain bounded. No raw DOM, screenshots, cookies, IP, full user agent, form body, email, or social conversation is required.

## Database Connection Strategy

Use the selected Supabase provider's supported pooled/server connection mode for multi-instance web deployment; do not create per-request unbounded connections. Local verification was unavailable.

## Concurrency Regressions

Packet 15R.1 adapter concurrency and Packet 16 synthetic dedupe/canary checks passed. Database races for intake, merges, stages, claims, leases, approvals, and one-use permits remain NOT VERIFIED without Postgres.

## Packet 07 Regression

Local Auth configuration remains invite-only; hosted Auth regression remains external.

## Packet 08 Regression

Prior consent/visitor/session evidence remains recorded; broad integration rerun was blocked by missing local Supabase credentials.

## Packet 09 Regression

Prior intake and SMTP-failure evidence remains recorded; rerun was blocked by missing local Supabase credentials.

## Packet 10 Regression

Prior CRM evidence remains recorded; rerun was blocked by missing local Supabase credentials.

## Packet 11 Regression

Prior operations evidence remains recorded; rerun was blocked by missing local Supabase credentials.

## Packet 12 Regression

Prior reporting evidence remains recorded; rerun was blocked by missing local Supabase credentials.

## Packet 13 Regression

Prior policy/automation evidence remains recorded; rerun was blocked by missing local Supabase credentials.

## Packet 14 Regression

Signed Bridge runtime rerun was blocked by missing local Supabase credentials; adapter/provider deterministic tests passed.

## Packet 15R.1 Regression

pnpm test:integration:meta-adapter passed with exact binding, cancellation/STOP/timeout, one-shot, integrity, dialog, prompt/origin, child-isolation, and pin checks.

## Packet 16 Regression

pnpm test:integration:social-provider passed 31 checks with zero real external side effects. Database materialization remains external.

## E2E

Playwright ran 18 tests: 4 passed, 3 failed during fixture setup because SUPABASE_SERVICE_ROLE_KEY was unavailable, and 11 dependent tests did not run. This is external, not a pass.

## Accessibility

The available E2E run passed homepage/forms/analytics accessibility checks. CRM/automation/operations axe coverage was blocked by missing database fixtures; zero-violation full operational claim is NOT VERIFIED.

## Responsive Verification

Responsive operational-route coverage is external with the database-backed suite; no full 1440x900, 1024x768, and 390x844 claim is made.

## Clean Environment Test

NOT RUN as a disposable clone/install/database environment was unavailable. CI now provides a reproducible install and disposable database path.

## Release Checklist

docs/RELEASE_CHECKLIST.md is the authoritative source checklist for source, dependencies, database, auth, forms, email, analytics, CRM, automation, Bridge, social, secrets, observability, backup, restore, security, CI, deployment, and smoke checks.

## Production Readiness Matrix

| Area                                                              | Status                 |
| ----------------------------------------------------------------- | ---------------------- |
| Source/build/lint/type/unit/security/pin                          | VERIFIED               |
| Adapter/provider dry-run and zero social side effects             | VERIFIED               |
| Environment unsafe-flag gate                                      | VERIFIED               |
| Docker/Postgres replay, pgTAP, RLS, generated types, Packet 16 DB | EXTERNAL_DEPENDENCY    |
| Hosted Auth, SMTP, Turnstile, observability account               | NOT_CONFIGURED         |
| Backup/restore rehearsal                                          | EXTERNAL_DEPENDENCY    |
| Deployment provider/release commit                                | NOT_CONFIGURED         |
| Live social execution                                             | INTENTIONALLY_DISABLED |

## External Dependencies

Docker Desktop/Postgres or equivalent CI evidence, hosted Supabase project/configuration, production SMTP credentials, Turnstile keys, deployment target, observability account, distributed rate limiter, disposable restore project, and authenticated social browser accounts.

## Known Limitations

The complete post-Packet-16 database has not been executed in this workspace. Do not deploy database changes or claim full backend production readiness until the database chain, generated types, RLS, Packet 16 materialization, canary atomicity, and restore rehearsal pass.

## Backend Release Recommendation

Release the local engineering changes only as an uncommitted review artifact. Require a user-authorized release commit and completion of all external/database gates before staging or production deployment. Keep live social execution false.

## STATUS

PASS_WITH_EXTERNAL_DEPENDENCY. Local backend/platform controls and documentation are closed; DATABASE RELEASE GATE = NOT VERIFIED. STOP after Packet 17 and do not start Packet 18.
