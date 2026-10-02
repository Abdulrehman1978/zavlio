import { notFound } from 'next/navigation';
import { CrmShell } from '../../../../components/crm-shell';
import { OpportunityActions } from '../../../../components/crm-opportunity-actions';
import { getOpportunityDetail } from '../../../../lib/crm/data';
import { requireCrmPage } from '../../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';
export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireCrmPage(`/crm/opportunities/${id}`);
  const detail = await getOpportunityDetail(await createServerSupabaseClient(), id);
  if (!detail) notFound();
  const op = detail.opportunity;
  return (
    <CrmShell role={staff.staff.role}>
      <article aria-labelledby="opportunity-title">
        <a className="crm-back" href="/crm/pipeline">
          ← Pipeline
        </a>
        <header className="crm-detail-header">
          <div>
            <p className="crm-eyebrow">Opportunity</p>
            <h1 id="opportunity-title">{op.title}</h1>
            <p>
              <a href={`/crm/people/${op.person_id}`}>{op.person_name}</a>
              {op.organization_name ? ` · ${op.organization_name}` : ''}
            </p>
          </div>
          <div>
            <span className="crm-badge">{op.stage_name}</span>
            {op.do_not_contact ? (
              <span className="crm-badge crm-badge-danger">Do not contact</span>
            ) : null}
          </div>
        </header>
        <section className="crm-summary-grid">
          <div>
            <span>Value</span>
            <strong>
              {op.estimated_value === null ? '—' : `${op.currency} ${String(op.estimated_value)}`}
            </strong>
          </div>
          <div>
            <span>Manual probability</span>
            <strong>{op.probability === null ? '—' : `${op.probability}%`}</strong>
          </div>
          <div>
            <span>Lead score</span>
            <strong>
              {op.lead_score ?? '—'} · {op.intent_level ?? 'Not scored'}
            </strong>
          </div>
          <div>
            <span>Primary interest</span>
            <strong>{op.primary_interest ?? '—'}</strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{op.owner_name ?? 'Unassigned'}</strong>
          </div>
          <div>
            <span>Expected close</span>
            <strong>{op.expected_close_date ?? '—'}</strong>
          </div>
          <div>
            <span>Next task</span>
            <strong>{op.next_task_title ?? '—'}</strong>
          </div>
          <div>
            <span>Updated</span>
            <strong>{date(op.updated_at)}</strong>
          </div>
        </section>
        <OpportunityActions
          opportunity={op}
          stages={detail.stages}
          staff={detail.staff}
          canMutate={staff.staff.role !== 'VIEWER'}
        />
        <div className="crm-detail-grid">
          <section className="crm-card">
            <h2>Stage history</h2>
            {detail.history.length ? (
              <ol className="crm-timeline">
                {detail.history.map((item) => (
                  <li key={item.id}>
                    <time>{date(item.changed_at)}</time>
                    <strong>
                      {item.fromStage ?? 'Created'} → {item.toStage}
                    </strong>
                    <span>{item.reason ?? 'No reason recorded'}</span>
                    <small>{item.actor ?? 'System'}</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="crm-empty-inline">No stage changes yet.</p>
            )}
          </section>
          <section className="crm-card">
            <h2>Related tasks</h2>
            {detail.tasks.length ? (
              <ul className="crm-list">
                {detail.tasks.map((task) => (
                  <li key={task.id}>
                    <strong>{task.title}</strong>
                    <span>
                      {task.status} · {task.priority}
                      {task.is_overdue ? ' · OVERDUE' : ''}
                    </span>
                    <small>Due {date(task.due_at)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No related tasks.</p>
            )}
          </section>
        </div>
      </article>
    </CrmShell>
  );
}
