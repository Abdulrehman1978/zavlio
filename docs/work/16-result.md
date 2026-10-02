# Zavlio Packet 16 result

## Scope

Packet 16 adds isolated platform providers, normalized social observations, conservative identity resolution, bounded conversation/message ingestion, CRM conversation UI, and a one-use canary control boundary. Packet 17 followed after review and is recorded separately in docs/work/17-result.md.

## Platform Scope

Threads, Facebook, and LinkedIn are implemented as separate providers. Instagram is unsupported.

## Platform Rollout Strategy

Read-only observation is independent from live execution. All providers remain PROVIDER_IMPLEMENTED; no authenticated real-site session was available, so none is READ_ONLY_VERIFIED or CANARY_READY.

## Provider Architecture

SocialPlatformProvider and SyntheticFixtureSocialProvider isolate origin, auth, target proof, exact controls, observation, ingestion, and verification. The generic adapter does not contain platform selectors or upstream business decisions.

## Synthetic Provider

Deterministic fixtures cover auth states, target mismatch, multi-identifier agreement, body-text rejection, exact controls, DOM drift, verification, identity resolution, repeated sync, outbound idempotency, and canary atomicity.

## Threads Provider

THREADS_PROVIDER_V1, origin https://www.threads.com, profile-path validation and normalized snapshot proof implemented. Synthetic result: PASS.

## Facebook Provider

FACEBOOK_PROVIDER_V1, origin https://www.facebook.com, provider-specific profile-path validation implemented. Synthetic provider contract is present; authenticated real-site result: NOT_RUN (external dependency).

## LinkedIn Provider

LINKEDIN_PROVIDER_V1, origin https://www.linkedin.com, /in/... profile-path validation implemented. Synthetic provider contract is present; authenticated real-site result: NOT_RUN (external dependency). LinkedIn is the documented first-canary candidate only because its canonical profile evidence is deterministic, not because a live test was performed.

## Instagram Status

Unsupported and absent from provider registry/capabilities.

## Provider Versions

Threads THREADS_PROVIDER_V1; Facebook FACEBOOK_PROVIDER_V1; LinkedIn LINKEDIN_PROVIDER_V1; upstream remains commit 439c3bfaacb1caabef25a7d67c3f204916a5a168, tree e4f412bc7ff86261f0753a1f088c5f271af9246c.

## Authentication State Detection

Providers distinguish AUTHENTICATED, LOGIN_REQUIRED, SECURITY_CHALLENGE, and UNKNOWN. Login, checkpoint, and unknown states fail closed. No login automation exists.

## Security Checkpoint Handling

Security signal, platform restriction, checkpoint, MFA, CAPTCHA, and suspicious-activity states stop with manual handling. No bypass or retry loop exists.

## Target Proof

All supplied username, stable ID, profile path, and conversation ID fields must agree. Missing observable evidence is insufficient; disagreement is a target mismatch. Canonical profile paths normalize trailing slashes. Body text and display names are never authority.

## Control Proof

Exact target-bound composer and action controls are resolved by semantic target key, role/name, visibility, enabled state, and action. Generic first-match controls cannot mutate.

## Final Revalidation

Preparation is observation-only. Before any future type/click, auth/security, target, and exact control must be re-observed. DOM replacement or action-control changes fail closed.

## Commit Boundary

Typing approved outbound content is prohibited before Packet 14 STARTED. The irreversible control is provider-specific and remains behind Packet 13 policy, approval, signed start, canary permit, and kill-switch recheck.

## Verification Architecture

DM/REPLY/COMMENT/PUBLISH require verified message/content evidence; FOLLOW/CONNECT/LIKE require verified target state. A successful click alone is not success.

## Outcome Unknown

If commit may have occurred but evidence is unavailable, the result is OUTCOME_UNKNOWN/MANUAL_ACTION_REQUIRED; no automatic replay occurs. Response-loss retry is limited to signed result submission.

## Platform Readiness

The Bridge health surface reports independent provider versions/readiness with live execution hard-disabled. The CRM social settings page does not claim authentication or connection without evidence.

## Identity Extraction

Normalized profile fields are limited to provider identity, URL, display name, optional operational headline/bio, and explicit organization name.

## Social Identity Model

