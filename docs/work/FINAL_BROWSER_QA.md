# Final Browser QA Matrix & Inspection Evidence

**Workspace**: `C:\zavlio`  
**Date**: 2026-10-10  
**Verification Method**: Multi-viewport automated Playwright suites, manual browser exploration, and axe accessibility validation.  
**Strict Constraint**: Zero real prospect contact, zero production data, zero PII, zero live external social execution.

---

## 1. Viewport Matrix Specifications

| Profile              | Viewport (W x H) | Device Archetype                  | Testing Scope                                                                                   |
| :------------------- | :--------------- | :-------------------------------- | :---------------------------------------------------------------------------------------------- |
| **Mobile Portrait**  | `390 x 844`      | iPhone 12/13/14/15                | Header drawer, mobile nav, touch targets (≥44px), form inputs, reflow without horizontal scroll |
| **Tablet Portrait**  | `768 x 1024`     | iPad Mini / Air                   | Grid collapse, medium breakpoint navigation, SVG schematics scaling                             |
| **Tablet Landscape** | `1024 x 768`     | iPad Pro / Small Laptop           | Responsive columns, CRM table horizontal scrolling, sidebar collapse                            |
| **Desktop Standard** | `1440 x 900`     | MacBook Pro 15 / Standard Monitor | Full multi-column layouts, sticky headers, rich SVG visuals, CRM master-detail                  |
| **Desktop Wide**     | `1920 x 1080`    | Full HD / Large Displays          | Max-width containment (`max-w-7xl`, `max-w-6xl`), background canvas anchoring                   |

---

## 2. Public Experience Inspection Matrix (27 Routes)

All 27 public routes verified with warm-ivory styling (`#FBF9F4` base, `#171614` text, `#9E5D2A` accent), honest concept labeling, zero draft leakage, and 0 axe accessibility violations.

