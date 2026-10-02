# CRM Specification

## Packet 17 operational closure

CRM release evidence must include restored representative records, role-safe mutations, PII-bounded routes, and post-deploy smoke checks.

Packet 13 adds the server-first Automation workspace: overview, approvals, jobs/detail, agents, and OWNER settings. It presents policy reasons, DNC, proposed content, immutable approval/job history, dry-run status, and safe cancel/manual-resolution controls. Lead score is context and never communication permission.

Status: Packet 06 data foundation and runtime verification; UI, APIs, and staff authorization remain later packets.

The model supports organizations, people, opportunities, pipeline stages/history, tasks, notes, touchpoints, conversations/messages, campaigns/members, form submissions, and lead scores. Opportunities store `numeric(14,2)` value, currency, probability 0–100, stage, owner, and expected close date. Stage history preserves transitions. Tasks and notes use explicit subject and state constraints.

Runtime tests verify key constraints, case-insensitive people email uniqueness, idempotency, composite campaign membership, and deny-by-default access. No staff role can read or write these tables until Packet 07 defines and tests auth/RBAC policies.

## Packet 09 intake behavior

## Packet 10 delivered behavior

People and organizations are server-rendered, searchable, filterable, and paginated. Person detail groups overview, consent/DNC, identities, forms, opportunities, tasks, notes, conversations, messages, and provenance. Timeline rows are normalized and cursor-paged. Operators may edit safe fields, create notes, and set DNC; only ADMIN/OWNER may clear DNC, reject candidates, or merge. Merges are never automatic and require preview/confirmation semantics at the action boundary.

`/start-a-project` creates a new-stage opportunity, a follow-up task, an inbound touchpoint, and a deterministic intake score. `/contact` creates a person/touchpoint/task and no opportunity by default. Every accepted form is a processed `form_submissions` record with a schema version and idempotency key. DNC is respected as a marketing preference; transactional acknowledgement is still allowed.

## Packet 12 analytics

Active VIEWER/OPERATOR/ADMIN/OWNER staff can read `/crm/analytics`. Reporting distinguishes enquiries, people, and opportunities; tracked and all-lead funnels; first/latest/self-reported attribution; current snapshots and period outcomes; and pipeline/Won value from actual revenue. Pipeline and Won values are explicitly not labelled revenue. Exact formulas are versioned in `docs/METRICS_DICTIONARY.md`.

# Packet 16 social CRM

CRM conversations now have staff-authorized list/detail views with identity, DNC, consent, and inbound message context. Replies create Packet 13 proposals only. Unknown social identities remain unresolved or in the existing review workflow; they are never automatic new people.
