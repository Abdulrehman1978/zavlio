# Security and authorization

## Packet 17 operational closure

Production checks reject demo/test credentials, Mailpit, disabled Turnstile, localhost endpoints, and live social execution. Structured logs redact credentials, tokens, cookies, and session material.

## Packet 12 reporting security

Packet 12 reporting RPCs are security-invoker functions with fixed `public` search paths and authenticated-only EXECUTE grants. Each validates active staff and the bounded date range. Anon, authenticated nonstaff, and inactive staff are denied by grants/RLS/runtime guards. Reporting does not use the service role. The unchanged active-staff RLS predicate is wrapped as a scalar subquery on report source tables so PostgreSQL evaluates it once per statement without weakening authorization.

Status: Packet 08 implementation; hosted Auth/RLS and production controls still require release verification.

## Authority and session model

Supabase Auth proves identity. `public.staff_profiles.auth_user_id`, `active`, and `role` authorize Zavlio actions. Email domains, user metadata, browser state, and an authenticated session alone never grant CRM access. Server code uses `auth.getClaims()` through `@supabase/ssr`; `getSession()` is not used as a server authorization decision.

The Next.js 16 `proxy.ts` refreshes cookies and provides a coarse `/crm` redirect. Every protected page and mutation repeats server-side authorization. Browser clients use the public anon key only; service-role clients are server-only and are never imported by client modules.

## Roles

`OWNER` is highest privilege. `ADMIN` manages only `OPERATOR` and `VIEWER` accounts and cannot create, promote, demote, deactivate, or modify an owner or another admin. `OPERATOR` performs operational CRM writes. `VIEWER` is read-only. The final active owner cannot be deactivated, deleted, or demoted.

## 39-table role matrix

The database keeps RLS enabled on every application table. `anon`, non-staff authenticated users, and inactive staff have no effective application access. `service_role` is server/infrastructure-only and bypasses RLS; its use is audited at the application boundary.

| Tables                                                                                                                                                   | VIEWER            | OPERATOR          | ADMIN                            | OWNER             | Ingestion / system                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------- | -------------------------------- | ----------------- | ---------------------------------------------- |
| authors, testimonials, services, projects, project_media, lab_projects, insights, site_settings, navigation_items, footer_links, reusable_content_blocks | read              | read              | read/write                       | read/write        | server writes                                  |
| organizations, people, opportunities, tasks, notes, touchpoints, conversations, messages, identity_match_candidates                                      | read              | read/write        | read/write                       | read/write        | server writes                                  |
| anonymous_visitors, sessions, identities, events, form_submissions                                                                                       | read              | read              | read                             | read              | ingestion writes                               |
| consents                                                                                                                                                 | read/history only | read/history only | read/history only                | read/history only | append-only ingestion; no casual update/delete |
| lead_scores, opportunity_stage_history                                                                                                                   | read              | read              | read                             | read              | scoring/system writes                          |
| pipeline_stages                                                                                                                                          | read              | read              | read/write                       | read/write        | server writes                                  |
| campaigns, campaign_members                                                                                                                              | read              | read              | read/write                       | read/write        | server writes                                  |
| automation_agents                                                                                                                                        | read              | read              | read/write                       | read/write        | worker control                                 |
| automation_settings                                                                                                                                      | no                | no                | read/write                       | read/write        | server config                                  |
| automation_jobs, automation_runs, automation_actions                                                                                                     | read              | read              | read                             | read              | worker claim/write functions                   |
| automation_nonces                                                                                                                                        | no                | no                | no                               | no                | infrastructure-only function access            |
| audit_logs                                                                                                                                               | no                | no                | read                             | read              | append through server/admin paths              |
| staff_profiles                                                                                                                                           | active staff read | active staff read | read all; manage OPERATOR/VIEWER | read/manage all   | bootstrap/admin service                        |

No blanket `ALL ON ALL TABLES TO authenticated` grant exists. Grants are explicit and are paired with role-aware policies. Staff have no direct delete path for CRM history, consents, audit logs, or automation state.

## Authentication controls

- Invite-only email/password; public signup is disabled locally and must be disabled in hosted Supabase settings.
- Login, recovery, invite confirmation, and password setup use PKCE and SSR cookies. Error responses are generic and do not enumerate accounts.
- Redirects accept only internal `/crm` and `/auth/set-password` paths. Tokens are exchanged server-side and removed from the URL.
- Passwords require at least 12 characters. Logout is a POST that clears the SSR session.
- Invite/profile creation compensates by deleting a newly invited Auth user when profile insertion fails and records an audit event.
- The owner bootstrap command requires a service-role key, is idempotent, refuses to create a second active owner, invites the owner, and writes an audit event.

## Analytics boundary

- Browser analytics is anonymous, first-party, consent-gated, and limited to the typed 20-name allowlist. The browser never inserts database rows directly.
- `POST /api/analytics/events` enforces same-origin checks, 64 KiB body/20-event limits, 4 KiB metadata, timestamp bounds, safe paths/referrers/UTM values, UUID event IDs, and a bounded per-user-agent throttle. It stores no raw IP or full user-agent and has no identity-resolution path.
- The service-role client is imported only by the server route. `service_role` is not exposed to browser code or bundled client chunks. The database function has a fixed search path and execute is revoked from `public`, `anon`, and `authenticated`.
- The in-memory throttle is process-local and is not a substitute for a distributed edge limit; production deployment must add a platform-level rate limit and observability.

## Operational evidence

