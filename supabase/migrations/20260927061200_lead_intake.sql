-- Zavlio Packet 09: atomic lead intake, deterministic person resolution, and durable email outbox.
alter table public.form_submissions
  add column if not exists schema_version text not null default 'LEGACY_V1',
  add column if not exists processed_at timestamptz,
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null,
  add column if not exists task_id uuid references public.tasks(id) on delete set null,
  add column if not exists touchpoint_id uuid references public.touchpoints(id) on delete set null,
  add column if not exists lead_score_id uuid references public.lead_scores(id) on delete set null,
  add column if not exists conflict_detected boolean not null default false;

create unique index if not exists identities_email_unique
  on public.identities (email)
  where provider = 'email' and email is not null;

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.form_submissions(id) on delete cascade,
  template text not null check (template in ('LEAD_CONFIRMATION_V1','LEAD_INTERNAL_NOTIFICATION_V1')),
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  scheduled_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  failure_reason text,
  idempotency_key text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);
create index email_outbox_pending_idx on public.email_outbox (status, scheduled_at);
create index form_submissions_person_submitted_idx on public.form_submissions (person_id, submitted_at desc);
create index form_submissions_status_idx on public.form_submissions (status, submitted_at desc);

alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon, authenticated;
grant select on public.email_outbox to authenticated;
create policy email_outbox_admin_select on public.email_outbox
for select to authenticated using (public.has_staff_role('ADMIN'));

