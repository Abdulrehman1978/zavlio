# Operator Guide: Audit Explorer & Administration (`/crm/audit`, `/crm/settings`)

**Workspace**: `C:\zavlio`  
**Audience**: System Administrators, Security Officers, Platform Owners  
**Routes**: `/crm/audit`, `/crm/settings`

---

## 1. Overview & Capabilities

The Audit Explorer (`/crm/audit`) provides an immutable, append-only log viewer backed by the PostgreSQL `audit_logs` table. Every significant administrative action, identity merge, policy activation, and role modification generates an immutable audit record.

The Settings Hub (`/crm/settings`) unifies navigation across all system-level administration interfaces.

---

## 2. Permissions & Roles (RBAC)

Audit logs contain sensitive operational history and are strictly restricted:

| Route / Capability          |     VIEWER     |    OPERATOR    |     ADMIN      |     OWNER      |
| :-------------------------- | :------------: | :------------: | :------------: | :------------: |
| Access `/crm/settings`      |     Denied     |     Denied     |  **Allowed**   |  **Allowed**   |
| Access `/crm/audit`         |     Denied     |     Denied     |  **Allowed**   |  **Allowed**   |
| Filter & Search Audit Logs  |     Denied     |     Denied     |  **Allowed**   |  **Allowed**   |
| Modify or Delete Audit Logs | **IMPOSSIBLE** | **IMPOSSIBLE** | **IMPOSSIBLE** | **IMPOSSIBLE** |

_Note: PostgreSQL RLS and trigger constraints strictly prohibit `UPDATE` and `DELETE` operations on `audit_logs` for all database roles._

---

## 3. Audit Payload Redaction Rules

When viewing audit events, all payloads are processed through `apps/web/src/lib/audit-redaction.ts`. The following sensitive keys are recursively replaced with `[REDACTED]`:

- `password`, `token`, `secret`, `hmac`
- `cookie`, `auth`, `session`, `api_key`
- Raw session identifiers and bearer tokens

---

## 4. Settings Administration Hub (`/crm/settings`)

`/crm/settings` organizes administrative domains into clear functional cards:

1. **Staff Administration** (`/crm/settings/staff`): Manage staff invitations, assign roles, view active profiles. Final owner accounts cannot be demoted or deleted.
2. **Identity Review** (`/crm/settings/identity-review`): Review unmerged candidate identities and approve canonical merges.
3. **Scoring Models** (`/crm/settings/lead-scoring`): Inspect versioned lead scoring configuration, weights, and decay half-lives. Read-only in UI.
4. **Automation Bridge & Leases** (`/crm/automation`): Monitor active worker leases, inspect signed machine agent heartbeats, and manage the platform kill switch (`DISABLED`).
5. **Social Settings & Canary** (`/crm/settings/social`): Supervise provider observation ingestion and canary permits (`LIVE_EXTERNAL_EXECUTION=false`).
