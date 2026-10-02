# Lead intake

## Packet 17 operational closure

Production intake requires Turnstile and a centrally shared/platform rate-limit plan; local process-only limits are not treated as production evidence.

Packet 09 implements the minimum production-shaped public intake boundary for `/start-a-project` and `/contact`.

## Routes and schemas

The browser forms post to `/api/forms/start-project` and `/api/forms/contact`. Shared Zod schemas cap all strings, normalize email, constrain website URLs to HTTP(S), require a UUID idempotency key and form version, and silently accept honeypot submissions without CRM writes.

## Transaction and identity

The routes call `intake_lead_submission`, a service-role-only security-definer RPC. It creates `form_submissions`, resolves people by exact case-insensitive email identity, inserts an unverified email identity, and updates only conservative fields. Website organization matching is exact normalized domain matching under an advisory lock. A company name alone never merges an existing organization.

## Visitor linking and attribution

The visitor cookie is considered only when the latest analytics consent is valid. A matching anonymous visitor is linked and null person IDs are backfilled on sessions/events. A visitor linked to another person produces a pending identity-match candidate and is never overwritten. First-touch and latest-touch attribution are preserved; self-reported source is stored separately in the submission payload.

## CRM state

Both forms create an inbound website touchpoint and a task with the configured SLA. Start-a-project additionally creates a `new` opportunity. The initial deterministic score is model `PACKET_09_INTAKE_V1`; Packet 11 owns the full scoring engine.

## Email, spam, consent, and DNC

Confirmation and internal notification jobs are inserted into `email_outbox` in the same transaction, then delivered by Mailpit locally or SMTP in deployment. Delivery failures mark jobs `FAILED` without rolling back CRM state. Turnstile is bypassed only for explicit local development URLs and fails closed for production. Intake does not subscribe a person to marketing; DNC only affects campaign use.

## Failure and idempotency

## Packet 10 merge regression

Lead intake resolves an email identity whose source person was merged by following the reparented identity/canonical survivor. The Packet 10 runtime harness verifies the resulting submission points at the survivor and that no archived source is revived.

The idempotency key is unique at the database boundary. Retries return the original outcome and do not duplicate person, CRM, or outbox records. Concurrency is serialized by the email identity unique index, visitor row lock, and domain advisory lock.