Existing identities remains the CRM identity model. Packet 16 adds normalized provider observations and never creates a second canonical-person system.

## Identity Resolution

Exact confirmed identity, explicit CRM-linked profile URL, legitimate verified email, or confirmed cross-platform mapping may link. Names, company, headline, photo, and similarity cannot merge.

## Identity Candidates

Ambiguous observations create PENDING identity candidates with provider evidence and reason codes. No automatic promotion or merge.

## Canonical Person Handling

Merged source identities resolve to the canonical survivor; archived source people are not resurrected.

## Conversation Model

Existing conversations/messages are reused. person_id is nullable for unresolved observations; provider/thread IDs remain the dedupe identity.

## Inbound Message Ingestion

Signed SOCIAL_OBSERVATION_V1 input is bounded to normalized facts, max 100 messages, 64 KiB protocol body, and 128 KiB stored message batch. Plain text is sanitized and bounded.

## Conversation Deduplication

Conversation provider ID is preferred; conservative platform/participant fallback is documented. Synthetic repeated-sync evidence: PASS.

## Message Deduplication

Provider message ID is preferred; fallback is conversation + sender + timestamp + body hash. Synthetic repeated-sync evidence: PASS, zero duplicate records.

## Inbound Touchpoints

New inbound messages create one bounded inbound touchpoint per dedupe key. They do not create opportunities or outbound jobs automatically.

## Outbound Message Recording

Only VERIFIED_SUCCESS may create an outbound CRM record. Dry-run preparation creates none. Repeated operation result is idempotent in the synthetic store.

## Social Attribution

Observed provider source remains distinct from self-reported source and does not overwrite immutable first-touch attribution.

## Conversation UI

Added /crm/conversations, /crm/conversations/[id], and /crm/settings/social. Pages are staff-authorized and show DNC/consent context; reply is a Packet 13 proposal, never direct browser execution.

## Person Timeline Integration

Existing person timeline/message projections remain authoritative; Packet 16 avoids DOM-observation noise.

## Reply Proposal Flow

Conversation → proposal → Packet 13 policy/approval → Packet 14 signed job → Packet 15R.1 adapter/provider.

## DNC Enforcement

DNC suppresses proactive reply proposals and does not suppress inbound recording.

## Consent Enforcement

Social reply UI shows effective consent context and suppresses withdrawn/missing social consent. Consent is not editable from the composer.

## Canary Architecture

social_canary_permits is OWNER-controlled, target/action bound, expiring, one-use, RLS-protected, and atomically consumed by a service-role RPC.

## Canary Authorization

Live mode requires server configuration, allowlisted test identity, Packet 13 eligibility, human approval, Packet 14 start, exact provider proof, and no security challenge. No canary was performed.

## Canary Atomicity

Synthetic concurrent consumption proves at most one use. Real database atomicity is unverified because Docker was unavailable.

## Kill Switch

Provider settings include independent live flags; the provider contract requires a fresh commit-time recheck. No live flag was enabled.

## Capability Negotiation

Packet 14 protocol v1 remains in use; social observation uses an additive typed route and remains dry-run/read-only.

## Machine Ingestion Protocol

Added signed /api/internal/automation/v1/social/observation with nonce/timestamp/body hash/agent authorization through existing Packet 14 machine authentication and a bounded Zod schema. Operation IDs are bound to the verified request hash and changed-body reuse is rejected.

## Schema Changes

Two migrations add provider settings, normalized observations, sync cursors, social identity observations, and canary permits; existing conversation/message person links become nullable for unresolved identities. The signed ingestion RPC materializes deduplicated messages/touchpoints into the existing CRM model when a confirmed person is available.

## Migrations

Added 20261001061900_social_integration.sql and 20261001062000_social_ingestion_materialization.sql. Docker replay was unavailable.

## Migration Count

2 Packet 16 migrations added. Database-applied migration count was not verified because Docker was unavailable.

## Table Count

5 new Packet 16 tables are defined (provider settings, provider observations, sync cursors, canary permits, and social identity observations). The applied catalog total was not verified because Docker was unavailable.

## RLS

New tables enable RLS; staff reads and OWNER canary controls are explicit. Service-only ingestion/consume functions reject non-service callers.

## Functions/RPCs

