'use client';

import { useState } from 'react';

interface Props {
  role: string;
}

export function ConsentActions({ role }: Props) {
  const isViewer = role === 'VIEWER';
  const isAdminOrOwner = role === 'ADMIN' || role === 'OWNER';

  const [personId, setPersonId] = useState('');
  const [verifiedIdentity, setVerifiedIdentity] = useState(false);
  const [requestType, setRequestType] = useState<'EXPORT' | 'ANONYMIZATION'>('EXPORT');
  const [notes, setNotes] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<unknown | null>(null);
  const [previewResult, setPreviewResult] = useState<unknown | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!verifiedIdentity) {
      setError('You must confirm that the data subject identity has been verified.');
      return;
    }

    if (requestType === 'ANONYMIZATION' && !isAdminOrOwner) {
      setError('Anonymization and deletion workflows require ADMIN or OWNER authorization.');
      return;
    }

    setBusy(true);
    setError(null);
    setExportResult(null);
    setPreviewResult(null);

    try {
      const endpoint =
        requestType === 'EXPORT' ? '/api/crm/consent/export' : '/api/crm/consent/anonymize-preview';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          personId,
          requestType,
          verifiedIdentity: true,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process privacy request.');

      if (requestType === 'EXPORT') {
        setExportResult(data.export);
      } else {
        setPreviewResult(data.preview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executing privacy request.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadJson = () => {
    if (!exportResult) return;
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zavlio-privacy-export-${personId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          padding: '1.25rem',
          border: '1px solid #d7dce2',
          borderRadius: '0.5rem',
          background: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>
          Data Subject Rights & Privacy Request Workbench
        </h2>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
          Execute verified subject access requests (GDPR Art. 15 / CCPA) and preview anonymization
          scope. No raw SQL required.
        </p>

        {isViewer ? (
          <p className="crm-note" style={{ margin: 0 }}>
            VIEWER role: Read-only consent history. OPERATOR role required to run subject exports;
            ADMIN required for anonymization previews.
          </p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Target Person UUID *</strong>
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
                <strong>Request Workflow</strong>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as 'EXPORT' | 'ANONYMIZATION')}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                >
                  <option value="EXPORT">Portable Data Export (JSON)</option>
                  <option value="ANONYMIZATION" disabled={!isAdminOrOwner}>
                    Preview Anonymization Scope (Dry-Run){' '}
                    {!isAdminOrOwner ? '(ADMIN required)' : ''}
                  </option>
                </select>
              </label>
            </div>

            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              <strong>Identity Verification Evidence / Reason *</strong>
              <input
                type="text"
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Verified via signed email response from authenticated primary address"
                style={{ padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: '#2d3748',
              }}
            >
              <input
                type="checkbox"
                required
                checked={verifiedIdentity}
                onChange={(e) => setVerifiedIdentity(e.target.checked)}
              />
              <strong>
                I confirm requester identity and authority have been verified prior to release.
              </strong>
            </label>

            {error && (
              <div
                role="alert"
                style={{
                  color: '#c53030',
                  background: '#fff5f5',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <button type="submit" className="crm-button" disabled={busy}>
                {busy
                  ? 'Processing...'
                  : requestType === 'EXPORT'
                    ? 'Generate Data Export'
                    : 'Run Anonymize Dry-Run'}
              </button>
            </div>
          </form>
        )}

        {/* Export JSON result */}
        {exportResult !== null && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.35rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <strong style={{ fontSize: '0.9rem', color: '#2b6cb0' }}>
                ✓ Export Generated Successfully (Audited)
              </strong>
              <button
                type="button"
                className="crm-button"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                onClick={handleDownloadJson}
              >
                📥 Download JSON file
              </button>
            </div>
            <pre
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                background: '#ffffff',
                padding: '0.75rem',
                fontSize: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '0.25rem',
              }}
            >
              {JSON.stringify(exportResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Anonymize preview result */}
        {previewResult !== null && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: '#fffaf0',
              border: '1px solid #fbd38d',
              borderRadius: '0.35rem',
            }}
          >
            <strong style={{ fontSize: '0.9rem', color: '#c05621' }}>
              ⚠ Anonymization Scope Dry-Run Report (Pending Legal Retention Approval)
            </strong>
            <p style={{ margin: '0.5rem 0', fontSize: '0.85rem' }}>
              Destructive purge is held in <code>PENDING_POLICY_APPROVAL</code>. The following
              records would be masked:
            </p>
            <pre
              style={{
                background: '#ffffff',
                padding: '0.75rem',
                fontSize: '0.75rem',
                border: '1px solid #fbd38d',
                borderRadius: '0.25rem',
              }}
            >
              {JSON.stringify(previewResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
