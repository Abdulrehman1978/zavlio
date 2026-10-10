# Decisions

## Packet 17 operational closure

Keep provider-neutral deployment, PostgreSQL queue architecture, separately supervised Bridge, encrypted secret-manager storage, and live social execution disabled until a separately approved canary.

| ID     | Status   | Decision                                                                                                                     | Rationale                                                                                                  |
| ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D-0001 | Accepted | Treat the supplied Version 2.0 specification as authoritative and import it verbatim.                                        | Required source-of-truth order                                                                             |
| D-0002 | Accepted | Classify the workspace as greenfield.                                                                                        | Empty recursive inventory and absent Git metadata                                                          |
| D-0003 | Accepted | Create documentation skeletons in Packet 00.                                                                                 | Final instruction explicitly requires them before stopping                                                 |
| D-0004 | Proposed | Use the specified pnpm modular monolith and isolated bridge/upstream runtime.                                                | Default target pending review and dependency inspection                                                    |
| D-0005 | Deferred | Exact Node/framework/package versions.                                                                                       | Must be compatibility-checked and pinned in Packet 01                                                      |
| D-0006 | Deferred | Meta Automation source-management method and revision.                                                                       | Upstream URL/commit not supplied                                                                           |
| D-0007 | Deferred | Retention periods and production outreach/autonomy policy.                                                                   | Requires business/legal approval                                                                           |
| D-0008 | Accepted | Defer Packets 02–05 and follow the approved backend-first sequence after Packet 01.                                          | Explicit user direction; visual work is not cancelled                                                      |
| D-0009 | Accepted | Pin Node `24.13.0` and pnpm `11.19.0`.                                                                                       | Compatible LTS toolchain matching the project test runtime                                                 |
| D-0010 | Accepted | Pin Next.js `16.3.6`, React `19.3.0`, and TypeScript `6.0.3`.                                                                | Stable compatible framework and lint peer graph                                                            |
| D-0011 | Accepted | Retain ESLint `9.39.5` temporarily despite registry deprecation.                                                             | Current Next React lint plugin does not support ESLint 10                                                  |
| D-0012 | Accepted | Keep feature packages as boundaries/contracts only in Packet 01.                                                             | Avoid premature features and architectural theatre                                                         |
| D-0013 | Accepted | Use Supabase CLI `2.118.0` with PostgreSQL 17 target and SQL migrations as the schema source of truth.                       | Reproducible local/hosted migration workflow                                                               |
| D-0014 | Accepted | Use UUID keys, UTC `timestamptz`, `citext` email values, `numeric(14,2)` money, and text/CHECK state machines.               | Explicit cross-service contracts and safe relational invariants                                            |
| D-0015 | Accepted | Enable RLS on every app-facing table with no policies and revoke anon/authenticated grants until Packet 07.                  | Deny-by-default prevents accidental exposure before RBAC exists                                            |
| D-0016 | Accepted | Keep seed data limited to pipeline stages and non-secret defaults.                                                           | Local repeatability without fake users, claims, customer data, or secrets                                  |
| D-0017 | Accepted | Use a security-definer `FOR UPDATE SKIP LOCKED` claim function with lease fields and idempotency keys.                       | Atomic multi-worker queue semantics with bounded authority                                                 |
| D-0018 | Accepted | Treat `pnpm db:types` output from the clean local schema as authoritative and keep it raw.                                   | Runtime generation now passes; Supabase emits intentionally unformatted output                             |
| D-0019 | Accepted | Authorize staff from `public.staff_profiles` resolved by `auth.uid()`; do not use email domains, metadata, or client state.  | Separates Supabase identity proof from Zavlio authorization and keeps RLS authoritative                    |
| D-0020 | Accepted | Preserve invite-only signup denial and classify the local Supabase CLI email-login mapping defect as an external dependency. | Enabling public signup to make local login work would violate the security requirement                     |
| D-0021 | Accepted | Implement Packet 08 as anonymous, first-party, consent-gated analytics only; defer identity resolution and CRM linking.      | Minimizes privacy scope and keeps the packet independently testable                                        |
| D-0022 | Accepted | Use `POST /api/analytics/events` with typed allowlists, 20-event batches, UUID dedupe, and a narrow server-admin boundary.   | Provides one auditable ingestion contract without public table grants                                      |
| D-0023 | Accepted | Honor GPC as denial when no explicit consent exists; do not infer consent from DNT.                                          | GPC is an explicit modern signal; DNT semantics are inconsistent and visible controls remain authoritative |
| D-0024 | Accepted | Keep first touch immutable and update latest touch only when a new attributed session starts.                                | Preserves acquisition evidence while allowing session-level campaign analysis                              |

