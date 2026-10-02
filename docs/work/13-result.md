# Packet 13 Result — Automation Control Plane

## Scope

Implemented the automation safety/control plane only. No real email/social side effect, bridge machine protocol, browser automation, upstream adapter, discovery, or AI action selection was added. Packet 14 was not started.

## Automation Architecture

CRM remains authoritative. Normalized CRM facts feed a deterministic policy evaluator; durable proposals, approvals, queue transitions, worker evidence, and person timeline events remain in PostgreSQL.

## Control Plane Boundary

The agent is an execution client, never the owner of people, DNC, consent, opportunity state, policy, or approval. Packet 13 provides a local service-role simulation only; the Packet 14 machine boundary remains absent.

## Policy Model

`evaluateAutomationPolicy(context, policy, asOf)` is pure and deterministic. Fact loading and database persistence are separate. Output includes decision, stable reason codes/reasons, next eligibility, approval requirement, policy version, and evaluation time.

## Policy Version

Fresh reset seeds immutable policy version 1 with one-active-version uniqueness and a configuration hash. OWNER creates/activates a new version; used versions are never edited.

## Communication Purposes

`MARKETING`, `SALES_FOLLOW_UP`, `INBOUND_REPLY`, `TRANSACTIONAL`, `RELATIONSHIP`, `INTERNAL`.

## Channels

Logical keys are `EMAIL`, `INSTAGRAM`, `THREADS`, `FACEBOOK`, `LINKEDIN`, `INTERNAL`; a key does not claim a working integration.

## Action Types

`SEND_EMAIL`, `DM`, `REPLY`, `COMMENT`, `LIKE`, `FOLLOW`, `CONNECT`, `PUBLISH`, `CREATE_TASK`, `FLAG_FOR_REVIEW`, `NOOP`.

## Risk Classification

Actions carry stable `LOW`, `MEDIUM`, or `HIGH` risk and `EXTERNAL_SIDE_EFFECT` or `INTERNAL_ONLY` class for policy/approval decisions.

## DNC Enforcement

Proactive DNC evaluates `BLOCK` with `DNC_BLOCKED`. Runtime and browser evidence show no approval control and no override, including after prior approval.

## Consent Enforcement

Configured purpose/channel permission is independent from analytics consent and score. Missing/unknown/withdrawn required permission blocks. Runtime withdrawal-after-approval recheck passed.

## Opportunity-State Policy

Closed related opportunities block relevant execution at final recheck. Policy functions never change pipeline stage.

## Canonical Person Handling

Missing, archived, or merged sources block. Merge triggers safely block pending source jobs and prevent silent person rebinding; runtime merge-before-execution passed.

## Working Hours

Configured IANA timezone, weekday, and local start/end produce `DEFER` with `OUTSIDE_WORKING_HOURS` and deterministic `nextEligibleAt`. Unit/runtime boundary fixtures passed.

## Cooldowns

Per-person cooldown uses recent completed and reserved work; active cooldown defers with exact next eligibility.

## Frequency Caps

Rolling person daily/weekly and follow-up caps count completed plus eligible reserved work so concurrent proposals cannot evade limits.

## Global / Channel Caps

Configured channel/action hourly caps block/defer excess work; deterministic runtime fixtures passed.

## Duplicate Suppression

Semantic matching covers person, channel, action, purpose, content hash/source reference, and configured window. Runtime result: `BLOCKED`.

## Job Idempotency

Unique technical idempotency keys produce exactly one job under replay/concurrency. Runtime result: `one-job`.

## Policy Evaluation

Proposal and approval run database fact extraction plus the same policy semantics as the TypeScript evaluator. Every decision persists version, codes, counters/snapshot, person/job/action/channel/purpose, and timestamp.

## Policy Reason Codes

Stable codes cover automation/channel/action/purpose disabled, person/DNC/consent/opportunity conditions, time/cooldown/caps, duplicates, approval/integrity, agent availability, and manual review. Tests assert codes, not only booleans.

## Policy Revalidation

Proposal, approval, claim, and start/execution re-evaluate current facts. Runtime proves post-approval consent withdrawal, DNC, policy change, content change, person merge, and opportunity close cannot execute.

## Approval Architecture

Decisions are immutable rows plus job events/audit. Approval cannot override hard blocks. Concurrent approval produces one winner.

## Approval Permissions

ADMIN/OWNER approve/reject. OPERATOR may propose but cannot approve. VIEWER is read-only. OWNER alone activates policy.

## Approval Expiry

Configurable bounded validity defaults to 24 hours. Expiry returns work to reapproval requirements; runtime result: `reapproval-required`.

## Content Hash / Approval Integrity

SHA-256 payload hash and approved content/policy/job versions are checked at execution. Changed content and policy invalidate approval in runtime.

