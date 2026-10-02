# Packet 09 result — forms, person resolution, visitor linking, and lead intake

## Scope

Implemented the functional public intake slice only. Visual design remains intentionally neutral and Packet 10+ remain untouched.

## Architecture

`/start-a-project` and `/contact` use shared client form primitives and shared server-only orchestration. The orchestration validates, rate-limits, verifies anti-abuse controls, resolves consent/cookies, calls one atomic database RPC, then drains durable outbox jobs.

## Routes Added

- `GET /start-a-project`
- `GET /contact`
- `POST /api/forms/start-project`
- `POST /api/forms/contact`

## Form Schemas

Start project captures services, contact, goal, budget, timing, and source. Contact captures name, email, company, website, role, and message. Both include form version, UUID idempotency key, optional Turnstile token, and honeypot.

## Validation

Server-only Zod parsing enforces bounded strings, normalized email, HTTP(S)-only websites, payload size, same-origin, and generic public errors.

## Spam Protection

Honeypot submissions return a neutral accepted response and create no CRM state. A bounded per-user-agent in-memory limiter is configured by `FORM_RATE_LIMIT_PER_MINUTE`.

## Turnstile

Localhost/127.0.0.1 is explicitly bypassable for local verification when disabled. Production domains fail closed unless Cloudflare verification succeeds.

## Idempotency

`form_submissions.idempotency_key` and the RPC duplicate path return the original IDs. Concurrent identical emails resolve to one person through the unique email identity index.

## Database Changes

Migration `20260927061200_lead_intake.sql` adds processing/reference fields to `form_submissions`, a unique email identity index, `email_outbox`, RLS, and `intake_lead_submission`.

## Migrations Added

One migration: `20260927061200_lead_intake.sql`.

## Person Resolution

Exact lower/case-insensitive email identity only; names, companies, websites, and browser IDs never auto-merge.

## Organization Resolution

Exact normalized website domain under a transaction advisory lock. A company-only submission can create an organization but cannot fuzzy-match an existing one. Free-email domains do not create organizations from email domains.

## Visitor Linking

Valid analytics consent plus a valid visitor cookie is required. Linked visitors backfill null session/event person IDs while preserving first/latest attribution.

## Conflict Handling

If the browser visitor belongs to a different person, a pending `identity_match_candidates` row is created and the existing visitor link is preserved.

## Attribution Preservation

First-touch and latest-touch system sources remain separate and are not overwritten by later forms. Self-reported source is stored separately.

## Service Interest

Service keys are allowlisted and persisted as structured JSON for touchpoints, opportunities, and score reasoning.

## Lead Score Boundary

Initial deterministic snapshot model: `PACKET_09_INTAKE_V1` (project/contact base, budget, services, returning-session bonus). Full scoring is Packet 11.

## Opportunity Creation

Start-a-project creates one opportunity at the seeded `new` stage. Contact does not create an opportunity by default.

## Task Creation

Both forms create a review task with configured SLA and priority.

## Touchpoints

Both forms create an inbound `website` touchpoint typed `PROJECT_ENQUIRY` or `CONTACT_ENQUIRY`.

## Email Architecture

The transaction writes idempotent confirmation and internal-notification rows to `email_outbox`; Mailpit HTTP is preferred locally, SMTP is supported for deployment. Delivery occurs after commit and updates `SENT` or `FAILED`.

## Mailpit Evidence

The lead-intake runtime test observed successful Mailpit delivery. The focused SMTP-failure runtime test committed CRM state and observed all outbox jobs marked `FAILED` when the provider was unreachable.

## Consent/DNC

No analytics consent is required to create CRM state. No-consent forms do not link visitors or analytics history. DNC is not marketing subscription and does not block transactional acknowledgement.

## Security

Same-origin, body cap, rate limit, Zod, honeypot, Turnstile, generic errors, server-only admin client, and safe structured logging are enforced.

## RLS

The RPC is service-role-only. `email_outbox` is RLS-enabled, anonymous/authenticated writes are denied, and only ADMIN staff may select it.

## Runtime Intake Tests

Passed no-consent intake, analytics linking, attribution, existing-person reuse, idempotency, honeypot, validation, Mailpit, and failure-path scenarios.

## Concurrency

Two concurrent same-email submissions resolve to one person; visitor and domain locks prevent unsafe overwrites/races.

## DB

`db:lint`: PASS with no schema warnings. `db:test`: PASS, 34 pgTAP checks across auth, foundation, and lead intake. Generated types were regenerated twice with identical SHA-256.

## Unit

Vitest: 8 files, 20 tests passed.

## Integration

Packet 08 analytics regression and Packet 09 lead-intake runtime both passed. SMTP failure-path runtime also passed.

## E2E

Playwright Chromium: 4 tests passed, including both forms and the existing analytics/home smoke paths.

## Accessibility

Playwright axe checks passed for the form and home paths; forms use fieldsets/legends, labels, errors, progress, and mobile-safe controls.

## Analytics Regression

Consent gating, rejection, acceptance, attribution, session reuse/timeout, dedupe, withdrawal, re-consent, and concurrency remain green.

## Auth Regression

Existing auth/RBAC pgTAP coverage remains green. Hosted email-login verification remains the Packet 07 external dependency; local CLI mapping is unchanged.

## Build

Production Next.js build and workspace TypeScript build passed. Lint, typecheck, and formatting passed.

## Audit

High/critical dependency audit remains clean from the final dependency set; no client bundle contains service-role credentials.

## Known Limitations

Process-local rate limiting, production SMTP/Turnstile verification, and manual conflict-review UI remain deployment/future-packet work.

## External Dependencies

Hosted Turnstile and production SMTP are external. Local Mailpit and local Turnstile behavior are verified.

## Rollback Notes

Rollback is the normal migration rollback procedure for `20260927061200`; disable the two form routes and drain/retain outbox rows before removing data. No destructive rollback was performed.

## Packet10 Readiness

Packet 10 is the next backend packet. Packet 09 stops here; no Packet 10 implementation was started.

## STATUS

**PASS** — local database, integration, email, browser, accessibility, build, lint, typecheck, and audit gates are green. Packet 07’s separately documented hosted-auth caveat remains external.
