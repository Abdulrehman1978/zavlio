begin;
select plan(12);

select has_table('public', 'social_provider_observations', 'social provider observations table exists');
select has_table('public', 'social_identity_observations', 'social identity observations table exists');
select has_column('public', 'social_identity_observations', 'person_id', 'social identity observation person pointer exists');
select has_column('public', 'social_identity_observations', 'provider_identity_key', 'social identity observation key exists');
select has_function('public', 'record_social_observation', ARRAY['uuid','text','text','text','text','jsonb','text','jsonb','text','timestamp with time zone'], 'record_social_observation RPC exists');
select has_function('public', 'review_social_identity_observation', ARRAY['uuid','uuid'], 'review_social_identity_observation RPC exists');
select ok((select relrowsecurity from pg_class where oid = 'public.social_provider_observations'::regclass), 'social provider observations has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.social_identity_observations'::regclass), 'social identity observations has RLS');

-- Functional verification of merge reparenting:
do $$
declare
  test_auth_id uuid := gen_random_uuid();
  admin_id uuid;
  person_a uuid;
  person_b uuid;
  obs_id uuid;
  canonical_res uuid;
begin
  insert into public.staff_profiles (auth_user_id, name, email, role, active)
  values (test_auth_id, 'Admin Test', 'admin-social-test@example.test', 'ADMIN', true)
  returning id into admin_id;

  perform set_config('request.jwt.claim.sub', test_auth_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', test_auth_id, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  insert into public.people (display_name, primary_email)
  values ('Person A', 'person-a-test@example.test')
  returning id into person_a;

  insert into public.people (display_name, primary_email)
  values ('Person B', 'person-b-test@example.test')
  returning id into person_b;

  insert into public.social_identity_observations (
    platform, provider_identity_key, provider_user_id, username, person_id
  ) values (
    'THREADS', 'threads:testuser_a', 'threads_user_123', 'testuser_a', person_a
  ) returning id into obs_id;

  perform public.merge_people(person_a, person_b, null, 'Test social merge');

  select person_id into canonical_res
  from public.social_identity_observations
  where id = obs_id;

  if canonical_res <> person_b then
    raise exception 'social_identity_observations was not repointed to person_b: got %', canonical_res;
  end if;
end $$;

select pass('merge_people successfully repoints social_identity_observations to canonical target person');

-- Functional verification that record_social_observation resolves to canonical person for merged identity:
do $$
declare
  person_a uuid;
  person_b uuid;
  obs_uuid uuid;
  stored_person_id uuid;
  conv_person_id uuid;
begin
  select id into person_a from public.people where primary_email = 'person-a-test@example.test';
  select id into person_b from public.people where primary_email = 'person-b-test@example.test';

  perform set_config('role', 'service_role', true);
  perform set_config('request.jwt.claim.role', 'service_role', true);

  obs_uuid := public.record_social_observation(
    gen_random_uuid(),
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    'THREADS',
    '1.0.0',
    'threads:testuser_a',
    jsonb_build_object('stableId', 'threads_user_123', 'username', 'testuser_a'),
    'threads_thread_999',
    jsonb_build_array(jsonb_build_object(
      'body', 'Hello after merge',
      'direction', 'INBOUND',
      'providerMessageId', 'msg-after-merge-1',
      'providerTimestamp', timezone('utc', now())::text
    )),
    'AUTHENTICATED',
    timezone('utc', now())
  );

  select person_id into stored_person_id
  from public.social_identity_observations
  where provider_identity_key = 'threads:testuser_a';

  if stored_person_id <> person_b then
    raise exception 'observation did not resolve to canonical person_b: got %', stored_person_id;
  end if;

  select person_id into conv_person_id
  from public.conversations
  where external_thread_id = 'threads_thread_999';

  if conv_person_id <> person_b then
    raise exception 'conversation did not resolve to canonical person_b: got %', conv_person_id;
  end if;
end $$;

select pass('record_social_observation canonicalizes observation and conversation to surviving person');

select ok(
  (select merged_into_person_id from public.people where primary_email = 'person-a-test@example.test') =
  (select id from public.people where primary_email = 'person-b-test@example.test'),
  'merged person remains archived and points to canonical target'
);

select is(
  public.resolve_canonical_person_id((select id from public.people where primary_email = 'person-a-test@example.test')),
  (select id from public.people where primary_email = 'person-b-test@example.test'),
  'resolve_canonical_person_id resolves merged person to survivor'
);

select * from finish();
rollback;
