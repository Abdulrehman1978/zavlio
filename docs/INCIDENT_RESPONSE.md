# Incident response

For every incident: detect and preserve bounded evidence, contain the affected capability, disable unsafe automation, rotate compromised credentials, recover from a known-good release or disposable restore, and complete a written review.

## Playbooks

- Credential or machine-HMAC compromise: disable the agent, revoke canary permits, stop the Bridge, rotate current and previous keys, inspect audit/nonces, then re-handshake.
- Database incident: stop risky writes, preserve outbox/jobs, isolate the project, use backup/restore rehearsal, verify RLS and schema before reopening traffic.
- Unauthorized automation or social challenge: activate the social kill switch, disable the agent/provider, preserve manual-action evidence, and do not replay unknown outcomes.
- Email abuse or SMTP failure: disable delivery, preserve accepted enquiries and durable outbox state, rotate credentials if needed, and retry only idempotent rows.
- Deployment failure: stop promotion, restore the previous immutable application artifact, and use forward-fix for schema changes.
- Data exposure suspicion: contain access, preserve logs without copying raw PII, rotate secrets, scope affected records, and follow approved data-subject/legal review.

Emergency controls are the automation disable flag, provider/live kill switch, agent disablement, canary revocation, form protection mode, and Bridge shutdown. All sensitive administrator actions remain auditable.
