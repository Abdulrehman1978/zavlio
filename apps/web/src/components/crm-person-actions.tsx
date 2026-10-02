'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

const emptySubscribe = () => () => {};

async function send(path: string, body: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error ?? 'Request failed');
  return result;
}

export function PersonActions({
  personId,
  canClearDnc,
  canRecalculate,
}: Readonly<{ personId: string; canClearDnc: boolean; canRecalculate: boolean }>) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [clearReason, setClearReason] = useState('');

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setMessage('');
    try {
      await task();
      setMessage('Saved.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="crm-actions-panel">
      <h2>Operational actions</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(() => send(`/api/crm/people/${personId}/notes`, { body: note }));
          setNote('');
        }}
      >
        <label htmlFor="crm-note">Add internal note</label>
        <textarea
          id="crm-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={10000}
          rows={4}
          disabled={!mounted || busy}
          required
        />
        <button type="submit" className="crm-button" disabled={!mounted || busy}>
          Add note
        </button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(() => send(`/api/crm/people/${personId}/dnc?value=true`, { reason }));
        }}
      >
        <label htmlFor="crm-dnc-reason">Set do-not-contact reason</label>
        <input
          id="crm-dnc-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          disabled={!mounted || busy}
          required
        />
        <button type="submit" className="crm-button crm-button-danger" disabled={!mounted || busy}>
          Set do not contact
        </button>
      </form>
      {canClearDnc && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(() =>
              send(`/api/crm/people/${personId}/dnc?value=false`, { reason: clearReason }),
            );
          }}
        >
          <label htmlFor="crm-clear-dnc-reason">Clear suppression reason</label>
          <input
            id="crm-clear-dnc-reason"
            value={clearReason}
            onChange={(event) => setClearReason(event.target.value)}
            maxLength={500}
            disabled={!mounted || busy}
            required
          />
          <button type="submit" className="crm-button" disabled={!mounted || busy}>
            Clear suppression
          </button>
        </form>
      )}
      {canRecalculate && (
        <button
          type="button"
          className="crm-button"
          disabled={!mounted || busy}
          onClick={() => void run(() => send(`/api/crm/people/${personId}/score`, {}))}
        >
          Recalculate lead score
        </button>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
