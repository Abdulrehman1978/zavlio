# Data Model

## Database Architecture & Verified Baseline

The database remains PostgreSQL/RLS-first across **52 public application tables** and 20 forward-only migrations, with RLS enabled on all 52 tables. Clean replay, generated types (zero drift), and 175 pgTAP assertions were fully verified in baseline CI runs (`38038752615` and `38055453341`) and verified locally.

## Migration Inventory & Authority

SQL migrations under `supabase/migrations` are authoritative. They run in timestamp order from `20260927060100_extensions_helpers.sql` through `20261001062000_social_ingestion_materialization.sql` (20 forward-only migrations); `supabase/seed.sql` contains only deterministic local defaults.

## Verified Table Catalog (52 Application Tables)

- **Staff & Content (12):** `staff_profiles`, `authors`, `testimonials`, `services`, `projects`, `project_media`, `lab_projects`, `insights`, `site_settings`, `navigation_items`, `footer_links`, `reusable_content_blocks`.
- **Identity & Telemetry (10):** `organizations`, `people`, `anonymous_visitors`, `sessions`, `identities`, `identity_match_candidates`, `consents`, `events`, `form_submissions`, `lead_scores`.
- **CRM Operations & Pipeline (7):** `pipeline_stages`, `opportunities`, `opportunity_stage_history`, `tasks`, `notes`, `touchpoints`, `person_merges`.
- **Intake & Outbox (1):** `email_outbox`.
- **Lead Scoring (1):** `lead_scoring_models`.
- **Engagement & Campaigns (4):** `conversations`, `messages`, `campaigns`, `campaign_members`.
- **Automation Control Plane & Bridge (11):** `automation_agents`, `automation_settings`, `automation_jobs`, `automation_runs`, `automation_actions`, `automation_nonces`, `automation_policy_versions`, `automation_policy_decisions`, `automation_approvals`, `automation_job_events`, `automation_machine_operations`.
- **Audit Logging (1):** `audit_logs` (append-only, immutable).
- **Social Integration & Ingestion (5):** `social_provider_settings`, `social_provider_observations`, `social_sync_cursors`, `social_canary_permits`, `social_identity_observations`.

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
