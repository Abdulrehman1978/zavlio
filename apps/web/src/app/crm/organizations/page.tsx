import { CrmShell } from '../../../components/crm-shell';
import { listOrganizations } from '../../../lib/crm/data';
import { requireCrmPage } from '../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/organizations');
  const raw = await searchParams;
  const search = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const page = Math.max(
    1,
    Math.min(
      200,
      Number.parseInt((Array.isArray(raw.page) ? raw.page[0] : raw.page) ?? '1', 10) || 1,
    ),
  );
  const result = await listOrganizations(await createServerSupabaseClient(), search, page);
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="organizations-title">
        <div className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Operational CRM</p>
            <h1 id="organizations-title">Organizations</h1>
            <p>Exact-domain accounts and their linked active people.</p>
          </div>
        </div>
        <form className="crm-filter-bar" method="get">
          <label>
            Search
            <input
              name="q"
              defaultValue={search ?? ''}
              maxLength={80}
              placeholder="Name, domain, website"
            />
          </label>
          <button className="crm-button" type="submit">
            Search
          </button>
        </form>
        {result.rows.length ? (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <caption>
                Organizations page {result.page} of {result.pageCount}
              </caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Domain</th>
                  <th>Industry</th>
                  <th>Country</th>
                  <th>People</th>
                  <th>Website</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((organization) => (
                  <tr key={organization.id}>
                    <th scope="row">
                      <a href={`/crm/organizations/${organization.id}`}>{organization.name}</a>
                    </th>
                    <td>{organization.domain ?? '—'}</td>
                    <td>{organization.industry ?? '—'}</td>
                    <td>{organization.country ?? '—'}</td>
                    <td>{organization.people_count}</td>
                    <td>
                      {organization.website ? (
                        <a href={organization.website} rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="crm-empty">
            <h2>No organizations yet</h2>
            <p>Organizations appear when intake has a company and a safe domain match.</p>
          </div>
        )}
        <nav className="crm-pagination" aria-label="Organization pagination">
          {result.page > 1 && (
            <a
              href={`/crm/organizations?q=${encodeURIComponent(search ?? '')}&page=${result.page - 1}`}
            >
              Previous
            </a>
          )}
          <span>
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount && (
            <a
              href={`/crm/organizations?q=${encodeURIComponent(search ?? '')}&page=${result.page + 1}`}
            >
              Next
            </a>
          )}
        </nav>
      </section>
    </CrmShell>
  );
}