## Job State Machine

The guarded lifecycle includes `AWAITING_APPROVAL`, `QUEUED`, `CLAIMED`, `RUNNING`, `COMPLETED`, `BLOCKED`, `FAILED`, `CANCELLED`, and `MANUAL_ACTION_REQUIRED`.

## Job Transition Rules

RPCs lock rows, validate current status/actor/expected version, clear leases where required, and append immutable events. Direct authenticated state mutation is revoked.

## Queue Architecture

PostgreSQL is sufficient: due/priority partial indexes, row locks, transactional transitions, and no Redis/BullMQ/Temporal/Kafka/RabbitMQ dependency.

## Claim Semantics

Service-only `FOR UPDATE SKIP LOCKED` claim checks current policy, due time, enabled/recent agent, capability, and approval. Concurrent claim result: `at-most-once`.

## Lease Semantics

Claims have bounded owner/time/expiry. Start/complete/fail verify the claiming agent and live state.

## Lease Recovery

Expired claims are requeued with recovery history. Runtime result: `requeued`.

## Retry Policy

Known transient network/provider/rate-limit failures retry below `maxAttempts` with configured bounded backoff. Runtime transient result: `scheduled`; maximum-attempt result: `FAILED`.

## Failure Taxonomy

Known transient, permanent, policy/privacy, security checkpoint, and ambiguous-outcome categories map to retry, block, fail, or manual attention. Permanent failure does not retry.

## Unknown Outcome Handling

`EXECUTION_OUTCOME_UNKNOWN` enters `MANUAL_ACTION_REQUIRED`; it never auto-retries a possibly completed side effect.

## Dry Run

Default is `true`; the only executor performs zero external side effects and records `DRY_RUN_COMPLETED`. Runtime result: `COMPLETED_NO_SIDE_EFFECT`.

## Manual Action Required

Security checkpoint/CAPTCHA/auth/identity/unknown outcome cannot be bypassed. ADMIN/OWNER can record a note and cancel or requeue through full revalidation. Runtime and browser resolution evidence passed.

## Agent Registry

Agents store stable key/name, enablement, capabilities, version, last heartbeat, and bounded runtime state.

## Agent Status

CRM reports enabled/disabled and online/stale/offline facts. Disabled-agent runtime claim result: `denied`.

## Heartbeat Boundary

Service-only heartbeat records state locally. No public endpoint, HMAC, remote identity, or Packet 14 protocol exists.

## CRM Routes

`/crm/automation`, `/crm/automation/approvals`, `/crm/automation/jobs`, `/crm/automation/jobs/[id]`, `/crm/automation/agents`, `/crm/automation/settings`.

## Approval UI

The queue shows person/action/purpose/policy reasons and links to immutable context. Eligible dry-run approval/rejection is available only to ADMIN/OWNER; hard blocks have no override.

## Jobs UI

Filtered/paginated list and detail show status, DNC, reasons, content, hashes/attempts/lease, approvals/events, cancellation, and safe manual resolution.

## Agents UI

Displays registry status, version, capabilities, heartbeat, and current workload without pretending a remote bridge is connected.

## Settings UI

ADMIN/OWNER can inspect policy; OWNER can activate only a safe Packet 13 version. Database checks force dry run and approval.

## Person/Timeline Integration

Person detail lists recent jobs. The normalized timeline includes meaningful proposal/approval/block/manual/completion events and labels dry-run completion without claiming contact.

## Role Matrix

VIEWER reads; OPERATOR reads/proposes; ADMIN approves/rejects/cancels/resolves/controls agents; OWNER also activates policy. Service-only worker RPCs are denied to staff/public callers.

## RLS Changes

All 46 application tables have RLS. Four new tables use explicit active-staff read policies, append-only protections, revoked direct writes, and security-invoker projections. Anon/nonstaff/inactive remain denied.

## Database Migrations

Added `20260928061600_automation_control_plane.sql`; repository total is 16 migrations. Clean zero-state replay passed.

## Tables Added

Four: `automation_policy_versions`, `automation_policy_decisions`, `automation_approvals`, `automation_job_events`. Total application tables: 46. Two security-invoker views bring the repository view total to 6.

## Functions/RPCs Added

Fourteen control-plane RPCs cover policy activation/check, proposal, approval/rejection/cancel, claim/heartbeat/start/complete/fail/recovery, agent enablement, and manual resolution. Four internal helper/trigger functions enforce hashing, immutability, and merge safety; the person timeline function was replaced to add automation events.

## Indexes Added

Twelve indexes cover one-active policy, execution idempotency, decision/job/person/reason history, approvals/events, approval queue, lease recovery, person policy windows, action frequency, and claim priority/due order.

