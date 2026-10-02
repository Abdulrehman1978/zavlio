import { CrmShell } from '../../../components/crm-shell';
import { requireCrmPage } from '../../../lib/crm/page';
import { listPeople, parsePeopleQuery } from '../../../lib/crm/data';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return `/crm/people?${next.toString()}`;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/people');
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined) params.set(key, Array.isArray(value) ? (value[0] ?? '') : value);
  }
  const query = parsePeopleQuery(params);
  const db = await createServerSupabaseClient();
  const result = await listPeople(db, query);
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="people-title">
        <div className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Operational CRM</p>
            <h1 id="people-title">People</h1>
            <p>Server-side search and pagination. Merged records are hidden by default.</p>
          </div>
          <a className="crm-button" href="/start-a-project">
            New project enquiry
          </a>
        </div>
        <form className="crm-filter-bar" method="get" aria-label="People filters">
          <label>
            Search
            <input
              name="q"
              defaultValue={query.search ?? ''}
              maxLength={80}
              placeholder="Name, email, organization, identity"
            />
          </label>
          <label>
            Lifecycle
            <select name="lifecycle" defaultValue={query.lifecycle ?? ''}>
              <option value="">All lifecycle stages</option>
              {[
                'IDENTIFIED',
                'ENGAGED',
                'QUALIFIED',
                'OPPORTUNITY',
                'CLIENT',
                'RETURNING_CLIENT',
                'LOST',
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Intent
            <select name="intent" defaultValue={query.intent ?? ''}>
              <option value="">All intent</option>
              {['LOW', 'INTERESTED', 'WARM', 'HIGH', 'PRIORITY'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            DNC
            <select name="dnc" defaultValue={query.dnc ?? 'all'}>
              <option value="all">All contact states</option>
              <option value="yes">Do not contact</option>
              <option value="no">Contact permitted</option>
            </select>
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={query.sort ?? 'last_activity'}>
              <option value="last_activity">Last activity</option>
              <option value="created">Created</option>
              <option value="name">Name</option>
              <option value="score">Lead score</option>
            </select>
          </label>
          <button className="crm-button" type="submit">
            Apply
          </button>
        </form>
        {result.rows.length === 0 ? (
          <div className="crm-empty">
            <h2>No CRM people yet</h2>
            <p>New project and contact enquiries will appear here.</p>
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <caption>
                People page {result.page} of {result.pageCount}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Organization</th>
                  <th scope="col">Lifecycle</th>
                  <th scope="col">Score / intent</th>
                  <th scope="col">Source</th>
                  <th scope="col">Last activity</th>
                  <th scope="col">Contact state</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((person) => (
                  <tr key={person.id}>
                    <th scope="row">
                      <a href={`/crm/people/${person.id}`}>{person.display_name}</a>
                      <small>{person.primary_email ?? 'Email not provided'}</small>
                    </th>
                    <td>{person.organization_name ?? '—'}</td>
                    <td>{person.lifecycle_stage}</td>
                    <td>
                      {person.latest_score ?? '—'} / {person.latest_intent ?? '—'}
                    </td>
                    <td>{person.lead_source ?? '—'}</td>
                    <td>
                      {person.last_activity_at
                        ? new Date(person.last_activity_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td>
                      {person.do_not_contact ? (
                        <span className="crm-badge crm-badge-danger">Do not contact</span>
                      ) : (
                        'Contact permitted'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <nav className="crm-pagination" aria-label="People pagination">
          {result.page > 1 && <a href={pageHref(params, result.page - 1)}>Previous</a>}
          <span>
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount && <a href={pageHref(params, result.page + 1)}>Next</a>}
        </nav>
      </section>
    </CrmShell>
  );
}
