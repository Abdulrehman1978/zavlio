# Social integration

## Packet 17 operational closure

Provider observation is separate from live execution. Production defaults keep live execution false and require policy, approval, kill switch, target proof, and a one-use permit.

Packet 16 adds a controlled social context layer for Threads, Facebook, and LinkedIn. It does not turn on a bot, claim official API support, or make an upstream agent authoritative.

## Support and rollout

| Platform  | Provider                                      | Version              | Default readiness    | Live execution |
| --------- | --------------------------------------------- | -------------------- | -------------------- | -------------- |
| Threads   | isolated target/profile/conversation provider | THREADS_PROVIDER_V1  | PROVIDER_IMPLEMENTED | disabled       |
| Facebook  | isolated target/profile/conversation provider | FACEBOOK_PROVIDER_V1 | PROVIDER_IMPLEMENTED | disabled       |
| LinkedIn  | isolated target/profile/conversation provider | LINKEDIN_PROVIDER_V1 | PROVIDER_IMPLEMENTED | disabled       |
| Instagram | unsupported                                   | —                    | UNIMPLEMENTED        | unavailable    |

Providers are independently enabled and observed. A platform can reach READ_ONLY_VERIFIED or CANARY_READY only after authenticated, bounded evidence. No platform is marked live by installation.

## Provider architecture

SocialPlatformProvider is the boundary between normalized browser evidence and the generic control plane. Provider modules own origin checks, authentication state, target proof, exact composer/action binding, profile extraction, conversation extraction, and action verification. The generic executor does not contain platform selectors or fallback clicks.

The current deterministic implementation is SyntheticFixtureSocialProvider plus three platform-specific classes. It consumes normalized page snapshots and ignores body text as target authority. Packet 16 does not claim authenticated real-site compatibility because no authorized test account was available.

## Identity and conversations

Observed provider identities are normalized by provider, stable ID, canonical profile path, or username. A known confirmed identity links to the canonical person; a merged identity resolves through the canonical survivor. Ambiguous identities create a review candidate. Unknown identities remain unresolved. Names, companies, headlines, photos, and model similarity never auto-merge people.

Conversation keys use the provider conversation/thread ID where available, otherwise a documented bounded platform/participant key. Message keys prefer provider message IDs and otherwise use conversation, sender, timestamp, and normalized body hash. Repeated ingestion is idempotent. Inbound messages are stored as plain text with bounded links/attachment metadata; raw HTML, arbitrary files, cookies, and page bodies are not stored.

Inbound messages can update a conversation, touchpoint, and last activity. They do not create an opportunity or outbound job automatically. DNC suppresses proactive outbound but does not prevent recording inbound history.

## Reply flow and control

Conversation UI proposes a Packet 13 job. It never calls a browser adapter directly. Packet 13 policy, consent, DNC, approval, Packet 14 signed start, and Packet 15R.1 exact binding remain authoritative. Typing approved content into a real composer is prohibited before STARTED.

After start, the provider rechecks auth/security state, all supplied target identifiers, and the exact commit control immediately before any external primitive. A click is not success: VERIFIED_SUCCESS requires provider-specific evidence. An unverifiable result is OUTCOME_UNKNOWN and is never automatically replayed.

## Canary and kill switch

Live execution is disabled by default. A server/control-plane canary permit is one-use, target/action bound, expiring, and atomically consumed. OWNER-only configuration, Packet 13 eligibility, human approval, Packet 14 start, provider proof, and a global live kill switch are all required. A first canary would stop for manual inspection and would not broaden rollout automatically. No live canary was performed in Packet 16.

## Privacy and limitations

Only staff-authenticated CRM users may view social context through RLS. The system does not automate login, MFA, OTP, CAPTCHA, checkpoints, account rotation, evasion, or rate-limit circumvention. Browser automation may be restricted by platform terms and UI drift remains an external risk. Social browser observations are separate from first-party website analytics.
