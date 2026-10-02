# Implementation Plan

Date: 2026-09-27  
Planning basis: `MASTER_SPEC.md` Version 2.0  
Status: Packet 00 approved; Packet 01 implemented; backend-first resequencing approved

## Goal and success criteria

Deliver the five-layer Zavlio platform defined in the master specification without diluting the approved public design or weakening privacy, consent, authorization, auditability, and automation safety. “Done” means every applicable release gate has recorded evidence; compilation alone never qualifies.

## Current architecture

There is no application architecture yet. The workspace began empty and unversioned. The master specification and Packet 00 documents are the only project artifacts.

## Target architecture

Use a pnpm modular monolith with one deployable Next.js App Router application under `apps/web`, focused packages under `packages/*`, SQL migrations and RLS under `supabase`, and an independently runnable `services/meta-bridge`. Keep the pinned third-party automation runtime isolated under `external/meta-automation` as a submodule, fork, or auditable vendor snapshot. PostgreSQL/Supabase is the durable source of truth; the bridge and automation agent are execution clients only.

Primary boundaries:

- Public web: server-rendered/crawlable content, selectively enhanced motion/3D, server-validated forms.
- Server application: authz, content reads/writes, event intake, identity resolution, CRM workflows, policy evaluation, internal signed automation API.
- PostgreSQL: relational truth, RLS, transactional job claims, append-only histories, audit records.
- Browser client: presentation, consent-aware event buffering, unprivileged Supabase access only where explicitly safe.
- Meta Bridge: outbound machine-authenticated polling/claim/result loop; no public CDP exposure.

## Migration strategy

This is greenfield, so there is no legacy data or code migration. Use additive, ordered SQL migrations from the first schema; seed only controlled demo/staging data. Establish migration validation and generated types before feature tables grow. Any later import must be designed as a separate idempotent, dry-run-capable migration with reconciliation reports and rollback notes.

## Preserve / replace decisions

- Preserve verbatim: master specification and its source-of-truth order.
- Preserve when supplied: approved Stitch design, design-system export, media, claims status, and Meta Automation revision.
- Replace nothing yet: no existing implementation was found.
- Do not recreate missing approved visuals from assumptions. Use documented temporary structural placeholders only in controlled development if review explicitly permits.
- Prefer adapters around Supabase, email, Turnstile, observability, and Meta Automation to limit vendor coupling.

## Design implementation strategy

Inventory the Stitch export and assets first; translate approved values into CSS variables and Zavlio-owned primitives. Build typography, grid, spacing, media, header/footer, focus, reduced-motion, and responsive foundations before pages. Keep public geometry editorial (mostly 0–4px radii) and CRM density operational. Implement expensive motion/Three.js behind route-level dynamic imports and capability/reduced-motion fallbacks. Establish desktop and mobile visual baselines before backend packets can regress the UI.

## Database plan

Create migration groups in dependency order: extensions/enums and staff profiles; content; visitors/sessions/events/consents/forms; organizations/people/identities/candidates; scoring and affinity; pipeline/tasks/notes; conversations/messages/touchpoints; campaigns; automation jobs/runs/actions/agents/nonces/settings; audit and retention support. Use UUIDs, UTC timestamps, constraints, explicit foreign-key behavior, partial/composite indexes, append-only histories where specified, and transactional functions for multi-write workflows and atomic job claims.

## RLS plan

Enable RLS explicitly on every exposed table. Public users must never read CRM tables directly; public form/event intake goes through validated, rate-limited server endpoints. Map authenticated users to active `staff_profiles`, enforce OWNER/ADMIN/OPERATOR/VIEWER capabilities both server-side and through database policies, and reserve service-role usage for narrow server-only modules. Maintain an RLS matrix in `SECURITY.md` and test anonymous, each staff role, disabled staff, cross-record writes, and service paths.

## CRM plan

Build auth and authorization before CRM screens. Implement people and organizations with unified timelines, identities and candidate review, notes, consent and DNC; then opportunities, stage history, tasks, configurable scoring/decay and service affinity; then dashboard, conversations, campaigns, content, audit, and settings. Every important mutation must validate input, authorize on the server, execute transactionally, and emit an audit/timeline record.

## Analytics plan

Issue a cryptographically random first-party `zv_vid` with no embedded PII; create configurable sessions; capture first/last attribution without overwriting first touch. Buffer noncritical client events, validate/batch/deduplicate server-side, and persist critical form events immediately. Bind tracking to consent state and store a consent snapshot. Publish definitions that distinguish visitor IDs, sessions, people, and cross-device limitations.

## Identity resolution plan

Keep anonymous visitors separate until evidence exists. Auto-link only deterministic trusted identifiers (verified email, authenticated account, trusted unique external identifier, or approved explicit link). Put medium-confidence matches into `identity_match_candidates`; never auto-merge low-confidence similarities. Provide duplicate review and merge preview; merge transactionally while preserving all related history and creating a complete audit record.

## Automation plan