## Packet 09 decisions

## Packet 10 decisions

- Use a security-invoker CRM projection and normalized timeline RPC to keep list/detail reads bounded and RLS-visible.
- Use one locked transactional merge RPC with immutable `person_merges` history; never auto-merge candidates.
- Protect primary email and merge provenance with column grants rather than trigger bypass flags.

- Deterministic exact email is the sole automatic person resolver; ambiguous browser/organization signals become review candidates.
- A security-definer RPC owns the CRM transaction, while email is an idempotent durable outbox after commit.
- Analytics consent is optional for intake and mandatory for visitor/history linking.
- The initial score is a bounded `PACKET_09_INTAKE_V1` adapter; the full scoring engine remains Packet 11.

## Packet 11 decisions

- Use a pure TypeScript scoring engine with versioned JSON configuration in PostgreSQL.
- Preserve score snapshots instead of updating a mutable score row; skip materially unchanged snapshots.
- Separate declared and behavioral affinity and use stable allowlisted service keys.
- Keep lifecycle, DNC, consent, score, and pipeline stage independent.
- Keep transactional stage/task invariants in SECURITY DEFINER RPCs with row locks and optimistic preconditions.
- Use CLI batch recalculation at current scale; defer a queue/scheduler.

## Packet 12 decisions

- Version reporting definitions as `METRICS_DEFINITION_VERSION = 1`; SQL and pure TypeScript helpers share the documented formulas.
- Keep tracked and CRM funnels separate, currency values grouped, and current snapshots visibly distinct from period outcomes.
- Use five coherent security-invoker aggregate RPCs rather than per-KPI queries or stored aggregate tables.
- Preserve active-staff RLS semantics and cache its stable predicate once per SQL statement to remove per-row authorization overhead.
- Pin Recharts 3.10.1 inside one analytics-only Client Component; keep database work and shaping server-side.

## Packet 13 decisions

- Use immutable versioned policy JSON with one active version; OWNER alone activates, and Packet 13 rejects non-dry-run or approval-free activation.
- Treat DNC as a non-overridable hard block for proactive purposes; treat inbound/transactional purposes separately without claiming a legal interpretation.
- Require stable purpose/channel/action keys and keep score, lifecycle, opportunity stage, and communication permission independent.
- Bind approval to job version, content hash, policy version, and bounded expiry; re-evaluate at proposal, approval, claim, and start.
- Count pending reservations in person/channel/action caps and use rolling UTC windows plus IANA-timezone working hours.
- Use PostgreSQL row locks, `FOR UPDATE SKIP LOCKED`, leases, and expected versions instead of adding a queue dependency.
- Recover expired leases to queued work with history; apply bounded configured backoff only to known transient failures.
- Put security challenges and unknown execution outcomes in `MANUAL_ACTION_REQUIRED`; never bypass or blindly retry.
- Block merged-source jobs rather than silently rebinding them to the canonical person.
- Keep heartbeat and service-role RPCs local/infrastructure-only until Packet 14 supplies a narrow authenticated machine protocol.

## Packet 14 decisions

