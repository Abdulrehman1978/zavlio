import { CrmShell } from '../../../components/crm-shell';
import { requireCrmPage } from '../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SettingsHubPage() {
  const context = await requireCrmPage('/crm/settings');
  const role = context.staff.role;
  const isOperatorOrHigher = role === 'OPERATOR' || role === 'ADMIN' || role === 'OWNER';
  const isAdminOrOwner = role === 'ADMIN' || role === 'OWNER';

  const db = await createServerSupabaseClient();
  const [staffCount, pendingMatchesCount, openJobsCount] = await Promise.all([
    db.from('staff_profiles').select('id', { count: 'exact', head: true }).eq('active', true),
    db
      .from('identity_match_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PENDING'),
    db
      .from('automation_jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['QUEUED', 'CLAIMED']),
  ]);

  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="settings-page-title">
        <header className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">System Administration</p>
            <h1 id="settings-page-title">Settings & configurations</h1>
            <p>
              Unified administrative index for staff access, identity resolution, scoring models,
              compliance policies, and automation controls.
            </p>
          </div>
        </header>

        <div className="crm-stat-grid">
          <div className="crm-stat">
            <strong>{staffCount.count ?? 0}</strong>
            <span>Active staff profiles</span>
          </div>
          <div className="crm-stat">
            <strong>{pendingMatchesCount.count ?? 0}</strong>
            <span>Pending identity matches</span>
          </div>
          <div className="crm-stat">
            <strong>{openJobsCount.count ?? 0}</strong>
            <span>Active automation jobs</span>
          </div>
          <div className="crm-stat">
            <strong>{role}</strong>
            <span>Your session role</span>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
          }}
        >
          {/* Staff Settings */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Staff & RBAC</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Manage active team members, role assignments (OWNER, ADMIN, OPERATOR, VIEWER), and
              last-active owner protections.
            </p>
            {isAdminOrOwner ? (
              <a
                href="/crm/settings/staff"
                className="crm-button"
                style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
              >
                Manage Staff Profiles →
              </a>
            ) : (
              <span className="crm-note" style={{ margin: 0 }}>
                Restricted to ADMIN & OWNER
              </span>
            )}
          </div>

          {/* Identity Review */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Identity Review & Merge</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Resolve ambiguous visitor-to-person matches, inspect candidate confidence scores, and
              perform canonical merges.
            </p>
            {isOperatorOrHigher ? (
              <a
                href="/crm/settings/identity-review"
                className="crm-button"
                style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
              >
                Review Candidates ({pendingMatchesCount.count ?? 0}) →
              </a>
            ) : (
              <span className="crm-note" style={{ margin: 0 }}>
                Restricted to OPERATOR+
              </span>
            )}
          </div>

          {/* Lead Scoring */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Lead Scoring Model</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Calibrate intent weights, activity decay factors, lookback windows, and service
              affinity coefficients.
            </p>
            {isAdminOrOwner ? (
              <a
                href="/crm/settings/lead-scoring"
                className="crm-button"
                style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
              >
                Configure Scoring Model →
              </a>
            ) : (
              <span className="crm-note" style={{ margin: 0 }}>
                Restricted to ADMIN & OWNER
              </span>
            )}
          </div>

          {/* Social Integration */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Social Provider Bounds</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Inspect social observation status, mock provider harnesses, and outbound execution
              kill switches.
            </p>
            <a
              href="/crm/settings/social"
              className="crm-button"
              style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
            >
              Inspect Social Bounds →
            </a>
          </div>

          {/* Automation Settings */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Automation Control Plane</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Manage safe policy activation, execution kill switch, human-in-the-loop review mode,
              and Bridge nonces.
            </p>
            {isAdminOrOwner ? (
              <a
                href="/crm/automation/settings"
                className="crm-button"
                style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
              >
                Automation Settings →
              </a>
            ) : (
              <span className="crm-note" style={{ margin: 0 }}>
                Restricted to ADMIN & OWNER
              </span>
            )}
          </div>

          {/* Audit Logs */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Audit Trail Explorer</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Immutable append-only ledger of system events, content changes, subject exports, and
              operational transitions.
            </p>
            {isAdminOrOwner ? (
              <a
                href="/crm/audit"
                className="crm-button"
                style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
              >
                Open Audit Logs →
              </a>
            ) : (
              <span className="crm-note" style={{ margin: 0 }}>
                Restricted to ADMIN & OWNER
              </span>
            )}
          </div>

          {/* Consent & Privacy */}
          <div className="crm-card">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Consent & Privacy Workbench</h2>
            <p style={{ margin: '0.4rem 0', fontSize: '0.85rem', color: '#4a5568' }}>
              Review immutable consent records, global Do-Not-Contact lists, and run verified
              subject access requests.
            </p>
            <a
              href="/crm/consent"
              className="crm-button"
              style={{ textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
            >
              Open Privacy Workbench →
            </a>
          </div>

          {/* System Environment */}
          <div className="crm-card" style={{ background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Security & Platform Status</h2>
            <div
              style={{
                margin: '0.4rem 0',
                fontSize: '0.8rem',
                color: '#4a5568',
                display: 'grid',
                gap: '0.2rem',
              }}
            >
              <div>
                • <strong>RLS Mode:</strong> Enforced on all tables
              </div>
              <div>
                • <strong>Live External Execution:</strong> Strictly Disabled (Synthetic/Dry-run)
              </div>
              <div>
                • <strong>Database Release Gate:</strong> VERIFIED (20 migrations, 175 pgTAP)
              </div>
              <div>
                • <strong>Bridge Protocol:</strong> HMAC-SHA256 signed
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#718096', marginTop: 'auto' }}>
              Zavlio Monorepo v2.0
            </span>
          </div>
        </div>
      </section>
    </CrmShell>
  );
}