create or replace function public.intake_lead_submission(
  p_idempotency_key text,
  p_form_type text,
  p_schema_version text,
  p_payload jsonb,
  p_name text,
  p_email text,
  p_company text,
  p_website text,
  p_company_domain text,
  p_role text,
  p_service_interests jsonb,
  p_budget_key text,
  p_timing_key text,
  p_self_reported_source text,
  p_system_source text,
  p_visitor_key uuid,
  p_link_analytics boolean,
  p_create_opportunity boolean,
  p_opportunity_title text,
  p_touchpoint_type text,
  p_touchpoint_summary text,
  p_task_title text,
  p_task_priority text,
  p_due_at timestamptz,
  p_score integer,
  p_score_intent text,
  p_score_reasoning jsonb,
  p_email_jobs jsonb
)
returns table(
  submission_id uuid,
  person_id uuid,
  visitor_id uuid,
  opportunity_id uuid,
  task_id uuid,
  touchpoint_id uuid,
  lead_score_id uuid,
  conflict_detected boolean,
  duplicate boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_submission public.form_submissions;
  person_row public.people;
  visitor_row public.anonymous_visitors;
  organization_row public.organizations;
  person_was_created boolean := false;
  visitor_was_linked boolean := false;
  conflict boolean := false;
  org_count integer := 0;
  resolved_source text;
  first_source text;
  latest_source text;
  stage_id uuid;
  new_opportunity_id uuid;
  new_task_id uuid;
  new_touchpoint_id uuid;
  new_score_id uuid;
  new_submission_id uuid;
  email_job jsonb;
begin
  if length(coalesce(p_idempotency_key, '')) < 8 or length(p_idempotency_key) > 128 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;
  if p_form_type not in ('START_A_PROJECT','CONTACT') then
    raise exception 'invalid form type' using errcode = 'check_violation';
  end if;
  if p_schema_version not in ('START_PROJECT_V1','CONTACT_V1') then
    raise exception 'invalid form version' using errcode = 'check_violation';
  end if;

  select fs.* into existing_submission
  from public.form_submissions as fs
  where fs.idempotency_key = p_idempotency_key
  limit 1;
  if found then
    return query select existing_submission.id, existing_submission.person_id, existing_submission.visitor_id,
      existing_submission.opportunity_id, existing_submission.task_id, existing_submission.touchpoint_id,
      existing_submission.lead_score_id, existing_submission.conflict_detected, true;
    return;
  end if;

  if p_link_analytics and p_visitor_key is not null then
    select av.* into visitor_row
    from public.anonymous_visitors as av
    where av.visitor_key = p_visitor_key
    for update;
  end if;
  resolved_source := coalesce(nullif(p_system_source, ''), 'direct');
  first_source := coalesce(visitor_row.first_source, resolved_source);
  latest_source := coalesce(visitor_row.last_source, resolved_source);

  -- Exact email identity is authoritative. Browser, name, company, and domain never resolve a person.
  select p.* into person_row
  from public.identities as i
  join public.people as p on p.id = i.person_id
  where i.provider = 'email' and i.email = lower(trim(p_email))::citext
  order by i.verified desc, i.discovered_at asc
  limit 1
  for update;
  if not found then
    insert into public.people (
      display_name, first_name, last_name, primary_email, job_title, lifecycle_stage, lead_status,
      lead_source, first_touch_source, latest_touch_source, last_activity_at
    )
    values (
      trim(p_name), null, null, lower(trim(p_email))::citext, nullif(trim(p_role), ''),
      case when p_form_type = 'START_A_PROJECT' and coalesce(p_score, 0) >= 60 then 'QUALIFIED' else 'ENGAGED' end,
      'NEW', resolved_source, first_source, latest_source, timezone('utc', now())
    )
    on conflict do nothing
    returning * into person_row;
    person_was_created := found;
    if not person_was_created then
      select p.* into person_row from public.people as p
      where p.primary_email = lower(trim(p_email))::citext
      for update;
    end if;
  end if;
  if person_row.id is null then raise exception 'person resolution failed'; end if;

  insert into public.identities (person_id, provider, email, verified, confidence, source, last_seen_at)
  values (person_row.id, 'email', lower(trim(p_email))::citext, false, 1, 'web_form', timezone('utc', now()))
  on conflict do nothing;

  update public.people
  set job_title = coalesce(nullif(public.people.job_title, ''), nullif(trim(p_role), '')),
      latest_touch_source = coalesce(nullif(latest_source, ''), public.people.latest_touch_source),
      first_touch_source = coalesce(public.people.first_touch_source, first_source),
      lifecycle_stage = case when public.people.lifecycle_stage = 'IDENTIFIED' then 'ENGAGED' else public.people.lifecycle_stage end,
      lead_status = coalesce(public.people.lead_status, 'NEW'),
      last_activity_at = timezone('utc', now())
  where public.people.id = person_row.id;

  -- Exact website domain matching is serialized; company name alone never creates an automatic match.
  if nullif(trim(p_company_domain), '') is not null then
    perform pg_advisory_xact_lock(hashtextextended(lower(trim(p_company_domain)), 0));
    select count(*) into org_count
    from public.organizations as o
    where o.domain = lower(trim(p_company_domain))::citext;
    if org_count = 1 then
      select o.* into organization_row
      from public.organizations as o
      where o.domain = lower(trim(p_company_domain))::citext
      limit 1;
    elsif org_count = 0 and nullif(trim(p_company), '') is not null then
      insert into public.organizations (name, domain, website)
      values (trim(p_company), lower(trim(p_company_domain))::citext, nullif(trim(p_website), ''))
      returning * into organization_row;
    elsif org_count > 1 then
      conflict := true;
    end if;
  end if;
  if organization_row.id is not null and (person_row.organization_id is null or person_was_created) then
    update public.people set organization_id = organization_row.id where id = person_row.id;
  elsif organization_row.id is not null and person_row.organization_id is distinct from organization_row.id then
    conflict := true;
  end if;

  if visitor_row.id is not null then
    if visitor_row.linked_person_id is null then
      update public.anonymous_visitors set linked_person_id = person_row.id where id = visitor_row.id;
      update public.sessions
      set person_id = person_row.id
      where public.sessions.visitor_id = visitor_row.id and public.sessions.person_id is null;
      update public.events
      set person_id = person_row.id
      where public.events.visitor_id = visitor_row.id and public.events.person_id is null;
      visitor_was_linked := true;
    elsif visitor_row.linked_person_id = person_row.id then
      update public.sessions
      set person_id = person_row.id
      where public.sessions.visitor_id = visitor_row.id and public.sessions.person_id is null;
      update public.events
      set person_id = person_row.id
      where public.events.visitor_id = visitor_row.id and public.events.person_id is null;
      visitor_was_linked := true;
    else
      conflict := true;
      insert into public.identity_match_candidates (person_a, person_b, confidence, match_reasons, status)
      values (
        visitor_row.linked_person_id, person_row.id, 0.75,
        jsonb_build_object('reason', 'visitor_link_conflicts_with_deterministic_email', 'visitor_id', visitor_row.id),
        'PENDING'
      )
      on conflict do nothing;
    end if;
  end if;

  insert into public.form_submissions (
    person_id, visitor_id, form_type, schema_version, payload, status, idempotency_key, submitted_at,
    source, processed_at, conflict_detected
  ) values (
    person_row.id, case when visitor_was_linked or visitor_row.id is not null then visitor_row.id else null end,
    p_form_type, p_schema_version,
    coalesce(p_payload, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
      'budget_key', p_budget_key,
      'timing_key', p_timing_key,
      'self_reported_source', p_self_reported_source
    )),
    'PROCESSED', p_idempotency_key,
    timezone('utc', now()), resolved_source, timezone('utc', now()), conflict
  ) returning id into new_submission_id;

  insert into public.touchpoints (
    person_id, channel, type, direction, subject, content_summary, occurred_at, created_by_type, metadata
  ) values (
    person_row.id, 'website', p_touchpoint_type, 'INBOUND', p_task_title, left(p_touchpoint_summary, 280),
    timezone('utc', now()), 'SYSTEM', jsonb_build_object('submission_id', new_submission_id, 'visitor_linked', visitor_was_linked)
  ) returning id into new_touchpoint_id;

  if p_create_opportunity then
    select ps.id into stage_id from public.pipeline_stages as ps where ps.slug = 'new' limit 1;
    if stage_id is null then raise exception 'new pipeline stage is missing'; end if;
    insert into public.opportunities (
      person_id, organization_id, title, stage_id, currency, service_interest, source
    ) values (
      person_row.id, organization_row.id, left(coalesce(p_opportunity_title, 'New website enquiry'), 200), stage_id,
      'INR', coalesce(p_service_interests, '{}'::jsonb), resolved_source
    ) returning id into new_opportunity_id;
    insert into public.opportunity_stage_history (opportunity_id, to_stage_id, reason, metadata)
    values (new_opportunity_id, stage_id, 'Packet 09 website intake', jsonb_build_object('submission_id', new_submission_id));
  end if;

  insert into public.tasks (person_id, opportunity_id, title, description, due_at, priority)
  values (person_row.id, new_opportunity_id, left(p_task_title, 200), 'Review inbound website enquiry.', p_due_at, p_task_priority)
  returning id into new_task_id;

  if p_score is not null then
    insert into public.lead_scores (person_id, score, intent_level, service_interest, reasoning, model_version)
    values (person_row.id, greatest(0, least(100, p_score)), p_score_intent, coalesce(p_service_interests, '{}'::jsonb), coalesce(p_score_reasoning, '{}'::jsonb), 'PACKET_09_INTAKE_V1')
    returning id into new_score_id;
  end if;

  if conflict then
    insert into public.audit_logs (actor_type, action, entity_type, entity_id, after_state)
    values ('SYSTEM', 'IDENTITY_CONFLICT_RECORDED', 'form_submission', new_submission_id, jsonb_build_object('person_id', person_row.id));
  elsif person_was_created then
    insert into public.audit_logs (actor_type, action, entity_type, entity_id, after_state)
    values ('SYSTEM', 'PERSON_CREATED_FROM_INTAKE', 'person', person_row.id, jsonb_build_object('submission_id', new_submission_id));
  else
    insert into public.audit_logs (actor_type, action, entity_type, entity_id, after_state)
    values ('SYSTEM', 'PERSON_RESOLVED_FROM_INTAKE', 'person', person_row.id, jsonb_build_object('submission_id', new_submission_id));
  end if;

  for email_job in select value from jsonb_array_elements(coalesce(p_email_jobs, '[]'::jsonb)) loop
    insert into public.email_outbox (submission_id, template, recipient, payload, idempotency_key)
    values (
      new_submission_id, email_job->>'template', email_job->>'recipient', coalesce(email_job->'payload', '{}'::jsonb),
      email_job->>'idempotencyKey'
    ) on conflict (idempotency_key) do nothing;
  end loop;

  update public.form_submissions
  set opportunity_id = new_opportunity_id, task_id = new_task_id, touchpoint_id = new_touchpoint_id, lead_score_id = new_score_id
  where id = new_submission_id;

  return query select new_submission_id, person_row.id, case when visitor_row.id is not null then visitor_row.id else null end,
    new_opportunity_id, new_task_id, new_touchpoint_id, new_score_id, conflict, false;
end;
$$;

revoke all on function public.intake_lead_submission(text,text,text,jsonb,text,text,text,text,text,text,jsonb,text,text,text,text,uuid,boolean,boolean,text,text,text,text,text,timestamptz,integer,text,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.intake_lead_submission(text,text,text,jsonb,text,text,text,text,text,text,jsonb,text,text,text,text,uuid,boolean,boolean,text,text,text,text,text,timestamptz,integer,text,jsonb,jsonb) to service_role;
