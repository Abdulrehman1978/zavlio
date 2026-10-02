# Environment

## Packet 17 operational closure

Use pnpm env:check in development, test, production, or bridge mode. Production rejects unsafe defaults and requires external configuration for Supabase, SMTP, Turnstile, and non-local URLs.

### Packet 17 variable classes

PUBLIC values are limited to NEXT_PUBLIC_SITE_URL, public Supabase URL/anon key, Turnstile site key, analytics flags, and policy versions. WEB_SERVER_SECRET values include Supabase service role, session/signing material, and server-only integration credentials. DATABASE values are hosted/local Supabase connection settings. SMTP values are host, port, user, password, TLS, sender, and recipient routing. TURNSTILE values are site key plus server secret. SUPABASE values are project URL, project ID, anon key, and service role. MACHINE_PROTOCOL values are control-plane machine key maps and Bridge per-agent HMAC. META_BRIDGE values are loopback host/port, control-plane URL, version, and dry-run mode. SOCIAL_PROVIDER values are readiness/configuration only; browser credentials stay user-controlled. OBSERVABILITY values are server-only DSN/token and never enter browser bundles.

Production storage is the selected deployment platform's encrypted secret facility. No secret is committed, browser-visible, or passed to the pinned child. Rotation is documented separately from database backup.

## Packet 14 machine protocol

Control-plane server only:

- `AUTOMATION_MACHINE_KEYS_JSON`: map of agent keys to a current `{ keyId, secret }` and optional previous `{ keyId, secret, validUntil }`. Secrets are unpadded base64url and decode to at least 32 bytes.

Bridge process only:

- `ZAVLIO_CONTROL_PLANE_URL`
- `ZAVLIO_AGENT_KEY`
- `ZAVLIO_MACHINE_KEY_ID`
- `ZAVLIO_MACHINE_HMAC_SECRET`
- `ZAVLIO_BRIDGE_VERSION`
- `ZAVLIO_PROTOCOL_VERSION=1`
- `ZAVLIO_EXECUTOR_MODE=DRY_RUN_ONLY`
- `ZAVLIO_HEARTBEAT_INTERVAL_MS`, `ZAVLIO_POLL_INTERVAL_MS`, `ZAVLIO_REQUEST_TIMEOUT_MS`
- `ZAVLIO_MAX_CONCURRENCY=1`
- `META_BRIDGE_HOST=127.0.0.1`, `META_BRIDGE_PORT`

Never provide `SUPABASE_SERVICE_ROLE_KEY` or a database URL/password to the Bridge. Production control-plane URLs must be HTTPS unless local loopback.

## Packet 12 reporting

Server-only `CRM_ANALYTICS_DEFAULT_RANGE_DAYS=30`, `CRM_ANALYTICS_MAX_RANGE_DAYS=730`, and `CRM_ANALYTICS_SLOW_QUERY_MS=500` require no secret. The business timezone remains fixed in metric definition v1 as Asia/Kolkata.

Last verified: 2026-09-27, Packet 08

## Source control

- Git repository: initialized at `C:\zavlio`, branch `main`, no remote, no commits created automatically.
- CI is configured for pull requests and pushes to `main` once a remote exists.

## Host and pinned toolchain

| Tool              | Selected / observed version                  | Policy                                                                            |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| OS                | Windows 10 Home Single Language `10.0.19045` | Development host only                                                             |
| Node.js           | `24.13.0`                                    | Exact project pin in `.node-version` and `engines`                                |
| pnpm              | `11.19.0`                                    | Exact `packageManager` and engine pin                                             |
| npm               | `11.6.2`                                     | Informational only                                                                |
| Git               | `2.52.0.windows.1`                           | Source control                                                                    |
| Next.js           | `16.3.6`                                     | Exact dependency pin                                                              |
| React / React DOM | `19.3.0`                                     | Exact dependency pin                                                              |
| TypeScript        | `6.0.3`                                      | Exact dependency pin                                                              |
| Vitest            | `5.0.2`                                      | Exact dependency pin                                                              |
| Playwright        | `1.63.0`                                     | Exact dependency pin                                                              |
| Supabase CLI      | `2.118.0`                                    | Exact root dev dependency; invoked project-locally                                |
| PostgreSQL        | `17` target in config                        | Local Supabase target; Auth and Mailpit are required for Packet 07 runtime checks |

