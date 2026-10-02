# Packet 14 Result — Meta Bridge Secure Machine Protocol

## Scope

Implemented the private, signed machine cable from the isolated Meta Bridge to the Packet 13 control plane. Packet 15 upstream/Meta/browser work was not started.

## Machine Trust Boundary

Staff sessions, the Next.js control plane, and machine agents are separate principals. The Bridge has no database or Supabase service-role credential; only the Next.js server crosses the service-role boundary.

## Protocol Version

Version `1` under `/api/internal/automation/v1`.

## Machine Identity

Every request identifies an enabled `automation_agents.agent_key` plus key ID and is authenticated before the database agent principal is resolved.

## Credential Storage

Raw base64url secrets exist only in server/Bridge process environments. PostgreSQL stores agent facts, nonces, and operation receipts, never the raw HMAC secret.

## Credential Rotation

One current credential and one expiry-bounded previous credential are supported. Runtime evidence accepted the previous key inside its validity window and rejected an unknown key ID.

## HMAC Algorithm

HMAC-SHA256 with Node crypto and constant-time `timingSafeEqual`.

## Signed Headers

`X-Zavlio-Agent-Key`, `X-Zavlio-Key-Id`, `X-Zavlio-Protocol-Version`, `X-Zavlio-Timestamp`, `X-Zavlio-Nonce`, `X-Zavlio-Content-SHA256`, `X-Zavlio-Signature`, and `X-Zavlio-Bridge-Version`.

## Canonical Request

Eight newline-delimited fields: `v1`, uppercase method, exact pathname, agent key, key ID, integer timestamp, UUID nonce, and lowercase body SHA-256. There is no trailing field or query component.

## Body Hash

SHA-256 lowercase hexadecimal over the exact raw bytes read once. The pinned vector hashes `{"operationId":"e403177a-3e9e-49f0-954a-74c5db10923b"}` to `21a98f89825466ad06729c811896b2dda8ca9606a6c8b641f865e33eb064b1a1`.

## Timestamp Window

Inclusive ±300 seconds; unit tests pass both boundaries and reject ±301.

## Nonce / Replay Protection

The MAC is verified before an atomic per-agent nonce insert. Nonces persist 24 hours; concurrent identical signed requests produced one `200` and one generic `401`.

## HTTPS Requirement

Production non-loopback HTTP is rejected. Unit tests cover insecure production URL refusal.

## Machine Principal

The verified principal contains agent/agent key, key ID, protocol/bridge version, request/nonce/timestamp/digest, authenticated time, exact body, and registered capabilities. It contains no staff authority.

## Handshake

Signed handshake passed, bound the runtime instance, stored bridge/protocol facts, returned safe policy intervals, and reported automation/dry-run/approval state.

## Protocol Negotiation

Version 1 was selected. A signed `[2]`-only request returned `426 PROTOCOL_VERSION_UNSUPPORTED`.

## Capability Negotiation

Requested, registered, and server capabilities are intersected. An EMAIL/SEND_EMAIL escalation request negotiated only `INTERNAL`, `NOOP`, `DRY_RUN_ONLY`.

## Bridge Version

Handshake and heartbeat persist bounded bridge version; compiled evidence used `14.0.0-compiled-test`.

## Heartbeat

Negotiated interval: 30,000 ms. Signed heartbeat binds the agent instance and records bounded state; local timing sampled ten signed heartbeat round trips.

## Agent Liveness

Claims require enabled agents seen in the last five minutes. Disabled-agent requests returned `403`; Packet 13 regression confirmed stale/disabled claim denial.

## Bridge Health

`/health` binds only to `127.0.0.1`/`localhost` and exposes bounded, secret-free runtime facts.

## Bridge Readiness

`/ready` remains `503` until signed handshake succeeds, then returns `200`.

## Claim Endpoint

`POST /claim` accepts `maxJobs: 1`. The verified lifecycle claimed one due safe job with its version, lease, policy version, content hash, purpose, payload, and attempt number.

## Claim Idempotency

The same agent/type/operation ID and request hash returned the exact persisted job response. A changed instance under the same operation ID returned `409 IDEMPOTENCY_CONFLICT`.

## Claim Retry / Lost Response

A fresh nonce/signature with the same operation ID returned the originally claimed job and did not claim another.

## Claim Concurrency

The same agent could hold only one active claim. Two live agents concurrently claimed two distinct jobs.

## Job Contract

The v1 job contract carries job/version/lease/policy/dry-run/channel/action/purpose/payload/content hash/attempt fields. Packet 14 claim restricts protocol-v1 agents to safe internal NOOP work.

## Lease Extension

