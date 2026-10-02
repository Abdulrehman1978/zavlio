# Automation Policy

## Packet 17 operational closure

Production policy remains approval-required and dry-run; the social live kill switch and provider/canary gates are independent and default off.

Packet 13 establishes policy version 1 as the authoritative control-plane contract. A fresh reset creates one immutable active policy with `enabled=false`, `dryRun=true`, `approvalRequired=true`, and empty allowed channel/action lists. Packet 13 cannot activate a non-dry-run or approval-free policy.

## Stable model

- Purposes: `MARKETING`, `SALES_FOLLOW_UP`, `INBOUND_REPLY`, `TRANSACTIONAL`, `RELATIONSHIP`, `INTERNAL`.
- Logical channels: `EMAIL`, `INSTAGRAM`, `THREADS`, `FACEBOOK`, `LINKEDIN`, `INTERNAL`. A key does not prove integration availability.
- Actions: `SEND_EMAIL`, `DM`, `REPLY`, `COMMENT`, `LIKE`, `FOLLOW`, `CONNECT`, `PUBLISH`, `CREATE_TASK`, `FLAG_FOR_REVIEW`, `NOOP`.
- Actions are classified `EXTERNAL_SIDE_EFFECT` or `INTERNAL_ONLY`, with stable `LOW`, `MEDIUM`, or `HIGH` risk.

## Evaluation order

`evaluateAutomationPolicy(context, policy, asOf)` is pure and deterministic. Database fact extraction is separate. Proposal, approval, claim, and execution boundaries persist decisions and stable reason codes. Hard blocks include missing/noncanonical/archived people, proactive DNC, missing or withdrawn configured permission, disabled channel/action/purpose, closed opportunity, semantic duplicate, changed content/policy, and unavailable integration/agent. Working hours defer to the next valid IANA-timezone window. Cooldowns and rolling daily/weekly person, channel, and action caps reserve pending work so concurrent proposals cannot evade limits.

DNC is a hard suppression for proactive outbound and cannot be overridden by approval, score, stage, campaign, or worker. Inbound/transactional treatment is purpose-specific and is not a legal conclusion. Unknown permission blocks whenever the active purpose/channel rule requires permission. Analytics consent is not marketing consent, and a business enquiry is not a marketing subscription.

Lead score is context only and never permission. Opportunity state is rechecked. Merged-source jobs are blocked and never silently rebound to the canonical person.

## Approval and integrity

External work defaults to approval. ADMIN and OWNER can approve/reject; OWNER alone activates a new policy version. Decisions are immutable history. Approval is bound to job version, content hash, and policy version and expires after the configured validity window. Content, policy, consent, DNC, person, opportunity, counters, agent, and time are re-evaluated at the last safe moment. Approval is never an execution token that bypasses policy.

## Execution safety

Technical idempotency uses the job idempotency key; semantic duplication uses person/channel/action/purpose/content and source references. Atomic claiming uses `FOR UPDATE SKIP LOCKED`, an enabled recent agent, and a bounded lease. Expired claims are recovered without erasing history. Retries are bounded and back off. Permanent failures stop. Security checkpoints, CAPTCHA, authentication/identity challenges, and unknown external outcomes enter `MANUAL_ACTION_REQUIRED`; they are never automatically bypassed or blindly retried.

Dry run executes only the local no-side-effect executor and completes as `DRY_RUN_COMPLETED`. It is never described as contact. No real channel executor exists in Packet 13.

Packet 15 keeps the same policy contract for the adapter: only negotiated `DRY_RUN_ONLY` social capabilities can be claimed, approval remains required, and Packet 13 is still the final policy authority. The adapter never invokes upstream business planning or identity state; it receives an already-approved target and immutable content hash.

Packet 15 keeps the same policy contract for the adapter: only negotiated `DRY_RUN_ONLY` social capabilities can be claimed, approval remains required, and Packet 13 is still the final policy authority. The adapter never invokes upstream business planning or identity state; it receives an already-approved target and immutable content hash.

# Packet 16 policy preservation

Social inbound sync does not imply outreach. DNC, consent, working hours, cooldowns, frequency caps, approval, policy version, merged-person, and closed-opportunity checks remain Packet 13 gates. A canary permit can only narrow eligibility and is never an override.
