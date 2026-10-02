# Packet 15 Result — Pinned Meta Automation Adapter

## Scope

Packet 15 integrates the approved upstream behind a Zavlio-owned, dry-run-only adapter. It does not start Packet 16 or enable real social side effects.

## Approved Upstream

### Repository URL

`https://github.com/sunmughan/meta-automation.git`

### Pinned Branch Context

`agentic-social-v2` (context only; checkout is detached).

### Pinned Commit SHA

`439c3bfaacb1caabef25a7d67c3f204916a5a168`

### Tree SHA

`e4f412bc7ff86261f0753a1f088c5f271af9246c`

### Commit Verification Status

`UNSIGNED`; the exact commit, tree, origin, and tracked-source cleanliness are verified.

### License

MIT; license hash is recorded in `external/meta-automation.lock.json`.

### Package Version

`meta-automation@2.0.0`, Node `>=18`, CommonJS.

### Package Lock Integrity

`package-lock.json` SHA-256 `3e7077977e388545f13477df76f45b5ce790ca462fc59f788948cd87a9a9ce7a`; locked Puppeteer Core is `25.11.0`.

### Upstream Dependency Audit

`npm audit --audit-level high`: PASS, zero high-severity findings.

### Upstream Test Results

`npm run test:agentic`: PASS. Broad `npm test`: FAIL in the environment-dependent Antigravity semantic assertions; it requires an unavailable external runtime and touched local browser/state artifacts. Generated artifacts were removed and the pinned source was reverified clean. This is an external upstream limitation, not an adapter-side production claim.

### Upstream Architecture Findings

The full runner discovers people, invokes its own next-best-action planner, applies local safety, executes actions, and updates local relationship state. Other upstream modules write local identity, follow-up, telemetry, and state files; the browser manager auto-accepts dialogs. None are Zavlio authorities.

### Supported Platform Findings

The pinned config supports `THREADS`, `FACEBOOK`, and `LINKEDIN`. Packet 15 exposes only this explicit matrix.

### Instagram Inconsistency

Instagram is not supported or claimed; configuration remnants are treated as drift/inconsistency.

### Reusable Upstream Components

Only the pinned `UniversalBrowserAgent` semantic snapshot and bounded click/type primitives are reused, behind Zavlio validation.

### Rejected Upstream Components

The full runner, business planner, identity graph, relationship/follow-up state, browser manager, AI runtime, telemetry, and local persistence are rejected from the normal path.

### Why Full Agentic Runner Is Not Used

It would duplicate CRM authority, policy, identity, approval, execution, and relationship state already established in Packets 08–14.

### Why NextBestAction Is Not Zavlio Authority

Business action selection belongs to Packet 13 policy and approved job content, not a child-local planner.

### Why Identity Graph Is Not Zavlio Authority

Canonical people and identities belong to Zavlio CRM/RLS; upstream local IDs cannot mutate or replace them.

## Adapter Architecture

### Process Isolation

Compiled Bridge supervises a long-lived child with `spawn(process.execPath, [entry], { shell: false })`, bounded timeouts, hidden Windows process, and graceful stop.

### IPC Contract

Typed JSONL requests/responses use request IDs, operation schemas, bounded result/evidence fields, and stdout reserved exclusively for IPC.

### Environment Isolation

An explicit allowlist is copied; dry-run/approval/disabled-posting flags are forced. Human logs go to redacted stderr.

### Filesystem Isolation

Upstream logs/state/leads/backups are redirected under the adapter runtime directory; the checkout remains clean.

### Machine Secret Isolation

Harness PASS: child environment excludes `ZAVLIO_MACHINE_HMAC_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` (and other server secrets). The child cannot impersonate the Bridge or write directly to Supabase.

### CDP Boundary

Only loopback CDP URLs are accepted. The child attaches through pinned Puppeteer Core and does not expose CDP credentials to the upstream.

### Browser Session Boundary

The child selects the expected local-origin page, uses one browser mutex/concurrency slot, and disconnects on stop. Authenticated real sessions were not exercised.

### Origin Allowlist

