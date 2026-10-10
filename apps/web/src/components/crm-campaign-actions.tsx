'use client';

import { useState } from 'react';
import type { CampaignRow } from '../lib/crm/campaigns-data';

interface Props {
  role: string;
  selectedCampaign?: CampaignRow;
}

export function CampaignActions({ role, selectedCampaign }: Props) {
  const isViewer = role === 'VIEWER';
  const isAdminOrOwner = role === 'ADMIN' || role === 'OWNER';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);

  // Campaign create state
  const [name, setName] = useState('');
  const [type, setType] = useState('OUTREACH_MANUAL');
  const [status, setStatus] = useState('DRAFT');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [audienceNotes, setAudienceNotes] = useState('');

  // Member enroll state
  const [personId, setPersonId] = useState('');
  const [memberStatus, setMemberStatus] = useState('ADDED');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!isAdminOrOwner && status !== 'DRAFT') {
      setError('Only ADMIN or OWNER roles may activate or archive campaigns.');
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        name,
        type,
        status,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        audienceDefinition: { notes: audienceNotes },
      };

      const res = await fetch('/api/crm/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign.');

      setSuccess(`Campaign '${name}' created.`);
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating campaign.');
    } finally {
      setBusy(false);
    }
  };

  const handleEnrollMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || isViewer) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/crm/campaigns/${selectedCampaign.id}/members`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          personId,
          status: memberStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll member.');

      if (data.suppressed) {
        setSuccess('Person enrolled, but marked EXCLUDED because Do-Not-Contact is active.');
      } else {
        setSuccess('Member enrolled successfully.');
      }
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enrolling member.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        className="analytics-caveat"
        style={{ marginBottom: '1rem', borderLeftColor: '#2b6cb0', background: '#ebf8ff' }}
      >
        <strong>Internal Planning Only:</strong> Zero-sends-by-default. Campaign membership tracks
        manual outreach, research cohorts, and attribution segments. Bulk automated messaging and
        unsolicited emails are strictly prohibited.
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {isViewer ? (
          <p className="crm-note" style={{ margin: 0 }}>
            VIEWER role: Read-only campaign viewer. OPERATOR required to manage campaigns.
          </p>
        ) : (
          <>
            <button
              type="button"
              className="crm-button"
              onClick={() => {
                setIsCreateOpen(true);
                setIsMemberOpen(false);
                setError(null);
                setSuccess(null);
              }}
            >
              + Create campaign
            </button>

            {selectedCampaign && (
              <button
                type="button"
                className="crm-button"
                style={{ background: '#3182ce', color: '#fff' }}
                onClick={() => {
                  setIsMemberOpen(true);
                  setIsCreateOpen(false);
                  setError(null);
                  setSuccess(null);
                }}
              >
                + Enroll person in {selectedCampaign.name}
              </button>
            )}
          </>
        )}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '0.75rem',
            color: '#c53030',
            background: '#fff5f5',
            padding: '0.5rem',
            borderRadius: '0.25rem',
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          style={{
            marginTop: '0.75rem',
            color: '#276749',
            background: '#f0fff4',
            padding: '0.5rem',
            borderRadius: '0.25rem',
          }}
        >
          {success}
        </div>
      )}

      {/* Create campaign modal */}
      {isCreateOpen && !isViewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="campaign-modal-title"
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            border: '1px solid #d7dce2',
            borderRadius: '0.5rem',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 id="campaign-modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              Create campaign
            </h2>
            <button
              type="button"
              className="crm-button"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
              onClick={() => setIsCreateOpen(false)}
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCreateCampaign} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Campaign Name *</strong>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Architectural Cohort"
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Campaign Type</strong>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                >
                  <option value="OUTREACH_MANUAL">Manual 1:1 Outreach</option>
                  <option value="CONTENT_PROMOTION">Content Promotion</option>
                  <option value="RESEARCH_COHORT">Research Cohort</option>
                  <option value="EVENT_INVITATION">Event Invitation</option>
                  <option value="PARTNERSHIP">Partnership</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Status</strong>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE" disabled={!isAdminOrOwner}>
                    ACTIVE {!isAdminOrOwner ? '(ADMIN required)' : ''}
                  </option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="ARCHIVED" disabled={!isAdminOrOwner}>
                    ARCHIVED {!isAdminOrOwner ? '(ADMIN required)' : ''}
                  </option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Starts At</strong>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Ends At</strong>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              <strong>Audience Definition / Notes</strong>
              <textarea
                rows={2}
                value={audienceNotes}
                onChange={(e) => setAudienceNotes(e.target.value)}
                placeholder="Target criteria, ICP details, or purpose of this cohort..."
                style={{ padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </label>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="crm-button" disabled={busy}>
                {busy ? 'Saving...' : 'Create campaign'}
              </button>
              <button
                type="button"
                className="crm-button"
                style={{ background: '#edf2f7', color: '#4a5568' }}
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enroll member modal */}
      {isMemberOpen && selectedCampaign && !isViewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-modal-title"
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            border: '1px solid #d7dce2',
            borderRadius: '0.5rem',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 id="member-modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              Enroll person into {selectedCampaign.name}
            </h2>
            <button
              type="button"
              className="crm-button"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
              onClick={() => setIsMemberOpen(false)}
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleEnrollMember} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Person UUID *</strong>
                <input
                  type="text"
                  required
                  pattern="^[0-9a-fA-F-]{36}$"
                  title="36-character UUID"
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Initial Status</strong>
                <select
                  value={memberStatus}
                  onChange={(e) => setMemberStatus(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                >
                  <option value="ADDED">ADDED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="RESPONDED">RESPONDED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="OPTED_OUT">OPTED_OUT</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="crm-button" disabled={busy}>
                {busy ? 'Enrolling...' : 'Enroll person'}
              </button>
              <button
                type="button"
                className="crm-button"
                style={{ background: '#edf2f7', color: '#4a5568' }}
                onClick={() => setIsMemberOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
