'use client';
import { useState } from 'react';
async function mutate(
  url: string,
  body: Record<string, unknown>,
  setMessage: (value: string) => void,
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    setMessage(String(result.error ?? 'Request failed'));
    return;
  }
  window.location.reload();
}
export function AutomationDecisionActions({
  jobId,
  version,
  canApprove,
}: {
  jobId: string;
  version: number;
  canApprove: boolean;
}) {
  const [message, setMessage] = useState('');
  if (!canApprove) return null;
  return (
    <section className="crm-actions-panel" aria-labelledby="decision-title">
      <h2 id="decision-title">Approval decision</h2>
      <p className="crm-note">
        Approval cannot override DNC, missing permission, changed policy, expired approval, or
        modified content.
      </p>
      <button
        className="crm-button"
        onClick={() =>
          void mutate(
            '/api/crm/automation/jobs/' + jobId + '/approve',
            { expectedVersion: version },
            setMessage,
          )
        }
      >
        Approve reviewed dry-run
      </button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const reason = new FormData(e.currentTarget).get('reason');
          void mutate(
            '/api/crm/automation/jobs/' + jobId + '/reject',
            { expectedVersion: version, reason },
            setMessage,
          );
        }}
      >
        <label>
          Rejection reason
          <input name="reason" minLength={3} maxLength={1000} required />
        </label>
        <button className="crm-button crm-button-danger">Reject</button>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
export function AutomationJobControls({
  jobId,
  version,
  status,
  canAdminister,
}: {
  jobId: string;
  version: number;
  status: string;
  canAdminister: boolean;
}) {
  const [message, setMessage] = useState('');
  if (!canAdminister) return null;
  if (status === 'MANUAL_ACTION_REQUIRED') {
    return (
      <form
        className="crm-actions-panel"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          void mutate(
            '/api/crm/automation/jobs/' + jobId + '/resolve-manual',
            {
              expectedVersion: version,
              resolution: form.get('resolution'),
              note: form.get('note'),
            },
            setMessage,
          );
        }}
      >
        <h2>Resolve manual action</h2>
        <p className="crm-note">
          Record what an authorized operator verified. Requeueing returns the job to the complete
          policy and approval checks; it does not execute an external action.
        </p>
        <label>
          Resolution
          <select name="resolution" defaultValue="RESOLVED_AND_REQUEUE">
            <option value="RESOLVED_AND_REQUEUE">Resolved — requeue safely</option>
            <option value="CANCEL">Cancel permanently</option>
          </select>
        </label>
        <label>
          Resolution note
          <textarea name="note" minLength={3} maxLength={1000} required />
        </label>
        <button className="crm-button">Record resolution</button>
        <p role="status">{message}</p>
      </form>
    );
  }
  if (!['QUEUED', 'AWAITING_APPROVAL', 'BLOCKED'].includes(status)) return null;
  return (
    <form
      className="crm-actions-panel"
      onSubmit={(event) => {
        event.preventDefault();
        const reason = new FormData(event.currentTarget).get('reason');
        void mutate(
          '/api/crm/automation/jobs/' + jobId + '/cancel',
          { expectedVersion: version, reason },
          setMessage,
        );
      }}
    >
      <h2>Cancel job</h2>
      <p className="crm-note">Cancellation is final and retained in the append-only job history.</p>
      <label>
        Cancellation reason
        <input name="reason" minLength={3} maxLength={1000} required />
      </label>
      <button className="crm-button crm-button-danger">Cancel job</button>
      <p role="status">{message}</p>
    </form>
  );
}
export function AutomationProposalForm({
  people,
}: {
  people: Array<{ id: string; display_name: string }>;
}) {
  const [message, setMessage] = useState('');
  return (
    <form
      className="crm-actions-panel"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void mutate(
          '/api/crm/automation/jobs',
          {
            personId: f.get('personId'),
            channel: f.get('channel'),
            action: f.get('action'),
            purpose: f.get('purpose'),
            text: f.get('text'),
            sourceReference: 'manual:' + crypto.randomUUID(),
            idempotencyKey: crypto.randomUUID(),
          },
          setMessage,
        );
      }}
    >
      <h2>Manual dry-run proposal</h2>
      <p className="crm-note">
        Creates policy evidence only. Packet 13 has no real external executor.
      </p>
      <label>
        Person
        <select name="personId" required>
          <option value="">Select</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Channel
        <select name="channel" defaultValue="EMAIL">
          {['EMAIL', 'INSTAGRAM', 'THREADS', 'FACEBOOK', 'LINKEDIN'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        Action
        <select name="action" defaultValue="SEND_EMAIL">
          {['SEND_EMAIL', 'DM', 'REPLY', 'COMMENT', 'LIKE', 'FOLLOW', 'CONNECT', 'PUBLISH'].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      <label>
        Purpose
        <select name="purpose" defaultValue="SALES_FOLLOW_UP">
          {['MARKETING', 'SALES_FOLLOW_UP', 'INBOUND_REPLY', 'TRANSACTIONAL', 'RELATIONSHIP'].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      <label>
        Proposed plain-text content
        <textarea name="text" maxLength={4000} required />
      </label>
      <button className="crm-button">Evaluate and propose</button>
      <p role="status">{message}</p>
    </form>
  );
}
export function SafePolicyForm({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState('');
  return (
    <form
      className="crm-actions-panel"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void mutate(
          '/api/crm/automation/policy',
          { name: f.get('name'), enabled: f.get('enabled') === 'on' },
          setMessage,
        );
      }}
    >
      <h2>Create and activate a safe policy version</h2>
      <p className="crm-note">
        Packet 13 forces dry run and human approval. Disabling either is rejected at the database
        boundary.
      </p>
      <label>
        Version name
        <input
          name="name"
          defaultValue="Reviewed dry-run policy"
          minLength={3}
          maxLength={120}
          required
        />
      </label>
      <label className="zavlio-check">
        <input name="enabled" type="checkbox" defaultChecked={enabled} />
        Enable dry-run simulation
      </label>
      <button className="crm-button">Activate new version</button>
      <p role="status">{message}</p>
    </form>
  );
}
