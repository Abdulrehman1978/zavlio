# Packet 15R Result — Adapter Hardening & Runtime Closure

## Preparation fingerprint algorithm

`executionContractHash = SHA-256(canonical JSON)` over job ID/version, attempt, person, channel/action, purpose, dry-run mode, target identity, profile URL, content hash, and payload. Object keys are recursively sorted; arrays preserve order.

## Parent prepared-state model

The parent stores `{job, contractHash, preparedAt}` only for an exact `READY_TO_SUBMIT` response. It enforces a 120-second TTL, consumes the entry before execution, clears on abort/shutdown/restart/error, and rejects mismatches as `PREPARED_JOB_MISMATCH`.

## Child prepared-state model

The child stores the same job and fingerprint with `PREPARED → EXECUTING → CONSUMED` semantics. Preparation is bounded to 120 seconds and 64 entries; terminal execution, abort, crash, and stop clear state.

## Execution mismatch tests

Compiled harness PASS for same job ID with changed version, attempt, channel, action, person, target, content/content hash, and purpose. No browser mutation occurs.

## Content hash requirement

DM, REPLY, COMMENT, and PUBLISH require content plus NFC/CRLF-normalized SHA-256. Non-text actions reject content/hash. LF/CRLF and composed/decomposed Unicode normalization tests pass.

## Target proof architecture

Target proof uses structured DOM evidence: observed username, stable platform ID, normalized profile path, conversation ID, editor binding, and submit binding. Body-text occurrence is supporting context only.

## StableId-only rejection

Stable ID without observable matching proof returns `INSUFFICIENT_TARGET_EVIDENCE`.

## Unrelated username-body rejection

A page mentioning `@alice` without target-proof structure returns `INSUFFICIENT_TARGET_EVIDENCE`.

## Exact editor binding

`TYPE_EXACT` requires a bound `data-zavlio-editor-for` control and verifies that exact control after typing.

## Submit-control binding

Submit steps require a matching `data-zavlio-submit-for` structural binding; no global first-match submit control is authoritative.

## Operation mutex

Child JSONL browser operations are serialized through a critical promise queue. ABORT is an immediate cooperative signal; STOP aborts then waits for the queue.

## Concurrency test

Harness PASS: 20 concurrent preparations correlate correctly; concurrent execute/prepare serializes; concurrent duplicate execute yields one success.

## Abort implementation

The child maintains `activeOperation`, `activeJobId`, and `AbortController`; checks occur before/after browser primitives and before final verification. Parent abort sends a direct ABORT request.

## Timeout cancellation

Parent timeout sends cooperative ABORT, waits bounded grace, then terminates the child if the request remains pending. Pending preparation state is cleared and child restart invalidates all contracts.

## Lease-loss result

Bridge cleanup exposes adapter abort in the run-finally path. A full signed lease-loss runtime requires Docker/Supabase and remains external on this host.

## Cancellation result

Synthetic slow execution plus ABORT returns `ABORTED` and writes no marker.

## Duplicate execution result

Repeated and concurrent execute attempts return `PREPARATION_REQUIRED`/equivalent after one-shot consumption; marker count remains one.

## One-shot preparation result

Only exact `READY_TO_SUBMIT` prepares are stored. Manual/error/blocked responses are never inserted.

## Preparation expiry result

Expired child/parent preparation returns `PREPARATION_EXPIRED`; expiry is bounded to 120 seconds with defensive map pruning.

## Child restart result

Parent clears preparation state on initialize/shutdown/IPC failure; child starts with an empty map.

## Dialog latch result

Unexpected dialog state is latched for the operation, sanitized to type/category only, dismissed, and returned as `MANUAL_ACTION_REQUIRED`. A fresh independent operation may begin cleanly after terminal cleanup.

## Security classifier behavior

States are `KNOWN_SAFE_NO_SIGNAL`, `KNOWN_SECURITY_SIGNAL`, `LOGIN_SIGNAL`, and `UNKNOWN`. “Safe” is explicitly a bounded no-signal result with confidence `0.25`, not universal safety.

## Telemetry correction

The semantic agent transitively loads upstream telemetry/logger modules. Runtime paths are redirected; raw output is not ingested wholesale; stderr is redacted; sanitized Zavlio evidence is authoritative. The pinned source was not modified.

## Pin verification

Exact origin, commit `439c3bfaacb1caabef25a7d67c3f204916a5a168`, tree `e4f412bc7ff86261f0753a1f088c5f271af9246c`, package version, clean source, and manifest hashes pass.

## Manifest hash verification

Runtime verifier now compares package-lock, LICENSE, and README SHA-256 values against `external/meta-automation.lock.json`.

## Git failure behavior

Runtime and standalone verifiers fail closed with `PIN_VERIFICATION_ERROR` when required Git subprocesses or manifest reads fail.

## Crash before side effect

Supervisor termination and pre-side-effect retry classification are implemented; a full injected crash run remains unverified without a dedicated crash fixture.

## Crash after side effect

The adapter preserves `UNVERIFIED`/unknown evidence and does not retry. Full marker-then-crash injection remains external follow-up evidence.

## Unknown outcome

Unverified execution maps to unknown/manual handling; no automatic retry is introduced.

## Packet 14 signed runtime

Not rerun in this environment because Docker Desktop is unavailable. Packet 14 remains the authoritative machine boundary.

## Database replay

Not rerun: Docker Desktop is unavailable. The reviewed Packet 15 migration and focused pgTAP test remain present; no manual schema mutation was performed.

## pgTAP

Not executed in this environment for the same Docker limitation.

## Generated types

Not regenerated in this environment for the same Docker limitation; existing Packet 14 generated runtime-state/evidence types remain compatible.

## Unit tests

Strict Bridge/web typechecks, formatting, and lint pass. The broad Vitest command did not complete within the local runner window and is not claimed as current evidence.

## Adapter integration tests

`pnpm test:integration:meta-adapter`: PASS after hardening changes.

## CDP fixture tests

Compiled Windows Chrome/CDP fixture PASS: secret isolation, target proof, dialog denial, fingerprint mismatch, serialization, duplicate prevention, content normalization, prompt/origin gates, and abort.

## Playwright

Changed automation pages were not rerun through Playwright in this Docker-limited turn.

## axe

Changed automation pages were not rerun through axe in this Docker-limited turn.

## Build

Bridge build and production web build emit compiled artifacts successfully.

## Audits

Pinned upstream and root high-severity audits passed with zero findings. The broad upstream semantic suite remains subject to the previously documented Antigravity/external limitation.

## Secret scan

No real secrets were added. Child allowlist tests prove HMAC/service-role exclusion; final client-bundle scan found no Puppeteer, adapter runtime, HMAC, service-role, or Antigravity strings.

## Source drift

`node scripts/meta-verify-pin.mjs`: PASS after final harness cleanup; detached checkout is clean and generated logs were removed.

## Packet 16 readiness

Packet 16 is not started. Real platform execution remains disabled and requires a new explicit review.

## STATUS

`PASS_WITH_EXTERNAL_DEPENDENCY` — execution binding, target proof, serialization, cancellation, one-shot preparation, dialog latching, and dry-run safety are hardened and locally exercised. Docker/database replay, full historical regressions, crash injection, and authenticated real-site evidence remain external.
