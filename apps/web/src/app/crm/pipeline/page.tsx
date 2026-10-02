import { CrmShell } from '../../../components/crm-shell';
import { listPipeline, parsePipelineQuery } from '../../../lib/crm/data';
import { requireCrmPage } from '../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

function money(value: number | null, currency: string | null) {
  return value === null ? 'Value not supplied' : `${currency} ${String(value)}`;
}
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await requireCrmPage('/crm/pipeline');
  const raw = await searchParams;
  const params = new URLSearchParams(
    Object.entries(raw).flatMap(([key, value]) =>
      value === undefined
        ? []
        : Array.isArray(value)
          ? value.map((item) => [key, item])
          : [[key, value]],
    ),
  );
  const query = parsePipelineQuery(params);
  const data = await listPipeline(await createServerSupabaseClient(), query);
  const grouped = new Map(
    data.stages.map((stage) => [stage.id, data.rows.filter((row) => row.stage_id === stage.id)]),
  );
  return (
    <CrmShell role={staff.staff.role}>
      <section aria-labelledby="pipeline-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Sales operations</p>
            <h1 id="pipeline-title">Pipeline</h1>
            <p>
              {data.count} matching opportunities · current score, affinity, next task, and DNC
              remain visible.
            </p>
          </div>
        </header>
        <form className="crm-filter-bar" method="get">
          <label>
            Search
            <input name="q" defaultValue={query.q} />
          </label>
          <label>
            Stage
            <select name="stage" defaultValue={query.stage ?? ''}>
              <option value="">All stages</option>
              {data.stages.map((stage) => (
                <option key={stage.id} value={stage.slug}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Intent
            <select name="intent" defaultValue={query.intent ?? ''}>
              <option value="">All intent</option>
              {['LOW', 'INTERESTED', 'WARM', 'HIGH', 'PRIORITY'].map((intent) => (
                <option key={intent}>{intent}</option>
              ))}
            </select>
          </label>
          <label>
            View
            <select name="view" defaultValue={query.view}>
              <option value="kanban">Kanban</option>
              <option value="table">Table</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="closed" value="yes" defaultChecked={query.closed} />{' '}
            Include closed
          </label>
          <button>Apply</button>
        </form>
        {query.view === 'kanban' ? (
          <div className="crm-kanban" aria-label="Opportunity Kanban">
            {data.stages
              .filter((stage) => query.closed || !stage.is_closed)
              .map((stage) => (
                <section
                  key={stage.id}
                  className="crm-kanban-column"
                  aria-labelledby={`stage-${stage.id}`}
                >
                  <h2 id={`stage-${stage.id}`}>
                    {stage.name} <small>{grouped.get(stage.id)?.length ?? 0}</small>
                  </h2>
                  {(grouped.get(stage.id) ?? []).map((row) => (
                    <article key={row.id} className="crm-kanban-card">
                      <a href={`/crm/opportunities/${row.id}`}>
                        <strong>{row.title}</strong>
                      </a>
                      <span>
                        {row.person_name}
                        {row.organization_name ? ` · ${row.organization_name}` : ''}
                      </span>
                      <small>
                        {money(row.estimated_value, row.currency)} · {row.lead_score ?? '—'}{' '}
                        {row.intent_level ?? ''}
                      </small>
                      <small>
                        {row.primary_interest ?? 'No affinity'} ·{' '}
                        {row.next_task_title ?? 'No open task'}
                        {row.next_task_overdue ? ' · OVERDUE' : ''}
                      </small>
                      {row.do_not_contact ? (
                        <span className="crm-badge crm-badge-danger">Do not contact</span>
                      ) : null}
                    </article>
                  ))}
                </section>
              ))}
          </div>
        ) : (
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Opportunity</th>
                  <th>Person</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Score</th>
                  <th>Interest</th>
                  <th>Next task</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <a href={`/crm/opportunities/${row.id}`}>{row.title}</a>
                    </td>
                    <td>{row.person_name}</td>
                    <td>{row.stage_name}</td>
                    <td>{money(row.estimated_value, row.currency)}</td>
                    <td>
                      {row.lead_score ?? '—'} {row.intent_level ?? ''}
                    </td>
                    <td>{row.primary_interest ?? '—'}</td>
                    <td>{row.next_task_title ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!data.rows.length ? (
          <p className="crm-empty">No opportunities match these filters.</p>
        ) : null}
      </section>
    </CrmShell>
  );
}
