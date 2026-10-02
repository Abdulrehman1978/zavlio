# Automation Architecture

## Packet 17 operational closure

Queue processing, lease recovery, nonce cleanup, and email delivery use simple scheduled workers around the existing PostgreSQL queue; no Redis/Kafka/Temporal dependency is introduced.

CRM is the system of record; an agent is only an execution client. The flow is CRM facts → canonical person → versioned policy → durable proposal/approval → PostgreSQL queue → atomic claim → final policy recheck → dry-run execution evidence → CRM history.

Packet 13 adds immutable policy versions, append-only policy decisions/approvals/job events, RLS-safe CRM projections, guarded transition RPCs, agent capability/runtime state, heartbeat data, and a pure TypeScript evaluator. Queue transitions use row locks, expected versions, partial indexes, `FOR UPDATE SKIP LOCKED`, and leases. Staff do not directly update protected queue state.

The browser UI is server-first at `/crm/automation`, `/approvals`, `/jobs`, `/jobs/[id]`, `/agents`, and `/settings`. Client components are limited to validated mutations. Person detail and the normalized person timeline expose meaningful automation history without treating dry runs as customer contact.

Packet 14 adds the isolated machine boundary described in `META_BRIDGE_PROTOCOL.md`: per-agent HMAC identity, exact-byte signing, timestamp/nonce replay defense, protocol/capability negotiation, heartbeat, one-job claim/lease/start/result semantics, durable operation receipts, and localhost health/readiness. The only executor is an INTERNAL/NOOP/DRY_RUN_ONLY simulator, and the Bridge has no database credential.

Packet 14 still has no Meta credential, browser/CDP control, pinned upstream source, social adapter, or live external executor. Packet 15 owns the pinned upstream adapter.

## Packet 15 adapter

Packet 15 preserves that authority chain. A negotiated THREADS/FACEBOOK/LINKEDIN dry-run job is prepared by Zavlio, then passed over typed JSONL IPC to a long-lived isolated child. The child uses only the pinned semantic browser agent and fixed action mappings; it does not run upstream discovery, next-best-action, identity, follow-up, browser-manager, or AI orchestration. A dialog, login/security challenge, target mismatch, origin escape, content mismatch, crash, or unverifiable result cannot become an automatic social side effect.

## Packet 15R.1 execution invariants

The adapter-owned synthetic provider is the sole target/control provider in this packet. It requires complete username/stableId/profile/conversation agreement and resolves exact semantic editor and action controls. Numeric element IDs are current snapshot coordinates only and are re-resolved from the binding before each primitive. Active and queued cancellation generations enforce that cancelled work never starts; STOP invalidates the queue immediately. Packet 16 may add explicit platform providers, but no live selectors or social side effects are introduced here.

## Packet 15 adapter

Packet 15 preserves that authority chain. A negotiated THREADS/FACEBOOK/LINKEDIN dry-run job is prepared by Zavlio, then passed over typed JSONL IPC to a long-lived isolated child. The child uses only the pinned semantic browser agent and fixed action mappings; it does not run upstream discovery, next-best-action, identity, follow-up, browser-manager, or AI orchestration. A dialog, login/security challenge, target mismatch, origin escape, content mismatch, crash, or unverifiable result cannot become an automatic social side effect.

# Packet 16 provider boundary

The execution flow remains CRM → Packet 13 policy/approval → Packet 14 signed job → Packet 15R.1 adapter → platform provider → exact proof → verified result. Social providers cannot choose targets, content, policy, or follow-up actions, and no upstream AgenticSocialRunner/NextBestAction authority is enabled.
