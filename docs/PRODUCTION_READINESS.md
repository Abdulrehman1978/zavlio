# Zavlio production readiness

Packet 17 is an operational closure record, not a claim that every hosted dependency is configured.

## Locally verified

- Frozen dependency install, formatting, lint, strict typecheck, unit tests, production build, high-severity audit, pin verification, deterministic Meta adapter/provider tests, environment safety tests, log-redaction tests, and secret scan.
- Live external social execution remains disabled. No real social side effect was attempted.
- Safe health/readiness routes, security headers, structured redaction, CI release gates, migration ordering, backup/restore procedures, incident response, retention, and deployment runbooks are present.

## Hosted or infrastructure dependent

Hosted Supabase Auth, production SMTP, production Turnstile, selected deployment
provider, production observability, distributed public rate limiting, and
authenticated social accounts remain external. Local Docker/Postgres replay,
catalog inspection, generated types, RLS runtime, Packet 16 materialization,
canary atomicity, performance checks, and a disposable restore rehearsal were
run; their failures are recorded in the Packet 17R result.

## Intentionally disabled

Demo content in production, test credentials, Mailpit, synthetic social providers, autonomous upstream execution, Instagram, live social execution, and production canary permits are disabled or rejected by production checks.

## Release decision

Packet 17R resumed verification after host recovery. Ubuntu-24.04 boots as
WSL2, Docker Desktop is healthy, clean reset applied all 20 migrations, and
the runtime catalog contains 52 RLS tables. Generated types were deterministic
and the disposable restore rehearsal completed, but pgTAP, Packet 08–13
regressions, merged-person social canonicalization, and four database-backed
E2E tests failed. DATABASE RELEASE GATE = NOT VERIFIED; do not deploy database
changes. Backend status is NOT_VERIFIED due to internal regressions; hosted
dependencies remain external.