Implement policy and data model before execution: modes, DNC/consent/cooldown/frequency/duplicate/pending-response checks, approval defaults, explicit failure states, and immutable evidence. Claim jobs atomically with lease/retry semantics and idempotency keys. Staff can approve, edit-and-approve, reject, cancel, or retry within capability rules. Security checkpoints always pause for humans.

## Meta Automation integration plan

Require an approved upstream URL and commit SHA. Record ownership, license, branch, update process, local patches, and compatibility. Wrap upstream through an adapter that translates scoped CRM jobs into objectives and normalizes verified results. The local bridge authenticates with HMAC SHA-256 over method, route, timestamp, nonce, and body hash; the server rejects stale/replayed/invalid/disabled-agent calls. Validate in dry-run before controlled approval-required execution. Never expose CDP or social credentials publicly.

## Security plan

Introduce typed environment validation and server-only secret modules in Packet 01. Add least-privilege RLS/RBAC, safe request IDs and structured logs, CSP and browser headers, validation, idempotency, rate limits, honeypots/Turnstile, HMAC replay defense, dependency/code scanning, audit logs, and secret rotation procedures. Threat-model public intake, privileged CRM mutations, identity merge, content publishing, and automation before production rehearsal.

## Privacy plan

Build consent state as operational data, not a banner-only UI. Implement append-only consent history, DNC enforcement, data export/correction/withdrawal, and deletion or anonymization workflows that respect required audit/business records. Configure retention only after policy approval; default to no automatic hard deletion of critical records. Obtain legal review for policies, consent language, lawful bases, retention, and outreach rules.

## SEO plan

Use server-rendered content, Metadata API, canonical rules, sitemap/robots, breadcrumbs, Open Graph assets, and only truthful Organization/Article/Service structured data. Enforce published/visible/claim status in production and prevent demo claims from leaking. Validate crawl output and schema in staging.

## Accessibility plan

Target WCAG 2.2 AA from primitives onward: semantic structure, skip links, keyboard and focus behavior, touch sizes, form labels/errors, live status, contrast, modal focus management, media controls, reduced-motion and non-WebGL semantic fallbacks. Run automated axe checks plus keyboard, screen-reader-oriented, zoom, and responsive manual reviews on critical journeys.

## Performance plan

Set route budgets and collect Lighthouse/Web Vitals evidence. Default to React Server Components and minimal client boundaries. Optimize fonts and responsive media, lazy-load video, and isolate Three.js/GSAP/CRM charts by route. Use poster/static fallbacks and measure at the required viewports. Gate launch on p75 targets when representative field data exists; use lab evidence until then and label it correctly.

## Test plan

- Unit: validation, scoring/decay/affinity, identity rules, consent/DNC, claims, transitions, HMAC/replay, automation eligibility.
- Database/integration: migrations, constraints, RLS matrix, event/session flows, form-to-person/opportunity, attribution, merges, atomic claims, result-to-timeline.
- Component: accessible design primitives, forms, tables, dialogs, consent, approval states.
- E2E: public navigation/content/forms/cookies; staff login and CRM flows; opportunity movement; automation approval/failure; logout.
- Nonfunctional: axe, visual regression, responsive matrix, performance/bundle budgets, security audit, claim guard, backup/restore rehearsal.

Every packet records commands, results, manual checks, and limitations.

## Deployment plan

Use separate LOCAL, STAGING, and PRODUCTION Supabase/configuration. Vercel is the preferred web target, subject to account confirmation; the Meta Bridge runs only on an approved private host. Establish preview/staging deployment, migration promotion, seed restrictions, test-recipient email override, disabled/dry-run automation, observability, and health checks before production. Production promotion requires reviewed claims, real policies, backup evidence, and explicit automation policy.

## Rollback plan

Keep deploys immutable and retain the prior known-good web release. Favor backward-compatible expand/migrate/contract database changes; each migration documents rollback feasibility and data consequences. Stop/disable automation independently, revoke or rotate agent secrets, and retain idempotent job state. Test database restore and storage recovery in staging. Never promise down-migration safety for destructive changes without rehearsal.

## External dependencies

| Dependency                         | Needed by            | Required evidence/input                                         |
| ---------------------------------- | -------------------- | --------------------------------------------------------------- |
| Approved Stitch/design export      | Packet 02            | Latest files, responsive states, approval reference             |
| Brand and media assets             | Packets 02–05        | Source, license, dimensions, variants, production status        |
| Verified content/claims/legal text | Packets 03–04, 17–20 | Owner approval and claim classification                         |
| Git hosting and repository policy  | Packet 01            | Remote, access, default branch/protection policy                |
| Supabase projects                  | Packets 06+          | Local/staging/production refs and securely provided credentials |
| Zoho SMTP                          | Packet 09+           | Host/port/account secret, sender verification, test recipient   |
| Turnstile                          | Packet 09/17         | Site/secret keys and domains                                    |
| Vercel/domain/DNS                  | Packets 18–20        | Project/team access, domain ownership, environment policy       |
| Observability provider             | Packet 01/18+        | Provider/project, DSN/token handling, retention policy          |
| Meta Automation source             | Packet 15            | Approved upstream URL, license, exact commit SHA                |
| Agent/browser/social accounts      | Packets 14–19        | Approved host, accounts, CDP configuration, test policy         |
| Business/legal policy decisions    | Packets 13/17+       | Consent, retention, outreach limits, autonomy, DNC exceptions   |

