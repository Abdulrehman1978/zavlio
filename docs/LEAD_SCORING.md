# Lead Scoring

## Packet 17 operational closure

Scoring remains versioned and unchanged; stale recalculation belongs to the scheduled maintenance process and never grants outreach permission.

Packet 11 enables deterministic, versioned lead intelligence. The active production model is ZAVLIO_LEAD_V1; it scores 0–100 from first-party CRM and consented analytics signals already associated with the canonical person.

Packet 12 reporting pins current score distribution and source-quality aggregates to `ZAVLIO_LEAD_V1`. Unscored people are reported separately rather than treated as zero; stale means the latest current-model snapshot is older than 24 hours. Historical daily score interpolation is not performed.

## Model storage and activation

lead_scoring_models stores immutable model key/version pairs, validated JSON configuration, its hash, active state, activation time, and creator. A partial unique index permits exactly one active model. ADMIN/OWNER may read configuration; normal staff cannot edit it. Activation is a controlled database change in this packet. Historical models and lead_scores snapshots remain available.

The shared pure TypeScript engine in packages/crm/src/scoring.ts accepts signals, configuration, and an explicit calculation time. It performs no I/O and produces stable score, intent, affinity, component, and reasoning output.

## Score bands

| Intent     | Minimum |
| ---------- | ------: |
| LOW        |       0 |
| INTERESTED |      25 |
| WARM       |      50 |
| HIGH       |      70 |
| PRIORITY   |      85 |

Scores are clamped to 0–100. Lifecycle, DNC, and consent are separate state: a high score does not authorize contact, change lifecycle, or override suppression.

## Signals, weights, occurrence, and caps

| Stable signal                  | Points | Occurrence            | Cap |      Affinity |
| ------------------------------ | -----: | --------------------- | --: | ------------: |
| homepage_viewed                |      1 | per session           |   3 |             — |
| service_viewed                 |      5 | distinct service      |  20 | 15 behavioral |
| second_service_viewed          |      4 | once                  |   4 |             — |
| project_viewed                 |      7 | distinct project      |  21 | 12 behavioral |
| multiple_projects_viewed       |      5 | once                  |   5 |             — |
| return_session                 |      8 | each distinct session |  24 |             — |
| start_project_opened           |     15 | once                  |  15 |             — |
| project_form_started           |     20 | once                  |  20 |             — |
| project_form_submitted         |     40 | once                  |  40 |   50 declared |
| contact_form_submitted         |     30 | once                  |  30 |   35 declared |
| budget_supplied                |     10 | once                  |  10 |             — |
| high_value_service_combination |     10 | once                  |  10 |   10 declared |
| repeat_engagement_7d           |     10 | once                  |  10 |             — |

Refresh spam is bounded by per-session, once, distinct-entity, and hard-cap rules. A submitted project form suppresses start_project_opened and project_form_started for the same scoring window so funnel steps cannot inflate a completed enquiry. Event and session reads are bounded to 90 days and hard query limits.

## Lookback and decay

Behavioral and engagement signals use a 90-day lookback and age multiplier: 0–7 days 100%, 8–14 90%, 15–30 75%, 31–60 50%, 61–90 25%, older 0%. Declared/commercial form signals do not decay in this version. Effective values are rounded deterministically after caps and decay.

## Service affinity

Stable keys are strategy, brand, design, web, technology, ai_automation, ecommerce, growth, and content. Declared and behavioral maps remain separate, with a combined map used only to choose primary and secondary affinities. Equal combined values resolve alphabetically. Arbitrary URLs never become affinity keys.

Packet 13 may display current score/intent as context, but policy never converts score into permission. DNC, consent, purpose, time, caps, opportunity state, approval, and final revalidation remain independent and authoritative.

## Extraction, reasoning, and history

Signal extraction resolves the canonical person and reads bounded events, sessions, and processed forms through the signed-in staff member's RLS client. The elevated client is restricted to persist_lead_score; it cannot broaden CRM source reads. Each reason records signal key, occurrence count, source identifiers, base/cap, decay, and effective points, plus configuration hash and calculation time.

lead_scores is append-only for authenticated users. Normal recalculation skips an unchanged score, intent, model, and affinity snapshot using structural JSON equality; a forced manual snapshot is available to trusted server workflows. crm_current_lead_score selects the latest row and marks it stale after 24 hours. Opening a person page never recalculates.

## Recalculation

- OPERATOR+ can recalculate one person from /crm/people/[id] or POST /api/crm/people/[id]/score.
- pnpm leads:recalculate -- --person UUID recalculates one person.
- pnpm leads:recalculate -- --stale --limit 100 --batch-size 50 performs bounded batch work.
- --dry-run computes without persistence.

Packet 09's PACKET_09_INTAKE_V1 snapshot remains historical. The next explicit Packet 11 recalculation appends ZAVLIO_LEAD_V1; it does not rewrite the intake row.

## Limitations

Version 1 has no negative signals, asynchronous score queue, hosted scheduler, or automated model editor. It intentionally uses local/CLI batch recalculation at current scale. Model activation remains a reviewed database operation.
