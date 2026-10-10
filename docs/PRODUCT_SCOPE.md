# Product Scope & Specification Reconciliation

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Baseline Specification**: `MASTER_SPEC.md` Version 2.0  
**Current State**: Final Pre-Deployment Engineering Closure (Packets 00–20 Pre-Handoff)  
**Status**: Authoritative

---

## 1. Scope Classification Framework

Every requirement from `MASTER_SPEC.md` is classified into one of five definitive states:

1. **SHIPPED**: Fully engineered, locally verified with automated test suites, accessible via UI and API, backed by database schemas and RLS policies.
2. **DEFERRED**: Intentionally postponed by documented product decision; optional future capabilities that are not required for launch.
3. **UNSUPPORTED**: Deliberately excluded by architecture policy (e.g., Instagram integration, autonomous mass DMing, CAPTCHA bypass).
4. **EXTERNAL_DEPENDENCY**: Requires real third-party provider accounts, DNS propagation, cloud hosting, or qualified legal/business review that cannot be fabricated by local code.
5. **READY_FOR_STAGING**: Offline rehearsal artifacts and configuration verified; awaiting hosted cloud environment deployment.

---

## 2. Comprehensive Requirements Matrix

### A. Public Website & Brand Experience

| Requirement                    | Spec Source |   Status    | Implementation Details & Evidence                                                                                                |
| :----------------------------- | :---------- | :---------: | :------------------------------------------------------------------------------------------------------------------------------- |
| **Warm Ivory Art Direction**   | V2 §2.1     | **SHIPPED** | `#FBF9F4` base, `#171614` ink, `#9E5D2A` accent, typography (`Instrument Serif`, `Inter`). Verified in `docs/work/02-result.md`. |
| **27 Public Routes**           | V2 §2.2     | **SHIPPED** | Static SSG compilation, metadataBase, canonical URLs on all 27 routes. Verified in `docs/work/18-result.md`.                     |
| **Kinetic Spatial Visual**     | V2 §2.3     | **SHIPPED** | Parametric canvas animation with `IntersectionObserver` pause and `prefers-reduced-motion` safety.                               |
| **Operating Cycle (7 Stages)** | V2 §2.4     | **SHIPPED** | Interactive 7-stage architectural timeline (`/` and `/services`). Verified in `docs/work/05R1-acceptance.md`.                    |
| **Original Vector Schematics** | V2 §2.5     | **SHIPPED** | 20+ custom responsive SVG schematics; zero stock photography or fake client deliverables. Cataloged in `docs/ASSET_REGISTER.md`. |
| **Honest Portfolio Labels**    | V2 §2.6     | **SHIPPED** | Tagged `STUDIO_CASE`, `REFERENCE_IMPLEMENTATION`, `EXPERIMENTAL_BENCHMARK`. Verified in `docs/CLAIMS_REGISTER.md`.               |
| **Multi-Step Project Intake**  | V2 §2.7     | **SHIPPED** | 4-step progressive disclosure form (`/start-a-project`) with honeypot and Turnstile integration.                                 |
| **Direct Contact Form**        | V2 §2.8     | **SHIPPED** | Accessible form (`/contact`) with validation and consent checkboxes.                                                             |
| **Cookie Preference Manager**  | V2 §2.9     | **SHIPPED** | Banner and dedicated `/cookies` route reading/writing first-party `zv_consent` cookie with GPC honor.                            |

### B. Core CRM & Customer Intelligence

| Requirement                       | Spec Source |   Status    | Implementation Details & Evidence                                                                                   |
| :-------------------------------- | :---------- | :---------: | :------------------------------------------------------------------------------------------------------------------ |
| **People Management**             | V2 §3.1     | **SHIPPED** | Searchable directory, pagination (25/page), person detail, timeline cursor function, RLS protection.                |
| **Organizations Directory**       | V2 §3.2     | **SHIPPED** | Organization entity, domain matching, associated contacts list.                                                     |
| **Canonical Identity Resolution** | V2 §3.3     | **SHIPPED** | Exact-email deterministic matching; `merge_people` security-definer RPC with row locking and audit history.         |
| **Pipeline & Opportunities**      | V2 §3.4     | **SHIPPED** | Accessible stage selector, monetary formatting (`numeric(14,2)`), optimistic concurrency preconditions.             |
| **Task Management**               | V2 §3.5     | **SHIPPED** | Subject-bound tasks, overdue filters, status transitions.                                                           |
| **Conversations & Messages**      | V2 §3.6     | **SHIPPED** | Multi-channel thread viewer, dry-run reply composer, no live unauthenticated external sends.                        |
| **Executive Reports & Analytics** | V2 §3.7     | **SHIPPED** | 5 security-invoker RPCs (`overview`, `acquisition`, `leads`, `pipeline`, `operations`) with Recharts visualization. |
| **Staff Administration**          | V2 §3.8     | **SHIPPED** | Invite-only workflow, role matrix (VIEWER, OPERATOR, ADMIN, OWNER), final-owner protection trigger.                 |

### C. Content Management Workspace (`/crm/content`)

| Requirement                 | Spec Source |   Status    | Implementation Details & Evidence                                                                                                                                                              |
| :-------------------------- | :---------- | :---------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content Lifecycle**       | V2 §4.1     | **SHIPPED** | `draft`, `published`, `archived` states across services, projects, lab, and insights. Backed by `packages/db`.                                                                                 |
| **Zero Draft Leakage**      | V2 §4.2     | **SHIPPED** | `apps/web/src/lib/content-resolver.ts` strictly filters for `published` items; unseeded public routes fall back gracefully to verified static content. Tested in `tests/unit/content.test.ts`. |
| **Slug & Claim Validation** | V2 §4.3     | **SHIPPED** | Unique slug constraints, metadata validation, claim status tagging (`STUDIO_CASE`, etc.).                                                                                                      |
| **Content RBAC**            | V2 §4.4     | **SHIPPED** | VIEWER read-only; OPERATOR can draft; ADMIN/OWNER can publish or archive. Enforced via RLS and server checks.                                                                                  |

