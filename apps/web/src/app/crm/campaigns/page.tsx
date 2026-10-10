import { CrmShell } from '../../../components/crm-shell';
import { CampaignActions } from '../../../components/crm-campaign-actions';
import {
  listCampaigns,
  getCampaignMembers,
  type CampaignRow,
  type CampaignMemberRow,
} from '../../../lib/crm/campaigns-data';
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
    : 'No limit';

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/campaigns');
  const raw = await searchParams;

  const currentStatus = typeof raw.status === 'string' ? raw.status : undefined;
  const currentSearch = typeof raw.search === 'string' ? raw.search : undefined;
  const selectedCampaignId = typeof raw.campaignId === 'string' ? raw.campaignId : undefined;

  const db = await createServerSupabaseClient();
  const data = await listCampaigns(db, currentStatus, currentSearch);

  let selectedCampaign: CampaignRow | undefined;
  let members: CampaignMemberRow[] = [];

  if (selectedCampaignId) {
    selectedCampaign = data.rows.find((c) => c.id === selectedCampaignId);
    if (!selectedCampaign) {
      const { data: single } = await db
        .from('campaigns')
        .select('*')
        .eq('id', selectedCampaignId)
        .single();
      if (single) {
        selectedCampaign = {
          id: single.id,
          name: single.name,
          type: single.type,
          status: single.status,
          starts_at: single.starts_at,
          ends_at: single.ends_at,
          audience_definition: (single.audience_definition as Record<string, unknown>) || {},
          member_count: 0,
          suppressed_count: 0,
          created_at: single.created_at,
          updated_at: single.updated_at,
        };
      }
    }
    if (selectedCampaign) {
      members = await getCampaignMembers(db, selectedCampaign.id);
    }
  }

  const activeCount = data.rows.filter((c) => c.status === 'ACTIVE').length;
  const totalMembers = data.rows.reduce((acc, c) => acc + c.member_count, 0);
  const totalSuppressed = data.rows.reduce((acc, c) => acc + c.suppressed_count, 0);

  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="campaigns-page-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Audience Cohorts & Segmentation</p>
            <h1 id="campaigns-page-title">Campaigns</h1>
            <p>
              Plan audience segments, manual 1:1 outreach lists, and research cohorts. Zero
              automated bulk sends.
            </p>
          </div>
        </header>

        <div className="crm-stat-grid">
          <div className="crm-stat">
            <strong>{data.count}</strong>
            <span>Total campaigns</span>
          </div>
          <div className="crm-stat">
            <strong>{activeCount}</strong>
            <span>Active campaigns</span>
          </div>
          <div className="crm-stat">
            <strong>{totalMembers}</strong>
            <span>Enrolled members</span>
          </div>
          <div className="crm-stat">
            <strong>{totalSuppressed}</strong>
            <span>DNC Suppressed</span>
          </div>
        </div>

        {/* Filter bar */}
        <form className="crm-filter-bar" method="get" action="/crm/campaigns">
          <label>
            Status
            <select name="status" defaultValue={currentStatus || ''}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label>
            Search
            <input
              type="search"
              name="search"
              placeholder="Filter by campaign name..."
              defaultValue={currentSearch || ''}
            />
          </label>
          <button type="submit">Filter</button>
        </form>

        <CampaignActions role={context.staff.role} selectedCampaign={selectedCampaign} />

        {/* Campaigns table */}
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Members</th>
                <th>Schedule</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}
                  >
                    No campaigns found. Use &apos;+ Create campaign&apos; above to begin.
                  </td>
                </tr>
              ) : (
                data.rows.map((c) => {
                  const isSelected = c.id === selectedCampaignId;
                  return (
                    <tr
                      key={c.id}
                      style={{
                        background: isSelected ? '#edf2f7' : undefined,
                      }}
                    >
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{c.type}</span>
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
                              c.status === 'ACTIVE'
                                ? '#c6f6d5'
                                : c.status === 'PAUSED'
                                  ? '#feebc8'
                                  : '#e2e8f0',
                            color:
                              c.status === 'ACTIVE'
                                ? '#22543d'
                                : c.status === 'PAUSED'
                                  ? '#744210'
                                  : '#4a5568',
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <strong>{c.member_count}</strong>
                        {c.suppressed_count > 0 && (
                          <span
                            style={{
                              marginLeft: '0.4rem',
                              padding: '0.1rem 0.4rem',
                              fontSize: '0.7rem',
                              borderRadius: '0.2rem',
                              background: '#fed7d7',
                              color: '#9b2c2c',
                            }}
                          >
                            {c.suppressed_count} DNC
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#4a5568' }}>
                        {date(c.starts_at)} → {date(c.ends_at)}
                      </td>
                      <td>
                        <a
                          href={`/crm/campaigns?campaignId=${c.id}`}
                          className="crm-button"
                          style={{
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                          }}
                        >
                          {isSelected ? 'Viewing' : 'Inspect'}
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected campaign detail & member list */}
        {selectedCampaign && (
          <div style={{ marginTop: '2rem' }}>
            <div className="crm-section-heading">
              <div>
                <p className="crm-eyebrow">Enrolled Cohort</p>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                  Members of {selectedCampaign.name} ({members.length})
                </h2>
              </div>
            </div>

            <div className="crm-table-wrap" style={{ marginTop: '0.75rem' }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Email</th>
                    <th>Lifecycle Stage</th>
                    <th>Member Status</th>
                    <th>DNC Suppression</th>
                    <th>Enrolled At</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ textAlign: 'center', padding: '1.5rem', color: '#718096' }}
                      >
                        No persons enrolled in this campaign yet. Use &apos;+ Enroll person&apos;
                        above.
                      </td>
                    </tr>
                  ) : (
                    members.map((m) => (
                      <tr key={m.person_id}>
                        <td>
                          <a href={`/crm/people/${m.person_id}`} style={{ fontWeight: 600 }}>
                            {m.person_name}
                          </a>
                        </td>
                        <td>{m.person_email || '—'}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{m.lifecycle_stage}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.status}</span>
                        </td>
                        <td>
                          {m.do_not_contact ? (
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
                              DNC / SUPPRESSED
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#276749' }}>Allowed</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#718096' }}>
                          {date(m.added_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </CrmShell>
  );
}
