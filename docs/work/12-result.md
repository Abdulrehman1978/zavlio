# Packet 12 Result — CRM Analytics, Attribution, and Revenue Intelligence

## Scope

Implemented the trusted internal reporting layer for consented tracked traffic, acquisition, enquiries, canonical leads, current lead quality, pipeline outcomes/value, and operational workload. Packet 13 was not started.

## Reporting Architecture

`/crm/analytics` is a dynamic authenticated Server Component route. URL query state selects one of five report tabs and a validated date range. The server calls one coherent SQL aggregate RPC per tab and sends bounded typed aggregates to the presentation layer. Loading a report has no write side effect.

## Metric Definition Version

`METRICS_DEFINITION_VERSION = 1`. The authoritative formulas, populations, timestamps, attribution rules, denominators, null behavior, and limitations are in `docs/METRICS_DICTIONARY.md`.

## Date Range Model

Presets: last 7/30/90 days, this month, last month, this quarter, year to date, and custom. The default is 30 days; custom maximum is 730 days. SQL uses `[start, end)` boundaries. Rolling presets compare the immediately preceding equal-length range; calendar presets use the documented calendar comparison.

## Timezone Semantics

Storage is UTC. Business day display/bucketing and calendar boundaries use Asia/Kolkata. Date helpers convert business-local midnight to UTC. Boundary unit tests cover the +05:30 conversion.

## Period vs Snapshot Metrics

Sessions, events, enquiries, people created, opportunities created, task completions, and stage transitions are period metrics. Current scores, current stage distribution/value, and open/overdue/due-today/unassigned tasks are labelled current/now snapshots and do not pretend to reconstruct history.

## Consent Population Semantics

Tracked traffic contains only visitor IDs created after permitted first-party analytics. It is not total traffic and a visitor ID is browser-level, not guaranteed human-level identity. Non-consent/direct CRM leads remain in total business/CRM metrics and are excluded from tracked-funnel downstream numerators.

## Overview Dashboard

Overview displays tracked visitors/sessions, enquiries, new people, opportunities created, Won transitions, current open pipeline value, period Won opportunity value, overdue tasks now, tracked funnel, and an Asia/Kolkata daily trend with exact table.

## Tracked Traffic

Tracked visitors are distinct selected-period session visitor IDs. Tracked sessions use Packet 08 rows. Returning tracked visitors have any earlier session before a qualifying selected-period session, including sessions before the filter range. Tracked page views come only from `page_viewed` events.

## Acquisition

First-touch acquisition, latest tracked session source, and self-reported/intake source are independent tables. Missing person attribution is `unattributed`, not silently Direct. Reports are descriptive rather than causal.

## UTM Reporting

Sessions and distinct tracked visitors group by normalized UTM source, medium, and campaign. Missing components are explicitly `none`.

## Landing Pages

Selected-period sessions group by landing page with exact session and distinct visitor counts. Missing landing paths are `unknown`.

## Content Engagement

Consented service/project/lab/insight view events group by event and safe content identifier. No PII metadata is emitted.

## Enquiries

Successful processed `form_submissions` are authoritative. Start Project and Contact remain separate. Multiple enquiries by one person remain multiple business submissions.

## Lead Metrics

New leads are canonical, non-archived `people.created_at` rows. Merged source rows are excluded. People with opportunity uses distinct people, so multiple opportunities do not inflate person conversion.

## Lead Quality by Source

Period-acquired people group by first-touch fallback source. Rows show sample size, scored sample size, mean/median current score, HIGH+, PRIORITY, people with opportunity, and Won people. Unscored people are not averaged as zero.

## Score Distribution

Latest `ZAVLIO_LEAD_V1` per canonical person is grouped by current intent. Unscored and scores older than 24 hours are reported separately. Historical daily score interpolation is not implemented.

## Service Interest

Declared enquiry services and current primary affinity are separate tables because they are different populations and evidence types.

## Tracked Funnel

Selected-period tracked visitors → canonical new people linked to those visitors → distinct linked people with any opportunity → distinct linked people with any Won transition. A deliberate non-consent cohort is excluded downstream.

## CRM Funnel

All canonical people created in period → distinct people with any opportunity → distinct people with a Won opportunity transition. This funnel includes non-consent and direct business leads.

## Pipeline Reporting