Added record_social_observation, review_social_identity_observation, and atomic consume_social_canary_permit. Materialization reuses existing conversations/messages/touchpoints and leaves unresolved identities unlinked.

## Provider Tests

pnpm test:integration:social-provider: PASS, 31 checks.

## Synthetic CDP Tests

Packet 15R.1 adapter harness remains green from the approved baseline; Packet 16 provider harness is deterministic and does not claim live-site compatibility.

## Read-Only Real-Site Tests

Not run: no authenticated user-controlled social account/browser evidence was available.

## Canary Test if performed

Not performed. Docker/Packet 13/14 database replay was unavailable, so Packet 16 forbids a real canary.

## Database Tests

Not rerun: Docker Desktop Linux engine unavailable.

## pgTAP

Not rerun for the Packet 16 migration because Docker was unavailable.

## Generated Types

Not regenerated after the Packet 16 migration because Docker was unavailable; generated-type hash is therefore NOT_AVAILABLE.

## Generated Type Hash

NOT_AVAILABLE — db:types could not run without Docker/Postgres.

## Unit Tests

pnpm test:unit -- --reporter=verbose: PASS, 13 test files and 86 tests.

## Integration Tests

Packet 16 social/provider harness: PASS, 31 checks. Existing Packet 15R.1 meta-adapter harness: PASS. The broad pnpm test:integration command was not runnable because local Supabase URL/service credentials were unavailable.

## Packet 13 Regression

No policy authority was moved. DNC, consent, approval, policy change, closed-opportunity, and merged-person controls remain Packet 13 responsibilities; database replay is external.

## Packet 14 Regression

Signed machine auth and result boundary remain authoritative. Social observation route reuses v1 auth. Database replay is external.

## Packet 15R.1 Regression

Exact binding, complete target proof, queued cancellation, STOP, timeout, one-shot, content integrity, and dialog latch remain intact; prior harness was green before Packet 16 additions.

## E2E Tests

Conversation/identity/status UI was added. Playwright result: 4 tests passed; 3 database-backed fixtures failed because SUPABASE_SERVICE_ROLE_KEY was unavailable; 11 dependent tests were not run.

## Accessibility

Existing E2E axe-covered home/forms/analytics paths passed where their fixtures were available. The new conversation/social routes were not axe-exercised because authenticated Supabase fixtures were unavailable.

## Build Result

pnpm --filter @zavlio/meta-bridge build, pnpm typecheck, and pnpm build: PASS. Next production build compiled the new conversation, social settings, and signed observation routes.

## Dependency Audit

pnpm audit --audit-level high: PASS, no known vulnerabilities.

## Secret Scan

Providers accept normalized evidence only. No passwords, cookies, HMAC, service-role, AI, or CDP secrets are passed to provider code.

## Pin Verification

pnpm meta:verify-pin passed the required origin, commit, tree, package/hash, license/hash, README/hash, and clean-source checks.

## Real External Side Effects

Exactly zero. LIVE_EXTERNAL_EXECUTION remains false and no live canary was attempted.

## Known Limitations

No official API claim, no Instagram, no discovery/bulk outreach, no login automation, no CAPTCHA/MFA/checkpoint bypass, no authenticated real-site compatibility evidence, and no platform ToS/legal approval claim.

## External Dependencies

Docker/Postgres, authenticated social accounts, real-site read-only browser evidence, and broad upstream Antigravity/browser tests were unavailable or not applicable.

## Rollback Notes

Disable provider observation/live flags, revoke permits, stop the Bridge, and roll back the two Packet 16 migrations (20261001062000_social_ingestion_materialization.sql followed by the reviewed handling for 20261001061900_social_integration.sql) through the reviewed migration workflow. Do not delete CRM history manually; prefer a forward-fix when a migration is not safely reversible.

## Packet 17 Readiness

Packet 16 was the approved predecessor to Packet 17. Packet 17 is complete with PASS_WITH_EXTERNAL_DEPENDENCY and remains the final packet executed in this workstream.

## STATUS

PASS_WITH_EXTERNAL_DEPENDENCY: internal provider, identity, ingestion, UI, policy-boundary, and synthetic canary invariants pass; Docker/database replay and authenticated real-site evidence remain genuine external dependencies.
