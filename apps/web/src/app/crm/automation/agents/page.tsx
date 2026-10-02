import { CrmShell } from '../../../../components/crm-shell';
import { loadAutomationOverview } from '../../../../lib/crm/automation';
import { requireCrmPage } from '../../../../lib/crm/page';
export const dynamic = 'force-dynamic';
const v = (x: unknown) => String(x ?? '—');
export default async function AgentsPage() {
  const auth = await requireCrmPage('/crm/automation/agents');
  const { agents } = await loadAutomationOverview();
  return (
    <CrmShell role={auth.staff.role}>
      <a className="crm-back" href="/crm/automation">
        ← Automation
      </a>
      <h1>Automation agents</h1>
      <p>
        Signed protocol-v1 clients use isolated machine credentials and remain constrained to
        dry-run execution. Packet 15 social adapter preparation remains dry-run-only and live
        external execution is disabled.
      </p>
      {agents.length ? (
        <div className="crm-table-wrap">
          <table className="crm-table">
            <caption>Registered execution clients</caption>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Version</th>
                <th>Protocol</th>
                <th>Mode</th>
                <th>Heartbeat</th>
                <th>Negotiated capabilities</th>
                <th>Adapter</th>
                <th>Claims</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={v(a.id)}>
                  <td>
                    {v(a.name)}
                    <small>{v(a.host)}</small>
                  </td>
                  <td>{v(a.derived_status)}</td>
                  <td>{v(a.bridge_version ?? a.version)}</td>
                  <td>v{v(a.protocol_version)}</td>
                  <td>{v(a.executor_mode)}</td>
                  <td>{v(a.last_heartbeat_at)}</td>
                  <td>{JSON.stringify(a.negotiated_capabilities ?? a.capabilities)}</td>
                  <td>
                    {v((a.runtime_state as Record<string, unknown> | null)?.adapterVersion)} ·{' '}
                    {v((a.runtime_state as Record<string, unknown> | null)?.adapterStatus)}
                  </td>
                  <td>{v(a.active_claims)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="crm-empty">
          No agents registered. All real channel integrations are unavailable.
        </p>
      )}
    </CrmShell>
  );
}
