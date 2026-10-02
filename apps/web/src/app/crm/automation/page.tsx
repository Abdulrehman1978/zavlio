import { CrmShell } from '../../../components/crm-shell';
import { AutomationProposalForm } from '../../../components/automation-actions';
import { loadAutomationOverview } from '../../../lib/crm/automation';
import { requireCrmPage } from '../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
export const dynamic = 'force-dynamic';
const value = (x: unknown) => String(x ?? '—');
export default async function AutomationPage() {
  const auth = await requireCrmPage('/crm/automation');
  const data = await loadAutomationOverview();
  const db = await createServerSupabaseClient();
  const { data: people } = await db
    .from('people')
    .select('id,display_name')
    .is('merged_into_person_id', null)
    .neq('lifecycle_stage', 'ARCHIVED')
    .order('display_name')
    .limit(100);
  return (
    <CrmShell role={auth.staff.role}>
      <div className="crm-page-heading">
        <div>
          <p className="crm-eyebrow">Safety control plane</p>
          <h1>Automation</h1>
          <p>
            CRM policy governs every job. The signed machine bridge can execute only INTERNAL NOOP
            simulations and Packet 15 social preparation in dry-run mode; live external channels
            remain disabled.
          </p>
        </div>
      </div>
      <nav className="analytics-tabs" aria-label="Automation sections">
        {[
          ['Overview', '/crm/automation'],
          ['Approvals', '/crm/automation/approvals'],
          ['Jobs', '/crm/automation/jobs'],
          ['Agents', '/crm/automation/agents'],
          ['Settings', '/crm/automation/settings'],
        ].map(([l, h], i) => (
          <a key={h} href={h} aria-current={i === 0 ? 'page' : undefined}>
            {l}
          </a>
        ))}
      </nav>
      <div className="analytics-caveat">
        <strong>
          {data.policy
            ? value((data.policy.configuration as Record<string, unknown>)?.enabled) === 'true'
              ? 'Enabled for simulation'
              : 'Disabled'
            : 'No policy'}
        </strong>{' '}
        · Dry run required · Human approval required
      </div>
      <div className="crm-stat-grid">
        {Object.entries(data.counts).map(([status, count]) => (
          <a className="crm-stat" href={'/crm/automation/jobs?status=' + status} key={status}>
            <strong>{count}</strong>
            <span>{status.replaceAll('_', ' ')}</span>
            <small>Operational jobs</small>
          </a>
        ))}
      </div>
      <section className="crm-card">
        <h2>Agent status</h2>
        {data.agents.length ? (
          <ul className="crm-list">
            {data.agents.map((a) => (
              <li key={value(a.id)}>
                <strong>{value(a.name)}</strong>
                <span>
                  {value(a.derived_status)} · protocol {value(a.protocol_version)} ·{' '}
                  {value(a.executor_mode)} · adapter{' '}
                  {value((a.runtime_state as Record<string, unknown> | null)?.adapterVersion)} ·{' '}
                  {value((a.runtime_state as Record<string, unknown> | null)?.adapterStatus)} ·{' '}
                  {value(a.active_claims)} active claims
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No agents registered. Live social channels remain unavailable.</p>
        )}
      </section>
      {auth.staff.role !== 'VIEWER' && (
        <AutomationProposalForm
          people={(people ?? []) as Array<{ id: string; display_name: string }>}
        />
      )}
    </CrmShell>
  );
}
