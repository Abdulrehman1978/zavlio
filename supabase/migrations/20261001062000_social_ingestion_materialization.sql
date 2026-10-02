-- Packet 16 follow-on: materialize signed normalized observations into the
-- existing identity/conversation/message/touchpoint model without auto-merging.

create table public.social_identity_observations (
  id uuid primary key default gen_random_uuid(),
  platform text not null references public.social_provider_settings(platform),
  provider_identity_key text not null unique,
  provider_user_id text,
  username text,
  profile_url text,
  person_id uuid references public.people(id) on delete set null,
  verification_state text not null default 'OBSERVED' check (
    verification_state in ('OBSERVED','CANDIDATE','CONFIRMED')
  ),
  confidence numeric(5,4) not null default 0 check (confidence between 0 and 1),
  source text not null default 'PROVIDER_OBSERVATION',
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb
);
create index social_identity_observations_person_idx
  on public.social_identity_observations(person_id, platform);

alter table public.conversations
  add column social_identity_observation_id uuid references public.social_identity_observations(id) on delete set null;
alter table public.messages
  add column social_identity_observation_id uuid references public.social_identity_observations(id) on delete set null;
create index conversations_social_identity_idx
  on public.conversations(social_identity_observation_id)
  where social_identity_observation_id is not null;

alter table public.social_provider_observations
  add column request_hash text not null default repeat('0', 64)
  check (request_hash ~ '^[a-f0-9]{64}$');

alter table public.social_identity_observations enable row level security;
revoke all on public.social_identity_observations from public, anon, authenticated;
grant select on public.social_identity_observations to authenticated;
create policy social_identity_observations_staff_select
  on public.social_identity_observations for select to authenticated
  using (public.is_active_staff());

drop function if exists public.record_social_observation(uuid,text,text,text,jsonb,text,jsonb,text,timestamptz);

