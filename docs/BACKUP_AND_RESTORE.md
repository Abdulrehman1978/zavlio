# Backup and restore

Use encrypted provider-managed PostgreSQL backups with point-in-time recovery where the selected provider supports it. Add scheduled logical exports for portability and migration rehearsal. Restrict restore/export access to named operators and keep secret-manager recovery separate from database backups.

Restore only into a disposable project. Verify migrations, generated types, RLS,
staff, people, identities, opportunities, messages, consents, automation jobs,
and audit rows before considering the rehearsal successful. Packet 17R created
a local custom-format dump and restored a public-schema export into a disposable
database with zero SQL errors; catalog and representative-row evidence is in
docs/work/17R-result.md. This is local engineering evidence, not hosted PITR or
provider restore evidence.

Packet 17R host recovery did not alter database or Docker data: wsl --shutdown
was used, no WSL distribution was unregistered, and no VHDX or application
data was deleted. The temporary restore database was dropped after verification.

Engineering targets, pending business approval: RPO follows provider PITR plus the last successful export; RTO is the measured disposable restore and redeploy duration. A failed migration uses a reviewed forward-fix or restore path, not an assumed destructive down migration.
