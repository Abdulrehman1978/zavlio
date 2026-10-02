import { SafePolicyForm } from '../../../../components/automation-actions';
import { CrmShell } from '../../../../components/crm-shell';
import { loadAutomationOverview } from '../../../../lib/crm/automation';
import { requireCrmRolePage } from '../../../../lib/crm/page';
export const dynamic = 'force-dynamic';
const v = (x: unknown) => String(x ?? '—');
export default async function SettingsPage() {
  const auth = await requireCrmRolePage('/crm/automation/settings', 'ADMIN', 'OWNER');
  const { policy } = await loadAutomationOverview();
  const config = (policy?.configuration ?? {}) as Record<string, unknown>;
  return (
    <CrmShell role={auth.staff.role}>
      <a className="crm-back" href="/crm/automation">
        ← Automation
      </a>
      <h1>Automation safety settings</h1>
      <div className="analytics-caveat">
        No setting on this page can enable a real external side effect in Packet 13.
      </div>
      <div className="crm-detail-grid">
        <section className="crm-card">
          <h2>Active policy</h2>
          <p>
            <strong>Version:</strong> {v(policy?.version)}
          </p>
          <p>
            <strong>Enabled:</strong> {v(config.enabled)}
          </p>
          <p>
            <strong>Dry run:</strong> {v(config.dryRun)}
          </p>
          <p>
            <strong>Approval:</strong> {v(config.approvalRequired)}
          </p>
          <p>
            <strong>Timezone:</strong>{' '}
            {v((config.workingHours as Record<string, unknown>)?.timezone)}
          </p>
        </section>
        <section className="crm-card">
          <h2>Safety limits</h2>
          <p>Cooldown: {v(config.cooldownMinutes)} minutes</p>
          <p>
            Per person: {v(config.personDailyCap)} / 24h · {v(config.personWeeklyCap)} / 7d
          </p>
          <p>Approval validity: {v(config.approvalValidityMinutes)} minutes</p>
          <p>
            Lease: {v(config.leaseSeconds)} seconds · Attempts: {v(config.maxAttempts)}
          </p>
        </section>
      </div>
      {auth.staff.role === 'OWNER' && <SafePolicyForm enabled={config.enabled === true} />}
    </CrmShell>
  );
}
