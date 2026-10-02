# Packet 11 Result

## Scope

Implemented production-oriented deterministic lead intelligence, service affinity, pipeline Kanban/table, opportunity workflow/history, tasks/SLA, role/RLS enforcement, runtime/browser tests, performance fixtures, and documentation. Packet 12 was not started.

## Scoring Architecture

packages/crm separates the pure scoring function from bounded Supabase extraction/persistence. Authenticated RLS supplies all CRM source reads. The service credential is confined to the validated persist_lead_score RPC.

## Model Version

Model ID ZAVLIO_LEAD; version 1; emitted model version ZAVLIO_LEAD_V1.

## Scoring Configuration

lead_scoring_models stores validated immutable key/version configuration, SHA-style configuration hash, activation metadata, and one-active-model uniqueness.

## Signal Extraction

Canonical-person events and sessions are bounded to 90 days and hard result limits; processed forms provide declared/commercial signals. Unknown service values are discarded.

## Signal Weights

Thirteen signals are authoritative in docs/LEAD_SCORING.md. Representative weights include project submission +40, contact submission +30, form started +20, service view +5, return session +8, budget +10, and high-value combination +10.

## Caps / Occurrence Rules

Once, per-session, distinct-entity, each-distinct-session, and hard component caps prevent refresh inflation. Completed project forms suppress opened/started funnel steps.

## Decay

Behavioral/engagement multipliers are 100%, 90%, 75%, 50%, 25%, and 0% at 0–7, 8–14, 15–30, 31–60, 61–90, and over 90 days.

## Lookback

90 days for behavioral events and sessions. Form-declared commercial intent persists without decay in V1.

## Intent Bands

LOW 0, INTERESTED 25, WARM 50, HIGH 70, PRIORITY 85. Range 0–100.

## Score Reasoning

Every result records exact signal, source IDs, occurrence, base/cap, decay factor, effective points, calculation time, and configuration hash.

## Score History

lead_scores is append-only for authenticated staff. Materially unchanged score/intent/model/affinity skips persistence; forced snapshots are server-only. Structural JSON comparison avoids jsonb key-order duplicates.

## Score Freshness

crm_current_lead_score exposes the latest snapshot and derives is_stale after 24 hours. Person page reads never recalculate.

## Recalculation Strategy

OPERATOR+ can recalculate one person through the person action/API. ADMIN/OWNER inherit that permission. The result remains deterministic for an explicit as-of time.

## Batch Recalculation

pnpm leads:recalculate supports person, stale, limit, batch-size, and dry-run options. The local 100-person no-persist batch completed in about 578.1 ms.

## Service Affinity

Nine stable keys are allowlisted. Combined values choose primary/secondary with alphabetical tie behavior.

## Declared vs Behavioral Interest

Declared and behavioral maps remain separately visible and are never collapsed into one unexplained label.

## Current Score Projection

crm_current_lead_score supplies one latest score without N+1 queries and feeds people/pipeline projections.

## People CRM Integration

Person detail shows score, intent, model, time, primary/secondary affinity, reasons, and prior delta. The tested fixture returned 66 WARM with web primary and ai_automation secondary; the runtime fixture returned 84 HIGH.

## Pipeline Architecture

crm_pipeline_projection joins opportunity, stable stage, canonical person, organization, owner, current score, affinity, DNC, and next task. Filters and pagination are bounded.

## Kanban

/crm/pipeline defaults to keyboard-readable Kanban and offers table mode. Mobile stacks columns.

## Pipeline Table

The table uses the same projection and filters. Narrow screens switch to stacked rows; wide screens retain contained horizontal table behavior.

## Opportunity Detail

/crm/opportunities/[id] shows value, score, affinity, owner, stage, DNC, history, and linked tasks.

## Opportunity Editing

update_opportunity validates fields/owner, locks the row, checks expected updated_at, increments version, and audits before/after.

## Stage Transition Rules

transition_opportunity_stage atomically locks, checks concurrency/role/target, updates, appends history/audit, and returns the new row.

## Lost Rules

Lost requires an allowlisted reason. OTHER also requires text. Runtime and browser tests prove missing reason denial.

## Won Rules

Won advances the linked person to CLIENT unless already CLIENT, RETURNING_CLIENT, or ARCHIVED.

## Reopen Rules

Only ADMIN/OWNER can reopen a closed stage. Runtime proves OPERATOR denial and ADMIN success.

## Stage History

Every actual transition appends opportunity_stage_history with actor, from/to, reason, metadata, and timestamp.

## Stage Concurrency

Two simultaneous transitions using the same updated_at yield one winner and one serialization conflict; no silent overwrite occurs.

## Task Architecture