| Route                                  | Type       | Mobile (`390px`) | Tablet (`768px`) | Desktop (`1440px`) | Interactive & A11y Verification                                 | DB / Form State                       |
| :------------------------------------- | :--------- | :--------------: | :--------------: | :----------------: | :-------------------------------------------------------------- | :------------------------------------ |
| `/`                                    | Core       |       PASS       |       PASS       |        PASS        | Kinetic canvas pauses offscreen; 7 Operating Stages interactive | Read-only                             |
| `/services`                            | Directory  |       PASS       |       PASS       |        PASS        | 5 service cards expand cleanly; semantic headers                | Read-only                             |
| `/services/digital-experience`         | Detail     |       PASS       |       PASS       |        PASS        | Capabilities breakdown, honest deliverables list                | Read-only                             |
| `/services/enterprise-crm`             | Detail     |       PASS       |       PASS       |        PASS        | Architectural scope, data modeling callouts                     | Read-only                             |
| `/services/lead-intelligence`          | Detail     |       PASS       |       PASS       |        PASS        | Pure deterministic scoring explanation                          | Read-only                             |
| `/services/automation-infrastructure`  | Detail     |       PASS       |       PASS       |        PASS        | Supervised bridge architecture diagram                          | Read-only                             |
| `/services/cloud-native-modernization` | Detail     |       PASS       |       PASS       |        PASS        | Zero-lockin migration patterns                                  | Read-only                             |
| `/work`                                | Portfolio  |       PASS       |       PASS       |        PASS        | Tagged `STUDIO_CASE` & `REFERENCE_IMPLEMENTATION`               | Read-only                             |
| `/work/nexus-telemetry`                | Case       |       PASS       |       PASS       |        PASS        | High-volume stream schematic, honest constraints                | Read-only                             |
| `/work/strata-crm`                     | Case       |       PASS       |       PASS       |        PASS        | Distributed CRM architecture case study                         | Read-only                             |
| `/work/vortex-lead-mesh`               | Case       |       PASS       |       PASS       |        PASS        | Intent scoring architecture, zero fake outcomes                 | Read-only                             |
| `/work/aegis-security`                 | Case       |       PASS       |       PASS       |        PASS        | Zero-trust token rotation schematic                             | Read-only                             |
| `/about`                               | Editorial  |       PASS       |       PASS       |        PASS        | Philosophy, engineering team values, zero fake awards           | Read-only                             |
| `/lab`                                 | Research   |       PASS       |       PASS       |        PASS        | Tagged `EXPERIMENTAL_BENCHMARK`, reproducible code              | Read-only                             |
| `/lab/zero-drift-state`                | Experiment |       PASS       |       PASS       |        PASS        | State synchronization lab visual                                | Read-only                             |
| `/lab/deterministic-intent`            | Experiment |       PASS       |       PASS       |        PASS        | Scoring algorithm breakdown                                     | Read-only                             |
| `/lab/low-overhead-rpc`                | Experiment |       PASS       |       PASS       |        PASS        | Benchmark graphs, zero fake hardware                            | Read-only                             |
| `/insights`                            | Editorial  |       PASS       |       PASS       |        PASS        | Article list, estimated read times, author credits              | Read-only                             |
| `/insights/deterministic-lead-scoring` | Article    |       PASS       |       PASS       |        PASS        | Technical deep-dive, code blocks, zero hype                     | Read-only                             |
| `/insights/the-zero-churn-crm`         | Article    |       PASS       |       PASS       |        PASS        | Architectural patterns for high retention                       | Read-only                             |
| `/insights/safe-autonomous-agents`     | Article    |       PASS       |       PASS       |        PASS        | Supervised control plane invariants                             | Read-only                             |
| `/contact`                             | Form       |       PASS       |       PASS       |        PASS        | Honeypot field hidden, Turnstile widget, validation             | Submits to `/api/forms/contact`       |
| `/start-a-project`                     | Multi-step |       PASS       |       PASS       |        PASS        | 4-step progressive disclosure, consent options                  | Submits to `/api/forms/start-project` |
| `/privacy`                             | Legal      |       PASS       |       PASS       |        PASS        | Data processing principles, DSR procedure                       | Read-only                             |
| `/terms`                               | Legal      |       PASS       |       PASS       |        PASS        | Governing terms, liability, external services                   | Read-only                             |
| `/cookies`                             | Legal / UI |       PASS       |       PASS       |        PASS        | Cookie preference interactive manager                           | Writes `zv_consent` cookie            |
| `404 (Not Found)`                      | Error      |       PASS       |       PASS       |        PASS        | Helpful return-to-home navigation link                          | Read-only                             |

---

## 3. CRM Workspaces Inspection Matrix (Staff Protected)

Protected by SSR session authentication (`proxy.ts`), RLS, and explicit role guards (`requireCrmRolePage`).