Production origins are exact HTTPS hosts for Threads, Facebook, and LinkedIn; test mode allows loopback fixtures only. Origin-escape harness check: PASS.

### Platform Mapping

`THREADS`, `FACEBOOK`, and `LINKEDIN` map to their exact allowlisted origins.

### Action Mapping

Threads: DM, REPLY, COMMENT, LIKE, FOLLOW, PUBLISH. Facebook: REPLY, COMMENT, LIKE, FOLLOW, PUBLISH. LinkedIn: DM, REPLY, COMMENT, LIKE, FOLLOW, CONNECT, PUBLISH.

### Capability Matrix

Packet 15 negotiates only `DRY_RUN_ONLY`; Packet 14 `INTERNAL/NOOP` remains valid. Unsupported channels/actions cannot be claimed.

### Adapter Version

`15.0.0`.

### Upstream Runtime Version

`meta-automation@2.0.0`, Puppeteer Core `25.11.0`.

## Security Guard

### Browser Dialog Safety

Harness PASS: a synthetic `confirm` is dismissed and returns `MANUAL_ACTION_REQUIRED`; no marker is written. The upstream auto-accept listener is not used.

### Target Verification

Username/stable identity must match exactly once. Login, wrong-target, and ambiguous target checks passed in the fixture.

### Content Integrity

Normalized SHA-256 content hashes are required and independently checked before type/click execution.

### Planner Restrictions

No upstream business planner is loaded; plans are deterministic mappings from the already-approved job.

### Prompt Injection Controls

Page content is untrusted. A fixture containing an instruction to open `example.com` remained on the local origin; no page text selects business action or navigation.

### Primitive Action Restrictions

Plans are bounded to semantic `CLICK`, `TYPE_EXACT`, and the explicitly enumerated safe primitives. `UPLOAD` plan validation is rejected by the adapter schema.

### Dry Run Semantics

Normal mode returns `SAFE_PRECOMMIT_DRY_RUN`; test mode is restricted to the local synthetic fixture. No external social side effect is enabled.

## Synthetic Fixture Architecture

Local loopback HTTP fixture plus a dedicated headless Chrome CDP process; confirm, safe, login, wrong-target, and prompt pages are exercised.

### Synthetic CDP Evidence

`pnpm test:integration:meta-adapter`: PASS. The harness verified child startup, secret exclusion, dialog denial, safe typed/clicked marker (`DM:alice`), login pause, wrong-target rejection, prompt/origin containment, primitive restriction, compiled child path, and clean pin.

### Real-Site Read-Only Evidence if available

Not available. No authenticated social account or real platform navigation was attempted.

### Action Verification

Safe fixture marker count was exactly one; confirmation fixture marker count was zero.

### Evidence Sanitization

Evidence contains bounded scalar status/origin/security/verification/hash metadata only; no body, screenshot, cookies, or message text is stored.

### Telemetry Boundary

Child stdout is structured IPC; stderr is redacted and bounded. The semantic agent transitively loads upstream telemetry/logger modules; runtime paths are redirected and raw output is not ingested wholesale. Sanitized Zavlio evidence remains authoritative.

### Failure Mapping

Pin, install, CDP, origin, target, content, security, timeout, and child-process failures map to bounded adapter statuses and generic errors.

### Manual-Action Mapping

Dialog, login, CAPTCHA/security checkpoint, identity ambiguity, and policy/manual holds map to `MANUAL_ACTION_REQUIRED`.

### Unknown-Outcome Mapping

An unverifiable post-action result maps to `UNVERIFIED`/unknown evidence and is not automatically retried.

## Bridge Integration

Packet 14 signed handshake/capability intersection remains the machine boundary. The Bridge starts the adapter only after lease/start policy gates and projects scalar health/evidence to authenticated staff UI.

### Agent UI Changes

Agents page shows adapter version, upstream SHA, process model, and scalar runtime state.

### Job UI Changes

Job detail renders sanitized execution evidence and never exposes child internals or secrets.

### Schema Changes

One new migration updates claim capability gating and projections; no new upstream-local tables were created.

### Migration Added

`supabase/migrations/20261001061800_meta_automation_adapter.sql`.