Signed lease extension passed and incremented job version/expiry. Retrying the same operation returned the persisted response.

## Lease Loss

Wrong agent, wrong instance/version/expiry, expired lease, and late result fail closed with `LEASE_LOST` or `JOB_STATE_CONFLICT`.

## Start / Final Policy Recheck

Signed start validates content, policy version, ownership, instance, version, and lease, then calls Packet 13's execution recheck. Endpoint tests changed state after claim and confirmed DNC, withdrawn consent, expired approval, changed content, merged person, closed opportunity, and changed policy all prevented start with zero actions.

This matrix exposed and fixed an inherited Packet 13 PL/pgSQL fallthrough: the blocked branch used `RETURN NEXT` without exiting. Packet 14 now executes `RETURN NEXT; RETURN;`, so a blocked result cannot continue into run/action creation.

## Result Endpoint

Signed results support success, transient, permanent, manual-action, and unknown outcome with a maximum 16 KiB evidence object.

## Result Idempotency

The same result operation returned the stored response and left exactly one action record.

## Result Retry / Lost Response

Fresh HTTP authentication with the same operation ID is safe. A different operation after terminal completion returned `409`.

## Evidence Model

Evidence remains bounded JSON on the dry-run action/run/job history. The NOOP executor records `executor=PACKET14_NOOP`, `dryRun=true`, and `verification=no-external-side-effect`.

## Dry-Run Executor

The compiled process completed INTERNAL/NOOP simulation only. No network provider action exists.

## Live-Action Guard

Bridge configuration rejects live mode and database credentials. Unit cases independently reject non-dry-run work and INSTAGRAM/DM work returned by a compromised server.

## Manual-Action Result

`SECURITY_CHECKPOINT` became `MANUAL_ACTION_REQUIRED` in compiled-process evidence.

## Unknown-Outcome Result

`UNKNOWN_OUTCOME` became `MANUAL_ACTION_REQUIRED` with `EXECUTION_OUTCOME_UNKNOWN`; it did not retry.

## Error Contract

One private/no-store JSON envelope supplies request/server time and stable data or code. Authentication errors are generic; stable conflict/limit/version codes are documented in `META_BRIDGE_PROTOCOL.md`.

## Machine Rate Limits

Process-local per-agent/path minute windows: handshake 10, claim 60, other routes 120. A distributed production limiter remains required.

## Request Limits

POST JSON only, 64 KiB maximum, no query string, strict schemas, bounded strings/arrays/runtime state/evidence.

## Bridge Backoff

No-job and error polling uses bounded exponential backoff up to 30 seconds; the negotiated normal poll interval is 5 seconds.

## Bridge Shutdown

SIGINT/SIGTERM and parent IPC converge on `runtime.stop()`. Compiled evidence emitted `BRIDGE_STOPPED`, drained loops, closed health, and exposed no secret.

## CRM Agent UI Integration

The existing agent table now shows protocol/bridge version, executor mode, handshake/heartbeat status, negotiated capabilities, and active claims.

## Job UI Integration

Job detail now shows agent/protocol/bridge identity, machine instance, claim operation, and execution evidence without redesigning the approved UI.

## Schema Changes

The final clean schema has 47 application tables and 6 views.

## Migration Added

`20260929061700_meta_bridge_protocol.sql`; repository total: 17 migrations. Multiple clean zero-state replays passed.

## Tables Added

One: `automation_machine_operations`.

## Columns Added

Seven agent columns (`protocol_version`, `bridge_version`, `executor_mode`, `instance_id`, `last_handshake_at`, `clock_skew_ms`, `negotiated_capabilities`) and two job columns (`machine_instance_id`, `claim_operation_id`).

## Functions / RPC Changes

Added operation guard, nonce consumption/cleanup, handshake/heartbeat, and four machine lifecycle RPCs; replaced claim for protocol constraints and start to make blocked rechecks terminal. Eleven function definitions changed/added in the migration.

## Indexes

Added nonce expiry, operation expiry/job, and unique live claim-operation indexes plus the operation identity unique constraint.

## RLS

All 47 application tables retain RLS. Machine receipts/nonces have no anon/authenticated table access; machine RPCs are service-role only. Staff use security-invoker CRM projections.

## Database Tests

pgTAP passed 8 files / 147 assertions. Packet 14 contributes 32 schema/RLS/privilege/immutability/fail-closed assertions.

## Protocol Unit Tests

Five deterministic tests cover canonical bytes/signature, constant-time semantics, timestamp boundaries, capability intersection, and strict envelopes.

## Bridge Unit Tests

Six cases cover configuration refusal, exact serialization/signing, health/readiness/shutdown, redaction, live refusal, and social refusal.