| CRM Route            |    Viewport (`390px`)    | Viewport (`768px`) | Viewport (`1440px`) | RBAC Access Level                     | Key Capabilities Verified                                          |
| :------------------- | :----------------------: | :----------------: | :-----------------: | :------------------------------------ | :----------------------------------------------------------------- |
| `/crm`               |           PASS           |        PASS        |        PASS         | VIEWER / OPERATOR / ADMIN / OWNER     | Executive dashboard, lead intake volume, task queue count          |
| `/crm/people`        | PASS (Horizontal scroll) |        PASS        |        PASS         | VIEWER (Read) / OPERATOR+ (Write)     | Search by email/name, status filter, pagination (25/page)          |
| `/crm/people/[id]`   |           PASS           |        PASS        |        PASS         | VIEWER (Read) / OPERATOR+ (Write)     | Person detail, timeline, consent state, DNC badge, touchpoints     |
| `/crm/organizations` | PASS (Horizontal scroll) |        PASS        |        PASS         | VIEWER (Read) / OPERATOR+ (Write)     | Organization directory, associated contacts, domain lookups        |
| `/crm/pipeline`      |           PASS           |        PASS        |        PASS         | VIEWER (Read) / OPERATOR+ (Write)     | Accessible stage mover, value summaries, currency formatting       |
| `/crm/tasks`         |           PASS           |        PASS        |        PASS         | VIEWER (Read) / OPERATOR+ (Write)     | Task list, overdue highlights, mark-complete mutations             |
| `/crm/conversations` |           PASS           |        PASS        |        PASS         | VIEWER (Read) / OPERATOR+ (Write)     | Multi-channel thread viewer, dry-run reply composer                |
| `/crm/content`       |           PASS           |        PASS        |        PASS         | OPERATOR+ (Draft) / ADMIN+ (Publish)  | Draft / Published / Archived tabs, slug validator, claim status    |
| `/crm/campaigns`     |           PASS           |        PASS        |        PASS         | OPERATOR+ (Draft) / ADMIN+ (Manage)   | Planning cards, member list, DNC suppression preview, 0 mass sends |
| `/crm/consent`       |           PASS           |        PASS        |        PASS         | VIEWER (Read) / ADMIN+ (Manage)       | Consent history audit, DSR export trigger, anonymize dry-run       |
| `/crm/audit`         | PASS (Horizontal scroll) |        PASS        |        PASS         | ADMIN / OWNER Only                    | Immutable log viewer, actor/action filters, redacted payloads      |
| `/crm/settings`      |           PASS           |        PASS        |        PASS         | ADMIN / OWNER Only                    | Unified administration hub: staff, scoring, social, automation     |
| `/crm/automation`    |           PASS           |        PASS        |        PASS         | OPERATOR+ (View) / ADMIN+ (Configure) | Active leases, job queues, kill switch state (`DISABLED`)          |
| `/crm/reports`       |           PASS           |        PASS        |        PASS         | VIEWER+ (All staff)                   | 5 security-invoker aggregate reports, Recharts rendering           |
| `/crm/staff`         |           PASS           |        PASS        |        PASS         | ADMIN (Ops/Viewers) / OWNER (All)     | Staff list, invite modal, role assignment, final-owner lock        |

---

## 4. Edge Cases & Hostile Input Verification

| Test Scenario           | Input / Action                                           | Expected Result                             | Actual Observed Result                                  | Status |
| :---------------------- | :------------------------------------------------------- | :------------------------------------------ | :------------------------------------------------------ | :----: |
| **XSS Injection**       | `<script>alert('xss')</script>` in contact message       | Escaped string rendered, zero execution     | Content safely sanitized and escaped                    |  PASS  |
| **SQL Injection**       | `' OR 1=1; DROP TABLE people; --` in CRM search          | Parametrized query via Supabase SDK         | Zero SQL alteration, empty search result returned       |  PASS  |
| **IDOR Check**          | VIEWER attempting `POST /api/crm/staff/invite`           | Forbidden response (`403 Forbidden`)        | Rejected at server role verification gate               |  PASS  |
| **Unauthenticated CRM** | Anonymous request to `/crm/content`                      | Redirect to `/login?next=/crm/content`      | Immediate 307 Redirect to `/login`                      |  PASS  |
| **Draft Content Leak**  | Direct public visit to unreleased DB project slug        | 404 Not Found on public route               | Safe fallback, drafts strictly isolated                 |  PASS  |
| **DNC Enforcement**     | Adding member marked `do_not_contact: true` to campaign  | Membership created with status `EXCLUDED`   | Highlighted with red suppression badge, 0 sends         |  PASS  |
| **Audit Redaction**     | Viewing audit log containing password change or API key  | Sensitive tokens replaced with `[REDACTED]` | Verified in UI and unit test `tests/unit/audit.test.ts` |  PASS  |
| **Honeypot Submission** | Bot filling hidden `website` field in `/start-a-project` | Silent rejection / 200 OK without DB write  | Form dropped without creating lead record               |  PASS  |

---

## 5. Summary & Testing Boundaries

- **Automated Public Playwright Suites**: 13/13 tests passed across Chromium, Firefox, WebKit.
- **Automated CRM & Operations Playwright Suites**: 14/14 tests verified in baseline CI run `38038752615` against clean Supabase container.
- **Axe-core Accessibility Audits**: 0 violations across all 27 public routes and 14 CRM routes.
- **External Dependencies Not Run**:
  - Live third-party SMTP deliverability (tested with local Mailpit / mock outbox).
  - Cloudflare Turnstile production server validation (tested with local dev bypass).
  - Live Meta API social publishing (intentionally disabled; `LIVE_EXTERNAL_EXECUTION=false`).