The pipeline tab separates opportunities created, period outcome transitions, and current stage snapshot. A Won/Lost-then-reopened deal remains in historical transition counts but leaves the current closed-stage snapshot.

## Pipeline Value

Current open pipeline value sums non-null estimated values for current open opportunities, per currency. Known and unknown-value opportunity counts remain visible.

## Won Opportunity Value

Won opportunity value sums non-null current estimated values for opportunities entering Won in the period, grouped by currency and dated by stage transition.

## Revenue Limitation

Actual invoice, payment, recognized, booked, and collected revenue are not tracked. The UI never labels Won opportunity value as revenue.

## Stage Distribution

Current opportunity count and known/unknown value by current stage are snapshot metrics. Stage links continue to operational pipeline management rather than duplicating it.

## Stage Age

Median current stage age uses the latest transition into the current stage, falling back to opportunity creation.

## Opportunity Velocity

Median close duration is days from opportunity creation to a closed transition within the selected period.

## Win Rate

Closed win rate is `Won transitions / (Won transitions + Lost transitions)`. Open deals are excluded and no closed outcomes returns null/“—”. Golden evidence confirms 3 Won and 2 Lost would equal 60%, not 30%.

## Lost Reasons

Only Lost transitions contribute. Immutable stage-history metadata is primary, so a reopened loss retains its historical reason while current Lost count excludes the reopened opportunity.

## Task / SLA Reporting

Operations shows open, overdue, due today, unassigned, and period-completed tasks by assignee. It presents workload facts, not employee scoring. First-response/customer-contact time is omitted because reliable outbound evidence does not yet exist.

## Chart Architecture

Recharts 3.10.1 is exact-pinned and isolated to `analytics-chart.tsx`. SQL/querying and data shaping stay server-side. The dashboard is not a giant Client Component and Recharts is absent from public-route manifests.

## Accessibility

Charts include titles, descriptions, screen-reader labels, no delayed animation, empty states, and exact HTML tables. The 13-test Chromium suite reports zero axe violations on exercised analytics/CRM/public pages; 390×844 has no document-level overflow.

## Role Access

Active VIEWER, OPERATOR, ADMIN, and OWNER can read. Anon lacks EXECUTE. Authenticated nonstaff and inactive staff are denied in runtime and browser coverage.

## Database Views / Functions

No reporting views or tables were added. Six security-invoker functions were added: `assert_crm_analytics_range`, `crm_analytics_overview`, `crm_analytics_acquisition`, `crm_analytics_leads`, `crm_analytics_pipeline`, and `crm_analytics_operations`. Base tables remain authoritative; the service role is not required by production reporting.

## Migrations

One new migration: `20260928061500_crm_analytics_reporting.sql`. Repository total: 15 migrations. Public application tables remain 42; repository public views remain 4.

## Indexes

Six report-specific indexes were added: session start/visitor, processed form timestamp/type/person, canonical person creation, opportunity creation/stage, stage-history timestamp/stage/opportunity, and completed-task timestamp/assignee. Existing event-name/timestamp and score-model/person indexes are reused.

## Query Plans

`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` ran under an authenticated VIEWER context on the representative fixture. Execution: overview 57.830 ms / 20,798 shared-hit blocks; acquisition 39.484 ms / 3,815; lead quality 32.466 ms / 5,104; pipeline 25.577 ms / 2,767. Plans returned one aggregate result without spill. Stable active-staff RLS checks use scalar subqueries so authorization is evaluated once per statement without bypassing RLS.

## Golden Metric Fixture

Deterministic fixture: 10 tracked visitors, 12 sessions, 6 enquiries, 5 canonical people plus one merged source, 2 attributed people, 4 opportunities, 1 Won transition, 1 Lost transition, mixed INR/USD values, null value, reopen history, current/stale/unscored model coverage, and current/period tasks.

## Correctness Tests

The fixture proves consent population consistency, merged-person exclusion, enquiry/person distinction, multiple opportunities, historical reopen behavior, correct score model, null honesty, current/period separation, role denial, and zero report writes.

## Currency Handling

INR, USD, and future ISO currencies produce separate totals. No FX conversion or cross-currency sum exists. Null values count toward opportunity count and unknown-value coverage, never silently ₹0.

## Merge Handling

Merged archived people do not count as new/current people. Their surviving canonical relations remain reportable; opportunity rows remain separate deals.

## Consent/Unattributed Handling

