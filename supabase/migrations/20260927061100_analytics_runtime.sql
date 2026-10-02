-- Zavlio Packet 08: consent preferences, session activity, and atomic analytics sessionization.
alter table public.consents add column if not exists consent_key uuid;
do $$
begin
  if exists (select 1 from pg_constraint where conrelid = 'public.consents'::regclass and conname = 'consents_check') then
    alter table public.consents drop constraint consents_check;
  end if;
end $$;
alter table public.consents add constraint consents_subject_or_preference_check
  check (person_id is not null or visitor_id is not null or consent_key is not null);
create index if not exists consents_key_captured_idx on public.consents (consent_key, captured_at desc) where consent_key is not null;

alter table public.sessions add column if not exists last_activity_at timestamptz;
update public.sessions set last_activity_at = coalesce(ended_at, started_at) where last_activity_at is null;
alter table public.sessions alter column last_activity_at set default timezone('utc', now());
alter table public.sessions alter column last_activity_at set not null;
create index if not exists sessions_visitor_activity_idx on public.sessions (visitor_id, last_activity_at desc);

create or replace function public.ensure_analytics_session(
  p_visitor_key uuid,
  p_now timestamptz,
  p_timeout interval,
  p_landing_page text,
  p_referrer text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_term text,
  p_utm_content text,
  p_device_category text,
  p_country text
)
returns table(visitor_id uuid, session_id uuid, created_visitor boolean, created_session boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  visitor_row public.anonymous_visitors;
  session_row public.sessions;
  visitor_was_created boolean := false;
  session_was_created boolean := false;
begin
  if p_visitor_key is null or p_now is null or p_timeout <= interval '0 seconds' then
    raise exception 'invalid analytics session arguments';
  end if;
  insert into public.anonymous_visitors (visitor_key, first_source, first_referrer, first_landing_page, first_seen_at, last_seen_at)
  values (p_visitor_key, coalesce(p_utm_source, 'direct'), p_referrer, p_landing_page, p_now, p_now)
  on conflict (visitor_key) do nothing
  returning * into visitor_row;
  visitor_was_created := found;
  if not visitor_was_created then
    select * into visitor_row from public.anonymous_visitors where visitor_key = p_visitor_key for update;
  end if;
  if visitor_row.id is null then raise exception 'analytics visitor could not be resolved'; end if;

  select * into session_row
  from public.sessions
  where public.sessions.visitor_id = visitor_row.id
    and public.sessions.ended_at is null
    and public.sessions.last_activity_at >= p_now - p_timeout
  order by last_activity_at desc
  limit 1
  for update;

  if session_row.id is null then
    update public.sessions
    set ended_at = p_now
    where public.sessions.visitor_id = visitor_row.id and public.sessions.ended_at is null;
    insert into public.sessions (visitor_id, started_at, last_activity_at, landing_page, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content, device_category, country)
    values (visitor_row.id, p_now, p_now, p_landing_page, p_referrer, p_utm_source, p_utm_medium, p_utm_campaign, p_utm_term, p_utm_content, p_device_category, p_country)
    returning * into session_row;
    session_was_created := true;
    update public.anonymous_visitors
    set session_count = session_count + 1, last_seen_at = p_now
    where public.anonymous_visitors.id = visitor_row.id;
  else
    update public.sessions set last_activity_at = p_now where id = session_row.id;
    update public.anonymous_visitors
    set last_seen_at = p_now
    where public.anonymous_visitors.id = visitor_row.id;
  end if;
  return query select visitor_row.id, session_row.id, visitor_was_created, session_was_created;
end;
$$;
revoke all on function public.ensure_analytics_session(uuid, timestamptz, interval, text, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ensure_analytics_session(uuid, timestamptz, interval, text, text, text, text, text, text, text, text, text) to service_role;
