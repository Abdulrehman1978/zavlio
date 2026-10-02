# Identity Resolution

Status: Packet 06 storage contract and integrity verification; resolution behavior is not enabled.

The schema separates visitors, sessions, provider identities, people, organizations, consents, events, and match candidates. Provider/user pairs are unique; candidate pairs are canonicalized and cannot self-match. Consent, event, and submission evidence remains traceable in JSONB.

Future deterministic auto-linking may use verified provider IDs or exact normalized contact evidence. IP, user-agent, name-only, timing, and fuzzy similarity are weak signals and must create review candidates, never automatic merges. Merge previews and decisions must be audited; source records remain traceable. No merge job or production policy is implemented here.

## Packet 09 deterministic boundary

## Packet 10 canonical merge rules

Identity candidates remain pending until an authorized reviewer acts. VIEWER cannot access the review queue; OPERATOR may view; ADMIN/OWNER may reject or merge. A merge preserves relations and provenance, ORs DNC, applies conservative lifecycle/attribution precedence, archives the source, and redirects source detail to the canonical survivor. Row locks and canonical checks make concurrent merges single-winner; a failed transaction rolls back all changes.

The only automatic person match is a case-insensitive exact canonical email identity. Name, company, website, browser, and free-email domain never merge people. Website organization matching requires an exact normalized website domain under an advisory transaction lock; company-only input may create a new organization but cannot fuzzy-match an existing one. If a consented visitor is already linked to another person, the form creates a pending `identity_match_candidates` record and preserves the existing visitor link.
