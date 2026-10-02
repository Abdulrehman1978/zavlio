# Privacy and Consent

## Packet 17 operational closure

Retention, export, correction, anonymization, and suppression-history procedures are documented in DATA_RETENTION.md; no automatic destructive purge is enabled.

Packet 12 tracked-traffic reports contain only the consented first-party population from Packet 08. They never claim total website traffic. Non-consent form leads remain present in total business/CRM metrics but are excluded from tracked-funnel downstream numerators. Aggregate reporting does not change consent, DNC, scores, sessions, or customer records.

Status: Packet 08 anonymous first-party analytics implementation; legal policy, retention, and subject workflows still require approval.

Analytics is opt-in at the browser boundary. Essential application behavior remains available without analytics. The preference endpoint is `POST /api/analytics/consent`; analytics ingestion is `POST /api/analytics/events`.

- Consent states are `UNKNOWN`, `ESSENTIAL_ONLY`, `ANALYTICS_ALLOWED`, `ANALYTICS_DENIED`, and `WITHDRAWN`.
- `zv_consent` is a readable first-party preference cookie containing state, consent UUID, and policy `2026-09-v1`; it lasts 180 days. `zv_vid` is a random first-party UUID with a 180-day TTL. `zv_sid` is a random session UUID with a 30-minute inactivity TTL.
- Acceptance creates a preference history row and the browser issues a visitor UUID. Rejection creates history but no visitor ID. Withdrawal appends history, clears visitor/session cookies and queued events, and does not delete historical database evidence. Reacceptance receives a new visitor ID.
- GPC is honored as analytics denial when no explicit consent cookie exists. DNT is not treated as a reliable legal preference and is not independently interpreted; the visible controls remain authoritative.
- Cookies are `SameSite=Lax`; `Secure` is set over HTTPS. No raw IP or full user-agent is stored, and country is not inferred by geolocation.

`consents` is append-oriented and may contain multiple records over time for a person or anonymous visitor, with purpose flags, policy version, source, evidence, capture time, and withdrawal time. It does not collapse history into one mutable row. Events, sessions, identities, submissions, and CRM rows are personal/operational data; audit logs and consent history are compliance evidence.

Packet 13 enforces DNC as a non-overridable proactive-outbound block and evaluates configured purpose/channel permission independently at proposal, approval, claim, and execution. Analytics consent is not marketing consent; a business enquiry is not a marketing subscription; score does not authorize outreach. Unknown/withdrawn required permission blocks, including after approval. These controls are technical safeguards, not legal advice; lawful-basis mappings and retention still require qualified approval.

## Packet 09 intake privacy

## Packet 10 CRM privacy controls

DNC is a global suppression flag distinct from analytics consent. Setting DNC is available to OPERATOR+; clearing requires ADMIN/OWNER, a reason, and an audit event. Consent history remains read-only in CRM detail. Browser/session provenance is shown as source-linked history, not copied into unrestricted raw payload dumps.

Forms may create CRM state without analytics consent. Visitor cookies/history are read and linked only with valid analytics consent; no-consent submissions preserve no visitor or event history. Form intake is not marketing subscription and does not trigger abandoned-form outreach. Do-not-contact suppresses campaign use while permitting transactional acknowledgement required to confirm receipt.

## Packet 11 derived intelligence

Lead scoring uses CRM facts and consented analytics that are already collected and linked to the canonical person. A score and service affinity are internal operational derived data. They do not create marketing consent, authorize contact, or override do-not-contact. DNC and consent remain independent and must win in every future outbound workflow.

# Packet 16 social privacy

Social observation is bounded to identity, conversation, message, and relationship context. Inbound history may be recorded without changing DNC; proactive reply proposals are suppressed for DNC or missing/withdrawn social consent. Raw page HTML, browser storage, credentials, arbitrary files, and private screenshots are not ingested.
