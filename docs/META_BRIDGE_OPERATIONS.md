# Meta Bridge Operations

## Packet 17 operational closure

Supervise one intended compiled instance with bounded restart backoff and graceful SIGTERM. A Bridge outage must not take core web readiness offline.

Packet 15 does not add a second machine-authentication model. Enable the adapter only after Packet 14 signed handshakes and the Packet 13 policy gate are working. Keep concurrency at one and treat `PIN_MISMATCH`, `AUTH_REQUIRED`, `SECURITY_PAUSED`, `CDP_UNAVAILABLE`, and `DEGRADED` as operator attention states.

The safe local sequence is `pnpm meta:verify-pin`, `pnpm --filter @zavlio/meta-bridge build`, then `pnpm test:integration:meta-adapter`. A security/dialog pause is not auto-resumed. Stop the Bridge, inspect the external browser manually, and restart only after the operator confirms the challenge is cleared. No real platform action is enabled by Packet 15.

# Packet 16 bridge operations

The Bridge reports independent provider versions/readiness while remaining DRY_RUN_ONLY. No live canary is permitted until current database, Packet 13, and Packet 14 runtime evidence is green; Docker unavailability therefore keeps all real canaries disabled.
