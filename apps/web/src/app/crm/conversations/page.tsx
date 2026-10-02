import { CrmShell } from '../../../components/crm-shell';
import { listConversations } from '../../../lib/crm/data';
import { requireCrmPage } from '../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireCrmPage('/crm/conversations');
  const raw = await searchParams;
  const query = Array.isArray(raw.q) ? raw.q[0] : raw.q;
  const rows = await listConversations(await createServerSupabaseClient(), query);
  return (
    <CrmShell role={context.staff.role}>
      <section aria-labelledby="conversations-title">
        <div className="crm-page-heading">
          <div>
            <p className="crm-eyebrow">Social context</p>
            <h1 id="conversations-title">Conversations</h1>
            <p>
              Inbound social context is observed, deduplicated, and kept behind staff authorization.
            </p>
          </div>
        </div>
        <form className="crm-filter-bar" method="get">
          <label>
            Search
            <input
              name="q"
              defaultValue={query ?? ''}
              maxLength={80}
              placeholder="Person or channel"
            />
          </label>
          <button className="crm-button" type="submit">
            Search
          </button>
        </form>
        {rows.length ? (
          <div className="crm-card-list">
            {rows.map((conversation) => (
              <a
                className="crm-card"
                href={'/crm/conversations/' + conversation.id}
                key={conversation.id}
              >
                <header>
                  <span className="crm-badge">{conversation.channel}</span>
                  {conversation.person?.do_not_contact ? (
                    <span className="crm-badge crm-badge-danger">DNC</span>
                  ) : null}
                  <span>{conversation.status}</span>
                </header>
                <h2>{conversation.person?.display_name ?? 'Unresolved social identity'}</h2>
                <p>
                  {conversation.external_thread_id ?? 'No provider conversation ID'} · latest{' '}
                  {conversation.last_message_at ?? 'unknown'}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <p className="crm-empty">No conversations are available.</p>
        )}
      </section>
    </CrmShell>
  );
}
