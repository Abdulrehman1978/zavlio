# Deployment

Status: operational runbook; deployment provider intentionally remains unselected.

## Components

Deploy the Next.js control plane, hosted Supabase/PostgreSQL/Auth, transactional email provider, Turnstile, and observability integration independently. The Meta Bridge is a separately supervised worker near the user-controlled browser/CDP session; it is not assumed to run in the web cloud. It has no database credential and reaches the control plane over signed HTTPS.

## Promotion order

1. Freeze an immutable release identifier and verify frozen install, build, pin, secret scan, and dependency audit. Packet 17R currently records RELEASE_SOURCE_NOT_COMMITTED.
2. Take/verify a database backup and review migration SQL. Apply migrations in filename order; Packet 16 consists of both 20261001061900_social_integration.sql and 20261001062000_social_ingestion_materialization.sql.
3. Run schema/type/RLS checks and the post-deploy smoke plan before enabling staff traffic.
4. Deploy the web artifact, then verify /api/health and /api/ready.
5. Start the Bridge under a supervisor only after handshake, heartbeat, DRY_RUN_ONLY, policy, and kill-switch checks pass. Live social execution remains disabled.

Packet 17R status: DATABASE RELEASE GATE = NOT VERIFIED. Do not apply the database migrations or promote a database-containing release until the clean replay, RLS/pgTAP, generated-types, Packet 16 materialization/canary, and restore gates have evidence.

## Configuration and secrets

Use the target platform's encrypted environment/secret facility; never deploy a local .env, developer path, test credential, Mailpit endpoint, or generated local Supabase secret. Run pnpm env:check production in the release environment. Keep AUTOMATION_MACHINE_KEYS_JSON only in the control plane and the per-agent HMAC only in the Bridge process.

## Supervision and rollback

Run the compiled Bridge as one intended instance with bounded restart backoff, SIGTERM drain, loopback health/readiness, and structured redacted logs. Application rollback restores the prior immutable artifact; configuration rollback restores the previous validated secret/config set; Bridge rollback stops the worker and restores its prior pinned artifact. Database rollback is not assumed to be a destructive down migration: stop promotion and use a reviewed forward-fix or restore rehearsal procedure.

## Post-deploy

Check homepage/login, staff authorization, a controlled public-form validation, consent-aware analytics, database/readiness status, email test recipient delivery, automation disabled/dry-run state, Bridge health if deployed, and LIVE_EXTERNAL_EXECUTION=false. Do not perform destructive or real social tests.
