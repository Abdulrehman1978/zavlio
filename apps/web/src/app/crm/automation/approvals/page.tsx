import { CrmShell } from '../../../../components/crm-shell';
import { loadAutomationJobs } from '../../../../lib/crm/automation';
import { requireCrmPage } from '../../../../lib/crm/page';
export const dynamic = 'force-dynamic';
const v = (x: unknown) => String(x ?? '—');
export default async function ApprovalsPage() {
  const auth = await requireCrmPage('/crm/automation/approvals');
  const { rows } = await loadAutomationJobs({ status: 'AWAITING_APPROVAL', page: 1 });
  return (
    <CrmShell role={auth.staff.role}>
      <a className="crm-back" href="/crm/automation">
        ← Automation
      </a>
      <h1>Approval queue</h1>
      <p>Lead score is context only. DNC and communication permission remain authoritative.</p>
      {rows.length ? (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <caption>Pending human review</caption>
            <thead>
              <tr>
                <th>Person</th>
                <th>Action</th>
                <th>Purpose</th>
                <th>Safety</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={v(r.id)}>
                  <td>
                    <a href={'/crm/automation/jobs/' + v(r.id)}>{v(r.person_name)}</a>
                    <small>
                      {v(r.organization_name)} · score {v(r.lead_score)} {v(r.intent_level)}
                    </small>
                  </td>
                  <td>
                    {v(r.channel)} · {v(r.type)}
                  </td>
                  <td>{v(r.communication_purpose)}</td>
                  <td>{r.do_not_contact ? 'BLOCKED — Do not contact' : v(r.policy_decision)}</td>
                  <td>
                    {new Date(v(r.created_at)).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="crm-empty">No approvals are waiting.</p>
      )}
    </CrmShell>
  );
}
