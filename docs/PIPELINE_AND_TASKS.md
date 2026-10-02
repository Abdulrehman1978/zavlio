# Pipeline and Tasks

## Packet 17 operational closure

Stage/task concurrency and rollback evidence are release gates; production deployment must use the documented backup and forward-fix strategy.

Packet 12 reports created opportunities and Won/Lost transitions by their own timestamps, while current stage/value/task cards remain explicitly labelled snapshots. Closed win rate is Won divided by Won plus Lost transitions; open deals are excluded. Values are grouped by currency and null values remain unknown. Reopened outcomes stay in immutable transition history but leave the current closed-stage snapshot.

Packet 11 provides the operational pipeline at /crm/pipeline, opportunity detail at /crm/opportunities/[id], and workload management at /crm/tasks.

## Pipeline

The server-rendered Kanban and table share crm_pipeline_projection. Filters are bounded and allowlisted for stage, owner, intent, primary service, closed state, and text. Cards show value, person/organization, current score, intent, primary affinity, DNC, and next open task. The mobile Kanban stacks columns; tables become stacked rows without document overflow.

Seeded stable stages are New, Qualified, Discovery, Proposal, Negotiation, Won, and Lost. Stage IDs remain relational, while slugs drive business rules. Staff use a labeled select and submit button, so no drag interaction is required.

transition_opportunity_stage is SECURITY DEFINER and performs row lock, optimistic updated_at precondition, stage update, immutable history, person lifecycle side effect, and audit insert in one transaction. Lost requires BUDGET, TIMING, NO_RESPONSE, COMPETITOR, NOT_FIT, INTERNAL, or OTHER; OTHER also requires text. Won advances the person to CLIENT unless already CLIENT, RETURNING_CLIENT, or ARCHIVED. Reopening a closed opportunity requires ADMIN/OWNER. Two simultaneous transitions cannot silently overwrite each other.

Opportunity business fields use update_opportunity with the same row lock/precondition. Stage, person, and source cannot be changed through direct table update grants.

## Tasks

Task status is OPEN, IN_PROGRESS, COMPLETED, or CANCELLED. Priority is LOW, NORMAL, HIGH, or URGENT. Tasks may link a canonical person and opportunity, and may only be assigned to an active OWNER, ADMIN, or OPERATOR.

Overdue is derived server-side when status is active, due_at is earlier than current server UTC, and completion/cancellation has not occurred. Storage is UTC; UI display and Today boundaries use Asia/Kolkata. Completing sets completed_at once; reopening clears it. No task hard-delete control is exposed.

create_crm_task and update_crm_task are SECURITY DEFINER transactional boundaries with role checks, validation, optimistic concurrency, completion/reopen semantics, and audit events. Direct authenticated task writes are revoked.

## Permissions

| Capability                         | VIEWER | OPERATOR | ADMIN | OWNER |
| ---------------------------------- | ------ | -------- | ----- | ----- |
| View pipeline, opportunity, tasks  | Yes    | Yes      | Yes   | Yes   |
| Edit opportunity, move open stage  | No     | Yes      | Yes   | Yes   |
| Create/update/complete/reopen task | No     | Yes      | Yes   | Yes   |
| Reopen closed opportunity          | No     | No       | Yes   | Yes   |
| Recalculate one lead               | No     | Yes      | Yes   | Yes   |
| View scoring configuration         | No     | No       | Yes   | Yes   |

DNC is always visible and remains independent. Future outbound automation must check DNC/consent rather than infer permission from score or stage.

Packet 13 rechecks the related opportunity before execution. Closed opportunities block configured follow-up work; policy operations never change opportunity stage or create task spam. Manual-action jobs themselves represent automation attention.