### D. Campaigns Workspace (`/crm/campaigns`)

| Requirement                   | Spec Source |     Status      | Implementation Details & Evidence                                                                                           |
| :---------------------------- | :---------- | :-------------: | :-------------------------------------------------------------------------------------------------------------------------- |
| **Campaign Planning**         | V2 §5.1     |   **SHIPPED**   | Manual campaign creation, date windows, objectives, status tracking (`DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`). |
| **Audience Membership**       | V2 §5.2     |   **SHIPPED**   | Manual member addition with duplicate prevention and merged person canonical resolution.                                    |
| **DNC & Consent Suppression** | V2 §5.3     |   **SHIPPED**   | Persons with `do_not_contact: true` marked as `EXCLUDED`; red badge displayed. Tested in `tests/unit/campaigns.test.ts`.    |
| **Mass Outreach / Auto-DM**   | V2 §5.4     | **UNSUPPORTED** | Zero autonomous mass emailing or bulk social outreach. Strictly manual planning workspace only.                             |

### E. Consent, Subject Rights & Audit (`/crm/consent`, `/crm/audit`)

| Requirement                    | Spec Source |   Status    | Implementation Details & Evidence                                                                                                                             |
| :----------------------------- | :---------- | :---------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Consent Ledger**             | V2 §6.1     | **SHIPPED** | Searchable consent timeline by purpose, channel, and consent key. Separate DNC toggle.                                                                        |
| **Personal Data Export (DSR)** | V2 §6.2     | **SHIPPED** | Bounded JSON export of person, events, consent, and tasks; sensitive credentials and machine tokens redacted. Tested in `tests/unit/consent-privacy.test.ts`. |
| **Anonymization / Deletion**   | V2 §6.3     | **SHIPPED** | Dry-run preview mapping records (`DRY_RUN_PREVIEW_ONLY`); destructive delete held in `PENDING_POLICY_APPROVAL`.                                               |
| **Data Retention Engine**      | V2 §6.4     | **SHIPPED** | Configurable retention category matrix in `docs/DATA_RETENTION.md`; destructive jobs require owner legal approval.                                            |
| **Audit Log Explorer**         | V2 §6.5     | **SHIPPED** | Secured viewer for `audit_logs` table; time, actor, action, and entity filters. Tested in `tests/unit/audit.test.ts`.                                         |
| **Audit Payload Redaction**    | V2 §6.6     | **SHIPPED** | Recursive masking of passwords, tokens, secrets, cookies, and API keys.                                                                                       |

### F. Operations, Workers & Readiness

| Requirement                       | Spec Source |     Status      | Implementation Details & Evidence                                                                                                                                                                     |
| :-------------------------------- | :---------- | :-------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Durable Email Outbox**          | V2 §7.1     |   **SHIPPED**   | `scripts/email-outbox-worker.mjs` with linear backoff (max 5 retries), idempotent claims, and status transitions. Tested in `tests/unit/outbox-worker.test.ts`.                                       |
| **Lead Scoring Scheduler**        | V2 §7.2     |   **SHIPPED**   | Batch CLI runner `scripts/recalculate-leads.mjs` with lease check and decay calculation.                                                                                                              |
| **Abuse Protection / Rate Limit** | V2 §7.3     |   **SHIPPED**   | Memory sliding-window adapter with deterministic IP salting; tested in `tests/unit/rate-limiter.test.ts`. Redis adapter template documented for multi-instance production.                            |
| **Security Headers & CSP**        | V2 §7.4     |   **SHIPPED**   | CSP report-only and strict HSTS headers configured in `apps/web/next.config.ts`.                                                                                                                      |
| **Meta Automation Bridge**        | V2 §7.5     |   **SHIPPED**   | Pinned upstream adapter (SHA `439c3bfaac...`, tree `e4f412b...`) with dry-run semantic primitives, target proof, and signed HMAC protocol. Live execution disabled (`LIVE_EXTERNAL_EXECUTION=false`). |
| **Instagram Integration**         | V2 §7.6     | **UNSUPPORTED** | Explicitly excluded by architectural policy; zero Instagram API or scraper code.                                                                                                                      |

### G. External Dependencies & Deployment (Owner Prerequisites)

| Item                               |         Status          | Action Required                                                                      |
| :--------------------------------- | :---------------------: | :----------------------------------------------------------------------------------- |
| **Hosted Supabase Project**        | **EXTERNAL_DEPENDENCY** | Provision staging/production Supabase databases; apply forward migrations via CLI.   |
| **Domain & DNS (`zavlio.online`)** | **EXTERNAL_DEPENDENCY** | Configure DNS A/CNAME records and Cloudflare SSL/TLS edge.                           |
| **Production Transactional SMTP**  | **EXTERNAL_DEPENDENCY** | Provide Zoho ZeptoMail / SendGrid SMTP credentials; configure DKIM, SPF, DMARC.      |
| **Cloudflare Turnstile Keys**      | **EXTERNAL_DEPENDENCY** | Register production site key and secret key in Cloudflare dashboard.                 |
| **Distributed Redis Instance**     | **EXTERNAL_DEPENDENCY** | Provision Upstash or managed Redis for multi-instance rate limiting across replicas. |
| **Legal Counsel Sign-Off**         | **EXTERNAL_DEPENDENCY** | Formally review Terms of Service, Privacy Policy, and Data Retention periods.        |