### RLS Changes

Existing service-only claim boundary and security-invoker projections are preserved; no anon grants were added.

## Verification

### Unit Tests

Bridge/web TypeScript checks and formatting passed after adapter changes. Focused adapter schemas/mappings/origin/pin logic compile in the Bridge build.

### Upstream Tests

Agentic architecture/onboarding tests PASS; broad suite remains externally blocked by Antigravity runtime as described above.

### Adapter Integration Tests

`pnpm test:integration:meta-adapter`: PASS.

### Synthetic Browser Tests

Dedicated compiled child/CDP harness: PASS.

### Packet 14 Signed End-to-End Test

Existing Packet 14 signed integration remains the reference; this host could not rerun Supabase-dependent tests because Docker Desktop is unavailable.

### Process Crash Tests

Supervisor has bounded timeout/exit rejection and graceful stop paths; a full crash-injected external run is not claimed.

### Environment Secret Tests

PASS in harness for HMAC/service-role exclusion and forced dry-run flags.

### Prompt Injection Tests

PASS in local fixture: hostile page text did not cause navigation or planner selection.

### Origin Escape Tests

PASS: external origin rejected by exact origin policy.

### Build Result

`pnpm --filter @zavlio/meta-bridge build` and `pnpm build`: PASS.

### Compiled Bridge Runtime

Compiled adapter child path started successfully in the harness; full signed Bridge + Supabase runtime was not rerun without Docker.

### Compiled Adapter Runtime

PASS via `services/meta-bridge/dist/adapters/meta-automation/child.js`.

### Accessibility

No UI redesign was made. Existing Packet 14 UI accessibility evidence remains applicable; changed CRM pages were not rerun through axe on this host.

### Dependency Audits

Pinned upstream high-severity audit PASS. Root audit and full repository regression remain recorded as external follow-up where not rerun.

### Secret Scan

No real secret values were added; harness fake secrets were process-local and never written to tracked files.

### Source Drift Scan

`node scripts/meta-verify-pin.mjs`: PASS after harness execution; checkout origin/SHA/tree/hashes/source cleanliness match the lock manifest.

### Packet 07 Regression

Not rerun in this Docker-unavailable turn; prior Packet 07 evidence remains historical.

### Packet 08 Regression

Not rerun in this Docker-unavailable turn; prior Packet 08 evidence remains historical.

### Packet 09 Regression

Not rerun in this Docker-unavailable turn; prior Packet 09 evidence remains historical.

### Packet 10 Regression

Not rerun in this Docker-unavailable turn; prior Packet 10 evidence remains historical.

### Packet 11 Regression

Not rerun in this Docker-unavailable turn; prior Packet 11 evidence remains historical.

### Packet 12 Regression

Not rerun in this Docker-unavailable turn; prior Packet 12 evidence remains historical.

### Packet 13 Regression

Not rerun in this Docker-unavailable turn; prior Packet 13 evidence remains historical.

### Packet 14 Regression

Not rerun in this Docker-unavailable turn; prior Packet 14 evidence remains historical.

## Known Limitations

No Instagram support, discovery, upstream identity/follow-up authority, autonomous next-best-action, real external execution, authenticated platform test, or production supervision is provided.

## External Dependencies

Docker/Supabase runtime, Antigravity upstream runtime, authenticated social accounts, platform UI/policy stability, deployment secret manager, and future live-outcome review remain external.

## Rollback Notes

Disable `ZAVLIO_META_ADAPTER_ENABLED`, stop the Bridge, remove the Packet 15 migration through the normal reviewed rollback process if required, and restore the prior pinned checkout. Do not mutate production schema manually or re-enable the upstream full runner.

## Packet 16 Readiness

Packet 16 is the next backend packet but is not started. Real live execution requires a new explicit review of platform policy, credentials, rate limits, outcome ambiguity, and supervision.

## STATUS

`PASS_WITH_EXTERNAL_DEPENDENCY` — Packet 15’s pinned, isolated, dry-run adapter and compiled synthetic CDP evidence pass. Docker/database replay and authenticated real-site evidence remain external; this is not a production-ready claim.
