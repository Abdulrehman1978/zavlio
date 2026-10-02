import { CrmShell } from '../../../components/crm-shell';
import { TaskActions } from '../../../components/crm-task-actions';
import { listTasks, parseTaskQuery } from '../../../lib/crm/data';
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
    : 'No due date';
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/tasks');
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
  const query = parseTaskQuery(params);
  const db = await createServerSupabaseClient();
  const [data, staff] = await Promise.all([
    listTasks(db, query, context.staff.id),
    db
      .from('staff_profiles')
      .select('id,name,role')
      .eq('active', true)
      .in('role', ['OWNER', 'ADMIN', 'OPERATOR'])
      .order('name'),
  ]);
  if (staff.error) throw staff.error;
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="tasks-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Next action workload</p>
            <h1 id="tasks-title">Tasks</h1>
            <p>{data.count} matching tasks · overdue uses server time and Asia/Kolkata display.</p>
          </div>
        </header>
        <form className="crm-filter-bar">
          <label>
            View
            <select name="scope" defaultValue={query.scope}>
              {['mine', 'all', 'overdue', 'today', 'upcoming', 'completed', 'unassigned'].map(
                (scope) => (
                  <option key={scope}>{scope}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" defaultValue={query.priority ?? ''}>
              <option value="">All priorities</option>
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
          <button>Apply</button>
        </form>
        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Related</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assignee</th>
                <th>Due</th>
                {context.staff.role !== 'VIEWER' ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>
                    {task.person_id ? (
                      <a href={`/crm/people/${task.person_id}`}>{task.person_name ?? 'Person'}</a>
                    ) : (
                      '—'
                    )}
                    {task.opportunity_id ? (
                      <>
                        <br />
                        <a href={`/crm/opportunities/${task.opportunity_id}`}>
                          {task.opportunity_title ?? 'Opportunity'}
                        </a>
                      </>
                    ) : null}
                  </td>
                  <td>{task.priority}</td>
                  <td>{task.status}</td>
                  <td>{task.assignee_name ?? 'Unassigned'}</td>
                  <td>
                    {date(task.due_at)}
                    {task.is_overdue ? (
                      <>
                        <br />
                        <strong>OVERDUE</strong>
                      </>
                    ) : null}
                  </td>
                  {context.staff.role !== 'VIEWER' ? (
                    <td>
                      <TaskActions task={task} staff={staff.data ?? []} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.rows.length ? <p className="crm-empty">No tasks match this workload view.</p> : null}
      </section>
    </CrmShell>
  );
}
