'use client';

import { useState } from 'react';

export function SocialReplyProposal({
  personId,
  channel,
  sourceReference,
  disabled,
}: {
  personId: string;
  channel: 'THREADS' | 'FACEBOOK' | 'LINKEDIN';
  sourceReference: string;
  disabled: boolean;
}) {
  const [message, setMessage] = useState('');
  const [text, setText] = useState('');
  if (disabled)
    return (
      <p className="crm-note">
        Reply proposal is suppressed by DNC or withdrawn social consent. No browser action is
        available from this screen.
      </p>
    );
  return (
    <form
      className="crm-actions-panel"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch('/api/crm/automation/jobs', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            personId,
            channel,
            action: 'REPLY',
            purpose: 'INBOUND_REPLY',
            text,
            idempotencyKey: 'social-reply:' + sourceReference + ':' + text.length,
            sourceReference,
          }),
        });
        const result = await response.json().catch(() => ({}));
        setMessage(
          response.ok
            ? 'Reply proposal created for policy and approval review.'
            : String(result.error ?? 'Proposal failed.'),
        );
        if (response.ok) setText('');
      }}
    >
      <h2>Propose reply</h2>
      <p className="crm-note">
        This creates a Packet 13 job. It never invokes a browser adapter directly.
      </p>
      <label>
        Approved content
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          minLength={1}
          maxLength={4000}
          required
        />
      </label>
      <button className="crm-button" type="submit">
        Propose for review
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