The golden 10-visitor cohort has 2 tracked-attributed people while three additional non-consent/direct people appear only in total CRM metrics. Null attribution remains `unattributed`.

## Database Tests

`pnpm db:lint` passed. pgTAP passed 6 files / 81 assertions, including report functions, authenticated/anon grants, invoker rights, and indexes. Clean migration reset passed from zero.

## Unit Tests

Vitest passed 11 files / 44 tests. Packet 12 covers metric version, Asia/Kolkata boundaries, presets/custom limits, previous periods, zero denominators, currency grouping, source normalization, win/conversion/coverage formulas, bucketing, chart shaping, and Indian currency formatting.

## Integration Tests

Seven runtime harnesses passed with required configuration/isolation: Packet 07 auth, Packet 08 analytics, Packet 09 intake, Packet 09 SMTP failure, Packet 10 CRM, Packet 11 operations, and Packet 12 reporting. Exact golden output is recorded above.

## E2E Tests

Chromium passed 13 tests. Analytics coverage includes Overview, Acquisition, Leads, Pipeline, Operations, range switch, VIEWER, nonstaff denial, mobile, exact table, and axe.

## Performance Evidence

Disposable deterministic 30-day fixture: 1,000 tracked visitors, 2,000 sessions, 10,000 events, 250 people/scores, 200 enquiries, 150 opportunities, 50 stage-history rows, and 500 tasks. End-to-end local RPC timings: overview 62.6 ms, acquisition 39.4 ms, lead quality 30.8 ms, pipeline 23.0 ms, operations 17.1 ms. The fixture cleans to zero rows. This is local evidence, not a production SLO.

## Auth Regression

Packet 07 owner/admin/operator/viewer/nonstaff/inactive runtime passed; public signup remained denied and Mailpit was reachable. Hosted email/password-login verification remains external.

## Analytics Regression

Packet 08 consent gating, accept/reject, first/latest attribution, session timeout/reuse, dedupe, withdrawal, re-consent, and concurrency passed.

## Lead Intake Regression

Packet 09 intake passed no-consent intake, analytics linking, attribution, exact-person reuse, idempotency, concurrency, conflicts, honeypot, validation, and Mailpit. An isolated unreachable-SMTP run confirmed CRM commit with FAILED outbox jobs.

## CRM Regression

Packet 10 roles, candidate visibility, DNC, atomic merge/provenance/relation preservation/rollback/concurrency, timeline, and merged-person intake passed.

## Packet 11 Regression

Deterministic scoring/history/affinity, roles, stage history/Lost/Won/reopen/concurrency, task assignment/completion/reopen, and nonstaff denial passed.

## Build Result

Frozen install, Prettier, zero-warning ESLint, strict workspace typecheck, deterministic database types (SHA-256 `C7E1009B417C2651066A5BA8200D50685150174248BC7A813EA6670788F75FF9` on both generations), and production Next.js/Meta Bridge build passed. `/crm/analytics` is dynamic.

## Dependency Audit

`pnpm audit --audit-level high` reported no known vulnerabilities after exact-pinning Recharts 3.10.1.

## Secret Scan

No service-role secret, SMTP password, JWT test secret, local test credential, or synthetic email appears in browser/server application bundles. The Recharts chunk is referenced by the `/crm/analytics` client manifest only, not public routes.

## Known Limitations

Consent-scoped/browser-level analytics only; no actual revenue, FX conversion, spend/ROAS, causal attribution, historical daily score interpolation, or historical pipeline-value snapshots. Production volume is unknown. Hosted Auth email-login remains external.

## External Dependencies

Hosted Supabase Auth email/password login verification from Packet 07, production SMTP, production Turnstile, deployment, legal/privacy policy approval, and production telemetry remain external. None undermine local Packet 12 reporting correctness.

## Rollback Notes

Roll back the application and migration `20260928061500_crm_analytics_reporting.sql` together. The migration creates only functions/indexes and semantically equivalent optimized read policies; it adds no business table or stored aggregates. No destructive rollback was performed.

## Packet 13 Readiness

Packet 12 exposes trusted, read-only commercial and operational reporting. Packet 13 is the next backend packet, but no automation queue/policy/approval work was started.

## STATUS

**PASS** — metric definitions, consent/cohort integrity, currency/null/reopen/merge correctness, current-vs-period semantics, role security, numerical fixture, report performance/plans, accessibility, regressions, build, audit, and documentation are green.
