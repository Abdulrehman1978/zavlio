# Routes

## Packet 14 private machine routes

- `POST /api/internal/automation/v1/handshake`
- `POST /api/internal/automation/v1/heartbeat`
- `POST /api/internal/automation/v1/claim`
- `POST /api/internal/automation/v1/jobs/[id]/lease`
- `POST /api/internal/automation/v1/jobs/[id]/start`
- `POST /api/internal/automation/v1/jobs/[id]/result`

These are signed server-to-server routes, not browser APIs. They reject query strings, public credentials, and unauthenticated access.

Packet 13 CRM routes: `/crm/automation`, `/crm/automation/approvals`, `/crm/automation/jobs`, `/crm/automation/jobs/[id]`, `/crm/automation/agents`, and `/crm/automation/settings`. Mutations are POST-only API routes for proposal, approval, rejection, cancellation, manual resolution, and safe policy activation.

## Implemented Packet 01 shells

| Route    | Rendering / behavior                                 | Status                |
| -------- | ---------------------------------------------------- | --------------------- |
| `/`      | Static server-rendered temporary shell with metadata | IMPLEMENTED_TEMPORARY |
| `/login` | Static placeholder; no auth form yet                 | IMPLEMENTED_TEMPORARY |
| `/crm`   | Server component redirects to `/login?next=/crm`     | STRUCTURALLY_GUARDED  |

Packet 07 owns real staff authentication/RBAC. Future public and CRM routes remain planned; Packets 02–05 are `DEFERRED_BY_USER`.
