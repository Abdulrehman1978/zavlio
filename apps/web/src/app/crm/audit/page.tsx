import { CrmShell } from '../../../components/crm-shell';
import { listAuditLogs } from '../../../lib/crm/audit-data';
import { requireCrmRolePage } from '../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

export default async function AuditExplorerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmRolePage('/crm/audit', 'ADMIN', 'OWNER');
  const raw = await searchParams;

  const currentAction = typeof raw.action === 'string' ? raw.action : undefined;
  const currentEntityType = typeof raw.entityType === 'string' ? raw.entityType : undefined;
  const pageNum = typeof raw.page === 'string' && Number(raw.page) > 0 ? Number(raw.page) : 1;

  const db = await createServerSupabaseClient();
  const data = await listAuditLogs(db, currentAction, currentEntityType, pageNum, 50);

  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="audit-page-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Compliance & Security Trail</p>
            <h1 id="audit-page-title">Audit logs</h1>
            <p>
              Append-only audit trail of system mutations, role transitions, consent events, and
              administrative actions. Restricted to ADMIN and OWNER roles.
            </p>
          </div>
        </header>

        <div className="crm-stat-grid">
          <div className="crm-stat">
            <strong>{data.count}</strong>
            <span>Total logged actions</span>
          </div>
          <div className="crm-stat">
            <strong>
              {data.page} / {data.totalPages}
            </strong>
            <span>Current page</span>
          </div>
          <div className="crm-stat">
            <strong>{data.rows.length}</strong>
            <span>Items on page</span>
          </div>
          <div className="crm-stat">
            <strong>Active</strong>
            <span>Append-only guarantee</span>
          </div>
        </div>

        {/* Filter bar */}
        <form className="crm-filter-bar" method="get" action="/crm/audit">
          <label>
            Action
            <input
              type="search"
              name="action"
              placeholder="e.g. CONTENT_*, PRIVACY_*, OPPORTUNITY_*"
              defaultValue={currentAction || ''}
            />
          </label>
          <label>
            Entity Type
            <input
              type="search"
              name="entityType"
              placeholder="e.g. people, campaigns, services"
              defaultValue={currentEntityType || ''}
            />
          </label>
          <button type="submit">Filter</button>
        </form>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity Type & ID</th>
                <th>Actor</th>
                <th>Changes / State (Redacted)</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}
                  >
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontSize: '0.85rem', color: '#4a5568' }}>
                      {date(row.created_at)}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: '#e2e8f0',
                          color: '#2d3748',
                        }}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td>
                      <strong>{row.entity_type}</strong>
                      <br />
                      <code style={{ fontSize: '0.75rem', color: '#718096' }}>
                        {row.entity_id ? `${row.entity_id.slice(0, 8)}…` : '—'}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{row.actor_type}</span>
                      {row.actor_id && (
                        <code style={{ display: 'block', fontSize: '0.75rem', color: '#718096' }}>
                          {row.actor_id.slice(0, 8)}…
                        </code>
                      )}
                    </td>
                    <td>
                      {row.before_state || row.after_state ? (
                        <details style={{ fontSize: '0.75rem' }}>
                          <summary style={{ cursor: 'pointer', color: '#2b6cb0' }}>
                            Inspect State Payload
                          </summary>
                          <div
                            style={{
                              marginTop: '0.35rem',
                              background: '#f7fafc',
                              padding: '0.5rem',
                              borderRadius: '0.25rem',
                            }}
                          >
                            {row.before_state && (
                              <div>
                                <strong>Before:</strong>
                                <pre
                                  style={{
                                    margin: '0.2rem 0',
                                    maxHeight: '100px',
                                    overflowY: 'auto',
                                  }}
                                >
                                  {JSON.stringify(row.before_state, null, 2)}
                                </pre>
                              </div>
                            )}
                            {row.after_state && (
                              <div style={{ marginTop: row.before_state ? '0.35rem' : 0 }}>
                                <strong>After:</strong>
                                <pre
                                  style={{
                                    margin: '0.2rem 0',
                                    maxHeight: '100px',
                                    overflowY: 'auto',
                                  }}
                                >
                                  {JSON.stringify(row.after_state, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      ) : (
                        <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {data.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1.25rem',
              justifyContent: 'center',
            }}
          >
            {data.page > 1 && (
              <a
                href={`/crm/audit?page=${data.page - 1}${currentAction ? `&action=${encodeURIComponent(currentAction)}` : ''}${currentEntityType ? `&entityType=${encodeURIComponent(currentEntityType)}` : ''}`}
                className="crm-button"
                style={{ textDecoration: 'none' }}
              >
                ← Previous
              </a>
            )}
            <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#718096' }}>
              Page {data.page} of {data.totalPages}
            </span>
            {data.page < data.totalPages && (
              <a
                href={`/crm/audit?page=${data.page + 1}${currentAction ? `&action=${encodeURIComponent(currentAction)}` : ''}${currentEntityType ? `&entityType=${encodeURIComponent(currentEntityType)}` : ''}`}
                className="crm-button"
                style={{ textDecoration: 'none' }}
              >
                Next →
              </a>
            )}
          </div>
        )}
      </section>
    </CrmShell>
  );
}
