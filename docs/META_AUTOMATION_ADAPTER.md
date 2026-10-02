# Meta Automation Adapter

## Packet 17 operational closure

Generic CI runs deterministic dry-run adapter/provider tests only. No authenticated browser, social account, or real side effect belongs in release automation.

The adapter is a Zavlio-owned boundary around the pinned upstream semantic browser agent. The normal path is:

`Packet 13 policy → Packet 14 signed cable → Bridge lease/start → typed adapter job → isolated JSONL child → local CDP semantic snapshot/action → bounded sanitized evidence`.

The child process is supervised with `spawn(process.execPath, [entry], { shell: false })`, Windows-hidden, bounded request/shutdown timers, and stdout reserved for JSONL. Its environment is an explicit allowlist with forced `DRY_RUN=true`, `APPROVAL_MODE=true`, `POSTING_ENABLED=false`, and `JOB_AUTOMATION_ENABLED=false`; Packet 14 HMAC, Supabase service-role, SMTP, Turnstile, JWT, cookie, and browser credentials are excluded. Upstream runtime paths are redirected under the adapter runtime directory.

Only THREADS, FACEBOOK, and LINKEDIN are supported by an explicit action matrix. Jobs must be dry-run, have an immutable target identity and content hash, and use fixed semantic primitives. The semantic agent transitively loads upstream telemetry/logger modules; their runtime paths are redirected, their output is not ingested wholesale, and sanitized Zavlio evidence remains authoritative. Upstream discovery, business planning, identity graph, follow-up scheduler, browser manager, AI runtime, and local state authorities are not loaded. Page content is untrusted and cannot select actions or origins.

Dialogs are never accepted. The child removes inherited dialog listeners, dismisses the dialog, and returns `MANUAL_ACTION_REQUIRED`. Login/security checkpoints, ambiguous/wrong targets, origin escapes, content mismatches, unavailable targets, child crashes, and unknown outcomes fail closed. Real social execution is disabled; the test-only CDP harness uses a local fixture and verifies a synthetic marker only.

Run `pnpm meta:verify-pin`, `pnpm --filter @zavlio/meta-bridge build`, and `pnpm test:integration:meta-adapter`. The harness covers secret isolation, dialog denial, safe action verification, login/wrong-target/prompt/origin gates, primitive restrictions, compiled child startup, and source-drift verification.

## Packet 15R hardening

Preparation and execution share a canonical SHA-256 execution contract; job ID alone is never authority. The parent and child retain the same fingerprint, require exact request identity, expire and consume preparation once, and clear it on abort, restart, timeout, or terminal result. Text actions always require normalized content hashes.

Target authorization requires structured browser proof rather than body-text counts or payload stable IDs. Editor and submit controls are structurally bound to the same target composer. The child serializes browser operations, maintains an abort controller for active work, and escalates a timed-out child after cooperative cancellation grace. Dialog state is latched for the operation and only type/category are retained.

## Packet 15R.1 execution-invariant closure

`SyntheticTargetProofProvider` is the only provider used here; it is test infrastructure, not a claim about real platform DOM. It observes all supplied target identifiers and requires complete agreement. It resolves unique target/action-bound controls by deterministic semantic ID. The adapter stores the binding as preparation evidence but re-resolves the exact control immediately before every TYPE and CLICK, so stale numeric IDs, reordered DOM, first-match editors, and first-match Send/action controls cannot become mutation authority. Non-text actions use explicit target plus action bindings.

Queued operations carry cancellation generations. ABORT invalidates queued work and active controllers; STOP latches stopping immediately, invalidates queued work, clears prepared state, waits for the active critical section, disconnects, and terminates the child. Preparation remains single-use and TTL-bounded. Timeout and child-exit paths clear parent/child state and classify uncertain outcomes conservatively.

## Packet 15R.1 execution-invariant closure

`SyntheticTargetProofProvider` is the only provider used here; it is test infrastructure, not a claim about real platform DOM. It observes all supplied target identifiers and requires complete agreement. It resolves unique target/action-bound controls by deterministic semantic ID. The adapter stores the binding as preparation evidence but re-resolves the exact control immediately before every TYPE and CLICK, so stale numeric IDs, reordered DOM, first-match editors, and first-match Send/action controls cannot become mutation authority. Non-text actions use explicit target plus action bindings.

Queued operations carry cancellation generations. ABORT invalidates queued work and active controllers; STOP latches stopping immediately, invalidates queued work, clears prepared state, waits for the active critical section, disconnects, and terminates the child. Preparation remains single-use and TTL-bounded. Timeout and child-exit paths clear parent/child state and classify uncertain outcomes conservatively.

# Packet 16 provider handoff

The adapter hands only a policy-approved, signed, exact execution contract to the provider boundary. Provider-specific proof and verification remain isolated from generic executor code; typing before STARTED, generic selectors, dialog acceptance, and unknown-outcome retry remain prohibited.