## Dependency and critical path

`00 review → 01 foundation → 02 design system → 03–05 public experience` and `01 → 06 database → 07 auth → 08–13 data/CRM/queue → 14–16 automation`; both paths converge at `17 security/privacy → 18 quality → 19 rehearsal → 20 handoff`.

Packet 02 is blocked by approved design inputs. Packet 15 is blocked by the pinned upstream revision. Packet 19 is blocked by all external environments and credentials.

## Exact work packet sequence

| Packet                               | Outcome and evidence gate                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 00 Audit                             | Audit, plan, registers, skeleton, packet result; review required                                                               |
| 01 Repository foundation             | pnpm workspace, pinned runtime/dependencies, strict TS, lint/format, env validation, CI and test harness all run               |
| 02 Design system                     | Approved tokens/primitives/layout/media/motion foundations; responsive and accessibility baselines                             |
| 03 Homepage                          | Required homepage flow, real/demo-content guard, responsive checks and visual evidence                                         |
| 04 Public routes                     | All required public/legal/error routes, content architecture, metadata, functional navigation/forms shell                      |
| 05 Premium motion / 3D               | Selective scenes/transitions, reduced-motion/mobile/WebGL/poster fallbacks, bundle/performance evidence                        |
| 06 Database                          | Supabase migrations, RLS skeleton, generated types, seeds and database tests from a fresh database                             |
| 07 Auth                              | Invite-only auth, staff roles, protected CRM and role/RLS negative tests                                                       |
| 08 Analytics                         | Visitor/session/event/attribution system with consent-aware batching, validation and integration tests                         |
| 09 Forms / identity                  | Idempotent Start Project/contact workflows through person resolution, scoring, opportunity/task and email adapters             |
| 10 CRM people                        | People/organization UI, unified timeline, identities/candidates, merge, notes, consent and DNC evidence                        |
| 11 Pipeline                          | Opportunity Kanban/table, transactional stage history, tasks, scoring/decay/affinity tests                                     |
| 12 Analytics dashboard               | Defined metrics for traffic/leads/source/conversion/pipeline with truthful terminology                                         |
| 13 Automation queue                  | Jobs, atomic claim function, approvals, policy settings, agent status, failure/manual states and tests                         |
| 14 Meta Bridge                       | Signed heartbeat/poll/claim/result/retry client; nonce/timestamp/idempotency and simulated integration evidence                |
| 15 Meta Automation adapter           | Pinned upstream, adapter/translation, dry-run, controlled execution and verification; external gap stated if untestable        |
| 16 Social lead ingestion             | Deduplicated inbound social identity/touchpoint/scoring/review/opportunity flow                                                |
| 17 Security / privacy                | Threat/RLS audit, headers/rates/Turnstile, export/withdrawal/deletion/DNC and policy documentation                             |
| 18 SEO / performance / accessibility | Schema/crawl checks, optimized assets/bundles, WCAG review and required viewport evidence                                      |
| 19 Production rehearsal              | Fresh staging migrations/seed/build/deploy, full flows, automation dry-run/manual state, backup/restore and rollback rehearsal |
| 20 Final handoff                     | Final operational/admin/CRM/automation guides, architecture/DB/route/test evidence, limitations and signed release checklist   |

## Estimation and review model

Each packet should be decomposed at its start into 2–8 hour tasks with single-owner done criteria. Estimates are intentionally deferred until approved designs, content volume, integration access, and staffing are known; presenting a calendar now would be false precision. Apply a 20–30% contingency after dependency discovery and include explicit review/QA time.

## Risks

The primary risks are missing approved design/media, unverified production claims, underestimated relational/RLS complexity, privacy/outreach policy ambiguity, third-party UI volatility, automation account restriction, identity false merges, heavy-media performance, and lack of staging/restore access. Detailed mitigations and owners are maintained in `RISKS.md`.

## Approved backend-first resequencing

The user has deferred Packets 02–05 without cancelling them. Continue only after packet review in this order: `06 Database → 07 Auth/RBAC → 08 Analytics → 09 Forms/Identity → 10 CRM People → 11 Pipeline/Scoring → 12 CRM Analytics → 13 Automation Queue → 14 Meta Bridge → 15 Meta Adapter → 16 Social Lead Ingestion → 17 Security/Privacy`. Stop for review, then return to `02 → 03 → 04 → 05 → 18 → 19 → 20` when the user reopens the visual branch.

## Approval checkpoint

Packet 00 was approved and Packet 01 is complete. Stop after Packet 01 for review. Packet 06 is the next eligible backend packet; do not begin it automatically. Do not start visual implementation until the user explicitly resumes that branch.
