'use client';

import { useState } from 'react';
import type { ContentEntityType, ContentItemRow } from '../lib/crm/content-data';

interface Props {
  role: string;
  currentType: ContentEntityType;
  items: ContentItemRow[];
}

export function ContentActions({ role, currentType, items }: Props) {
  const isViewer = role === 'VIEWER';
  const isAdminOrOwner = role === 'ADMIN' || role === 'OWNER';

  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItemRow | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [claimStatus, setClaimStatus] = useState<string>('DEMO');
  const [demoContent, setDemoContent] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startCreate = () => {
    setEditingItem(null);
    setTitle('');
    setSlug('');
    setSummary('');
    setStatus('DRAFT');
    setClaimStatus('DEMO');
    setDemoContent(true);
    setSeoTitle('');
    setSeoDescription('');
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  };

  const startEdit = (item: ContentItemRow) => {
    setEditingItem(item);
    setTitle(item.title);
    setSlug(item.slug);
    setSummary(item.summary || '');
    setStatus(item.status);
    setClaimStatus(item.claim_status || 'DEMO');
    setDemoContent(item.demo_content);
    setSeoTitle(item.seo_title || '');
    setSeoDescription(item.seo_description || '');
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  };

  const handleSlugAutofill = (newTitle: string) => {
    setTitle(newTitle);
    if (!editingItem) {
      const generated = newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    if (!isAdminOrOwner && status !== 'DRAFT') {
      setError('Only ADMIN or OWNER roles may publish or archive content.');
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        type: currentType,
        title,
        slug,
        summary: summary || null,
        status,
        visibility: 'PUBLIC',
        claimStatus: claimStatus || null,
        demoContent,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      };

      if (editingItem) {
        payload.id = editingItem.id;
      }

      const res = await fetch('/api/crm/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save content item.');
      }

      setSuccess(`Content item '${title}' saved successfully.`);
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="crm-content-actions" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {isViewer ? (
            <p className="crm-note" style={{ margin: 0 }}>
              VIEWER role: Read-only catalog. OPERATOR required to draft; ADMIN/OWNER required to
              publish.
            </p>
          ) : (
            <button type="button" className="crm-button" onClick={startCreate} disabled={busy}>
              + Create new {currentType.slice(0, -1)}
            </button>
          )}
        </div>
      </div>

      {isOpen && !isViewer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="content-modal-title"
          style={{
            marginTop: '1rem',
            padding: '1.25rem',
            border: '1px solid #d7dce2',
            borderRadius: '0.5rem',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 id="content-modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              {editingItem
                ? `Edit ${currentType.slice(0, -1)}: ${editingItem.title}`
                : `New ${currentType.slice(0, -1)}`}
            </h2>
            <button
              type="button"
              className="crm-button"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
              onClick={() => setIsOpen(false)}
            >
              ✕ Close
            </button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                color: '#c53030',
                background: '#fff5f5',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                marginBottom: '0.75rem',
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              style={{
                color: '#276749',
                background: '#f0fff4',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                marginBottom: '0.75rem',
              }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Title *</strong>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleSlugAutofill(e.target.value)}
                  placeholder="e.g. Adaptive Grid Engine"
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Slug (URL identifier) *</strong>
                <input
                  type="text"
                  required
                  pattern="^[a-z0-9-]+$"
                  title="Lowercase alphanumeric with hyphens only"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="adaptive-grid-engine"
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
              <strong>Summary / Description</strong>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="High-level description of this editorial item..."
                style={{ padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
              />
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Lifecycle Status</strong>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                >
                  <option value="DRAFT">DRAFT (Internal only)</option>
                  <option value="PUBLISHED" disabled={!isAdminOrOwner}>
                    PUBLISHED {!isAdminOrOwner ? '(ADMIN required)' : ''}
                  </option>
                  <option value="ARCHIVED" disabled={!isAdminOrOwner}>
                    ARCHIVED {!isAdminOrOwner ? '(ADMIN required)' : ''}
                  </option>
                </select>
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>Claim Status</strong>
                <select
                  value={claimStatus}
                  onChange={(e) => setClaimStatus(e.target.value)}
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                >
                  <option value="DEMO">DEMO (Concept/Prototype)</option>
                  <option value="UNVERIFIED">UNVERIFIED</option>
                  <option value="VERIFIED">VERIFIED (Evidence confirmed)</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={demoContent}
                  onChange={(e) => setDemoContent(e.target.checked)}
                />
                <span>Demo Content Flag</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>SEO Title</strong>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Meta title for search engines"
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                <strong>SEO Description</strong>
                <input
                  type="text"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description for search snippets"
                  style={{
                    padding: '0.45rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.25rem',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="submit" className="crm-button" disabled={busy}>
                {busy ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
              </button>
              <button
                type="button"
                className="crm-button"
                style={{ background: '#edf2f7', color: '#4a5568' }}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit button hooks for table rows */}
      {!isViewer && items.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#718096', alignSelf: 'center' }}>
            Quick Edit:
          </span>
          {items.slice(0, 8).map((it) => (
            <button
              key={it.id}
              type="button"
              className="crm-button"
              style={{
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                background: '#f7fafc',
                border: '1px solid #e2e8f0',
                color: '#2d3748',
              }}
              onClick={() => startEdit(it)}
            >
              Edit {it.slug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
