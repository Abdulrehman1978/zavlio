-- Zavlio Packet 10: operational CRM read models, canonical merges, and guarded mutations.

alter table public.people
  add column if not exists merged_into_person_id uuid references public.people(id) on delete restrict,
  add column if not exists merged_at timestamptz,
  add column if not exists merged_by uuid references public.staff_profiles(id) on delete set null;

create index if not exists people_merged_into_idx on public.people (merged_into_person_id)
where merged_into_person_id is not null;
create index if not exists people_name_lower_idx on public.people (lower(display_name));
create index if not exists people_email_lower_idx on public.people (lower(primary_email::text))
where primary_email is not null;
create index if not exists organizations_name_lower_idx on public.organizations (lower(name));
create index if not exists identities_username_lower_idx on public.identities (lower(username))
where username is not null;

create or replace view public.crm_people_projection
with (security_invoker = true)
as
select p.id, p.display_name, p.primary_email, p.job_title, p.lifecycle_stage, p.lead_status,
  p.lead_source, p.owner_id, p.do_not_contact, p.first_touch_source, p.latest_touch_source,
  p.created_at, p.updated_at, p.last_activity_at, p.organization_id, p.merged_into_person_id,
  o.name as organization_name, o.domain as organization_domain,
  sp.name as owner_name, ls.score as latest_score, ls.intent_level as latest_intent,
  ls.service_interest as latest_service_interest, ls.model_version as latest_model_version,
  ls.calculated_at as latest_score_at
from public.people as p
left join public.organizations as o on o.id = p.organization_id
left join public.staff_profiles as sp on sp.id = p.owner_id
left join lateral (
  select score, intent_level, service_interest, model_version, calculated_at
  from public.lead_scores where person_id = p.id order by calculated_at desc, id desc limit 1
) as ls on true;
grant select on public.crm_people_projection to authenticated;

create table if not exists public.person_merges (
  id uuid primary key default gen_random_uuid(),
  source_person_id uuid not null references public.people(id) on delete restrict,
  target_person_id uuid not null references public.people(id) on delete restrict,
  merged_by uuid not null references public.staff_profiles(id) on delete restrict,
  candidate_id uuid references public.identity_match_candidates(id) on delete set null,
  reason text,
  summary jsonb not null default '{}'::jsonb,
  merged_at timestamptz not null default timezone('utc', now()),
  check (source_person_id <> target_person_id)
);
create index if not exists person_merges_source_idx on public.person_merges (source_person_id, merged_at desc);
create index if not exists person_merges_target_idx on public.person_merges (target_person_id, merged_at desc);

alter table public.person_merges enable row level security;
revoke all on public.person_merges from anon, authenticated;
grant select on public.person_merges to authenticated;
create policy person_merges_admin_select on public.person_merges
for select to authenticated using (public.has_staff_role('ADMIN'));

create or replace function public.crm_lifecycle_rank(p_stage text)
returns integer
language sql
immutable
as $$
  select case p_stage
    when 'IDENTIFIED' then 10
    when 'ENGAGED' then 20
    when 'QUALIFIED' then 30
    when 'OPPORTUNITY' then 40
    when 'CLIENT' then 50
    when 'RETURNING_CLIENT' then 60
    when 'LOST' then 5
    when 'ARCHIVED' then 0
    else 0
  end;
$$;

