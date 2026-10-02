'use client';

import { useState, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

type Stage = { id: string; name: string; slug: string; is_closed: boolean };
type Staff = { id: string; name: string; role: string };
type Opportunity = {
  id: string | null;
  person_id: string | null;
  title: string | null;
  estimated_value: number | null;
  currency: string | null;
  probability: number | null;
  service_interest: unknown;
  owner_id: string | null;
  expected_close_date: string | null;
  updated_at: string | null;
};

async function request(path: string, method: string, body: unknown) {
  const response = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? 'Request failed');
}

export function OpportunityActions({
  opportunity,
  stages,
  staff,
  canMutate,
}: Readonly<{ opportunity: Opportunity; stages: Stage[]; staff: Staff[]; canMutate: boolean }>) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [stageId, setStageId] = useState('');
  const [lostReason, setLostReason] = useState('');

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await task();
      setMessage('Saved.');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };
  if (!canMutate) return null;
  return (
    <section className="crm-actions-panel" aria-labelledby="opportunity-actions-title">
      <h2 id="opportunity-actions-title">Opportunity actions</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const target = String(data.get('targetStage') || stageId);
          const reason = String(data.get('lostReason') || lostReason);
          const effectiveReason = reason && reason !== 'Not applicable' ? reason : undefined;
          void run(() =>
            request(`/api/crm/opportunities/${opportunity.id}/transition`, 'POST', {
              targetStageId: target,
              expectedUpdatedAt: opportunity.updated_at,
              lostReason: effectiveReason,
              reason: effectiveReason === 'OTHER' ? 'Other business reason' : undefined,
            }),
          );
        }}
      >
        <label htmlFor="target-stage">Move stage</label>
        <select
          id="target-stage"
          name="targetStage"
          value={stageId}
          onChange={(event) => setStageId(event.target.value)}
          disabled={!mounted || busy}
          required
        >
          <option value="">Select stage</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        <label htmlFor="lost-reason">Lost reason (required when moving to Lost)</label>
        <select
          id="lost-reason"
          name="lostReason"
          value={lostReason}
          onChange={(event) => setLostReason(event.target.value)}
          disabled={!mounted || busy}
        >
          <option value="">Not applicable</option>
          {['BUDGET', 'TIMING', 'NO_RESPONSE', 'COMPETITOR', 'NOT_FIT', 'INTERNAL', 'OTHER'].map(
            (reason) => (
              <option key={reason}>{reason}</option>
            ),
          )}
        </select>
        <button type="submit" className="crm-button" disabled={!mounted || busy}>
          Move opportunity
        </button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(() =>
            request(`/api/crm/opportunities/${opportunity.id}`, 'PATCH', {
              expectedUpdatedAt: opportunity.updated_at,
              title: data.get('title'),
              estimatedValue: data.get('value') || null,
              currency: data.get('currency'),
              probability: data.get('probability') ? Number(data.get('probability')) : null,
              serviceInterests: Array.isArray(opportunity.service_interest)
                ? opportunity.service_interest
                : [],
              ownerId: data.get('owner') || null,
              expectedCloseDate: data.get('close') || null,
            }),
          );
        }}
      >
        <label htmlFor="opportunity-title">Title</label>
        <input
          id="opportunity-title"
          name="title"
          defaultValue={opportunity.title ?? ''}
          maxLength={200}
          disabled={!mounted || busy}
          required
        />
        <label htmlFor="opportunity-value">Estimated value</label>
        <input
          id="opportunity-value"
          name="value"
          defaultValue={opportunity.estimated_value ?? ''}
          disabled={!mounted || busy}
          inputMode="decimal"
        />
        <label htmlFor="opportunity-currency">Currency</label>
        <input
          id="opportunity-currency"
          name="currency"
          defaultValue={opportunity.currency ?? 'INR'}
          minLength={3}
          maxLength={3}
          disabled={!mounted || busy}
          required
        />
        <label htmlFor="opportunity-probability">Manual sales probability</label>
        <input
          id="opportunity-probability"
          name="probability"
          type="number"
          min="0"
          max="100"
          disabled={!mounted || busy}
          defaultValue={opportunity.probability ?? ''}
        />
        <label htmlFor="opportunity-owner">Owner</label>
        <select
          id="opportunity-owner"
          name="owner"
          defaultValue={opportunity.owner_id ?? ''}
          disabled={!mounted || busy}
        >
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <label htmlFor="opportunity-close">Expected close</label>
        <input
          id="opportunity-close"
          name="close"
          type="date"
          defaultValue={opportunity.expected_close_date ?? ''}
          disabled={!mounted || busy}
        />
        <button type="submit" className="crm-button" disabled={!mounted || busy}>
          Save opportunity
        </button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void run(() =>
            request('/api/crm/tasks', 'POST', {
              personId: opportunity.person_id,
              opportunityId: opportunity.id,
              assignedTo: data.get('assignee') || null,
              title: data.get('taskTitle'),
              description: null,
              dueAt: data.get('due') ? new Date(String(data.get('due'))).toISOString() : null,
              priority: data.get('priority'),
            }),
          );
        }}
      >
        <label htmlFor="new-task-title">Create linked task</label>
        <input
          id="new-task-title"
          name="taskTitle"
          maxLength={200}
          disabled={!mounted || busy}
          required
        />
        <label htmlFor="new-task-assignee">Assignee</label>
        <select id="new-task-assignee" name="assignee" disabled={!mounted || busy}>
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <label htmlFor="new-task-due">Due time</label>
        <input id="new-task-due" name="due" type="datetime-local" disabled={!mounted || busy} />
        <label htmlFor="new-task-priority">Priority</label>
        <select
          id="new-task-priority"
          name="priority"
          defaultValue="NORMAL"
          disabled={!mounted || busy}
        >
          {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
        <button type="submit" className="crm-button" disabled={!mounted || busy}>
          Create task
        </button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
