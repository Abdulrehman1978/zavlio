import { CrmShell } from '../../../components/crm-shell';
import { ConsentActions } from '../../../components/crm-consent-actions';
import { listConsents, listDncPeople } from '../../../lib/crm/consent-data';
import { requireCrmPage } from '../../../lib/crm/page';
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

export default async function ConsentManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/consent');
  const raw = await searchParams;
  const search = typeof raw.search === 'string' ? raw.search : undefined;

  const db = await createServerSupabaseClient();
  const [consentsData, dncPeople] = await Promise.all([
    listConsents(db, search),
    listDncPeople(db),
  ]);

  const activeAnalyticsCount = consentsData.rows.filter(
    (c) => c.analytics && !c.withdrawn_at,
  ).length;
  const activeMarketingCount = consentsData.rows.filter(
    (c) => (c.marketing_email || c.marketing_social) && !c.withdrawn_at,
  ).length;

  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="consent-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Compliance & Subject Rights</p>
            <h1 id="consent-title">Consent & privacy operations</h1>
            <p>
              Inspect immutable consent records, global Do-Not-Contact suppressions, and execute
              verified subject data requests.
            </p>
          </div>
        </header>

        <div className="crm-stat-grid">
          <div className="crm-stat">
            <strong>{consentsData.count}</strong>
            <span>Recorded consent events</span>
          </div>
          <div className="crm-stat">
            <strong>{activeAnalyticsCount}</strong>
            <span>Active analytics opt-ins</span>
          </div>
          <div className="crm-stat">
            <strong>{activeMarketingCount}</strong>
            <span>Active marketing opt-ins</span>
          </div>
          <div className="crm-stat">
            <strong>{dncPeople.length}</strong>
            <span>Global DNC suppressed</span>
          </div>
        </div>

        {/* Retention Policy Matrix Banner */}
        <div
          className="analytics-caveat"
          style={{ marginBottom: '1.5rem', borderLeftColor: '#4a5568', background: '#f7fafc' }}
        >
          <strong>Configured Retention & Purge Policy Matrix (Version 2026-v1):</strong>
          <ul style={{ margin: '0.4rem 0 0 1.25rem', padding: 0, fontSize: '0.85rem' }}>
            <li>
              <strong>Analytics & Sessions:</strong> 180-day TTL; cookie bound to consent
              preference.
            </li>
            <li>
              <strong>Enquiries & Form Payloads:</strong> Retained for active relationship
              lifecycle; purge requires owner request.
            </li>
            <li>
              <strong>CRM Profiles & Touchpoints:</strong> Reviewed anonymization only; DNC
              suppression and audit history are never erased.
            </li>
            <li>
              <strong>Audit Logs & Nonces:</strong> Nonces expire in 30 days; security and audit
              logs are append-only.
            </li>
          </ul>
        </div>

        {/* Data Subject Request Actions */}
        <ConsentActions role={context.staff.role} />

        {/* Global DNC Suppression List */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="crm-section-heading">
            <div>
              <p className="crm-eyebrow">Proactive Outreach Safeguards</p>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                Global Do-Not-Contact Suppressions ({dncPeople.length})
              </h2>
            </div>
          </div>
          <div className="crm-table-wrap" style={{ marginTop: '0.75rem' }}>
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Email</th>
                  <th>Lifecycle</th>
                  <th>Suppression Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {dncPeople.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: 'center', padding: '1.5rem', color: '#718096' }}
                    >
                      No persons currently marked as Do-Not-Contact.
                    </td>
                  </tr>
                ) : (
                  dncPeople.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <a href={`/crm/people/${p.id}`} style={{ fontWeight: 600 }}>
                          {p.display_name}
                        </a>
                      </td>
                      <td>{p.primary_email || '—'}</td>
                      <td>{p.lifecycle_stage}</td>
                      <td>
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: '#fed7d7',
                            color: '#9b2c2c',
                          }}
                        >
                          BLOCKED / DNC
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#718096' }}>
                        {date(p.updated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Consent Records Table */}
        <div>
          <div className="crm-section-heading">
            <div>
              <p className="crm-eyebrow">Immutable Ledger</p>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                Recorded Consents ({consentsData.count})
              </h2>
            </div>
          </div>

          <form
            className="crm-filter-bar"
            method="get"
            action="/crm/consent"
            style={{ marginTop: '0.75rem' }}
          >
            <label>
              Search Source / Policy
              <input
                type="search"
                name="search"
                placeholder="e.g. cookie_banner, 2026-09-v1..."
                defaultValue={search || ''}
              />
            </label>
            <button type="submit">Filter</button>
          </form>

          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Subject (Person / Visitor)</th>
                  <th>Analytics</th>
                  <th>Marketing Email</th>
                  <th>Marketing Social</th>
                  <th>Policy Version</th>
                  <th>Captured At</th>
                  <th>Withdrawn At</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {consentsData.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: 'center', padding: '1.5rem', color: '#718096' }}
                    >
                      No consent records found.
                    </td>
                  </tr>
                ) : (
                  consentsData.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        {row.person_id ? (
                          <a href={`/crm/people/${row.person_id}`}>{row.person_name || 'Person'}</a>
                        ) : row.visitor_id ? (
                          <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                            Visitor: {row.visitor_id.slice(0, 8)}…
                          </span>
                        ) : (
                          'Anonymous'
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            color: row.analytics ? '#276749' : '#a0aec0',
                            fontWeight: row.analytics ? 700 : 400,
                          }}
                        >
                          {row.analytics ? 'Allowed' : 'Denied'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: row.marketing_email ? '#276749' : '#a0aec0',
                            fontWeight: row.marketing_email ? 700 : 400,
                          }}
                        >
                          {row.marketing_email ? 'Allowed' : 'Denied'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: row.marketing_social ? '#276749' : '#a0aec0',
                            fontWeight: row.marketing_social ? 700 : 400,
                          }}
                        >
                          {row.marketing_social ? 'Allowed' : 'Denied'}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem' }}>{row.policy_version}</code>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{date(row.captured_at)}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {row.withdrawn_at ? (
                          <span style={{ color: '#c53030', fontWeight: 600 }}>
                            {date(row.withdrawn_at)}
                          </span>
                        ) : (
                          'Active'
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{row.source}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </CrmShell>
  );
}
