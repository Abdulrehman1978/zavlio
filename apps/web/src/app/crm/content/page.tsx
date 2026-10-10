import { CrmShell } from '../../../components/crm-shell';
import { ContentActions } from '../../../components/crm-content-actions';
import { listContentItems, type ContentEntityType } from '../../../lib/crm/content-data';
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
    : 'Never';

export default async function ContentManagementPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/content');
  const raw = await searchParams;

  const currentType = (
    typeof raw.type === 'string' &&
    ['projects', 'services', 'lab_projects', 'insights'].includes(raw.type)
      ? raw.type
      : 'projects'
  ) as ContentEntityType;

  const currentStatus = typeof raw.status === 'string' ? raw.status : undefined;
  const currentSearch = typeof raw.search === 'string' ? raw.search : undefined;

  const db = await createServerSupabaseClient();
  const data = await listContentItems(db, currentType, currentStatus, currentSearch);

  // Calculate breakdown for stats
  const [draftsCount, publishedCount, archivedCount] = await Promise.all([
    db.from(currentType).select('id', { count: 'exact', head: true }).eq('status', 'DRAFT'),
    db.from(currentType).select('id', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
    db.from(currentType).select('id', { count: 'exact', head: true }).eq('status', 'ARCHIVED'),
  ]);

  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="content-page-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Editorial & Public Content</p>
            <h1 id="content-page-title">Content workspace</h1>
            <p>
              Manage public website content, drafts, and publication lifecycles. Published items are
              displayed on public routes.
            </p>
          </div>
        </header>

        <div className="crm-stat-grid">
          <div className="crm-stat">
            <strong>{data.count}</strong>
            <span>Total {currentType}</span>
          </div>
          <div className="crm-stat">
            <strong>{draftsCount.count ?? 0}</strong>
            <span>Drafts (Internal)</span>
          </div>
          <div className="crm-stat">
            <strong>{publishedCount.count ?? 0}</strong>
            <span>Published (Live)</span>
          </div>
          <div className="crm-stat">
            <strong>{archivedCount.count ?? 0}</strong>
            <span>Archived</span>
          </div>
        </div>

        {/* Section entity tabs */}
        <div className="analytics-tabs" role="tablist" aria-label="Content sections">
          {[
            ['projects', 'Projects & Cases'],
            ['services', 'Services'],
            ['lab_projects', 'Lab Prototypes'],
            ['insights', 'Insights & Articles'],
          ].map(([typeKey, label]) => {
            const isActive = currentType === typeKey;
            return (
              <a
                key={typeKey}
                href={`/crm/content?type=${typeKey}`}
                role="tab"
                aria-selected={isActive}
                style={{
                  fontWeight: isActive ? 700 : 400,
                  borderBottom: isActive ? '2px solid #1a202c' : 'none',
                  color: isActive ? '#1a202c' : '#4a5568',
                }}
              >
                {label}
              </a>
            );
          })}
        </div>

        {/* Filter bar */}
        <form className="crm-filter-bar" method="get" action="/crm/content">
          <input type="hidden" name="type" value={currentType} />
          <label>
            Status
            <select name="status" defaultValue={currentStatus || ''}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label>
            Search
            <input
              type="search"
              name="search"
              placeholder="Filter by title..."
              defaultValue={currentSearch || ''}
            />
          </label>
          <button type="submit">Filter</button>
        </form>

        {/* Interactive action buttons */}
        <ContentActions role={context.staff.role} currentType={currentType} items={data.rows} />

        {/* Data table */}
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Title & Slug</th>
                <th>Status</th>
                <th>Claim Status</th>
                <th>Type / Flag</th>
                <th>Updated</th>
                <th>Public Route</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}
                  >
                    No {currentType} records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                data.rows.map((item) => {
                  const publicPath =
                    currentType === 'projects'
                      ? `/work/${item.slug}`
                      : currentType === 'services'
                        ? `/services/${item.slug}`
                        : currentType === 'lab_projects'
                          ? `/lab/${item.slug}`
                          : `/insights/${item.slug}`;

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <br />
                        <code style={{ fontSize: '0.8rem', color: '#718096' }}>{item.slug}</code>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              item.status === 'PUBLISHED'
                                ? '#c6f6d5'
                                : item.status === 'ARCHIVED'
                                  ? '#fed7d7'
                                  : '#e2e8f0',
                            color:
                              item.status === 'PUBLISHED'
                                ? '#22543d'
                                : item.status === 'ARCHIVED'
                                  ? '#742a2a'
                                  : '#4a5568',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{item.claim_status || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>
                          {item.demo_content ? 'Demo Content' : 'Production'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#4a5568' }}>
                        {date(item.updated_at)}
                      </td>
                      <td>
                        {item.status === 'PUBLISHED' ? (
                          <a
                            href={publicPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.85rem', textDecoration: 'underline' }}
                          >
                            View Live ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>
                            Draft preview only
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </CrmShell>
  );
}
