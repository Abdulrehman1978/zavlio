-- Zavlio Packet 16: bounded social observation, identity/conversation integration,
-- per-platform readiness, and atomic canary permits.
-- This migration stores normalized facts only; raw DOM, cookies, credentials, and
-- browser session material are intentionally excluded.

alter table public.conversations alter column person_id drop not null;
alter table public.messages alter column person_id drop not null;

create table public.social_provider_settings (
  platform text primary key check (platform in ('THREADS','FACEBOOK','LINKEDIN')),
  provider_version text not null,
  readiness_state text not null default 'PROVIDER_IMPLEMENTED' check (
    readiness_state in ('UNIMPLEMENTED','PROVIDER_IMPLEMENTED','READ_ONLY_VERIFIED',
      'AUTH_REQUIRED','SECURITY_BLOCKED','CANARY_READY','LIVE_CANARY_ENABLED','DEGRADED','DISABLED')
  ),
  observation_enabled boolean not null default false,
  live_execution_enabled boolean not null default false,
  auth_state text not null default 'UNKNOWN' check (
    auth_state in ('AUTHENTICATED','LOGIN_REQUIRED','SECURITY_CHALLENGE','UNKNOWN')
  ),
  last_observed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.social_provider_settings(platform, provider_version)
values
  ('THREADS','THREADS_PROVIDER_V1'),
  ('FACEBOOK','FACEBOOK_PROVIDER_V1'),
  ('LINKEDIN','LINKEDIN_PROVIDER_V1')
on conflict (platform) do nothing;

create table public.social_provider_observations (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique,
  platform text not null references public.social_provider_settings(platform),
  provider_version text not null,
  schema_version text not null check (schema_version = 'SOCIAL_OBSERVATION_V1'),
  provider_identity_key text not null,
  provider_identity jsonb not null default '{}'::jsonb,
  conversation_provider_id text,
  normalized_messages jsonb not null default '[]'::jsonb,
  auth_state text not null check (auth_state in ('AUTHENTICATED','LOGIN_REQUIRED','SECURITY_CHALLENGE','UNKNOWN')),
  observed_at timestamptz not null,
  ingested_at timestamptz not null default timezone('utc', now()),
  check (jsonb_typeof(provider_identity) = 'object'),
  check (jsonb_typeof(normalized_messages) = 'array'),
  check (pg_column_size(provider_identity) <= 32768),
  check (pg_column_size(normalized_messages) <= 131072)
);
create index social_provider_observations_lookup_idx
  on public.social_provider_observations(platform, provider_identity_key, observed_at desc);

create table public.social_sync_cursors (
  platform text primary key references public.social_provider_settings(platform),
  cursor_value text,
  last_provider_timestamp timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.social_canary_permits (
  id uuid primary key default gen_random_uuid(),
  platform text not null references public.social_provider_settings(platform),
  target_identity_key text not null,
  action_type text not null check (action_type in ('DM','REPLY','COMMENT','LIKE','FOLLOW','CONNECT','PUBLISH')),
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses = 1),
  used_count integer not null default 0 check (used_count between 0 and max_uses),
  created_by uuid not null references public.staff_profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  consumed_at timestamptz,
  revoked_at timestamptz
);
create index social_canary_permits_active_idx
  on public.social_canary_permits(platform, target_identity_key, expires_at)
  where revoked_at is null and used_count < max_uses;

alter table public.social_provider_settings enable row level security;
alter table public.social_provider_observations enable row level security;
alter table public.social_sync_cursors enable row level security;
alter table public.social_canary_permits enable row level security;
revoke all on public.social_provider_settings, public.social_provider_observations,
  public.social_sync_cursors, public.social_canary_permits from public, anon, authenticated;
grant select on public.social_provider_settings to authenticated;
grant select on public.social_provider_observations to authenticated;
grant select on public.social_canary_permits to authenticated;
grant update on public.social_provider_settings to authenticated;
grant insert, update on public.social_canary_permits to authenticated;

create policy social_provider_settings_staff_select on public.social_provider_settings
for select to authenticated using (public.is_active_staff());
create policy social_provider_settings_owner_update on public.social_provider_settings
for update to authenticated using (public.has_staff_role('OWNER'))
with check (public.has_staff_role('OWNER'));
create policy social_provider_observations_staff_select on public.social_provider_observations
for select to authenticated using (public.is_active_staff());
create policy social_canary_permits_staff_select on public.social_canary_permits
for select to authenticated using (public.is_active_staff());
create policy social_canary_permits_owner_insert on public.social_canary_permits
for insert to authenticated with check (public.has_staff_role('OWNER') and created_by = public.current_staff_id());
create policy social_canary_permits_owner_update on public.social_canary_permits
for update to authenticated using (public.has_staff_role('OWNER'))
with check (public.has_staff_role('OWNER'));

create or replace function public.consume_social_canary_permit(
  p_permit_id uuid,
  p_platform text,
  p_target_identity_key text,
  p_action_type text
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare consumed boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = 'insufficient_privilege';
  end if;
  update public.social_canary_permits
  set used_count = used_count + 1, consumed_at = timezone('utc', now())
  where id = p_permit_id
    and platform = p_platform
    and target_identity_key = p_target_identity_key
    and action_type = p_action_type
    and revoked_at is null
    and expires_at > timezone('utc', now())
    and used_count < max_uses
  returning true into consumed;
  return coalesce(consumed, false);
end;
$$;
revoke all on function public.consume_social_canary_permit(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.consume_social_canary_permit(uuid,text,text,text) to service_role;

create or replace function public.record_social_observation(
  p_operation_id uuid,
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
declare result_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = 'insufficient_privilege';
  end if;
  if pg_column_size(coalesce(p_provider_identity, '{}'::jsonb)) > 32768
     or pg_column_size(coalesce(p_normalized_messages, '[]'::jsonb)) > 131072 then
    raise exception 'social observation payload too large' using errcode = 'program_limit_exceeded';
  end if;
  insert into public.social_provider_observations(
    operation_id, platform, provider_version, schema_version, provider_identity_key,
    provider_identity, conversation_provider_id, normalized_messages, auth_state, observed_at
  ) values (
    p_operation_id, p_platform, p_provider_version, 'SOCIAL_OBSERVATION_V1', p_provider_identity_key,
    coalesce(p_provider_identity, '{}'::jsonb), p_conversation_provider_id,
    coalesce(p_normalized_messages, '[]'::jsonb), p_auth_state, p_observed_at
  )
  on conflict (operation_id) do update set operation_id = excluded.operation_id
  returning id into result_id;
  return result_id;
end;
$$;
revoke all on function public.record_social_observation(uuid,text,text,text,jsonb,text,jsonb,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_social_observation(uuid,text,text,text,jsonb,text,jsonb,text,timestamptz)
  to service_role;