## Database Tests

`db:lint` reports zero findings. pgTAP passed 7 files / 115 assertions; Packet 13 contributes 34 checks. Generated types were identical twice: SHA-256 `5FA6292595C40DC3AA4C6548B407BB9D8EB585672A5914E0131F87F7CC3DEA02`.

## Unit Tests

Vitest passed 12 files / 76 tests; Packet 13 contributes 32 deterministic policy/contracts tests.

## Integration Tests

Eight local harnesses passed: Packet 07 auth, 08 analytics, 09 intake, 09 SMTP failure, 10 CRM, 11 operations, 12 reporting, and 13 automation.

## Automation Runtime Tests

The dedicated harness covers the required A–Z matrix: eligible proposal, hard blocks, approval/rejection/expiry/integrity, hours/cooldown/caps, both duplicate classes, lifecycle, failures, merge/opportunity rechecks, dry run, and disabled agent.

## Concurrency Tests

Approval is single-winner, idempotency is one-job, claims are at-most-once, and claim/cancel has one outcome. Lease crash/recovery requeues safely.

## E2E Tests

Chromium passed 18 tests after adding five Packet 13 workflows: ADMIN approval, DNC/no override, VIEWER denial, manual-action resolution, and OWNER agent/settings mobile coverage.

## Accessibility

All exercised automation pages report zero axe violations. The 390×844 agent/settings paths have no document-level overflow; native labelled controls retain keyboard operation.

## Performance Evidence

Disposable 3,000-job fixture: approval queue 18.97 ms / 25 rows, job list 11.16 ms / 25 rows, claim-candidate read 8.42 ms. A separate rollback-safe 5,000-job `EXPLAIN ANALYZE` used `automation_jobs_claim_queue_idx` in 0.820 ms (56 shared hits) and `automation_jobs_approval_idx` in 0.088 ms (6 shared hits, 25 rows). Local evidence is not a production SLO.

## Packet 07 Regression

Owner/admin/operator/viewer/nonstaff/inactive matrix, public-signup denial, and Mailpit reachability passed. Hosted email-login remains external.

## Packet 08 Regression

Consent accept/reject/withdraw/re-consent, attribution, sessions, dedupe, and concurrency passed.

## Packet 09 Regression

No-consent intake, consented linking, identity reuse/conflict/idempotency/concurrency, validation, Mailpit, and isolated SMTP failure all passed.

## Packet 10 Regression

Roles, DNC, merge provenance/relations/rollback/concurrency, timeline, and merged-person intake passed.

## Packet 11 Regression

Scoring/history/affinity, stage/Lost/Won/reopen/concurrency, tasks, roles, and nonstaff denial passed.

## Packet 12 Regression

Golden reporting passed with 10 tracked visitors, 12 sessions, 6 enquiries, 5 canonical people, 2 attributed people, 4 opportunities, one Won and one Lost transition, role denial, currency separation, and zero report writes.

## Build Result

Frozen install, Prettier, zero-warning ESLint, strict workspace typecheck, 76 unit tests, deterministic DB types, and the production Next.js/Meta Bridge build passed. All automation routes build as dynamic server routes.

## Dependency Audit

`pnpm audit --audit-level high` passed with no known high-severity vulnerability. Packet 13 added no queue/runtime dependency.

## Secret Scan

No service-role, SMTP, Turnstile, social, browser-session, CDP, or future HMAC secret is committed or present in browser output. Local synthetic credentials remain confined to ignored/local harness configuration.

## Known Limitations

No real executor, Meta Bridge machine auth, browser/CDP integration, social discovery, AI next-best-action, production scheduler, approved production channel/legal policy, production platform-rate evidence, or validated autonomous mode. Hosted Auth caveat remains external.

## External Dependencies

Qualified legal/privacy policy approval, hosted Auth verification, deployment, production telemetry/scheduler, real agent credentials, and channel-specific platform review remain external. Their absence does not undermine the locally verified control plane.

## Rollback Notes

Roll back application and `20260928061600_automation_control_plane.sql` together only through a reviewed forward migration/restore plan. Preserve append-only decision/approval/event evidence. No destructive rollback was performed.

## Packet 14 Readiness

The control plane exposes the database semantics Packet 14 can wrap with machine identity, HMAC/timestamp/nonce validation, narrow claim/heartbeat/result endpoints, lease extension, evidence submission, health, and capability negotiation. Packet 14 has not begun.

## STATUS

**PASS** — safe defaults, policy/privacy enforcement, approval integrity, final revalidation, atomic lifecycle/concurrency, leases/recovery, bounded failure handling, dry-run zero side effects, roles/RLS, accessibility, performance fixture, full regressions, build, audit, and documentation are green.
