# Packet 10 result — CRM people, organizations, unified timeline, identity review, and safe merge

## Scope

Implemented the production-oriented CRM slice after Packet 09: server-rendered people and organization workspaces, person detail, normalized timeline, identity review, DNC/notes mutations, and explicit safe merge. Packet 11 was not started.

## CRM Architecture

Next.js server pages use authenticated Supabase reads with RLS active. `crm_people_projection` and `crm_person_timeline` provide bounded typed read contracts. Mutations use role guards, safe field allowlists, audited RPCs, and the transactional `merge_people` function.

## Routes Added

`/crm`, `/crm/people`, `/crm/people/[id]`, `/crm/organizations`, `/crm/organizations/[id]`, and `/crm/settings/identity-review`, plus guarded API routes for person/org patches, DNC, notes, candidate reject, and candidate merge.

## Role Behavior

VIEWER can read CRM records and notes but cannot see identity review or staff settings. OPERATOR can view candidates, edit safe fields, create notes, and set DNC. ADMIN/OWNER can reject candidates, clear DNC with a reason, and merge people. Direct RLS and column grants backstop route checks.

## People List

Server-rendered bounded table with page-size 25, empty state, URL-preserved filters, and allowlisted sorting.

## Search

Search covers name/email, organization name/domain/website, and identity username/email/provider through bounded indexed ILIKE lookups.

## Filtering

Lifecycle, intent, source, organization, and DNC filters are sanitized and applied against the projection.

## Pagination

Offset pagination is bounded to pages 1–200. Timeline pagination uses `(occurred_at,id)` cursor semantics and a maximum 100-row RPC page.

## Person Detail

Detail renders overview, attribution, consent/DNC, identities, forms, opportunities, tasks, notes, conversations/messages, linked browser history, and automation placeholder sections.

## Overview

Primary email is displayed as provenance but is not a safe direct-edit field. Organization and owner links remain explicit.

## Timeline

Timeline categories cover website/session/event, enquiry, CRM, email/conversation, opportunity, task, consent, identity, and note activity.

## Timeline Query Architecture

One security-invoker SQL function unions normalized sources, filters by category, applies cursor ordering, and bounds output. The UI does not issue N+1 per-row reads or dump raw payloads.

## Website History

Sessions, events, and visitor linkage are shown as provenance-backed activity and remain subject to analytics/RLS policy.

## Forms / Enquiries

Existing Packet 09 form submissions are listed in person detail; merged identity intake remains linked to the canonical survivor.

## Identities

Identity rows show provider/username/email and candidate context. Candidate review is explicit and role-gated.

## Consent

Consent history is read-only in CRM detail.

## DNC

DNC is global suppression. Set requires OPERATOR+ and a reason; clear requires ADMIN/OWNER and a reason; both are audited.

## Notes

Internal notes are immutable after creation. OPERATOR/ADMIN/OWNER may create; VIEWER may read.

## Organizations

Organizations have bounded search/list/detail views with people and opportunity summaries. Safe organization mutation API fields are role-gated.

## Identity Review

VIEWER is denied. OPERATOR can inspect. ADMIN/OWNER can reject or merge with explicit target and optional reason.

## Person Merge Architecture

`merge_people(source,target,candidate,reason)` locks both canonical rows in deterministic order, validates candidate pairing, reparents dependent relations, merges conservative fields, marks the source archived, records `person_merges`, updates candidates, and audits the action.

## Merge Field Policy

DNC is ORed; lifecycle uses explicit precedence; attribution keeps existing first touch and newer latest touch; non-null target values win unless the target is empty. Primary email and merge provenance cannot be directly edited through authenticated column grants.

## Merge Transaction

All merge writes occur in one transaction. A forced-failure sentinel in the local harness proves rollback leaves both people and relations unchanged.

## Merge Concurrency

Concurrent source-to-two-target attempts have one winner; the losing transaction sees the archived/canonical state and fails safely.

## Canonical Resolution

`resolve_canonical_person_id` follows bounded merge pointers. Source detail redirects to the survivor, and Packet 09 intake resolves reparented identities to that survivor.

## RLS Changes

CRM reads use authenticated RLS. Candidate select is operator+, candidate writes are admin+, merge history is admin-visible, and direct people update grants exclude primary email and merge provenance.

## Database Migrations

One migration: `20260927061300_crm_operations.sql`.

## Database Tests

`pnpm db:lint` passed with no schema errors. `pnpm db:test` passed 46 checks across auth, foundation, analytics/lead intake, and CRM operations.

## Unit Tests

Vitest passed 9 files / 22 tests, including CRM validation contracts.

## Integration Tests

Packet 08 analytics, Packet 09 lead intake, and Packet 09 SMTP failure regressions passed from a clean reset.

## CRM Runtime Tests

`pnpm test:integration:crm` passed role matrix, candidate visibility, guarded DNC, merge atomicity/provenance, relation preservation, rollback, concurrency, timeline, and merged-person intake.

## E2E Tests

CRM Playwright Chromium passed 2 tests: ADMIN navigation and VIEWER navigation/visibility.

## Accessibility

axe reported zero violations on exercised People and Organizations pages for ADMIN and People page for VIEWER.

## Performance / Query Evidence

Representative local search over 1,000 synthetic people returned 25 rows in approximately 7.7 ms through the bounded projection query. This is a local sample, not a production SLO.

## Auth Regression

Packet 07 auth/RLS runtime matrix passed for owner/admin/operator/viewer/nonstaff/inactive users; public signup remains denied. Hosted email-login verification remains external.

## Analytics Regression

Packet 08 analytics runtime passed consent gating, attribution, session behavior, dedupe, withdrawal, re-consent, and concurrency.

## Lead Intake Regression

Packet 09 lead-intake and SMTP failure-path runtimes passed; merged source identity intake points to the canonical survivor.

## Build Result

Production Next build, workspace typecheck, lint, and format check passed.

## Dependency Audit

`pnpm audit --audit-level high` reported no known vulnerabilities.

## Secret/PII Scan

No committed application source or client bundle contains service-role credentials. Local Supabase generated `.temp` runtime secrets are environment artifacts and are not application source.

## Known Limitations

No full pipeline/task/conversation workspace, scoring dashboard, analytics dashboard, or automation controls. Notes are immutable and search is bounded ILIKE/page-offset rather than fuzzy/keyset search.

## External Dependencies

Hosted Auth email-login verification, production SMTP, and production Turnstile remain external/deployment concerns.

## Rollback Notes

Rollback is the normal migration rollback procedure for `20260927061300_crm_operations.sql`; no destructive rollback was performed.

## Packet 11 Readiness

Packet 10 is complete and documented. Stop here for user review; do not start Packet 11.

## STATUS

**PASS** — implementation, database, authorization, runtime, regression, browser/accessibility, build, dependency, and documentation gates are green.
