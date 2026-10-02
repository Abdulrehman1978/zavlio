import { notFound } from 'next/navigation';
import { CrmShell } from '../../../../components/crm-shell';
import { SocialReplyProposal } from '../../../../components/social-reply-proposal';
import { getConversationDetail } from '../../../../lib/crm/data';
import { requireCrmPage } from '../../../../lib/crm/page';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireCrmPage('/crm/conversations/' + id);
  const detail = await getConversationDetail(await createServerSupabaseClient(), id);
  if (!detail) notFound();
  const person = detail.person;
  const channel =
    detail.conversation.channel === 'THREADS' ||
    detail.conversation.channel === 'FACEBOOK' ||
    detail.conversation.channel === 'LINKEDIN'
      ? detail.conversation.channel
      : null;
  const socialSuppressed = Boolean(
    person?.do_not_contact ||
    detail.consent?.withdrawn_at ||
    detail.consent?.marketing_social === false,
  );
  return (
    <CrmShell role={context.staff.role}>
      <article aria-labelledby="conversation-title">
        <a className="crm-back" href="/crm/conversations">
          ← Conversations
        </a>
        <header className="crm-detail-header">
          <div>
            <p className="crm-eyebrow">{detail.conversation.channel} conversation</p>
            <h1 id="conversation-title">{person?.display_name ?? 'Unresolved social identity'}</h1>
            <p>{detail.conversation.external_thread_id ?? 'Provider thread ID unavailable'}</p>
          </div>
          <div>
            {person?.do_not_contact ? (
              <span className="crm-badge crm-badge-danger">Do not contact</span>
            ) : null}
            <p className="crm-provenance">Inbound recording does not change DNC or consent.</p>
          </div>
        </header>
        <section className="crm-card" aria-labelledby="identity-title">
          <h2 id="identity-title">Observed identity</h2>
          {detail.identities.length ? (
            <ul>
              {detail.identities.map((identity) => (
                <li key={identity.id}>
                  {identity.provider} ·{' '}
                  {identity.username ?? identity.provider_user_id ?? 'stable ID unavailable'} ·{' '}
                  {identity.verified ? 'confirmed' : 'observed'}
                </li>
              ))}
            </ul>
          ) : (
            <p>Identity is unresolved; no automatic person was created.</p>
          )}
          <p>
            Social consent: {detail.consent?.marketing_social ? 'granted' : 'not granted'} · policy{' '}
            {detail.consent?.policy_version ?? 'unknown'}
          </p>
        </section>
        <section className="crm-card" aria-labelledby="messages-title">
          <h2 id="messages-title">Messages</h2>
          {detail.messages.length ? (
            <ol className="crm-message-list">
              {detail.messages.map((message) => (
                <li key={message.id}>
                  <strong>
                    {message.direction} · {message.channel}
                  </strong>
                  <span className="crm-preformatted">{message.body}</span>
                  <small>{message.received_at ?? message.sent_at ?? message.created_at}</small>
                </li>
              ))}
            </ol>
          ) : (
            <p>No messages have been ingested.</p>
          )}
        </section>
        {channel && person ? (
          <SocialReplyProposal
            personId={String(person.id)}
            channel={channel}
            sourceReference={detail.conversation.id}
            disabled={socialSuppressed}
          />
        ) : (
          <p className="crm-note">
            Reply proposals require a confirmed person and supported social channel.
          </p>
        )}
      </article>
    </CrmShell>
  );
}