## Integration Tests

The dedicated signed harness passed 51 assertions across HTTP authentication, replay, negotiation, lifecycle, mutation rechecks, concurrency, results, compiled process, health, and shutdown.

## Hostile Auth Tests

Eleven grouped hostile cases cover bad secret, unknown key, tampered bytes, wrong signed path, stale time, replay, disabled agent, query, oversized body, unsupported protocol, and escalation/rotation boundaries.

## Replay Tests

Concurrent identical nonce: exactly one accepted. Sequential nonce replay: rejected. Valid retries use a new nonce and stable operation ID.

## Concurrency Tests

Same-agent maximum was one. Two-agent race produced two distinct claims. Packet 13 approval/claim/cancel concurrency regressions also passed.

## E2E Tests

Chromium passed 18/18. The agent workflow now asserts protocol-v1, DRY_RUN_ONLY, and bridge identity visibility.

## Accessibility

All exercised pages reported zero axe violations. The 390×844 automation agent/settings flow had no document overflow.

## Performance Evidence

Local signed harness: average of ten signed heartbeat round trips 24.44 ms; claim 35.25 ms. The Packet 13 3,000-job regression passed at 8.04 ms approval list, 6.08 ms job list, and 3.70 ms candidate read. These are not production SLOs.

## Meta Bridge Compiled Runtime Evidence

The built `services/meta-bridge/dist/index.js` handshook, became ready, completed safe success, classified transient/manual/unknown results correctly, and exited gracefully.

## Packet 07 Regression

Owner/admin/operator/viewer/nonstaff/inactive matrix passed; signup denial and Mailpit reachability passed. Hosted email-login remains external.

## Packet 08 Regression

Consent, attribution, sessions, dedupe, withdrawal/re-consent, and concurrency passed.

## Packet 09 Regression

Lead intake, linking/conflict/idempotency/concurrency, validation, Mailpit delivery, and isolated SMTP failure passed.

## Packet 10 Regression

Role matrix, DNC, merge provenance/relations/rollback/concurrency, timeline, and merged-person intake passed.

## Packet 11 Regression

Scoring/history/affinity, stages/Lost/Won/reopen/concurrency, tasks, roles, and nonstaff denial passed.

## Packet 12 Regression

Golden reporting passed: 10 tracked visitors, 12 sessions, 6 enquiries, 5 canonical people, 2 attributed people, 4 opportunities, one Won and one Lost, role denials, currencies, and zero report writes.

## Packet 13 Regression

The policy matrix passed DNC, consent, approval expiry, content/policy changes, merge/opportunity checks, claim concurrency, recovery, transient/max/permanent outcomes, dry run, manual/unknown outcomes, and disabled agent. Packet 14's signed mutation matrix separately verified the final-start path and exposed/fixed the blocked fallthrough.

## Build Result

Prettier, zero-warning ESLint, strict workspace typecheck, 13 Vitest files / 86 tests, generated DB types, full Next.js build, and compiled Bridge build passed. The pinned project asks for Node 24.13.0; the host wrapper reported 24.19.0 for some pnpm commands, while spawned test processes used 24.13.0.

## Dependency Audit

`pnpm audit --audit-level high`: no known vulnerabilities.

## Secret Scan

No populated machine-secret or `sb_secret_` value was found in workspace source. Runtime logs did not contain the generated HMAC secret. Synthetic local credentials were supplied only through process environment.

## Known Limitations

No Meta credentials, approved upstream URL/SHA, Meta Automation adapter, browser/CDP session, social discovery/sync, or real external execution. Machine throttling is process-local; production needs distributed limiting, secret-manager integration, supervision, alerting, and telemetry.

## External Dependencies

Hosted Auth verification, deployment infrastructure, production secret manager/clock/rate limiting, approved privacy/legal policy, and the Packet 15 upstream source remain external. Their absence does not undermine local protocol correctness.

## Rollback Notes

Roll back application and migration only through a reviewed forward migration or restore. Preserve nonce/operation/job evidence until retention expiry. Do not manually mutate production schema or delete immutable receipts.

## Packet 15 Readiness

The signed cable is ready for a pinned, reviewed adapter that preserves dry-run-first behavior and security checkpoint propagation. An approved upstream URL and exact commit SHA are still required.

## STATUS

**PASS** — HMAC identity, exact-byte signing, replay defense, negotiation, idempotent claim/lease/start/result, agent isolation, final policy revalidation, dry-run guards, compiled runtime, graceful shutdown, UI, accessibility, regressions, audit, and documentation are locally verified. Packet 15 was not started.