create function public.record_social_observation(
  p_operation_id uuid,
  p_request_hash text,
  p_platform text,
  p_provider_version text,
  p_provider_identity_key text,
  p_provider_identity jsonb,
  p_conversation_provider_id text,
  p_normalized_messages jsonb,
  p_auth_state text,
  p_observed_at timestamptz
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  observation_id uuid;
  existing_request_hash text;
  identity_id uuid;
  known_person_id uuid;
  conversation_id uuid;
  item jsonb;
  body text;
  direction text;
  provider_message_id text;
  dedupe_message_id text;
  message_id uuid;
  provider_timestamp timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = 'insufficient_privilege';
  end if;
  select id, request_hash into observation_id, existing_request_hash
  from public.social_provider_observations
  where operation_id = p_operation_id;
  if observation_id is not null then
    if existing_request_hash <> p_request_hash then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = 'integrity_constraint_violation';
    end if;
    return observation_id;
  end if;
  if p_request_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid request hash' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(coalesce(p_normalized_messages, '[]'::jsonb)) > 100 then
    raise exception 'social message batch too large' using errcode = 'program_limit_exceeded';
  end if;
  insert into public.social_provider_observations(
    operation_id, request_hash, platform, provider_version, schema_version, provider_identity_key,
    provider_identity, conversation_provider_id, normalized_messages, auth_state, observed_at
  ) values (
    p_operation_id, p_request_hash, p_platform, p_provider_version, 'SOCIAL_OBSERVATION_V1',
    p_provider_identity_key, coalesce(p_provider_identity, '{}'::jsonb),
    p_conversation_provider_id, coalesce(p_normalized_messages, '[]'::jsonb),
    p_auth_state, p_observed_at
  )
  returning id into observation_id;

  insert into public.social_identity_observations(
    platform, provider_identity_key, provider_user_id, username, profile_url, last_seen_at
  ) values (
    p_platform, p_provider_identity_key,
    nullif(p_provider_identity->>'stableId', ''),
    nullif(p_provider_identity->>'username', ''),
    nullif(p_provider_identity->>'profileUrl', ''),
    p_observed_at
  )
  on conflict (provider_identity_key) do update set
    provider_user_id = coalesce(excluded.provider_user_id, social_identity_observations.provider_user_id),
    username = coalesce(excluded.username, social_identity_observations.username),
    profile_url = coalesce(excluded.profile_url, social_identity_observations.profile_url),
    last_seen_at = excluded.last_seen_at
  returning id, person_id into identity_id, known_person_id;

  known_person_id := public.resolve_canonical_person_id(known_person_id);
  if known_person_id is null and nullif(p_provider_identity->>'stableId', '') is not null then
    select public.resolve_canonical_person_id(i.person_id) into known_person_id
    from public.identities as i
    where i.provider = p_platform and i.provider_user_id = nullif(p_provider_identity->>'stableId', '')
    limit 1;
  end if;
  if known_person_id is not null and (known_person_id is distinct from (select person_id from public.social_identity_observations where id = identity_id)) then
    update public.social_identity_observations
    set person_id = known_person_id
    where id = identity_id;
  end if;

  if p_conversation_provider_id is not null then
    insert into public.conversations(
      person_id, channel, external_thread_id, status, last_message_at, social_identity_observation_id
    ) values (
      known_person_id, p_platform, p_conversation_provider_id, 'OPEN', p_observed_at, identity_id
    )
    on conflict (channel, external_thread_id) where external_thread_id is not null do update set
      person_id = coalesce(public.resolve_canonical_person_id(conversations.person_id), excluded.person_id),
      social_identity_observation_id = coalesce(
        conversations.social_identity_observation_id, excluded.social_identity_observation_id
      ),
      last_message_at = greatest(conversations.last_message_at, excluded.last_message_at),
      updated_at = timezone('utc', now())
    returning id into conversation_id;

    if known_person_id is not null then
      update public.conversations
      set person_id = known_person_id
      where id = conversation_id and (person_id is null or person_id <> known_person_id);
    end if;

    for item in select value from jsonb_array_elements(coalesce(p_normalized_messages, '[]'::jsonb)) loop
      body := left(coalesce(item->>'body', ''), 4000);
      direction := coalesce(item->>'direction', 'INBOUND');
      provider_message_id := nullif(item->>'providerMessageId', '');
      dedupe_message_id := coalesce(
        provider_message_id,
        md5(
          p_platform || ':' || p_conversation_provider_id || ':' ||
          coalesce(item->'sender'->>'stableId', item->'sender'->>'username', 'unknown') || ':' ||
          coalesce(item->>'providerTimestamp', 'unknown-time') || ':' || body
        )
      );
      provider_timestamp := nullif(item->>'providerTimestamp', '')::timestamptz;
      message_id := null;
      insert into public.messages(
        conversation_id, person_id, direction, channel, body, external_message_id,
        status, received_at, social_identity_observation_id
      ) values (
        conversation_id, known_person_id, direction, p_platform, body, dedupe_message_id,
        case when direction = 'INBOUND' then 'RECEIVED' else 'OBSERVED' end,
        case when direction = 'INBOUND' then coalesce(provider_timestamp, timezone('utc', now())) end,
        identity_id
      )
      on conflict (channel, external_message_id) where external_message_id is not null do nothing
      returning id into message_id;
      if message_id is not null and known_person_id is not null then
        insert into public.touchpoints(
          person_id, channel, type, direction, content_summary, external_reference,
          occurred_at, created_by_type, metadata
        ) values (
          known_person_id, p_platform,
          case when direction = 'INBOUND' then 'INBOUND_MESSAGE' else 'OUTBOUND_MESSAGE' end,
          direction, left(body, 240), dedupe_message_id,
          coalesce(provider_timestamp, p_observed_at), 'SYSTEM',
          jsonb_build_object('source', 'social-provider', 'providerVersion', p_provider_version)
        );
      end if;
    end loop;
  end if;
  return observation_id;
end;
$$;
revoke all on function public.record_social_observation(uuid,text,text,text,text,jsonb,text,jsonb,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_social_observation(uuid,text,text,text,text,jsonb,text,jsonb,text,timestamptz)
  to service_role;

create or replace function public.review_social_identity_observation(
  p_observation_id uuid,
  p_person_id uuid
) returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare
  canonical_id uuid;
  observation public.social_identity_observations%rowtype;
begin
  if coalesce(auth.role(), '') <> 'authenticated' or not public.has_staff_role('ADMIN') then
    raise exception 'admin review required' using errcode = 'insufficient_privilege';
  end if;
  canonical_id := public.resolve_canonical_person_id(p_person_id);
  select * into observation
  from public.social_identity_observations
  where id = p_observation_id
  for update;
  if observation.id is null then raise exception 'social identity observation not found'; end if;
  update public.social_identity_observations
  set person_id = canonical_id, verification_state = 'CONFIRMED', confidence = 1,
      source = 'STAFF_REVIEW', last_seen_at = greatest(last_seen_at, timezone('utc', now()))
  where id = p_observation_id;
  if observation.provider_user_id is not null then
    insert into public.identities(
      person_id, provider, provider_user_id, username, profile_url,
      verified, confidence, source, last_seen_at, metadata
    ) values (
      canonical_id, observation.platform, observation.provider_user_id,
      observation.username, observation.profile_url, true, 1, 'SOCIAL_REVIEW',
      observation.last_seen_at, jsonb_build_object('socialObservationId', observation.id)
    )
    on conflict (provider, provider_user_id) where provider_user_id is not null do update set
      person_id = excluded.person_id,
      username = coalesce(excluded.username, identities.username),
      profile_url = coalesce(excluded.profile_url, identities.profile_url),
      verified = true, confidence = 1, source = 'SOCIAL_REVIEW',
      last_seen_at = excluded.last_seen_at;
  end if;
  update public.conversations
  set person_id = canonical_id
  where channel = observation.platform
    and person_id is null
    and social_identity_observation_id = p_observation_id;
  update public.messages
  set person_id = canonical_id
  where channel = observation.platform
    and person_id is null
    and social_identity_observation_id = p_observation_id;
  return canonical_id;
end;
$$;
revoke all on function public.review_social_identity_observation(uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.review_social_identity_observation(uuid,uuid) to authenticated;

-- Repoint social_identity_observations during person merge
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
  update public.social_identity_observations set person_id = target_id where person_id = source_id;

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

