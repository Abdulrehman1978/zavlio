import { notFound, redirect } from 'next/navigation';
import { CrmShell } from '../../../../components/crm-shell';
import { PersonActions } from '../../../../components/crm-person-actions';
import {
  getPersonDetail,
  getTimeline,
  TIMELINE_CATEGORIES,
  type TimelineCategory,
} from '../../../../lib/crm/data';
import { requireCrmPage } from '../../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function value(payload: unknown, key: string) {
  return payload && typeof payload === 'object' && key in payload
    ? String((payload as Record<string, unknown>)[key] ?? '')
    : '';
}
function date(valueToFormat: string | null | undefined) {
  return valueToFormat
    ? new Date(valueToFormat).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
}
function scoreReasons(valueToRead: unknown) {
  if (!valueToRead || typeof valueToRead !== 'object') return [];
  const signals = (valueToRead as { signals?: unknown }).signals;
  return Array.isArray(signals)
    ? signals.filter(
        (item): item is { signal: string; effectivePoints: number; occurrences: number } =>
          Boolean(item) && typeof item === 'object' && 'signal' in item,
      )
    : [];
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const context = await requireCrmPage(`/crm/people/${id}`);
  const db = await createServerSupabaseClient();
  const detail = await getPersonDetail(db, id);
  if (!detail) notFound();
  if (detail.canonicalId) redirect(`/crm/people/${detail.canonicalId}`);
  const raw = await searchParams;
  const category = TIMELINE_CATEGORIES.includes(
    (Array.isArray(raw.category) ? raw.category[0] : raw.category) as TimelineCategory,
  )
    ? ((Array.isArray(raw.category) ? raw.category[0] : raw.category) as TimelineCategory)
    : 'ALL';
  const timeline = await getTimeline(db, id, category);
  const p = detail.person;
  const latestScore = detail.scores[0];
  const { data: automationJobs } = await db
    .from('crm_automation_jobs_projection')
    .select('id,status,channel,type,dry_run,failure_code,created_at')
    .eq('person_id', id)
    .order('created_at', { ascending: false })
    .limit(5);
  return (
    <CrmShell role={context.staff.role}>
      <article aria-labelledby="person-title">
        <a className="crm-back" href="/crm/people">
          ← People
        </a>
        <header className="crm-detail-header">
          <div>
            <p className="crm-eyebrow">Person record</p>
            <h1 id="person-title">{p.display_name}</h1>
            <p>
              {p.primary_email ?? 'Email not provided'} · {p.job_title ?? 'Role not provided'}
            </p>
          </div>
          <div>
            {p.do_not_contact ? (
              <span className="crm-badge crm-badge-danger">Do not contact</span>
            ) : (
              <span className="crm-badge">Contact permitted</span>
            )}
            <p className="crm-provenance">
              Browser activity is associated through the browser used when the person identified
              themselves.
            </p>
          </div>
        </header>
        <section className="crm-summary-grid" aria-label="Person summary">
          <div>
            <span>Lifecycle</span>
            <strong>{p.lifecycle_stage}</strong>
          </div>
          <div>
            <span>Lead score</span>
            <strong>
              {latestScore ? `${latestScore.score} · ${latestScore.intent_level}` : '—'}
            </strong>
          </div>
          <div>
            <span>Organization</span>
            <strong>
              {p.organization_name ? (
                <a href={`/crm/organizations/${p.organization_id}`}>{p.organization_name}</a>
              ) : (
                '—'
              )}
            </strong>
          </div>
          <div>
            <span>Owner</span>
            <strong>{p.owner_name ?? 'Unassigned'}</strong>
          </div>
          <div>
            <span>First touch</span>
            <strong>{p.first_touch_source ?? '—'}</strong>
          </div>
          <div>
            <span>Latest touch</span>
            <strong>{p.latest_touch_source ?? '—'}</strong>
          </div>
          <div>
            <span>Last activity</span>
            <strong>{date(p.last_activity_at)}</strong>
          </div>
          <div>
            <span>Sessions</span>
            <strong>
              {detail.visitors.reduce((total, visitor) => total + visitor.session_count, 0)}
            </strong>
          </div>
        </section>
        <PersonActions
          personId={id}
          canClearDnc={context.staff.role === 'ADMIN' || context.staff.role === 'OWNER'}
          canRecalculate={context.staff.role !== 'VIEWER'}
        />
        <div className="crm-detail-grid">
          <section className="crm-card" aria-labelledby="score-title">
            <h2 id="score-title">Lead intelligence</h2>
            {latestScore ? (
              <>
                <p>
                  <strong>
                    {latestScore.score} — {latestScore.intent_level}
                  </strong>
                </p>
                <p>
                  Model {latestScore.model_version} · calculated {date(latestScore.calculated_at)}
                </p>
                <p>
                  Primary interest:{' '}
                  {String(
                    (latestScore.service_interest as { primary?: unknown } | null)?.primary ??
                      'Not established',
                  )}
                </p>
                <p>
                  Secondary interest:{' '}
                  {String(
                    (latestScore.service_interest as { secondary?: unknown } | null)?.secondary ??
                      'Not established',
                  )}
                </p>
                <h3>Why this score</h3>
                <ul className="crm-list">
                  {scoreReasons(latestScore.reasoning)
                    .slice(0, 8)
                    .map((reason) => (
                      <li key={reason.signal}>
                        <strong>{reason.signal.replaceAll('_', ' ')}</strong>
                        <span>
                          +{reason.effectivePoints} · {reason.occurrences} qualifying occurrence(s)
                        </span>
                      </li>
                    ))}
                </ul>
                {detail.scores[1] ? (
                  <p>
                    Previous: {detail.scores[1].score} — change{' '}
                    {latestScore.score - detail.scores[1].score >= 0 ? '+' : ''}
                    {latestScore.score - detail.scores[1].score}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="crm-empty-inline">No full lead score has been calculated.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="timeline-title">
            <div className="crm-section-heading">
              <h2 id="timeline-title">Unified timeline</h2>
              <form method="get">
                <label className="sr-only" htmlFor="timeline-category">
                  Timeline category
                </label>
                <select id="timeline-category" name="category" defaultValue={category}>
                  {TIMELINE_CATEGORIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button className="crm-button" type="submit">
                  Filter timeline
                </button>
              </form>
            </div>
            {timeline.length ? (
              <ol className="crm-timeline">
                {timeline.map((item) => (
                  <li key={`${item.item_type}-${item.item_id}`}>
                    <time dateTime={item.occurred_at}>{date(item.occurred_at)}</time>
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                    <small>
                      {item.category} · {item.actor}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="crm-empty-inline">No timeline activity for this category.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="identity-title">
            <h2 id="identity-title">Identities</h2>
            {detail.identities.length ? (
              <ul className="crm-list">
                {detail.identities.map((identity) => (
                  <li key={identity.id}>
                    <strong>{identity.provider}</strong>
                    <span>
                      {identity.username ??
                        identity.email ??
                        identity.profile_url ??
                        'Identifier not provided'}
                    </span>
                    <small>
                      {identity.verified ? 'Verified' : 'Unverified'} · confidence{' '}
                      {identity.confidence} · {identity.source ?? 'Source not recorded'}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No known identities.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="enquiries-title">
            <h2 id="enquiries-title">Enquiries</h2>
            {detail.forms.length ? (
              <ul className="crm-list">
                {detail.forms.map((form) => {
                  const payload = form.payload;
                  return (
                    <li key={form.id}>
                      <strong>
                        {form.form_type === 'START_A_PROJECT'
                          ? 'Start a project'
                          : 'Contact enquiry'}
                      </strong>
                      <span>
                        {value(payload, 'company') || 'Company not provided'} ·{' '}
                        {date(form.submitted_at)}
                      </span>
                      <small>
                        {value(payload, 'goal') ||
                          value(payload, 'message') ||
                          'No description provided'}
                        {value(payload, 'source')
                          ? ` · self-reported: ${value(payload, 'source')}`
                          : ''}
                      </small>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="crm-empty-inline">No submitted enquiries.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="opportunities-title">
            <h2 id="opportunities-title">Opportunities</h2>
            {detail.opportunities.length ? (
              <ul className="crm-list">
                {detail.opportunities.map((opportunity) => (
                  <li key={opportunity.id}>
                    <strong>
                      <a href={`/crm/opportunities/${opportunity.id}`}>{opportunity.title}</a>
                    </strong>
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
              <p className="crm-empty-inline">No opportunities.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="tasks-title">
            <h2 id="tasks-title">Tasks</h2>
            {detail.tasks.length ? (
              <ul className="crm-list">
                {detail.tasks.map((task) => (
                  <li key={task.id}>
                    <strong>{task.title}</strong>
                    <span>
                      {task.status} · {task.priority}
                    </span>
                    <small>Due {date(task.due_at)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No tasks.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="consent-title">
            <h2 id="consent-title">Consent history</h2>
            {detail.consents.length ? (
              <div className="crm-table-wrap">
                <table className="crm-table">
                  <caption>Read-only consent history</caption>
                  <thead>
                    <tr>
                      <th>Captured</th>
                      <th>Source / policy</th>
                      <th>Preferences</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.consents.map((consent) => (
                      <tr key={consent.id}>
                        <td>{date(consent.captured_at)}</td>
                        <td>
                          {consent.source} · {consent.policy_version}
                        </td>
                        <td>
                          Analytics {consent.analytics ? 'yes' : 'no'} · Email{' '}
                          {consent.marketing_email ? 'yes' : 'no'} · Social{' '}
                          {consent.marketing_social ? 'yes' : 'no'}
                        </td>
                        <td>
                          {consent.withdrawn_at
                            ? `Withdrawn ${date(consent.withdrawn_at)}`
                            : 'Active record'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="crm-empty-inline">No consent history.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="notes-title">
            <h2 id="notes-title">Notes</h2>
            {detail.notes.length ? (
              <ul className="crm-list">
                {detail.notes.map((note) => (
                  <li key={note.id}>
                    <strong>
                      {(note.staff_profiles as { name?: string } | null)?.name ?? 'Staff note'} ·{' '}
                      {date(note.created_at)}
                    </strong>
                    <span className="crm-preformatted">{note.body}</span>
                    <small>{note.visibility}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No internal notes.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="conversation-title">
            <h2 id="conversation-title">Conversations</h2>
            {detail.messages.length ? (
              <ul className="crm-list">
                {detail.messages.map((message) => (
                  <li key={message.id}>
                    <strong>
                      {message.direction} · {message.channel}
                    </strong>
                    <span className="crm-preformatted">{message.body}</span>
                    <small>
                      {date(message.created_at)} · {message.status}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No conversation messages.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="website-title">
            <h2 id="website-title">Linked browser activity</h2>
            <p className="crm-provenance">
              This history is associated through consented visitor linking; it is not
              identity-verified behavior.
            </p>
            {detail.visitors.length ? (
              <ul className="crm-list">
                {detail.visitors.map((visitor) => (
                  <li key={visitor.id}>
                    <strong>{visitor.session_count} sessions</strong>
                    <span>
                      First seen {date(visitor.first_seen_at)} · last seen{' '}
                      {date(visitor.last_seen_at)}
                    </span>
                    <small>
                      First touch {visitor.first_source ?? '—'} · latest{' '}
                      {visitor.last_source ?? '—'}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No linked browser history.</p>
            )}
          </section>
          <section className="crm-card" aria-labelledby="automation-title">
            <h2 id="automation-title">Automation</h2>
            {automationJobs?.length ? (
              <ul className="crm-list">
                {automationJobs.map((job) => (
                  <li key={job.id}>
                    <a href={'/crm/automation/jobs/' + job.id}>
                      {job.channel} · {job.type}
                    </a>
                    <span>
                      {job.status}
                      {job.dry_run ? ' · dry run' : ''}
                    </span>
                    <small>{job.failure_code ?? date(job.created_at)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="crm-empty-inline">No automation activity yet.</p>
            )}
          </section>
        </div>
      </article>
    </CrmShell>
  );
}
