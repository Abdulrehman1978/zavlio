# Packet 08 Result — First-Party Analytics, Visitor Identity, Sessions & Attribution

Date: 2026-09-27  
Status: **PASS**  
Scope: consent-gated anonymous first-party analytics only. Packet 09 was not started.

## Delivered

- Browser-safe analytics package with 20 typed event names, per-event metadata allowlists, safe page/referrer/UTM normalization, UUID event IDs, bounded 100-event queue, 20-event batches, transient retry limit, and `sendBeacon` visibility flush.
- Minimal consent controls in the existing shell. Analytics is disabled until `ANALYTICS_ALLOWED`; GPC defaults undecided visitors to denial. DNT is not interpreted as consent.
- First-party cookies: `zv_consent` (180 days, state/key/policy), `zv_vid` (random UUID, 180 days), and `zv_sid` (random UUID, 30-minute inactivity TTL). Withdrawal clears visitor/session cookies and queued events; re-consent receives a new visitor ID.
- `POST /api/analytics/consent` and canonical `POST /api/analytics/events` routes. The event route enforces same-origin, 64 KiB body, 20-event, 4 KiB metadata, safe path/referrer, timestamp, UUID, and bounded per-user-agent checks. It uses a server-only admin client and never stores raw IP or full user-agent.
- Migration `20260927061100_analytics_runtime.sql` adds preference keys, session activity, indexes, and atomic `ensure_analytics_session`. It preserves immutable first touch, updates attribution only on new sessions, and increments session count exactly once per new session.

## Evidence and gates

| Gate                        | Result                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Frozen install              | PASS (`pnpm install --frozen-lockfile`)                                                                                                    |
| Format                      | PASS                                                                                                                                       |
| Lint                        | PASS                                                                                                                                       |
| Typecheck                   | PASS                                                                                                                                       |
| Unit tests                  | PASS; 7 files / 17 tests                                                                                                                   |
| Database reset              | PASS after corrected migration; clean ordered reset                                                                                        |
| Database lint               | PASS                                                                                                                                       |
| pgTAP                       | PASS; 13 auth/RBAC assertions plus existing database contract assertions                                                                   |
| Generated DB types          | PASS; regenerated twice with no drift                                                                                                      |
| Local analytics integration | PASS; consent gating, rejection, acceptance, attribution, session reuse/timeout, dedupe, withdrawal, re-consent, and eight-way concurrency |
| Production web build        | PASS                                                                                                                                       |
| Playwright/axe              | PASS; 2 Chromium tests                                                                                                                     |
| Dependency audit            | PASS at high severity                                                                                                                      |
| Auth regression             | PASS for protected `/crm` route and bundle boundary; Packet 07 hosted email-login caveat remains documented separately                     |

## Runtime assertions

The local integration harness proves that unknown/denied/withdrawn consent persists zero analytics events; acceptance creates an anonymous visitor and first session; Instagram attribution is normalized; a second page reuses the session; duplicate event UUIDs do not increase row count; a forced timeout creates session two without changing first touch; withdrawal stops collection and clears both cookies; re-consent creates a new visitor; and eight concurrent first events produce one session rather than eight.

## Security and privacy boundary

No fingerprinting, cross-device identity, third-party pixels, country geolocation, CRM/person linking, scoring, form field values, raw IP, or raw user-agent is implemented. Public clients have no direct table grants. The service-role key remains server-only. Production still needs a distributed edge throttle, approved retention/legal policy, hosted Supabase verification, and observability.

## Final status

**PASS.** Packet 08 is complete and locally verified. Stop execution here; Packet 09 remains `NOT_STARTED` and requires a separate user instruction/review gate.
