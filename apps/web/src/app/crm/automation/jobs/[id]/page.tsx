import { notFound } from 'next/navigation';
import {
  AutomationDecisionActions,
  AutomationJobControls,
} from '../../../../../components/automation-actions';
import { CrmShell } from '../../../../../components/crm-shell';
import { loadAutomationJob } from '../../../../../lib/crm/automation';
import { requireCrmPage } from '../../../../../lib/crm/page';
export const dynamic = 'force-dynamic';
const v = (x: unknown) => String(x ?? '—');
export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireCrmPage('/crm/automation/jobs/' + id);
  const data = await loadAutomationJob(id);
  if (!data.job) notFound();
  const j = data.job;
  const adapterEvidence = j.execution_evidence as Record<string, unknown> | null | undefined;
  return (
    <CrmShell role={auth.staff.role}>
      <a className="crm-back" href="/crm/automation/jobs">
        ← Jobs
      </a>
      <div className="crm-detail-header">
        <div>
          <p className="crm-eyebrow">{j.dry_run ? 'Dry run' : 'External action'}</p>
          <h1>
            {v(j.channel)} {v(j.type)}
          </h1>
          <p>
            {v(j.person_name)} · {v(j.communication_purpose)}
          </p>
        </div>
        <span
          className={
            'crm-badge ' +
            (j.status === 'BLOCKED' || j.status === 'FAILED' ? 'crm-badge-danger' : '')
          }
        >
          {v(j.status)}
        </span>
      </div>
      <div className="crm-detail-grid">
        <section className="crm-card">
          <h2>Policy checklist</h2>
          <p>
            <strong>Decision:</strong> {v(j.policy_decision)}
          </p>
          <p>
            <strong>Reasons:</strong>{' '}
            {Array.isArray(j.reason_codes) ? j.reason_codes.join(', ') : 'None'}
          </p>
          <p>
            <strong>DNC:</strong> {j.do_not_contact ? 'Yes — cannot override' : 'No'}
          </p>
          <p>
            <strong>Score:</strong> {v(j.lead_score)} {v(j.intent_level)} (context only)
          </p>
        </section>
        <section className="crm-card">
          <h2>Execution contract</h2>
          <p>
            <strong>Attempts:</strong> {v(j.attempt_count)} / {v(j.max_attempts)}
          </p>
          <p>
            <strong>Scheduled:</strong> {v(j.scheduled_for)}
          </p>
          <p>
            <strong>Lease:</strong> {v(j.lease_expires_at)}
          </p>
          <p>
            <strong>Agent:</strong> {v(j.agent_name)} · protocol v{v(j.protocol_version)} ·{' '}
            {v(j.bridge_version)}
          </p>
          <p>
            <strong>Machine instance:</strong> {v(j.machine_instance_id)}
          </p>
          <p>
            <strong>Claim operation:</strong> {v(j.claim_operation_id)}
          </p>
          <p>
            <strong>Idempotency:</strong> {v(j.idempotency_key).slice(0, 20)}…
          </p>
        </section>
      </div>
      {j.status === 'AWAITING_APPROVAL' && (
        <AutomationDecisionActions
          jobId={id}
          version={Number(j.version)}
          canApprove={auth.staff.role === 'ADMIN' || auth.staff.role === 'OWNER'}
        />
      )}
      <AutomationJobControls
        jobId={id}
        version={Number(j.version)}
        status={String(j.status)}
        canAdminister={auth.staff.role === 'ADMIN' || auth.staff.role === 'OWNER'}
      />
      <section className="crm-card">
        <h2>Proposed content</h2>
        <p className="crm-preformatted">{v((j.payload as Record<string, unknown>)?.text)}</p>
      </section>
      <section className="crm-card">
        <h2>Execution evidence</h2>
        {adapterEvidence && (
          <pre className="crm-preformatted">{JSON.stringify(adapterEvidence, null, 2)}</pre>
        )}
        {data.actions.length ? (
          <ul className="crm-list">
            {data.actions.map((action) => (
              <li key={v(action.id)}>
                <strong>{v(action.status)}</strong>
                <span>{v(action.failure_code)}</span>
                <small>{v(action.completed_at ?? action.requested_at)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No execution evidence recorded.</p>
        )}
      </section>
      <div className="crm-detail-grid">
        <section className="crm-card">
          <h2>Approval history</h2>
          {data.approvals.length ? (
            <ul className="crm-list">
              {data.approvals.map((a) => (
                <li key={v(a.id)}>
                  <strong>{v(a.decision)}</strong>
                  <span>{v(a.reason)}</span>
                  <small>
                    {v(a.decided_at)} · expires {v(a.expires_at)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>None.</p>
          )}
        </section>
        <section className="crm-card">
          <h2>Job history</h2>
          {data.events.length ? (
            <ul className="crm-list">
              {data.events.map((e) => (
                <li key={v(e.id)}>
                  <strong>{v(e.event_type)}</strong>
                  <span>
                    {v(e.from_status)} → {v(e.to_status)} · {v(e.reason_code)}
                  </span>
                  <small>{v(e.occurred_at)}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>None.</p>
          )}
        </section>
      </div>
    </CrmShell>
  );
}
