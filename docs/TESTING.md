# Testing

Packet 14 adds `meta_bridge_protocol_test.sql`, deterministic canonical/HMAC vectors, bridge configuration/health/live-action refusal tests, and `pnpm test:integration:bridge`. The integration harness launches a temporary Next.js control plane and the compiled Bridge, then exercises handshake/capability negotiation, current/previous keys, bad secret/key, body/path tampering, timestamp, oversized/query rejection, nonce races, operation conflicts, claim/lease/start/result retries, agent isolation, one-agent/two-agent concurrency, result classifications, health/readiness, redaction, and graceful shutdown.

`pnpm test:integration:automation` remains the authoritative policy recheck matrix for DNC, consent, policy/content/approval changes, merge, closed opportunity, recovery, transient/manual/unknown outcomes, and disabled agents. Browser automation coverage verifies protocol state in the existing CRM UI with axe and mobile containment.

## Implemented Packet 01

- Vitest 5 with jsdom and React Testing Library.
- Environment default/rejection/integration-secret/public-separation tests.
- Safe typed-error/public-redaction tests.
- Temporary homepage render test.
- Meta Bridge start/health/clean-stop test.
- Playwright Chromium homepage/content/fatal-client-error smoke test.
- Axe integration on the minimal homepage shell.
- CI runs frozen install, format, lint, typecheck, unit tests, build, Chromium install, and E2E.
- The compiled Meta Bridge was also started manually, answered `/health`, and stopped cleanly under SIGINT.

Packet 01 result: 4 test files and 8 Vitest tests passed; 1 Playwright/axe test passed. This automated shell scan is not a claim of full WCAG compliance.

Future packets must add feature, integration, RLS, responsive, visual-regression, performance, security, and manual accessibility evidence.

## Packet 11

Unit tests cover configuration validation, caps, occurrence, funnel suppression, decay/lookback, thresholds, affinity separation/ties, and deterministic output. pgTAP covers the model table, projections, RPCs, grants, RLS, and indexes. The live operations harness covers exact scoring/history, role matrix, Lost/Won/reopen, stage concurrency, inactive assignment, task completion/reopen, and nonstaff denial. Playwright covers OPERATOR, ADMIN, VIEWER, score detail/recalculation, axe, and 390×844 overflow. The disposable performance harness measures 1,000 opportunities, 2,000 tasks, and a 100-person scoring batch.
