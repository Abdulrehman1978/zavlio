'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function IdentityActions({
  candidateId,
  sourceId,
  targetId,
  canMerge,
}: Readonly<{ candidateId: string; sourceId: string; targetId: string; canMerge: boolean }>) {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const reject = async () => {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/crm/identity-candidates/${candidateId}/reject`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Reject failed');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reject failed');
      setBusy(false);
    }
  };
  const merge = async () => {
    if (
      !window.confirm(
        'Merge the source person into the selected survivor? This is audited and cannot be undone from the UI.',
      )
    )
      return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/crm/identity-candidates/${candidateId}/merge`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetPersonId: targetId, candidateId, reason }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Merge failed');
      router.push(`/crm/people/${targetId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Merge failed');
      setBusy(false);
    }
  };
  return (
    <div className="crm-candidate-actions">
      <label htmlFor={`reason-${candidateId}`}>
        Review reason
        <input
          id={`reason-${candidateId}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          required
        />
      </label>
      <div>
        <button className="crm-button" onClick={() => void reject()} disabled={busy || !reason}>
          Reject match
        </button>
        {canMerge && (
          <button
            className="crm-button crm-button-danger"
            onClick={() => void merge()}
            disabled={busy || !reason}
          >
            Merge source into survivor
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      <small>
        Source: {sourceId} · survivor: {targetId}
      </small>
    </div>
  );
}
