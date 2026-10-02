import { CrmShell } from '../../components/crm-shell';
import { requireCrmPage } from '../../lib/crm/page';
import { createServerSupabaseClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CrmPage() {
  const context = await requireCrmPage('/crm');
  const db = await createServerSupabaseClient();
  const [people, enquiries, tasks, candidates] = await Promise.all([
    db
      .from('people')
      .select('id', { count: 'exact', head: true })
      .is('merged_into_person_id', null),
    db
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PROCESSED'),
    db
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['OPEN', 'IN_PROGRESS']),
    db
      .from('identity_match_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'PENDING'),
  ]);
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="crm-title">
        <h1 id="crm-title">CRM workspace</h1>
        <p>
          Signed in as {context.staff.name}. Operational records are server-authorized and
          RLS-backed.
        </p>
        <div className="crm-stat-grid">
          <a className="crm-stat" href="/crm/people">
            <strong>{people.count ?? 0}</strong>
            <span>Active people</span>
          </a>
          <a className="crm-stat" href="/crm/people">
            <strong>{enquiries.count ?? 0}</strong>
            <span>Processed enquiries</span>
          </a>
          <a className="crm-stat" href="/crm/people">
            <strong>{tasks.count ?? 0}</strong>
            <span>Open tasks</span>
          </a>
          <a className="crm-stat" href="/crm/settings/identity-review">
            <strong>{candidates.count ?? 0}</strong>
            <span>Pending identity matches</span>
          </a>
        </div>
        <p className="crm-note">
          Pipeline, full task workflows, analytics dashboards, and automation controls belong to
          later packets.
        </p>
      </section>
    </CrmShell>
  );
}
