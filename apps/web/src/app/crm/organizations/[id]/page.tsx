import { notFound } from 'next/navigation';
import { CrmShell } from '../../../../components/crm-shell';
import { getOrganizationDetail } from '../../../../lib/crm/data';
import { requireCrmPage } from '../../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function date(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';
}

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireCrmPage(`/crm/organizations/${id}`);
  const detail = await getOrganizationDetail(await createServerSupabaseClient(), id);
  if (!detail) notFound();
  const organization = detail.organization;
  return (
    <CrmShell role={context.staff.role}>
      <article aria-labelledby="organization-title">
        <a className="crm-back" href="/crm/organizations">
          ← Organizations
        </a>
        <header className="crm-detail-header">
          <div>
            <p className="crm-eyebrow">Organization record</p>
            <h1 id="organization-title">{organization.name}</h1>
            <p>
              {organization.domain ?? 'Domain not provided'} ·{' '}
              {organization.industry ?? 'Industry not provided'}
            </p>
          </div>
        </header>
        <section className="crm-summary-grid">
          <div>
            <span>Website</span>
            <strong>
              {organization.website ? (
                <a href={organization.website} rel="noreferrer">
                  {organization.website}
                </a>
              ) : (
                '—'
              )}
            </strong>
          </div>
          <div>
            <span>Country</span>
            <strong>{organization.country ?? '—'}</strong>
          </div>
          <div>
            <span>Size</span>
            <strong>{organization.size_range ?? '—'}</strong>
          </div>
          <div>
            <span>Created</span>
            <strong>{date(organization.created_at)}</strong>
          </div>
        </section>
        <div className="crm-detail-grid">
          <section className="crm-card" aria-labelledby="org-people-title">
            <h2 id="org-people-title">People</h2>
            {detail.people.length ? (
              <ul className="crm-list">
                {detail.people.map((person) => (
                  <li key={person.id}>
                    <strong>
                      <a href={`/crm/people/${person.id}`}>{person.display_name}</a>
                    </strong>
                    <span>
                      {person.primary_email ?? 'Email not provided'} ·{' '}
                      {person.job_title ?? 'Role not provided'}
                    </span>
                    <small>
                      {person.lifecycle_stage} ·{' '}
                      {person.do_not_contact ? 'Do not contact' : 'Contact permitted'}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No linked active people.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="org-opportunities-title">
            <h2 id="org-opportunities-title">Related opportunities</h2>
            {detail.opportunities.length ? (
              <ul className="crm-list">
                {detail.opportunities.map((opportunity) => (
                  <li key={opportunity.id}>
                    <strong>{opportunity.title}</strong>
                    <span>
                      {String(
                        (opportunity.pipeline_stages as { name?: string } | null)?.name ??
                          'Stage not provided',
                      )}{' '}
                      · {opportunity.currency} {opportunity.estimated_value ?? 'value not provided'}
                    </span>
                    <small>Created {date(opportunity.created_at)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No related opportunities.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="org-notes-title">
            <h2 id="org-notes-title">Organization notes</h2>
            <p className="crm-preformatted">
              {organization.notes ?? 'No organization summary notes.'}
            </p>
            {detail.notes.map((note) => (
              <p className="crm-preformatted" key={note.id}>
                {note.body}
              </p>
            ))}
          </section>
        </div>
      </article>
    </CrmShell>
  );
}
