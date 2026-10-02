# Packet 15R.1 Result

## Scope

Final execution-invariant closure for the Packet 15/15R pinned Meta Automation adapter. No live social execution, provider implementation, upstream modification, or Packet 16 work was started.

## Files Changed

- `services/meta-bridge/src/adapters/meta-automation/target-proof.ts` — adapter-owned `TargetProofProvider` contract and `SyntheticTargetProofProvider`.
- `services/meta-bridge/src/adapters/meta-automation/child.ts` — complete identifier agreement, exact semantic control binding, queued cancellation generations, immediate STOP invalidation, and re-resolution before every TYPE/CLICK.
- `services/meta-bridge/src/adapters/meta-automation/index.ts` — provider exports.
- `scripts/meta-adapter-runtime-test.mjs` — multi-control, non-text, stale-DOM, identifier, queued abort, STOP, restart, timeout, and dynamic-CDP fixtures.
- Packet 15R.1 documentation, tracker, ledger, security, risks, and limitations records.

## Exact element-binding architecture

The synthetic provider observes deterministic `data-zavlio-*` evidence and resolves a unique semantic control using target key, action, and `data-zavlio-control-id`. The numeric element ID is only a current-snapshot transport coordinate. It is never mutation authority. Before every TYPE or CLICK the adapter re-resolves the binding, checks visibility, target, action, semantic ID, and current interactive ordering, then passes that freshly resolved ID to the pinned semantic agent. Missing, duplicate, changed, or stale controls fail closed as `UNVERIFIED`/`MANUAL_ACTION_REQUIRED`.

Text actions bind both the exact editor and exact submit control. LIKE/FOLLOW/CONNECT bind explicit target plus action; FOLLOW cannot satisfy CONNECT. Generic first editable, first Send, first Reply, and text-matching controls are not used as final mutation authority.

## Target proof

All supplied identifiers must agree with observed evidence: username, stable ID, normalized profile path, and conversation ID. Missing observable proof returns `INSUFFICIENT_TARGET_EVIDENCE`; disagreement returns `TARGET_IDENTITY_MISMATCH`. Profile paths normalize trailing slashes and platform origin validation remains enforced. Body text and display names are untrusted supporting context only.

## Cancellation, STOP, timeout, and one-shot execution

Every queued browser operation captures a per-job cancellation generation. ABORT increments the generation and aborts a matching active controller; queued work checks the generation before entering the critical section and before browser work, so cancelled work cannot start later. STOP sets a global stopping latch immediately, invalidates queued work, aborts active work, clears preparation, waits for the critical section, disconnects, and is followed by bounded child termination.

Preparation remains `NONE → PREPARED → EXECUTING → CONSUMED`, fingerprint-bound, single-use, bounded to 120 seconds and 64 entries. Parent/child preparation clears on success, abort, timeout, error, child exit/restart, STOP, shutdown, and expiry. Timeout requests cooperative ABORT, waits bounded grace, then terminates the child; unknown post-commit outcomes are not retried automatically.

## Integrity and security regressions

Canonical nested execution-contract hashing covers job ID/version, attempt, person, channel, action, purpose, dry-run state, target identity, profile URL, content hash, and payload. DM/REPLY/COMMENT/PUBLISH require normalized NFC + CRLF→LF content hashes; non-text actions reject contradictory content fields. Dialogs are dismissed and latched for the operation; they are never accepted. Security states remain `KNOWN_SAFE_NO_SIGNAL`, `KNOWN_SECURITY_SIGNAL`, `LOGIN_SIGNAL`, or `UNKNOWN`, with safe state explicitly limited to absence of a known signal in bounded observation.

The provider boundary is synthetic-only in Packet 15R.1. Threads, Facebook, and LinkedIn platform providers are deferred to Packet 16; no real-site selectors were added. Prompt-injection pages cannot change target, action, content, origin, or job identity. CDP is loopback-only, Instagram remains unsupported, and forbidden secrets remain excluded from the child.

## Verification evidence

`pnpm test:integration:meta-adapter` PASS. The compiled Windows Chrome/CDP fixture covered exact editor/submit binding, wrong first controls, non-text action binding, stale DOM re-resolution, complete and conflicting target identifiers, body-text false positives, active ABORT, queued PREPARE abort, queued EXECUTE abort, STOP invalidation and child termination, child restart invalidation, timeout cancellation, duplicate execution, content hashes, contract mismatches, dialog latching, prompt/origin gates, secret isolation, 20-request IPC correlation, and pinned-source cleanliness.

Also passed: adapter typecheck/build, formatting, lint, full typecheck, production build, high-severity dependency audit, and `pnpm meta:verify-pin` for exact origin, commit, tree, package version, package-lock/LICENSE/README hashes, clean source, and no uncontrolled upstream `.env`.

Docker/Postgres was not available, so database replay, pgTAP, generated types, and the Packet 14 signed runtime path were not rerun. The broad upstream suite remains limited by its external Antigravity/browser dependency. No real external social side effect occurred.

## STATUS

`PASS_WITH_EXTERNAL_DEPENDENCY` — all internal Packet 15R.1 execution invariants and applicable local gates pass; Docker/Postgres, authenticated real-site evidence, and the external upstream broad suite remain unavailable. Packet 16 was not started.
