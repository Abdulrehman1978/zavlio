# Data retention matrix

Retention is an operational proposal subject to business, privacy, and legal approval. No automatic destructive purge is enabled by this packet.

| Category                                | Purpose                           | Default handling                                             |
| --------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| Analytics events and anonymous sessions | Product measurement               | bounded TTL configuration; consent-aware                     |
| Form submissions and outbox rows        | Lead intake and delivery evidence | retain for operational review; purge only by approved policy |
| CRM people, organizations, identities   | Relationship source of truth      | explicit reviewed correction/anonymization                   |
| Conversations and messages              | Unified timeline                  | bounded access; preserve suppression context                 |
| Notes and opportunities                 | Operations/revenue history        | explicit reviewed retention                                  |
| Consent and DNC history                 | suppression and consent evidence  | preserve history; do not erase solely with profile deletion  |
| Automation jobs, actions, nonces, audit | safety and accountability         | expire operational nonces; retain audit/security evidence    |
| Social observations                     | normalized provider evidence      | bounded payloads and provider policy                         |
| Logs                                    | diagnostics                       | redacted, access-controlled, bounded retention               |

Data-subject export, correction, deletion, or anonymization is an internal reviewed operation. Audit, financial, security, consent, and suppression evidence is not automatically cascaded away.
