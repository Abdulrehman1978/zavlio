# Meta Bridge Machine Protocol v1

## Packet 17 operational closure

Bridge operations require NTP-synchronized clocks, bounded machine rate limits, current/previous HMAC overlap, replay denial, safe readiness, and redacted structured logs.

Packet 14 defines a private server-to-server protocol between the isolated Meta Bridge process and the Zavlio control plane. It does not enable Meta, email, browser/CDP, or any other live external action.

## Transport and endpoints

- Version: `1`
- Prefix: `/api/internal/automation/v1`
- Method: `POST` only
- Endpoints: `/handshake`, `/heartbeat`, `/claim`, `/jobs/{id}/lease`, `/jobs/{id}/start`, `/jobs/{id}/result`
- Content type: `application/json`
- Request body: at most 64 KiB; exact bytes are read once, hashed, authenticated, and then parsed
- Query strings: rejected
- Cache: private/no-store
- CORS: no public browser access is enabled
- Production: non-local HTTP is rejected; HTTPS is mandatory

## Machine identity and credentials

Each enabled `automation_agents.agent_key` maps to one current HMAC credential in server environment configuration. The raw secret and key ID are also supplied to that bridge process, but never stored in PostgreSQL or sent to a browser. `AUTOMATION_MACHINE_KEYS_JSON` supports one bounded previous credential with an explicit `validUntil` during rotation. Secrets must decode to at least 32 bytes.

The bridge must not receive a Supabase service-role key or database connection credential. Staff sessions and machine identity are separate principals.

## Signed request

Algorithm: HMAC-SHA256. Signature encoding: unpadded base64url with the `v1=` prefix. Body digest: SHA-256 lowercase hexadecimal over the exact request bytes.

Signed headers:

- `X-Zavlio-Agent-Key`
- `X-Zavlio-Key-Id`
- `X-Zavlio-Protocol-Version`
- `X-Zavlio-Timestamp`
- `X-Zavlio-Nonce`
- `X-Zavlio-Content-SHA256`
- `X-Zavlio-Signature`
- `X-Zavlio-Bridge-Version`

Canonical request, including the final body digest but no trailing line:

```text
v1
METHOD
PATHNAME
AGENT_KEY
KEY_ID
TIMESTAMP
NONCE
BODY_SHA256
```

Method is uppercase. Path is the exact pathname without a query. Timestamp is integer Unix seconds. Nonce is a UUID. Verification uses `timingSafeEqual`; malformed, unknown, stale, tampered, and replayed requests receive a generic machine-auth failure.

## Freshness and replay

The timestamp window is inclusive ±300 seconds. A valid signature is checked before nonce persistence. The nonce is then atomically inserted per agent; duplicates fail closed. Nonces expire after 24 hours and are removed only by the bounded service-role cleanup function.

HTTP retries create a fresh timestamp, nonce, digest, and signature. Durable operation identity is separate: claim, lease, start, and result payloads retain the same `operationId`. Repeating the same operation returns the persisted response; changing the request hash under that identity returns `IDEMPOTENCY_CONFLICT`.

## Negotiation and safe capabilities

Handshake selects protocol v1 and intersects requested, registered, and server capabilities. Packet 14's immutable server maximum is:

```json
{
  "channels": ["INTERNAL"],
  "actions": ["NOOP"],
  "executionModes": ["DRY_RUN_ONLY"]
}
```

The bridge separately refuses non-dry-run work and any channel/action outside this set, even if a compromised server response attempts to supply it. Maximum concurrency is one.

## Liveness and health

The bridge binds health/readiness only to `127.0.0.1` or `localhost`. `/health` exposes bounded operational state without credentials. `/ready` returns success only after handshake. The negotiated heartbeat interval is 30 seconds, poll interval 5 seconds, and lease duration comes from the active policy (bounded 30–3600 seconds; local evidence used 60 seconds).

Heartbeat and handshake bind an agent to a runtime `instanceId`. Claims require a recently live enabled agent. Lease/start/result operations require the same agent, instance, current version, and live lease.

## Lifecycle and results

Claim uses PostgreSQL row locking and `SKIP LOCKED`, records the claim operation, and allows at most one active job per protocol-v1 agent. A lost claim response retried with the same operation ID returns the same job and cannot claim another.

Lease extension uses expected version and expiry preconditions. Start rechecks content hash, active policy version, ownership, instance, lease, and the complete Packet 13 execution policy before entering `RUNNING`.

Results are `SUCCESS`, `TRANSIENT_FAILURE`, `PERMANENT_FAILURE`, `MANUAL_ACTION_REQUIRED`, or `UNKNOWN_OUTCOME`. Success writes one dry-run action completion. Known transient results use bounded retry. Security checkpoints and unknown outcomes enter `MANUAL_ACTION_REQUIRED`; they are never blindly retried. A repeated result returns the stored response without duplicating evidence, while a late new result is rejected.

## Operations

Provision a local agent with `pnpm bridge:provision-local [agent-key] [display-name]`. The command is local-only, stores only the agent record, prints the generated secret once, and does not put the secret in PostgreSQL.

Build and start the bridge with `pnpm --filter @zavlio/meta-bridge build` and `pnpm --filter @zavlio/meta-bridge start` after setting the required bridge variables. Use `pnpm test:integration:bridge` for the local signed protocol/compiled-process matrix. SIGINT, SIGTERM, and the test-only parent IPC path all converge on graceful `runtime.stop()`.

## Error contract

Responses use one JSON envelope with `ok`, `requestId`, `serverTime`, and either `data` or a stable code. Relevant codes include `MACHINE_AUTH_FAILED`, `AGENT_DISABLED`, `PROTOCOL_INVALID_BODY`, `PROTOCOL_BODY_TOO_LARGE`, `PROTOCOL_VERSION_UNSUPPORTED`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`, `LEASE_LOST`, and `JOB_STATE_CONFLICT`. Authentication details and secrets are never echoed.

## Packet 15 adapter handoff

The signed Packet 14 cable remains the only machine-authenticated ingress. When enabled, capability negotiation may include only the pinned dry-run social matrix. The Bridge constructs a typed job and starts the child only after the existing lease/start policy gates pass. The child cannot verify HMACs, call Supabase, or claim jobs; it receives neither machine nor database credentials.

# Packet 16 observation route

Packet 14 protocol v1 remains authoritative. The signed internal social observation route accepts only bounded SOCIAL_OBSERVATION_V1 normalized facts, preserves nonce/timestamp/body-hash/agent checks, and never accepts raw DOM or browser session material.
