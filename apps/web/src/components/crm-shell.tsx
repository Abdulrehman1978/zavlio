import type { ReactNode } from 'react';
import type { StaffRole } from '../lib/auth/roles';

const links = [
  ['CRM home', '/crm', true],
  ['People', '/crm/people', true],
  ['Organizations', '/crm/organizations', true],
  ['Identity review', '/crm/settings/identity-review', true],
  ['Pipeline', '/crm/pipeline', true],
  ['Tasks', '/crm/tasks', true],
  ['Conversations', '/crm/conversations', true],
  ['Campaigns', '/crm/campaigns', true],
  ['Content', '/crm/content', true],
  ['Consent & Privacy', '/crm/consent', true],
  ['Analytics', '/crm/analytics', true],
  ['Automation', '/crm/automation', true],
  ['Audit logs', '/crm/audit', true],
  ['Settings', '/crm/settings', true],
  ['Staff settings', '/crm/settings/staff', true],
  ['Lead scoring', '/crm/settings/lead-scoring', true],
  ['Social settings', '/crm/settings/social', true],
] as const;

export function CrmShell({ children, role }: Readonly<{ children: ReactNode; role: StaffRole }>) {
  return (
    <div className="crm-shell">
      <header className="crm-header">
        <div>
          <a className="crm-brand" href="/crm">
            Zavlio CRM
          </a>
          <span className="crm-role">{role}</span>
        </div>
        <form action="/auth/logout" method="post">
          <button type="submit">Log out</button>
        </form>
      </header>
      <div className="crm-layout">
        <nav className="crm-nav" aria-label="CRM navigation">
          {links
            .filter(([, href]) => href !== '/crm/settings/identity-review' || role !== 'VIEWER')
            .filter(
              ([, href]) => href !== '/crm/settings/staff' || role === 'ADMIN' || role === 'OWNER',
            )
            .filter(
              ([, href]) =>
                href !== '/crm/settings/lead-scoring' || role === 'ADMIN' || role === 'OWNER',
            )
            .filter(([, href]) => href !== '/crm/audit' || role === 'ADMIN' || role === 'OWNER')
            .map(([label, href, implemented]) =>
              implemented ? (
                <a key={href} href={href}>
                  {label}
                </a>
              ) : (
                <span key={href} className="crm-nav-placeholder">
                  {label} <small>Not available yet</small>
                </span>
              ),
            )}
        </nav>
        <main className="crm-main">{children}</main>
      </div>
    </div>
  );
}
