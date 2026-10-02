# Backup and Recovery

Status: documented engineering procedure. Packet 17R now has local disposable
backup/restore evidence; provider-specific PITR and hosted restore evidence
remain external until a deployment target is selected.

## Backup model

Use the hosted PostgreSQL provider's encrypted automated backups and point-in-time retention, plus scheduled logical exports for migration/portability checks. Restrict backup access to named operators, encrypt exports at rest and in transit, and keep secrets in a separate secret manager. Database backups are not secret-manager backups.

## Restore rehearsal

Restore a known backup/export into a disposable project, never production. Run
schema/migration checks, generated-type checks, RLS tests, and representative
reads for staff, people, identities, opportunities, messages, consents,
automation jobs, and audit rows. Packet 17R recorded a zero-error local
rehearsal in docs/work/17R-result.md. Provider PITR and hosted restore remain
external.

## Engineering objectives

Until business requirements approve contractual objectives, use engineering targets only: RPO target is provider-configured point-in-time recovery plus the last successful logical export; RTO target is the measured disposable restore and redeploy duration. Reassess after the deployment provider is selected.

## Failure recovery

On database outage, stop writes that cannot be safely retried, preserve outbox/job state, and follow docs/INCIDENT_RESPONSE.md. On migration failure, stop application promotion and use a reviewed forward-fix or restore path. Rotate compromised credentials separately from database restore.