`supabase/tests/auth_rbac_test.sql` checks helper functions, RLS, staff policies, and the final-owner trigger. Runtime tests must create disposable local Auth users/JWTs for owner/admin/operator/viewer/nonstaff/inactive cases and verify representative reads/writes, invite, recovery, logout, and the Mailpit flow. Secrets and tokens must never be committed or printed.

The local CLI has a known configuration mapping defect: with `auth.enable_signup = false`, email/password is disabled along with signup. The required invite-only configuration is retained. This is the sole Packet 07 external dependency; hosted Supabase must verify the final email-login setting before release.

## External references

- [Next.js proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase JWT claims](https://supabase.com/docs/reference/javascript/auth-getclaims)

## Packet 09 public intake boundary

## Packet 10 authorization boundary

CRM reads use the authenticated server client so database RLS remains the enforcement layer; no service-role bypass is used for people, organizations, timelines, or candidates. Direct authenticated `people` updates are column-granted to safe fields, protecting primary email and merge provenance. Sensitive mutations use role checks plus audited RPCs. Identity review is operator-readable/admin-writable, and merge/DNC-clear operations require ADMIN/OWNER policy checks.

Form routes enforce same-origin requests, a strict body limit, bounded in-memory per-user-agent rate limiting, Zod validation, honeypot rejection, and production-fail-closed Turnstile verification. A service-role-only RPC performs the atomic write; outbox delivery is post-commit and idempotent. `email_outbox` is RLS-protected and ADMIN-readable only; no browser bundle contains service credentials.

## Packet 11 security boundaries

Authenticated staff read CRM source signals through existing RLS; scoring never uses a service client for source reads. persist_lead_score is SECURITY DEFINER, service-role-only, validates the active model and configuration hash, resolves canonical people, and is the only elevated scoring write.

get_active_lead_scoring_model permits OPERATOR+ and service role. transition_opportunity_stage, update_opportunity, create_crm_task, and update_crm_task are SECURITY DEFINER functions that re-check active staff role, validate stable values, lock rows, enforce optimistic concurrency, and write audit/history atomically. Direct authenticated lead-score writes and task writes are revoked; direct opportunity updates exclude stage, person, and source. VIEWER remains read-only; OPERATOR handles normal operations; ADMIN/OWNER may reopen closed opportunities and read model configuration.

## Packet 13 automation boundary

All 46 application tables retain RLS. Staff read automation through explicit policies and security-invoker projections; direct queue-state, policy, approval, and event mutation is revoked. SECURITY DEFINER RPCs use a fixed `public` search path, re-check staff role or service-role context, lock target rows, enforce expected versions/transitions, and append audit/history atomically.

VIEWER is read-only. OPERATOR may propose but cannot approve. ADMIN/OWNER may approve, reject, cancel, and resolve manual action. OWNER alone activates immutable policy versions, and Packet 13 forces approval plus dry run. Worker claim/start/complete/fail/recovery/heartbeat functions are service-role only; job payloads must not contain secrets. A disabled or stale agent cannot claim.

Approval cannot override DNC, consent, canonical-person, opportunity, content-hash, or current-policy checks. Final eligibility runs before execution.

## Packet 14 machine boundary

The Bridge and staff are distinct principals. Every machine request is POST-only, JSON, at most 64 KiB, and authenticated with per-agent HMAC-SHA256 over protocol version, method, exact pathname, agent key, key ID, Unix timestamp, UUID nonce, and the SHA-256 digest of exact body bytes. Verification uses constant-time comparison. The ±300-second timestamp window and 24-hour per-agent nonce uniqueness prevent replay; HMAC verification precedes nonce insertion.

Raw machine secrets are server/Bridge environment values and are not stored in PostgreSQL. One current and one expiry-bounded previous key support rotation. The Bridge rejects a service-role key at startup and has no direct database access. Production non-local HTTP is rejected. Machine responses are private/no-store, no CORS path is added, and authentication failures are deliberately generic.

Durable operation receipts make claim/lease/start/result retries idempotent and reject changed payloads. Agent, instance, version, and lease ownership are checked transactionally. Packet 13's final policy recheck remains authoritative. Packet 14 capabilities are intersected to INTERNAL/NOOP/DRY_RUN_ONLY, max concurrency is one, and the Bridge independently refuses live or social work.

Packet 15R.1 adds an adapter execution invariant: the element whose target/action binding is proven is the only element eligible for mutation, and that binding is revalidated immediately before every TYPE/CLICK. Complete target-identifier agreement, queued cancellation generations, immediate STOP invalidation, one-shot preparation, dialog latching, bounded timeout termination, and child secret isolation are local safety controls; they do not replace Packet 13 policy or Packet 14 lease/signature authority.

## Packet 15 child boundary

The pinned upstream is an untrusted implementation dependency. It is loaded only in a supervised child with JSONL stdout, stderr redaction, isolated runtime paths, an explicit environment allowlist, forced dry-run/approval flags, and no HMAC/service-role/SMTP/Turnstile/JWT secrets. CDP is local-only; platform origins, target identity, approved content hash, and bounded semantic primitives are checked before work. The adapter removes upstream dialog listeners and dismisses confirmation dialogs, returning `MANUAL_ACTION_REQUIRED` rather than accepting. Page content is untrusted prompt-injection input; no page text can choose business actions, navigate outside allowlisted origins, or alter Zavlio identity/policy.

# Packet 16 security boundary

Threads, Facebook, and LinkedIn providers accept normalized browser evidence only. Signed Packet 14 machine auth protects social observation ingestion. Login/MFA/CAPTCHA/checkpoint states fail closed; no cookies, passwords, service-role keys, HMAC secrets, raw HTML, or public CDP are exposed. DNC/consent/approval/policy remain authoritative and live execution is disabled.