crm_task_projection supplies person/opportunity/assignee and server-derived overdue state. /crm/tasks supplies bounded workload scopes.

## Task Assignment

Assignee must be an active OWNER, ADMIN, or OPERATOR. Inactive and VIEWER assignment is denied.

## Task Status

OPEN, IN_PROGRESS, COMPLETED, CANCELLED. Completion sets completed_at; reopen clears it.

## Task SLA / Overdue

Active task plus due_at earlier than server UTC is overdue. Times store UTC and display in Asia/Kolkata.

## Task Audit

Create/update/complete/cancel/reopen events write audit rows from transactional RPCs.

## Role Matrix

VIEWER is read-only. OPERATOR can recalculate one score and run normal opportunity/task operations. ADMIN/OWNER add closed-opportunity reopen and scoring configuration visibility.

## RLS Changes

Added security-invoker current score/pipeline/task projections, admin model read policy, safe column grants, and revoked authenticated score/task direct writes. Elevated functions re-check role internally.

## Database Migrations

One new migration, 20260927061400_lead_intelligence_operations.sql. Repository total: 14 migrations. Local public application tables: 42.

## Database Tests

Clean reset passed. SQL lint passed after removing its only unused-variable warning. pgTAP passed 5 files / 64 assertions.

## Unit Tests

Vitest passed 10 files / 31 tests, including nine scoring cases for caps, suppression, decay, lookback, thresholds, affinity, ties, determinism, and config validation.

## Integration Tests

Six local runtime harnesses cover auth, analytics, lead intake success/failure, CRM, and Packet 11 operations.

## Scoring Runtime Tests

Exact 84 HIGH result, web/ai_automation affinity, unchanged-history skip, and coexistence of PACKET_09_INTAKE_V1 with ZAVLIO_LEAD_V1 passed.

## Pipeline Runtime Tests

Role denial, transitions, history, Lost reason, Won lifecycle, reopen authorization, and concurrent transition protection passed.

## Task Runtime Tests

Inactive assignment denial, VIEWER denial, create, complete, reopen/cleared completion time, and nonstaff projection denial passed.

## E2E Tests

Chromium suite contains 10 tests: existing public/analytics/intake/CRM coverage plus four Packet 11 operator/admin/viewer/mobile workflows.

## Accessibility

axe reported zero violations on exercised Pipeline, Opportunity, Tasks, Person score details, and prior CRM/public routes. Stage and task controls use labels, selects, buttons, and keyboard-native forms.

## Performance Evidence

Disposable local dataset: 1,000 people, 1,000 opportunities, 2,000 tasks, 100 scoring people, 1,000 events. Approximate local timings: people projection 6.5 ms; pipeline 8.1 ms; stage filter 8.3 ms; task projection 5.5 ms; single score 28.1 ms; 100-person score batch 578.1 ms. These are local evidence, not production SLOs.

## Auth Regression

Packet 07 role/nonstaff/inactive/invite-only runtime remains required and green; hosted email-login verification remains its documented external dependency.

## Analytics Regression

Packet 08 consent/session/attribution/dedupe/withdrawal runtime remains required and green.

## Lead Intake Regression

Packet 09 success/idempotency/concurrency/Mailpit and email-failure outbox behavior remain required and green. Packet 09 score history is explicitly preserved beside Packet 11 history.

## CRM Regression

Packet 10 role, DNC, merge atomicity/rollback/concurrency, canonical timeline, and merged-person intake runtime remains required and green.

## Build Result

Strict workspace typecheck, zero-warning lint, format check, frozen install, and production Next.js/Meta Bridge build pass.

## Dependency Audit

High/critical dependency audit reports no known vulnerabilities.

## Secret Scan

No production credentials or service keys are committed. Local Supabase test keys and synthetic fixture credentials are runtime-only/test data.

## Known Limitations

No hosted scoring scheduler/queue, negative signals, writable model editor, drag/drop, fuzzy search, conversation workspace, analytics dashboard, or automation UI. See docs/KNOWN_LIMITATIONS.md.

## External Dependencies

Hosted Supabase Auth email-login, production SMTP, production Turnstile, deployment, legal policy, and observability remain external. None undermine local Packet 11 correctness.

## Rollback Notes

Rollback uses the normal database/application deployment rollback for the single Packet 11 migration and related application code. No destructive rollback was performed. Score history/model rows should be exported before any production rollback.

## Packet 12 Readiness

Packet 11 exposes stable score/pipeline/task projections suitable for later analytics UI. Packet 12 is next but was not started.

## STATUS

PASS — deterministic/versioned scoring, explainability, anti-inflation, decay, history, affinity, pipeline transactions/concurrency, task operations/SLA, roles/RLS, performance, browser/accessibility, build, and regressions are green.