Node 24 was selected as the project LTS line and the exact `24.13.0` pin remains authoritative. The managed elevated pnpm launcher intermittently reports embedded Node `24.19.0`; CI and application/test executables use the project pin. ESLint remains `9.39.5` because the selected React lint graph does not support ESLint 10.

## Environment categories

- Required now: `NODE_ENV`, `NEXT_PUBLIC_SITE_URL`.
- Public analytics: `NEXT_PUBLIC_ANALYTICS_ENABLED` (default `true`), `NEXT_PUBLIC_ANALYTICS_DEBUG` (default `false`), and `NEXT_PUBLIC_ANALYTICS_POLICY_VERSION` (`2026-09-v1`).
- Server analytics: `ANALYTICS_VISITOR_TTL_DAYS` (180), `ANALYTICS_SESSION_TIMEOUT_MINUTES` (30), `ANALYTICS_BATCH_MAX` (20), and `ANALYTICS_POLICY_VERSION` (`2026-09-v1`).
- Public optional/future: public Supabase URL/anon key, Turnstile site key, portal flag.
- Server-only optional/future: Supabase project ID/service role, SMTP password/config, Turnstile secret, automation agent/HMAC secret, Sentry DSN.

Packet 13 local automation harnesses use the local Supabase service role only as a worker simulation. `AUTOMATION_AGENT_ID` is optional for the local tick. `AUTOMATION_HMAC_SECRET` remains unused and reserved for Packet 14; no machine credential belongs in browser variables or job payloads.

- Required when enabled: each integration calls `requireIntegrationEnv` before use.

## Verified commands

```text
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:e2e
pnpm audit --audit-level high
pnpm db:verify
```

## Local Supabase

`supabase/config.toml` targets PostgreSQL 17 with API `54321`, database `54322`, Studio `54323`, and local SMTP `54324`. Packet 06R verified `db:start`, two clean `db:reset` runs, `db:lint`, `db:test`, and `db:types` on Docker Desktop 29.8.0. A hosted Supabase project is not configured.

Vercel, Zoho SMTP, Cloudflare Turnstile, observability, domain/DNS, and social/browser automation access are not configured. A hosted Supabase project is not configured; local Auth keys remain ephemeral and environment-specific. Hosted signup must remain disabled and redirect URLs must be explicitly allowlisted.

## Packet 09 local/runtime variables

## Packet 10 local verification

CRM runtime and E2E fixtures create temporary auth users/profiles with the local service key, sign browser requests with a test-only local JWT because local CLI email login is disabled, and always clean fixtures. This harness is not a production authentication path.

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, `MAILPIT_URL`, `MAIL_FROM`, `LEAD_NOTIFICATION_RECIPIENTS`, `TURNSTILE_ENABLED`, `LEAD_TASK_SLA_HOURS`, `FORM_RATE_LIMIT_PER_MINUTE`, and `FORM_BODY_MAX_BYTES` configure intake. Local verification uses Mailpit at `http://127.0.0.1:54324`; production SMTP credentials and deliverability remain deployment-owned and unverified.

## Packet 15 adapter variables

`ZAVLIO_META_ADAPTER_ENABLED`, `ZAVLIO_META_ADAPTER_UPSTREAM_ROOT`, `ZAVLIO_META_ADAPTER_RUNTIME_DIR`, `ZAVLIO_META_ADAPTER_CDP_URL`, `ZAVLIO_META_ADAPTER_TEST_MODE`, `ZAVLIO_META_ADAPTER_REQUEST_TIMEOUT_MS`, and `ZAVLIO_META_ADAPTER_VERSION` configure the isolated adapter. Production rejects test mode and non-local CDP. The child environment is constructed from an explicit allowlist and forcibly sets `DRY_RUN=true`, `APPROVAL_MODE=true`, `POSTING_ENABLED=false`, and `JOB_AUTOMATION_ENABLED=false`.

# Packet 16 environment

Real-site read-only verification requires a user-controlled authenticated browser session and loopback CDP. This environment had no authorized social account and Docker Desktop's Linux engine was unavailable, so no real-site or database replay evidence is claimed.
