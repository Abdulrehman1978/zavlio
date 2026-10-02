import { CrmShell } from '../../../../components/crm-shell';
import { loadAutomationJobs } from '../../../../lib/crm/automation';
import { requireCrmPage } from '../../../../lib/crm/page';
export const dynamic = 'force-dynamic';
const v = (x: unknown) => String(x ?? '—');
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const auth = await requireCrmPage('/crm/automation/jobs');
  const p = await searchParams;
  const page = Math.min(200, Math.max(1, Number(p.page) || 1));
  const data = await loadAutomationJobs({
    status: p.status,
    channel: p.channel,
    purpose: p.purpose,
    q: p.q,
    page,
  });
  return (
    <CrmShell role={auth.staff.role}>
      <a className="crm-back" href="/crm/automation">
        ← Automation
      </a>
      <h1>Automation jobs</h1>
      <form className="crm-filter-bar">
        <label>
          Search
          <input name="q" defaultValue={p.q} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={p.status ?? ''}>
            <option value="">All</option>
            {[
              'AWAITING_APPROVAL',
              'QUEUED',
              'CLAIMED',
              'RUNNING',
              'BLOCKED',
              'MANUAL_ACTION_REQUIRED',
              'FAILED',
              'COMPLETED',
              'CANCELLED',
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Channel
          <select name="channel" defaultValue={p.channel ?? ''}>
            <option value="">All</option>
            {['EMAIL', 'INSTAGRAM', 'THREADS', 'FACEBOOK', 'LINKEDIN', 'INTERNAL'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <button className="crm-button">Filter</button>
      </form>
      {data.rows.length ? (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <caption>{data.count} jobs</caption>
            <thead>
              <tr>
                <th>Job</th>
                <th>Person</th>
                <th>Action</th>
                <th>Status</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={v(r.id)}>
                  <td>
                    <a href={'/crm/automation/jobs/' + v(r.id)}>{v(r.id).slice(0, 8)}</a>
                    <small>{r.dry_run ? 'Dry run' : 'External'}</small>
                  </td>
                  <td>{v(r.person_name)}</td>
                  <td>
                    {v(r.channel)} · {v(r.type)}
                    <small>{v(r.communication_purpose)}</small>
                  </td>
                  <td>
                    <span
                      className={
                        'crm-badge ' +
                        (r.status === 'BLOCKED' || r.status === 'FAILED' ? 'crm-badge-danger' : '')
                      }
                    >
                      {v(r.status)}
                    </span>
                    <small>{v(r.failure_code)}</small>
                  </td>
                  <td>
                    {new Date(v(r.scheduled_for)).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="crm-empty">No jobs match these filters.</p>
      )}
    </CrmShell>
  );
}
