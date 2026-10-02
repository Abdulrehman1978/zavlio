import { CrmShell } from '../../../../components/crm-shell';
import { requireCrmRolePage } from '../../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function LeadScoringSettings() {
  const context = await requireCrmRolePage('/crm/settings/lead-scoring', 'ADMIN', 'OWNER');
  const db = await createServerSupabaseClient();
  const model = await db
    .from('lead_scoring_models')
    .select('model_key,version,name,active,configuration,configuration_hash,activated_at')
    .eq('active', true)
    .single();
  if (model.error) throw model.error;
  const config = model.data.configuration as {
    lookbackDays?: number;
    staleAfterHours?: number;
    thresholds?: Array<{ intent: string; min: number }>;
    decay?: Array<{ maxDays: number | null; factor: number }>;
    signals?: Array<{ key: string; points: number; cap: number; occurrence: string }>;
  };
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="scoring-title">
        <p className="crm-eyebrow">Read-only configuration</p>
        <h1 id="scoring-title">Lead scoring</h1>
        <p>
          {model.data.name} · {model.data.model_key}_V{model.data.version}
        </p>
        <section className="crm-summary-grid">
          <div>
            <span>Range</span>
            <strong>0–100</strong>
          </div>
          <div>
            <span>Lookback</span>
            <strong>{config.lookbackDays} days</strong>
          </div>
          <div>
            <span>Stale after</span>
            <strong>{config.staleAfterHours} hours</strong>
          </div>
          <div>
            <span>Config hash</span>
            <strong>{model.data.configuration_hash.slice(0, 12)}…</strong>
          </div>
        </section>
        <div className="crm-detail-grid">
          <section className="crm-card">
            <h2>Intent bands</h2>
            <ul className="crm-list">
              {config.thresholds?.map((item) => (
                <li key={item.intent}>
                  <strong>{item.intent}</strong>
                  <span>Starts at {item.min}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="crm-card">
            <h2>Decay</h2>
            <ul className="crm-list">
              {config.decay?.map((item, index) => (
                <li key={index}>
                  <strong>
                    {item.maxDays === null ? '> 90 days' : `Up to ${item.maxDays} days`}
                  </strong>
                  <span>{Math.round(item.factor * 100)}% behavioral contribution</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="crm-card">
            <h2>Signals</h2>
            <ul className="crm-list">
              {config.signals?.map((item) => (
                <li key={item.key}>
                  <strong>{item.key}</strong>
                  <span>
                    +{item.points} · cap {item.cap} · {item.occurrence}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </CrmShell>
  );
}
