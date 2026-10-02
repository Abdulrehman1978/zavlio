# Risks

## Packet 17 operational closure

The largest remaining risks are the failing pgTAP/Packet 08–13 regressions and
the fact that social identity observations are not repointed when a person is
merged. Hosted Auth, SMTP, Turnstile, observability, deployment, and
authenticated social evidence remain explicit external dependencies.

## Packet 14

- HMAC key compromise permits machine impersonation until the key is disabled/rotated. Mitigation: per-agent keys, server/Bridge-only secret storage, bounded previous key, generic failures, agent disablement, and no database credential in the Bridge.
- Process-local request throttling does not coordinate across replicas. A production edge/distributed limit is required before scaling the machine API.
- Clock drift over five minutes rejects valid traffic. Hosts require reliable time synchronization and monitoring of recorded skew.
- A lost or ambiguous external result must never be retried automatically. Packet 14 maps unknown outcomes to manual action, but real external behavior remains unimplemented until Packet 15+.

| ID    | Risk                                                       | Likelihood | Impact   | Mitigation / gate                                                                                         |
| ----- | ---------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------- |
| R-001 | Approved design/assets are missing                         | High       | High     | Block Packet 02 fidelity claims; obtain export/provenance                                                 |
| R-002 | Production content contains unverified claims              | High       | High     | Claim states, production guard, owner review                                                              |
| R-003 | RLS/RBAC gaps expose CRM data                              | Medium     | Critical | Deny-by-default matrix, negative tests, security review                                                   |
| R-004 | Identity resolution creates false merges                   | Medium     | High     | Deterministic-only auto-link, candidate review, audited merge preview                                     |
| R-005 | Consent/DNC is bypassed by automation                      | Medium     | Critical | Central eligibility policy enforced at creation and execution                                             |
| R-006 | Social UI/security checkpoints break automation            | High       | High     | Pinned adapter, explicit failures, approval/dry-run, manual-action state                                  |
| R-007 | Motion/media harms Core Web Vitals or accessibility        | Medium     | High     | Budgets, dynamic imports, reduced/static/mobile fallbacks                                                 |
| R-008 | Restore/rollback is documented but not viable              | Medium     | High     | Staging rehearsal before release gate                                                                     |
| R-009 | Merged person leaves social observation on archived source | High       | High     | Repoint social_identity_observations and rerun Packet 16/17R materialization regression                   |
| R-009 | Missing environments/credentials delay integration         | High       | Medium   | Dependency checklist and staged simulators without false verification                                     |
| R-010 | Scope breadth causes oversized packets                     | High       | High     | Decompose each packet into 2–8 hour tasks and review gates                                                |
| R-011 | Local Docker/Supabase availability can vary                | Medium     | Medium   | Packet 06R passed on Docker Desktop; rerun the runtime gate in each new environment before schema changes |
| R-012 | Generated type snapshot drifts from migrations             | Medium     | High     | Run `pnpm db:types` against a clean database and review the generated diff before enabling data access    |
| R-013 | Process-local analytics throttle is not distributed        | Medium     | Medium   | Add edge/platform rate limiting and metrics before production traffic                                     |
| R-014 | Consent retention/legal periods are not approved           | High       | High     | Obtain privacy/legal approval before production collection or retention changes                           |

## Packet 09 risks

## Packet 10 residual risks

Large CRM datasets will eventually need keyset pagination and likely trigram/search infrastructure; the current bounded indexed ILIKE path is intentionally conservative. Merge field precedence is documented but should gain product-level review before lifecycle automation. Browser history remains shared provenance and is not a separate analytics dashboard.

The in-memory rate limiter is intentionally bounded but is not distributed across multiple web instances. Turnstile and SMTP are external dependencies. Shared-browser identity conflicts are retained for review rather than auto-merged. These are tracked limitations, not silent fallbacks.

## Packet 11 risks

- Score configuration changes can change commercial prioritization. Mitigation: immutable versions, configuration hash, one-active constraint, read-only settings UI, and deterministic fixtures.
- Behavioral data can overstate intent. Mitigation: 90-day bounds, decay, occurrence/caps, form-step suppression, exact reasoning, and declared/behavioral separation.
- Concurrent sales edits can overwrite work. Mitigation: row locks, expected updated_at preconditions, append-only stage history, and runtime concurrency tests.
- Scores could be mistaken for outreach permission. Mitigation: DNC/consent remain independent and are displayed/documented as authoritative.

## Packet 12 risks

- Consent-gated traffic can be mistaken for all traffic. Mitigation: every tracked view carries an explicit consent/browser-identity caveat.
- Estimated opportunity value can be mistaken for revenue. Mitigation: no Revenue KPI; labels and dictionary explicitly reject that interpretation.
- Attribution can be mistaken for causality. Mitigation: first/latest/self-reported models remain separate and descriptive.
- Production scale is unknown. Mitigation: bounded ranges, top-N aggregates, report indexes, timing logs, and a disposable 10,000-event benchmark.

## Packet 13 risks

- A future channel adapter could create duplicate side effects after an ambiguous timeout. Mitigation: execution keys, final recheck, and `MANUAL_ACTION_REQUIRED` for unknown outcomes rather than automatic retry.
- Policy or consent may change after approval. Mitigation: approvals bind policy/content versions and eligibility is rechecked at claim/start.
- Worker crashes can strand work. Mitigation: bounded leases, append-only events, and explicit expired-lease recovery.
- Legal-basis configuration is not legal advice. Mitigation: disabled-by-default policy and qualified review before any real channel is enabled.

## Packet 15 risks

- The pinned commit is unsigned and may evolve rapidly outside this exact revision; mitigate with detached SHA/tree and hash verification.
- Upstream platform mappings/configuration are inconsistent (including Instagram remnants); mitigate with an explicit THREADS/FACEBOOK/LINKEDIN matrix and no Instagram claim.
- Browser UI changes, prompt injection, local session exposure, CDP exposure, and upstream auto-dialog behavior can create unsafe outcomes; mitigate with local-CDP/origin/target/content guards, dialog dismissal, no page-driven planning, and evidence minimization.
- Upstream telemetry/logger modules load transitively with the semantic agent and may expose content or spawn external tools; mitigate by redirecting paths, not ingesting raw output, redacting stderr, and allowlisting child environment. Upstream state/AI authorities remain out of the normal path.
- Platform account restrictions, terms, rate limits, and future ambiguous outcomes remain external risks; no real social execution is enabled.

## Packet 15R.1 closure

- Stale or reordered browser DOM could otherwise redirect a primitive to an unrelated control; mitigation: synthetic provider semantic IDs, explicit target/action binding, and re-resolution before each TYPE/CLICK.
- Queued cancellation could otherwise execute after ABORT or STOP; mitigation: per-job cancellation generations, global stopping latch, active AbortController, bounded child termination, and harness regressions.
- Supplied identifiers could disagree with browser proof; mitigation: all supplied username, stable ID, profile path, and conversation ID must agree or fail closed.

## Packet 16 social risks

- Platform UI and semantic target drift can produce missing or ambiguous evidence; providers fail closed and never downgrade to fuzzy clicks.
- Conversation parsing, direction, timestamp, and fallback message keys can drift; provider IDs are preferred and collision limitations are documented.
- Account restrictions, security checkpoints, session expiry, and provider verification uncertainty map to manual handling or unknown outcome.
- Browser automation may conflict with platform terms; no evasion, CAPTCHA bypass, account rotation, or official API claim is made.
