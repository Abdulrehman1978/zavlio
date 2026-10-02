# Automation Operations

## Packet 17 operational closure

Runbooks cover pending approval, stuck claims, lease recovery, retry exhaustion, manual action, Bridge outage, DNC-after-approval, and consent withdrawal.

## Queue states

Jobs progress through `AWAITING_APPROVAL`, `QUEUED`, `CLAIMED`, `RUNNING`, and a terminal or attention state: `COMPLETED`, `BLOCKED`, `FAILED`, `CANCELLED`, or `MANUAL_ACTION_REQUIRED`. Every meaningful transition appends a job event and relevant audit row. Optimistic versions reject stale staff actions.

ADMIN/OWNER may approve, reject, cancel, and resolve manual-action holds. Requeue resolution records an operator note and returns to full eligibility checks. Rejection/cancellation are durable. VIEWER is read-only; OPERATOR can propose but cannot approve or administer policy. OWNER alone activates a new safe policy version.

Protocol-v1 workers use the signed private endpoints in `META_BRIDGE_PROTOCOL.md`. The Next.js server alone holds the service-role credential; the Bridge holds only its per-agent HMAC secret. Claims carry a bounded lease and durable operation identity. Recovery requeues expired claims and records the recovery. Heartbeats record protocol/bridge version, negotiated capabilities, instance, last-seen time, and bounded runtime state.

Transient network/provider/rate-limit failures retry only below `max_attempts` with configured backoff. Permanent failures stop. `SECURITY_CHECKPOINT`, `CAPTCHA`, `AUTH_REQUIRED`, `IDENTITY_VERIFICATION`, and `EXECUTION_OUTCOME_UNKNOWN` require manual action. Unknown outcomes must not auto-retry because the external side effect may already have happened.

`pnpm automation:tick` remains the Packet 13 local service-role simulator. `pnpm test:integration:automation` exercises policy and concurrency; `pnpm test:integration:bridge` exercises signed protocol and the compiled Bridge. Agent protocol health, negotiated mode/capabilities, claim identity, queue state, failure reasons, and evidence are visible in CRM.

Packet 14 completion means the secure dry-run machine cable works locally. It does not mean platform delivery or production readiness. Meta credentials, approved upstream source, CDP/browser sessions, real social actions, a distributed rate limiter, deployment supervision, and production telemetry remain external or Packet 15+.

Packet 15 operations add `pnpm meta:verify-pin` and `pnpm test:integration:meta-adapter`. Adapter health states are `NOT_INSTALLED`, `PIN_MISMATCH`, `INSTALL_ERROR`, `READY`, `CDP_UNAVAILABLE`, `AI_RUNTIME_UNAVAILABLE`, `AUTH_REQUIRED`, `SECURITY_PAUSED`, and `DEGRADED`. A child crash is bounded by the supervisor; no auto-resume follows a security pause. Browser concurrency remains one.

Packet 15 operations add `pnpm meta:verify-pin` and `pnpm test:integration:meta-adapter`. Adapter health states are `NOT_INSTALLED`, `PIN_MISMATCH`, `INSTALL_ERROR`, `READY`, `CDP_UNAVAILABLE`, `AI_RUNTIME_UNAVAILABLE`, `AUTH_REQUIRED`, `SECURITY_PAUSED`, and `DEGRADED`. A child crash is bounded by the supervisor; no auto-resume follows a security pause. Browser concurrency remains one.

# Packet 16 social runbook

Provider status is independent per platform. Disable observation/live flags and revoke permits during an incident; recheck auth, target, control, policy, and kill switch immediately before any future commit. Unknown outcomes require manual review and are never blindly retried.
