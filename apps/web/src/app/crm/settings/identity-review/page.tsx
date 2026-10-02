import { CrmShell } from '../../../../components/crm-shell';
import { IdentityActions } from '../../../../components/crm-identity-actions';
import { listIdentityCandidates } from '../../../../lib/crm/data';
import { requireCrmRolePage } from '../../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function IdentityReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmRolePage(
    '/crm/settings/identity-review',
    'OPERATOR',
    'ADMIN',
    'OWNER',
  );
  const raw = await searchParams;
  const status = ['PENDING', 'CONFIRMED', 'REJECTED', 'AUTO_CONFIRMED'].includes(
    String(raw.status ?? 'PENDING'),
  )
    ? String(raw.status ?? 'PENDING')
    : 'PENDING';
  const result = await listIdentityCandidates(await createServerSupabaseClient(), status);
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="identity-review-title">
        <div className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Identity operations</p>
            <h1 id="identity-review-title">Identity review</h1>
            <p>
              Possible duplicates stay separate until an ADMIN or OWNER confirms a canonical merge.
            </p>
          </div>
        </div>
        <form className="crm-filter-bar" method="get">
          <label>
            Status
            <select name="status" defaultValue={status}>
              {['PENDING', 'CONFIRMED', 'REJECTED', 'AUTO_CONFIRMED'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="crm-button" type="submit">
            Filter
          </button>
        </form>
        {result.rows.length ? (
          <div className="crm-candidate-list">
            {result.rows.map((candidate) => (
              <article className="crm-card" key={candidate.id}>
                <header>
                  <span className="crm-badge">{candidate.status}</span>
                  <span>
                    Confidence {Math.round(Number(candidate.confidence) * 100)}% · created{' '}
                    {new Date(candidate.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </header>
                <div className="crm-compare">
                  <div>
                    <h2>Person A</h2>
                    <p>
                      <a href={`/crm/people/${candidate.person_a}`}>
                        {candidate.personA?.display_name ?? 'Unavailable'}
                      </a>
                    </p>
                    <small>
                      {candidate.personA?.primary_email ?? 'Email not provided'} ·{' '}
                      {candidate.personA?.organization_name ?? 'Organization not provided'}
                    </small>
                  </div>
                  <div>
                    <h2>Person B</h2>
                    <p>
                      <a href={`/crm/people/${candidate.person_b}`}>
                        {candidate.personB?.display_name ?? 'Unavailable'}
                      </a>
                    </p>
                    <small>
                      {candidate.personB?.primary_email ?? 'Email not provided'} ·{' '}
                      {candidate.personB?.organization_name ?? 'Organization not provided'}
                    </small>
                  </div>
                </div>
                <p className="crm-preformatted">
                  Reasons: {JSON.stringify(candidate.match_reasons)}
                </p>
                {candidate.status === 'PENDING' && (
                  <IdentityActions
                    candidateId={candidate.id}
                    sourceId={candidate.person_a}
                    targetId={candidate.person_b}
                    canMerge={context.staff.role === 'ADMIN' || context.staff.role === 'OWNER'}
                  />
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="crm-empty">
            <h2>No {status.toLowerCase()} identity candidates</h2>
            <p>New visitor/email conflicts will appear here for review.</p>
          </div>
        )}
      </section>
    </CrmShell>
  );
}