- Version the private machine contract at v1 under `/api/internal/automation/v1` and sign protocol, method, pathname, agent/key identity, timestamp, nonce, and exact-body SHA-256 with HMAC-SHA256/base64url.
- Store raw per-agent credentials only in server/Bridge environments, with one current and one expiry-bounded previous key; never put them in PostgreSQL or the browser.
- Verify the MAC in constant time before consuming the 24-hour per-agent nonce; allow ±300 seconds inclusive and reject query strings.
- Separate HTTP replay identity from durable operation identity: every retry gets a new nonce/signature while claim/lease/start/result retain the operation ID and request hash.
- Constrain negotiated Packet 14 capability and the Bridge executor to INTERNAL/NOOP/DRY_RUN_ONLY with maximum concurrency one.
- Keep the service-role/database boundary in Next.js; the Bridge receives no database credential and binds health/readiness to loopback.
- Preserve Packet 13 as the final policy authority at start and map security/unknown outcomes to manual action rather than bypass or automatic retry.
- Keep Meta/upstream/browser/CDP integration in Packet 15+; its absence is an intentional boundary, not a Packet 14 failure.

## Packet 15 decisions

- Pin the approved upstream by detached SHA/tree and verify origin, source cleanliness, package-lock/license/README hashes at adapter startup.
- Keep the full upstream runner, business planner, identity graph, follow-up scheduler, browser manager, AI runtime, and local telemetry/state authorities out of the normal path; reuse only the semantic browser agent behind a Zavlio-owned adapter.
- Supervise a long-lived isolated child over JSONL IPC with no Packet 14 HMAC or Supabase service-role credentials. The child runs dry-run only, max concurrency one, and writes only under its runtime directory.
- Dismiss all browser dialogs and map them to manual action; never inherit upstream auto-accept behavior. Treat page content as untrusted and require origin, target, content, and security checkpoints.
- Mark Packet 15 `PASS_WITH_EXTERNAL_DEPENDENCY`: local compiled/CDP evidence passes, while Docker/database reset and authenticated real-site verification remain external.

# Packet 16 decisions

- Keep three separate provider modules and a synthetic fixture provider rather than a giant platform switch.
- Reuse existing identities/conversations/messages and add only bounded observation/settings/canary tables.
- Keep live execution disabled and stop with PASS_WITH_EXTERNAL_DEPENDENCY when Docker or authenticated social evidence is unavailable.

## Packet 17 operational closure decisions

- D-0025: Implement fail-fast production environment validation enforcing non-default production secrets, rejection of demo/test credentials, Mailpit disablement, and strict loopback checks.
- D-0026: Implement recursive structured-log redaction across all JSON logger outputs, masking keys like password, token, secret, hmac, cookie, session, api_key.
- D-0027: Maintain isolated Bridge supervision; keep live external execution disabled (`LIVE_EXTERNAL_EXECUTION=false`) until separate canary authorization.

## Packet 18 SEO, performance, and accessibility decisions

- D-0028: Use Next.js `metadataBase` and explicit absolute canonical URLs across all 27 public routes.
- D-0029: Implement structured JSON-LD schemas (Organization, Service, Article, BreadcrumbList) grounded strictly in verified source code without fabricated ratings or awards.
- D-0030: Enforce zero draft leakage via `content-resolver.ts` with safe fallback to verified static content if database items are unseeded.

## Packet 19 offline rehearsal decisions

- D-0031: Package offline staging rehearsal into an automated 11-stage script (`scripts/offline-rehearsal.mjs`), validating clean build, lint, types, unit tests, secret scans, pin integrity, and simulated forward-fix/rollback procedures.
- D-0032: Mark hosted staging rehearsal as `READY_FOR_STAGING` / `EXTERNAL_DEPENDENCY` without triggering unauthorized cloud deployments.

## Packet 20 pre-handoff decisions

- D-0033: Create dedicated owner deployment inputs manifest (`docs/OWNER_DEPLOYMENT_INPUTS.md`) with explicit parameter names, formats, and destinations.
- D-0034: Create standalone operator runbooks for Content, Campaigns, Consent, and Audit.
- D-0035: Maintain pre-handoff status as `PREDEPLOYMENT_HANDOFF_READY`, holding final signed acceptance conditional on post-deployment verification.
