# CRM Operations

## Packet 17 operational closure

Operational recovery follows the incident and deployment runbooks; failed email/automation work remains durable and idempotent rather than being hidden in request threads.

Packets 10–11 deliver the usable CRM workspace while keeping the visual branch neutral.

## Navigation and search

`/crm/people` supports bounded search across person name/email, organization, and identity username/email/provider. Filters cover lifecycle, intent, source, organization, DNC, and allowlisted sort order. Results are page-sized at 25 with a maximum page boundary of 200. `/crm/organizations` provides the corresponding bounded organization index.

## Person detail and timeline

`/crm/people/[id]` shows overview fields, attribution, score snapshot, forms/enquiries, identities, consent, DNC state, notes, opportunities, tasks, conversations/messages, and linked website history. Timeline rows are typed categories with `(occurred_at,id)` cursor semantics and a bounded server query.

## Identity review and merge

`/crm/settings/identity-review` hides the queue from VIEWER. OPERATOR can inspect candidates; ADMIN/OWNER can reject or confirm a merge. Merge confirmation calls one transaction, locks both people, preserves/reparents relations, archives the source, records `person_merges` and `PERSON_MERGED`, and makes the source route redirect to the canonical survivor.

## DNC and notes

OPERATOR+ can set DNC with a reason. Only ADMIN/OWNER can clear it, also with a reason and audit event. Notes are internal and immutable in this packet; OPERATOR/ADMIN/OWNER can create them, while VIEWER is read-only.

## Lead intelligence

Person detail shows current score, intent, model, calculation time, primary/secondary service affinity, declared versus behavioral evidence, exact top reasons, and prior-score delta. OPERATOR+ may request one deterministic recalculation; opening the page has no scoring side effect. ADMIN/OWNER can inspect the active configuration at /crm/settings/lead-scoring.

## Pipeline and tasks

/crm/pipeline offers bounded Kanban/table views with score, affinity, DNC, owner, value, and next-action context. /crm/opportunities/[id] provides guarded edits, keyboard-operable stage transitions, immutable history, Lost/Won/reopen rules, and linked task creation. /crm/tasks provides Mine/All/Overdue/Today/Upcoming/Completed/Unassigned scopes, priority filters, Asia/Kolkata display, derived overdue state, and guarded completion/reopen.

Full rules are in docs/LEAD_SCORING.md and docs/PIPELINE_AND_TASKS.md.

## Scope boundary

## Analytics interpretation

Packet 12 delivers `/crm/analytics`. First touch describes acquisition, latest touch describes a session, and self-reported source is a separate intake claim. An enquiry is a form submission; a lead/person is canonical identity; an opportunity is a deal. Current score and pipeline/task cards are snapshots, while created/completed/Won/Lost values use period timestamps. Open pipeline value and Won opportunity value are estimated deal values, never revenue. Scores express modeled intent, not outreach permission or business outcome.

Conversation workspace remains later work. Packet 13 now provides automation proposal, policy evaluation, approval, cancellation, queue/lease status, dry-run simulation, and manual-action resolution. It does not provide real external execution or a production scheduler.

# Packet 16 social operations

Conversation sync is bounded and idempotent. A repeated provider sync must not duplicate conversations, messages, or touchpoints. Confirmed merged identities resolve to the canonical survivor. Operational staff may review context; only the existing approval/policy flow can create outbound jobs.
