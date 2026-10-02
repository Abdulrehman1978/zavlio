import { CrmShell } from '../../../../components/crm-shell';
import { requireCrmPage } from '../../../../lib/crm/page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const providers = [
  ['THREADS', 'THREADS_PROVIDER_V1'],
  ['FACEBOOK', 'FACEBOOK_PROVIDER_V1'],
  ['LINKEDIN', 'LINKEDIN_PROVIDER_V1'],
] as const;

export default async function SocialSettingsPage() {
  const context = await requireCrmPage('/crm/settings/social');
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="social-settings-title">
        <p className="crm-eyebrow">Controlled integration</p>
        <h1 id="social-settings-title">Social provider status</h1>
        <p>
          Each provider has an independent readiness state. Observation and live execution are
          separate controls; this installation keeps live execution disabled.
        </p>
        <div className="crm-card-list">
          {providers.map(([platform, version]) => (
            <article className="crm-card" key={platform}>
              <header>
                <span className="crm-badge">{platform}</span>
                <span className="crm-badge">PROVIDER_IMPLEMENTED</span>
              </header>
              <h2>{version}</h2>
              <dl className="crm-definition-list">
                <div>
                  <dt>Authentication</dt>
                  <dd>UNKNOWN — user-controlled session required</dd>
                </div>
                <div>
                  <dt>Read-only verification</dt>
                  <dd>Not exercised in this environment</dd>
                </div>
                <div>
                  <dt>Canary</dt>
                  <dd>Disabled</dd>
                </div>
                <div>
                  <dt>Live execution</dt>
                  <dd>Disabled</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <p className="crm-note">
          Instagram is unsupported. Login, MFA, CAPTCHA, checkpoint, and suspicious-activity
          handling remain manual; no credentials or cookies are stored.
        </p>
      </section>
    </CrmShell>
  );
}