create or replace function public.resolve_canonical_person_id(p_person_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_id uuid := p_person_id;
  next_id uuid;
  hops integer := 0;
begin
  if current_id is null then return null; end if;
  loop
    hops := hops + 1;
    if hops > 32 then raise exception 'person merge chain is too deep' using errcode = 'integrity_constraint_violation'; end if;
    select p.merged_into_person_id into next_id from public.people as p where p.id = current_id;
    if not found or next_id is null then return current_id; end if;
    if next_id = current_id then raise exception 'person merge cycle detected' using errcode = 'integrity_constraint_violation'; end if;
    current_id := next_id;
  end loop;
  return current_id;
end;
$$;
revoke all on function public.resolve_canonical_person_id(uuid) from public, anon;
grant execute on function public.resolve_canonical_person_id(uuid) to authenticated, service_role;

create or replace function public.crm_guard_sensitive_person_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_role text;
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    actor_role := public.current_staff_role();
    if actor_role is null then raise exception 'active staff authorization required' using errcode = 'insufficient_privilege'; end if;
    if new.primary_email is distinct from old.primary_email then
      raise exception 'primary email changes require identity review' using errcode = 'insufficient_privilege';
    end if;
    if old.do_not_contact and not new.do_not_contact and actor_role not in ('ADMIN', 'OWNER') then
      raise exception 'only ADMIN or OWNER may clear do-not-contact' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.crm_guard_sensitive_person_update() from public, anon, authenticated;
create trigger people_guard_sensitive_packet10
before update on public.people
for each row execute function public.crm_guard_sensitive_person_update();

-- Staff may edit only safe operational fields directly. Primary email and merge provenance
-- are deliberately absent; the SECURITY DEFINER merge operation owns those transitions.
revoke update on public.people from authenticated;
grant update (display_name, first_name, last_name, primary_phone, job_title, organization_id, owner_id, do_not_contact, lifecycle_stage, lead_status, lead_source, first_touch_source, latest_touch_source, last_activity_at) on public.people to authenticated;

create or replace function public.merge_people(
  p_source_person_id uuid,
  p_target_person_id uuid,
  p_candidate_id uuid default null,
  p_reason text default null
)
returns table(
  canonical_person_id uuid,
  merged_person_id uuid,
  relation_counts jsonb,
  candidate_status text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := public.current_staff_id();
  source_row public.people;
  target_row public.people;
  candidate_row public.identity_match_candidates;
  identity_row public.identities;
  source_id uuid := p_source_person_id;
  target_id uuid := public.resolve_canonical_person_id(p_target_person_id);
  org_conflict boolean := false;
  source_first text;
  source_latest text;
  source_last_activity timestamptz;
  duplicate_identities integer := 0;
  duplicate_campaigns integer := 0;
  candidate_result text := null;
begin
  if actor_id is null or not public.has_staff_role('ADMIN') then
    raise exception 'ADMIN or OWNER authorization required' using errcode = 'insufficient_privilege';
  end if;
  if source_id is null or target_id is null or source_id = target_id then
    raise exception 'a person cannot be merged into itself' using errcode = 'check_violation';
  end if;
  if length(coalesce(p_reason, '')) > 500 then raise exception 'merge reason is too long' using errcode = 'check_violation'; end if;

  -- Lock in deterministic ID order so A->B and A->C cannot interleave.
  if source_id < target_id then
    select p.* into source_row from public.people as p where p.id = source_id for update;
    select p.* into target_row from public.people as p where p.id = target_id for update;
  else
    select p.* into target_row from public.people as p where p.id = target_id for update;
    select p.* into source_row from public.people as p where p.id = source_id for update;
  end if;
  if source_row.id is null or target_row.id is null then raise exception 'person not found' using errcode = 'no_data_found'; end if;
  if source_row.merged_into_person_id is not null then raise exception 'source person is already merged' using errcode = 'serialization_failure'; end if;
  if target_row.merged_into_person_id is not null then raise exception 'target person is not canonical' using errcode = 'serialization_failure'; end if;

  if p_candidate_id is not null then
    select c.* into candidate_row from public.identity_match_candidates as c where c.id = p_candidate_id for update;
    if candidate_row.id is null then raise exception 'identity candidate not found' using errcode = 'no_data_found'; end if;
    if candidate_row.status not in ('PENDING','AUTO_CONFIRMED') then raise exception 'identity candidate is already resolved' using errcode = 'check_violation'; end if;
    if not ((candidate_row.person_a = source_id and candidate_row.person_b = target_id) or (candidate_row.person_a = target_id and candidate_row.person_b = source_id)) then
      raise exception 'identity candidate does not match merge pair' using errcode = 'check_violation';
    end if;
  end if;

  source_first := source_row.first_touch_source;
  source_latest := source_row.latest_touch_source;
  source_last_activity := source_row.last_activity_at;
  org_conflict := source_row.organization_id is not null and target_row.organization_id is not null and source_row.organization_id <> target_row.organization_id;

  update public.people as p
  set display_name = coalesce(nullif(p.display_name, ''), source_row.display_name),
      first_name = coalesce(nullif(p.first_name, ''), source_row.first_name),
      last_name = coalesce(nullif(p.last_name, ''), source_row.last_name),
      primary_phone = coalesce(nullif(p.primary_phone, ''), source_row.primary_phone),
      job_title = coalesce(nullif(p.job_title, ''), source_row.job_title),
      organization_id = coalesce(p.organization_id, source_row.organization_id),
      owner_id = coalesce(p.owner_id, source_row.owner_id),
      do_not_contact = p.do_not_contact or source_row.do_not_contact,
      first_touch_source = coalesce(p.first_touch_source, source_first),
      latest_touch_source = case when source_last_activity is not null and (p.last_activity_at is null or source_last_activity > p.last_activity_at) then source_latest else p.latest_touch_source end,
      last_activity_at = greatest(p.last_activity_at, source_last_activity),
      lifecycle_stage = case when public.crm_lifecycle_rank(source_row.lifecycle_stage) > public.crm_lifecycle_rank(p.lifecycle_stage) then source_row.lifecycle_stage else p.lifecycle_stage end
  where p.id = target_id;

  for identity_row in select i.* from public.identities as i where i.person_id = source_id for update loop
    if exists (
      select 1 from public.identities as existing
      where existing.person_id = target_id and existing.provider = identity_row.provider
        and ((identity_row.provider_user_id is not null and existing.provider_user_id = identity_row.provider_user_id)
          or (identity_row.provider = 'email' and identity_row.email is not null and existing.email = identity_row.email))
    ) then
      delete from public.identities where id = identity_row.id;
      duplicate_identities := duplicate_identities + 1;
    else
      update public.identities set person_id = target_id where id = identity_row.id;
    end if;
  end loop;

  update public.anonymous_visitors set linked_person_id = target_id where linked_person_id = source_id;
  update public.sessions set person_id = target_id where person_id = source_id;
  update public.events set person_id = target_id where person_id = source_id;
  update public.consents set person_id = target_id where person_id = source_id;
  update public.form_submissions set person_id = target_id where person_id = source_id;
  update public.lead_scores set person_id = target_id where person_id = source_id;
  update public.opportunities set person_id = target_id where person_id = source_id;
  update public.tasks set person_id = target_id where person_id = source_id;
  update public.notes set person_id = target_id where person_id = source_id;
  update public.touchpoints set person_id = target_id where person_id = source_id;
  update public.conversations set person_id = target_id where person_id = source_id;
  update public.messages set person_id = target_id where person_id = source_id;
  update public.automation_jobs set person_id = target_id where person_id = source_id;
  update public.automation_actions set person_id = target_id where person_id = source_id;

  insert into public.campaign_members (campaign_id, person_id, status, added_at)
  select cm.campaign_id, target_id, cm.status, cm.added_at from public.campaign_members as cm where cm.person_id = source_id
  on conflict (campaign_id, person_id) do update set status = excluded.status;
  get diagnostics duplicate_campaigns = row_count;
  delete from public.campaign_members where person_id = source_id;

  update public.identity_match_candidates set person_a = target_id where person_a = source_id and person_b <> target_id;
  update public.identity_match_candidates set person_b = target_id where person_b = source_id and person_a <> target_id;
  delete from public.identity_match_candidates where person_a = target_id and person_b = target_id;
  if p_candidate_id is not null then
    update public.identity_match_candidates set status = 'CONFIRMED', reviewed_by = actor_id, reviewed_at = timezone('utc', now()) where id = p_candidate_id;
    candidate_result := 'CONFIRMED';
  end if;

  insert into public.person_merges (source_person_id, target_person_id, merged_by, candidate_id, reason, summary)
  values (source_id, target_id, actor_id, p_candidate_id, nullif(trim(p_reason), ''), jsonb_build_object(
    'organization_conflict', org_conflict,
    'duplicate_identities', duplicate_identities,
    'campaign_rows_reconciled', duplicate_campaigns,
    'source_dnc', source_row.do_not_contact,
    'target_dnc', target_row.do_not_contact,
    'source_first_touch', source_first,
    'source_latest_touch', source_latest
  ));

  update public.people
  set lifecycle_stage = 'ARCHIVED', merged_into_person_id = target_id, merged_at = timezone('utc', now()), merged_by = actor_id
  where id = source_id;

  insert into public.audit_logs (actor_id, actor_type, action, entity_type, entity_id, before_state, after_state)
  values (actor_id, 'STAFF', 'PERSON_MERGED', 'person', target_id,
    jsonb_build_object('source_person_id', source_id, 'target_person_id', target_id),
    jsonb_build_object('candidate_id', p_candidate_id, 'organization_conflict', org_conflict, 'duplicate_identities', duplicate_identities));

  if p_reason = '__PACKET10_TEST_FAILURE__' then raise exception 'forced Packet 10 merge failure' using errcode = 'raise_exception'; end if;
  return query select target_id, source_id,
    jsonb_build_object('identities_reconciled', duplicate_identities, 'campaign_rows_reconciled', duplicate_campaigns, 'organization_conflict', org_conflict), candidate_result;
end;
$$;
revoke all on function public.merge_people(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.merge_people(uuid, uuid, uuid, text) to authenticated, service_role;

create or replace function public.record_crm_audit(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before_state jsonb default null,
  p_after_state jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := public.current_staff_id();
  audit_id uuid;
begin
  if actor_id is null then raise exception 'active staff authorization required' using errcode = 'insufficient_privilege'; end if;
  if length(coalesce(p_action, '')) > 80 or length(coalesce(p_entity_type, '')) > 80 then raise exception 'invalid audit label' using errcode = 'check_violation'; end if;
  insert into public.audit_logs (actor_id, actor_type, action, entity_type, entity_id, before_state, after_state)
  values (actor_id, 'STAFF', p_action, p_entity_type, p_entity_id, p_before_state, p_after_state)
  returning id into audit_id;
  return audit_id;
end;
$$;
revoke all on function public.record_crm_audit(text, text, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.record_crm_audit(text, text, uuid, jsonb, jsonb) to authenticated;

-- Candidate review is visible to operators, but only ADMIN/OWNER can mutate it.
drop policy if exists identity_match_candidates_active_staff_select on public.identity_match_candidates;
drop policy if exists identity_match_candidates_operator_insert on public.identity_match_candidates;
drop policy if exists identity_match_candidates_operator_update on public.identity_match_candidates;
create policy identity_match_candidates_operator_select on public.identity_match_candidates
for select to authenticated using (public.has_staff_role('OPERATOR'));
create policy identity_match_candidates_admin_update on public.identity_match_candidates
for update to authenticated using (public.has_staff_role('ADMIN')) with check (public.has_staff_role('ADMIN'));

-- One bounded, RLS-respecting timeline read model. CRM pages use the service client only after requireStaff().
create or replace function public.crm_person_timeline(
  p_person_id uuid,
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_category text default 'ALL',
  p_limit integer default 50
)
returns table(
  item_id uuid,
  item_type text,
  category text,
  occurred_at timestamptz,
  title text,
  summary text,
  actor text,
  source_entity text,
  source_id uuid,
  visibility text
)
language sql
stable
security invoker
set search_path = public
as $$
with items as (
  select e.id as item_id, e.event_name as item_type,
    case when e.event_name in ('project_form_submitted','contact_form_submitted') then 'ENQUIRY' else 'WEBSITE' end as category,
    e.occurred_at, case when e.event_name = 'page_viewed' then 'Website activity' else initcap(replace(e.event_name, '_', ' ')) end as title,
    case when e.event_name = 'page_viewed' then coalesce('Viewed ' || e.page_path, 'Website activity') else 'Linked browser activity' end as summary,
    'Browser' as actor, 'events' as source_entity, e.id as source_id, 'STAFF' as visibility
  from public.events as e
  where e.person_id = p_person_id and e.event_name not in ('project_form_submitted','contact_form_submitted')
  union all
  select s.id, 'SESSION', 'WEBSITE', s.started_at, 'Website session',
    coalesce('Linked browser activity from ' || nullif(s.utm_source, ''), 'Linked browser activity') || coalesce(' · landing ' || s.landing_page, ''),
    'Browser', 'sessions', s.id, 'STAFF'
  from public.sessions as s where s.person_id = p_person_id
  union all
  select f.id, f.form_type, 'ENQUIRY', f.submitted_at, case when f.form_type = 'START_A_PROJECT' then 'Project enquiry submitted' else 'Contact enquiry submitted' end,
    coalesce(nullif(f.source, ''), 'Website form'), 'Inbound', 'form_submissions', f.id, 'STAFF'
  from public.form_submissions as f where f.person_id = p_person_id
  union all
  select t.id, t.type, case when t.channel = 'email' then 'EMAIL' else 'CRM' end, t.occurred_at, coalesce(t.subject, initcap(replace(t.type, '_', ' '))), left(coalesce(t.content_summary, ''), 240),
    coalesce(t.created_by_type, 'System'), 'touchpoints', t.id, 'STAFF'
  from public.touchpoints as t where t.person_id = p_person_id
  union all
  select n.id, 'NOTE_CREATED', 'NOTE', n.created_at, 'Note added', left(n.body, 240), coalesce(sp.name, 'Staff'), 'notes', n.id, n.visibility
  from public.notes as n left join public.staff_profiles as sp on sp.id = n.author_id where n.person_id = p_person_id
  union all
  select o.id, 'OPPORTUNITY', 'OPPORTUNITY', o.created_at, o.title, 'Opportunity created', coalesce(sp.name, 'CRM'), 'opportunities', o.id, 'STAFF'
  from public.opportunities as o left join public.staff_profiles as sp on sp.id = o.owner_id where o.person_id = p_person_id
  union all
  select ta.id, 'TASK', 'TASK', ta.created_at, ta.title, coalesce(ta.status, 'Task'), coalesce(sp.name, 'CRM'), 'tasks', ta.id, 'STAFF'
  from public.tasks as ta left join public.staff_profiles as sp on sp.id = ta.assigned_to where ta.person_id = p_person_id
  union all
  select c.id, 'CONSENT_CHANGED', 'CONSENT', c.captured_at, 'Consent preference recorded', c.source, 'Consent', 'consents', c.id, 'STAFF'
  from public.consents as c where c.person_id = p_person_id
  union all
  select i.id, 'IDENTITY_DISCOVERED', 'IDENTITY', i.discovered_at, initcap(i.provider) || ' identity', coalesce(i.username, i.email, i.profile_url, 'Identity recorded'), coalesce(i.source, 'System'), 'identities', i.id, 'STAFF'
  from public.identities as i where i.person_id = p_person_id
  union all
  select m.id, 'MESSAGE', 'CONVERSATION', m.created_at, initcap(m.direction) || ' ' || m.channel || ' message', left(m.body, 240), 'Conversation', 'messages', m.id, 'STAFF'
  from public.messages as m where m.person_id = p_person_id
), filtered as (
  select * from items where (p_category = 'ALL' or category = p_category)
    and (p_before_at is null or (occurred_at, item_id) < (p_before_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
)
select * from filtered order by occurred_at desc, item_id desc limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;
revoke all on function public.crm_person_timeline(uuid, timestamptz, uuid, text, integer) from public, anon;
grant execute on function public.crm_person_timeline(uuid, timestamptz, uuid, text, integer) to authenticated, service_role;

grant select on public.person_merges to authenticated;
