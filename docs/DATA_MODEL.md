# Data Model

## Database Architecture & Verified Baseline

The database remains PostgreSQL/RLS-first across 39 application tables and 20 forward-only migrations. Clean replay, generated types (zero drift), and 175 pgTAP assertions were fully verified in baseline CI run `38038752615` and verified locally.

## Packet 14

`automation_machine_operations` is an RLS-enabled infrastructure-only receipt table keyed uniquely by agent, operation type, and operation ID. It stores the request hash and immutable response for claim/lease/start/result retries, plus bounded expiry. Only expired receipts may be deleted by the service-role cleanup path.

`automation_agents` now records protocol/bridge version, DRY_RUN_ONLY mode, runtime instance, handshake time, bounded clock skew, and negotiated capabilities. `automation_jobs` records the machine instance and claim operation. `automation_nonces` remains the per-agent replay ledger and now has a cleanup index.

Status: Packet 08 schema/runtime foundation implemented; identity resolution and application workflows remain later packets.

## Source of truth and migrations

SQL migrations under `supabase/migrations` are authoritative. They run in timestamp order from `20260927060100_extensions_helpers.sql` through `20260927060900_rls_baseline.sql`; `supabase/seed.sql` contains only deterministic local defaults.

## Entities and relationships

- **Staff/content:** `staff_profiles`, `authors`, `testimonials`, `services`, `projects`, `project_media`, `lab_projects`, `insights`, `site_settings`, `navigation_items`, `footer_links`, `reusable_content_blocks`. Project media belongs to projects; insights may reference authors.
- **Identity/telemetry:** `organizations` → `people`; anonymous visitors remain unlinked in Packet 08; sessions belong to visitors; identities belong to people; consents belong to a person, visitor, or preference-only `consent_key`; events link visitors and sessions; submissions/linking remain later-packet concerns.
- **CRM:** opportunities belong to people and may reference organizations, stages, and staff owners; stage history belongs to opportunities; tasks and notes reference CRM subjects; touchpoints belong to people and may reference opportunities.
- **Engagement:** conversations belong to people; messages belong to conversations and people; campaigns have composite-key campaign membership rows for people.
- **Automation/audit:** agents own runs/nonces and may claim jobs; jobs may link people/opportunities; actions link jobs, runs, and people; audit logs retain actor/entity evidence.

## Types and constraints

All application primary keys are UUIDs with `gen_random_uuid()`. Business timestamps use UTC `timestamptz`; no business monetary value uses floating point. Opportunity values use `numeric(14,2)` and a three-letter currency CHECK. Email fields use `citext`; the partial unique index on `people.primary_email` makes `John@Example.com` and `john@example.com` equivalent. Provider identity pairs and idempotency keys are unique.

State fields use text plus explicit CHECK constraints: lifecycle, opportunity/job/task/campaign/message states, score 0–100, probability 0–100, non-negative amounts, and canonical non-self identity candidates. JSONB is reserved for external/evolving payloads, metadata, evidence, settings, and explanations—not relational identity or status.

## Delete behavior and history

Customer and compliance history uses `RESTRICT` where deletion would destroy meaning. Optional owners/actors use `SET NULL`. Dependent media/messages/membership/stage history use `CASCADE` only where the child has no independent meaning. Consents, events, submissions, identity candidates, stage history, touchpoints, actions, nonces, and audit logs are append-oriented/history records; mutable operational/content tables have `updated_at` triggers.

## Indexes and verification

Indexes cover lookup domains/emails/provider identities, visitor/session/event chronology, consent-key history, CRM owners/stages/due work, conversations/messages, campaign status, automation queue/leases, and audit entity chronology. Packet 08 adds `sessions.last_activity_at` and the security-definer `ensure_analytics_session` primitive, which atomically creates/reuses visitors and sessions and increments `session_count` only for a new session. Event UUIDs provide ingestion dedupe. Runtime evidence is in `docs/work/08-result.md`.

Packet 13 adds `automation_policy_versions`, `automation_policy_decisions`, `automation_approvals`, and `automation_job_events`; extends jobs/agents/actions with policy, integrity, lease, retry, capability, and execution fields; and adds security-invoker job/agent projections. Decisions, approvals, and job events are append-only. Jobs retain canonical person/opportunity references and are blocked rather than rebound after a merge.

## Packet 09 additions

## Packet 10 CRM operations

`people` now records `merged_into_person_id`, `merged_at`, and `merged_by`. `person_merges` is immutable merge provenance. `crm_people_projection` exposes bounded list/detail fields without exposing archived sources. `resolve_canonical_person_id`, `crm_person_timeline`, `record_crm_audit`, and `merge_people` are fixed-search-path functions with explicit grants. Supporting indexes cover lower-cased people/org/identity search and merge lookups.

Migration `20260927061200_lead_intake.sql` adds `form_submissions.schema_version`, processing/reference columns, `conflict_detected`, and the durable `email_outbox` queue. A partial unique index enforces one email identity per canonical address. `intake_lead_submission` is a service-role-only security-definer transaction boundary; public clients never receive direct table or RPC grants.

## Packet 11 additions

lead_scoring_models versions validated configuration and enforces one active model. lead_scores remains append-only history. crm_current_lead_score, crm_pipeline_projection, and crm_task_projection provide current bounded operational reads without N+1 queries. opportunities and tasks carry monotonic version fields; opportunity_stage_history remains append-only. Stable relational stage IDs and service keys are used for business logic.

## Packet 12 reporting objects

Migration `20260928061500_crm_analytics_reporting.sql` adds no business tables. `crm_analytics_overview`, `crm_analytics_acquisition`, `crm_analytics_leads`, `crm_analytics_pipeline`, and `crm_analytics_operations` are read-only aggregate functions over authoritative transactional tables. `assert_crm_analytics_range` enforces active staff and a 730-day maximum. Six report indexes support date/cohort access; current and period values are not persisted as duplicated facts.

# Packet 16 social data

Normalized social observations, provider settings, sync cursors, and one-use canary permits are added by migration 20261001061900_social_integration.sql. Existing conversations/messages are reused; person links may remain null while an identity is unresolved. Provider message IDs and bounded deterministic fallbacks provide dedupe. Raw DOM and credentials are not stored.
