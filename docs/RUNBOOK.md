# Runbook

## Packet 17 release operations

Use docs/DEPLOYMENT.md for promotion order, docs/BACKUP_AND_RESTORE.md for restore rehearsal, docs/INCIDENT_RESPONSE.md for emergency controls, and docs/RELEASE_CHECKLIST.md for evidence. Run pnpm env:check production before starting a release; keep live social execution disabled.

## Packet 14 Bridge

1. Provision a local/staging agent with `pnpm bridge:provision-local <agent-key> <name>`; capture the generated secret once and place it only in secret-managed server/Bridge environments.
2. Build with `pnpm --filter @zavlio/meta-bridge build` and start the compiled service.
3. Check loopback `/health` and `/ready`, then confirm protocol version, bridge version, last handshake, last heartbeat, negotiated capabilities, safe mode, and active claims in `/crm/automation/agents`.
4. For `MACHINE_AUTH_FAILED`, check clock synchronization, agent/key ID pairing, canonical pathname, exact body bytes, and rotation expiry without printing the secret.
5. For `LEASE_LOST` or `JOB_STATE_CONFLICT`, do not force completion. Reload CRM state; let recovery/manual review own the outcome.
6. For `SECURITY_CHECKPOINT`, CAPTCHA/auth/identity verification, or unknown outcome, leave the job in manual action. Never bypass the provider or blindly retry.
7. Rotate by installing a new current key and retaining the old value only as the bounded previous key. Restart/re-handshake the Bridge with the new key, verify it, then remove the expired previous value.
8. Graceful stop uses SIGINT/SIGTERM and drains loops before the local health server closes.

Validation: `pnpm db:reset`, `pnpm db:test`, `pnpm test:unit`, `pnpm --filter @zavlio/meta-bridge build`, and `pnpm test:integration:bridge`.

Status: skeleton. Add operational procedures, alerts, incident triage, safe automation shutdown, escalation, and recovery links.
