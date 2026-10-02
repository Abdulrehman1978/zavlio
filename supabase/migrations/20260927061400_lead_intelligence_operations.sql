-- Zavlio Packet 11: versioned lead intelligence, pipeline transitions, and task operations.

create table public.lead_scoring_models (
  id uuid primary key default gen_random_uuid(),
  model_key text not null,
  version integer not null check (version > 0),
  name text not null,
  active boolean not null default false,
  configuration jsonb not null,
  configuration_hash text not null,
  created_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  activated_at timestamptz,
  unique (model_key, version),
  check (jsonb_typeof(configuration) = 'object')
);
create unique index lead_scoring_models_one_active_idx on public.lead_scoring_models ((active)) where active;
create trigger lead_scoring_models_set_updated_at before update on public.lead_scoring_models
for each row execute function public.set_updated_at();

alter table public.opportunities add column if not exists version integer not null default 1 check (version > 0);
alter table public.tasks add column if not exists version integer not null default 1 check (version > 0);

create index lead_scores_model_person_idx on public.lead_scores (model_version, person_id, calculated_at desc);
create index opportunities_updated_idx on public.opportunities (updated_at desc, id);
create index opportunities_expected_close_idx on public.opportunities (expected_close_date) where expected_close_date is not null;
create index tasks_status_due_idx on public.tasks (status, due_at, id);
create index tasks_person_status_due_idx on public.tasks (person_id, status, due_at) where person_id is not null;

alter table public.lead_scoring_models enable row level security;
revoke all on public.lead_scoring_models from anon, authenticated;
grant select on public.lead_scoring_models to authenticated;
create policy lead_scoring_models_admin_select on public.lead_scoring_models
for select to authenticated using (public.has_staff_role('ADMIN'));

create or replace function public.get_active_lead_scoring_model()
returns table(id uuid,model_key text,version integer,name text,configuration jsonb,configuration_hash text,activated_at timestamptz)
language plpgsql stable security definer set search_path=public,auth as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' and not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege'; end if;
  return query select m.id,m.model_key,m.version,m.name,m.configuration,m.configuration_hash,m.activated_at
  from public.lead_scoring_models m where m.active limit 1;
end; $$;
revoke all on function public.get_active_lead_scoring_model() from public,anon;
grant execute on function public.get_active_lead_scoring_model() to authenticated;

-- Score history is trusted derived state, never browser-authored.
revoke insert, update, delete on public.lead_scores from authenticated;

create or replace function public.persist_lead_score(
  p_person_id uuid,p_score integer,p_intent_level text,p_service_interest jsonb,
  p_reasoning jsonb,p_model_version text,p_calculated_at timestamptz
)
returns uuid language plpgsql security definer set search_path=public as $$
declare inserted_id uuid; expected_model text; expected_hash text;
begin
  select model_key||'_V'||version,configuration_hash into expected_model,expected_hash from public.lead_scoring_models where active limit 1;
  if expected_model is null or p_model_version<>expected_model then raise exception 'active scoring model mismatch' using errcode='check_violation'; end if;
  if p_score<0 or p_score>100 or p_intent_level not in ('LOW','INTERESTED','WARM','HIGH','PRIORITY') then raise exception 'invalid score result' using errcode='check_violation'; end if;
  if p_reasoning->>'configurationHash' is distinct from expected_hash then raise exception 'scoring configuration hash mismatch' using errcode='check_violation'; end if;
  insert into public.lead_scores(person_id,score,intent_level,service_interest,reasoning,model_version,calculated_at)
  values(public.resolve_canonical_person_id(p_person_id),p_score,p_intent_level,coalesce(p_service_interest,'{}'),coalesce(p_reasoning,'{}'),p_model_version,p_calculated_at)
  returning id into inserted_id;
  return inserted_id;
end; $$;
revoke all on function public.persist_lead_score(uuid,integer,text,jsonb,jsonb,text,timestamptz) from public,anon,authenticated;
grant execute on function public.persist_lead_score(uuid,integer,text,jsonb,jsonb,text,timestamptz) to service_role;

-- Workflow columns are reachable only through the transactional RPCs below.
revoke insert, update on public.opportunities from authenticated;
grant update (title, estimated_value, currency, probability, service_interest, owner_id, expected_close_date) on public.opportunities to authenticated;
revoke insert, update, delete on public.tasks from authenticated;

create or replace view public.crm_current_lead_score
with (security_invoker = true)
as
select distinct on (ls.person_id)
  ls.id, ls.person_id, ls.score, ls.intent_level, ls.service_interest, ls.reasoning,
  ls.model_version, ls.calculated_at,
  ls.calculated_at < timezone('utc', now()) - interval '24 hours' as is_stale
from public.lead_scores as ls
order by ls.person_id, ls.calculated_at desc, ls.id desc;
grant select on public.crm_current_lead_score to authenticated;

create or replace view public.crm_people_projection
with (security_invoker = true)
as
select p.id, p.display_name, p.primary_email, p.job_title, p.lifecycle_stage, p.lead_status,
  p.lead_source, p.owner_id, p.do_not_contact, p.first_touch_source, p.latest_touch_source,
  p.created_at, p.updated_at, p.last_activity_at, p.organization_id, p.merged_into_person_id,
  o.name as organization_name, o.domain as organization_domain,
  sp.name as owner_name, ls.score as latest_score, ls.intent_level as latest_intent,
  ls.service_interest as latest_service_interest, ls.model_version as latest_model_version,
  ls.calculated_at as latest_score_at,
  ls.service_interest ->> 'primary' as latest_primary_interest,
  ls.service_interest ->> 'secondary' as latest_secondary_interest,
  ls.is_stale as latest_score_stale
from public.people as p
left join public.organizations as o on o.id = p.organization_id
left join public.staff_profiles as sp on sp.id = p.owner_id
left join public.crm_current_lead_score as ls on ls.person_id = p.id;
grant select on public.crm_people_projection to authenticated;

create or replace view public.crm_pipeline_projection
with (security_invoker = true)
as
select op.id, op.person_id, op.organization_id, op.title, op.stage_id, op.estimated_value,
  op.currency, op.probability, op.service_interest, op.source, op.owner_id,
  op.expected_close_date, op.lost_reason, op.created_at, op.updated_at, op.version,
  ps.name as stage_name, ps.slug as stage_slug, ps.sort_order as stage_sort_order,
  ps.is_closed, ps.is_won, p.display_name as person_name, p.primary_email,
  p.do_not_contact, p.last_activity_at, o.name as organization_name, owner.name as owner_name,
  score.score as lead_score, score.intent_level, score.service_interest ->> 'primary' as primary_interest,
  nt.id as next_task_id, nt.title as next_task_title, nt.due_at as next_task_due_at,
  (nt.due_at < timezone('utc', now())) as next_task_overdue
from public.opportunities op
join public.pipeline_stages ps on ps.id = op.stage_id
join public.people p on p.id = op.person_id and p.merged_into_person_id is null
left join public.organizations o on o.id = op.organization_id
left join public.staff_profiles owner on owner.id = op.owner_id
left join public.crm_current_lead_score score on score.person_id = op.person_id
left join lateral (
  select t.id, t.title, t.due_at from public.tasks t
  where t.opportunity_id = op.id and t.status in ('OPEN','IN_PROGRESS')
  order by t.due_at asc nulls last, t.created_at asc limit 1
) nt on true;
grant select on public.crm_pipeline_projection to authenticated;

create or replace view public.crm_task_projection
with (security_invoker = true)
as
select t.id, t.person_id, t.opportunity_id, t.assigned_to, t.title, t.description,
  t.due_at, t.status, t.priority, t.created_at, t.updated_at, t.completed_at, t.version,
  p.display_name as person_name, op.title as opportunity_title, assignee.name as assignee_name,
  (t.status not in ('COMPLETED','CANCELLED') and t.due_at < timezone('utc', now())) as is_overdue
from public.tasks t
left join public.people p on p.id = t.person_id
left join public.opportunities op on op.id = t.opportunity_id
left join public.staff_profiles assignee on assignee.id = t.assigned_to;
grant select on public.crm_task_projection to authenticated;

create or replace function public.transition_opportunity_stage(
  p_opportunity_id uuid, p_target_stage_id uuid, p_expected_updated_at timestamptz,
  p_reason text default null, p_lost_reason text default null
)
returns setof public.opportunities
language plpgsql security definer set search_path = public, auth
as $$
declare
  actor uuid := public.current_staff_id();
  current_row public.opportunities%rowtype; from_stage public.pipeline_stages%rowtype; target_stage public.pipeline_stages%rowtype;
begin
  if actor is null or not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege'; end if;
  select * into current_row from public.opportunities where id=p_opportunity_id for update;
  if not found then raise exception 'opportunity not found' using errcode='no_data_found'; end if;
  if p_expected_updated_at is not null and current_row.updated_at <> p_expected_updated_at then raise exception 'opportunity changed; reload and retry' using errcode='serialization_failure'; end if;
  select * into from_stage from public.pipeline_stages where id=current_row.stage_id;
  select * into target_stage from public.pipeline_stages where id=p_target_stage_id;
  if target_stage.id is null then raise exception 'target stage not found' using errcode='foreign_key_violation'; end if;
  if from_stage.is_closed and not public.has_staff_role('ADMIN') then raise exception 'ADMIN role required to reopen a closed opportunity' using errcode='insufficient_privilege'; end if;
  if target_stage.slug='lost' and (p_lost_reason is null or p_lost_reason not in ('BUDGET','TIMING','NO_RESPONSE','COMPETITOR','NOT_FIT','INTERNAL','OTHER')) then raise exception 'valid lost reason required' using errcode='check_violation'; end if;
  if target_stage.slug='lost' and p_lost_reason='OTHER' and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'reason required for OTHER' using errcode='check_violation'; end if;
  if current_row.stage_id=p_target_stage_id then return query select * from public.opportunities where id=p_opportunity_id; return; end if;
  update public.opportunities set stage_id=p_target_stage_id,
    lost_reason=case when target_stage.slug='lost' then p_lost_reason else null end,
    version=version+1 where id=p_opportunity_id returning * into current_row;
  insert into public.opportunity_stage_history(opportunity_id,from_stage_id,to_stage_id,changed_by,reason,metadata)
  values(p_opportunity_id,from_stage.id,target_stage.id,actor,nullif(trim(coalesce(p_reason,'')),''),jsonb_build_object('lost_reason',p_lost_reason));
  if target_stage.is_won then
    update public.people set lifecycle_stage='CLIENT' where id=current_row.person_id and lifecycle_stage not in ('CLIENT','RETURNING_CLIENT','ARCHIVED');
  end if;
  insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,before_state,after_state)
  values('STAFF',actor,case when target_stage.slug='won' then 'OPPORTUNITY_WON' when target_stage.slug='lost' then 'OPPORTUNITY_LOST' when from_stage.is_closed then 'OPPORTUNITY_REOPENED' else 'OPPORTUNITY_STAGE_CHANGED' end,
    'opportunity',p_opportunity_id,jsonb_build_object('stage_id',from_stage.id,'stage',from_stage.slug),jsonb_build_object('stage_id',target_stage.id,'stage',target_stage.slug,'lost_reason',p_lost_reason));
  return next current_row;
end; $$;
revoke all on function public.transition_opportunity_stage(uuid,uuid,timestamptz,text,text) from public, anon;
grant execute on function public.transition_opportunity_stage(uuid,uuid,timestamptz,text,text) to authenticated;

create or replace function public.update_opportunity(
  p_id uuid, p_expected_updated_at timestamptz, p_title text, p_estimated_value numeric,
  p_currency text, p_probability numeric, p_service_interest jsonb, p_owner_id uuid, p_expected_close_date date
)
returns setof public.opportunities language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id(); row_before public.opportunities%rowtype; row_after public.opportunities%rowtype;
begin
  if actor is null or not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege'; end if;
  if length(trim(p_title))<1 or length(p_title)>200 then raise exception 'invalid title' using errcode='check_violation'; end if;
  if p_owner_id is not null and not exists(select 1 from public.staff_profiles where id=p_owner_id and active and role in ('OWNER','ADMIN','OPERATOR')) then raise exception 'invalid opportunity owner' using errcode='check_violation'; end if;
  select * into row_before from public.opportunities where id=p_id for update;
  if not found then raise exception 'opportunity not found' using errcode='no_data_found'; end if;
  if p_expected_updated_at is not null and row_before.updated_at<>p_expected_updated_at then raise exception 'opportunity changed; reload and retry' using errcode='serialization_failure'; end if;
  update public.opportunities set title=trim(p_title),estimated_value=p_estimated_value,currency=upper(p_currency),probability=p_probability,
    service_interest=coalesce(p_service_interest,'{}'),owner_id=p_owner_id,expected_close_date=p_expected_close_date,version=version+1 where id=p_id returning * into row_after;
  insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,before_state,after_state)
  values('STAFF',actor,'OPPORTUNITY_UPDATED','opportunity',p_id,jsonb_build_object('title',row_before.title,'owner_id',row_before.owner_id,'estimated_value',row_before.estimated_value),jsonb_build_object('title',row_after.title,'owner_id',row_after.owner_id,'estimated_value',row_after.estimated_value));
  return next row_after;
end; $$;
revoke all on function public.update_opportunity(uuid,timestamptz,text,numeric,text,numeric,jsonb,uuid,date) from public,anon;
grant execute on function public.update_opportunity(uuid,timestamptz,text,numeric,text,numeric,jsonb,uuid,date) to authenticated;

create or replace function public.create_crm_task(
  p_person_id uuid, p_opportunity_id uuid, p_assigned_to uuid, p_title text,
  p_description text, p_due_at timestamptz, p_priority text
)
returns setof public.tasks language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id(); created public.tasks%rowtype; canonical uuid;
begin
  if actor is null or not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege'; end if;
  if length(trim(p_title))<1 or length(p_title)>200 or length(coalesce(p_description,''))>10000 then raise exception 'invalid task text' using errcode='check_violation'; end if;
  if p_priority not in ('LOW','NORMAL','HIGH','URGENT') then raise exception 'invalid priority' using errcode='check_violation'; end if;
  if p_assigned_to is not null and not exists(select 1 from public.staff_profiles where id=p_assigned_to and active and role in ('OWNER','ADMIN','OPERATOR')) then raise exception 'invalid task assignee' using errcode='check_violation'; end if;
  canonical:=case when p_person_id is null then null else public.resolve_canonical_person_id(p_person_id) end;
  if p_opportunity_id is not null and not exists(select 1 from public.opportunities where id=p_opportunity_id and (canonical is null or person_id=canonical)) then raise exception 'invalid opportunity' using errcode='check_violation'; end if;
  insert into public.tasks(person_id,opportunity_id,assigned_to,title,description,due_at,priority)
  values(canonical,p_opportunity_id,p_assigned_to,trim(p_title),nullif(trim(coalesce(p_description,'')),''),p_due_at,p_priority) returning * into created;
  insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after_state)
  values('STAFF',actor,'TASK_CREATED','task',created.id,jsonb_build_object('person_id',canonical,'opportunity_id',p_opportunity_id,'assigned_to',p_assigned_to,'priority',p_priority,'due_at',p_due_at));
  return next created;
end; $$;
revoke all on function public.create_crm_task(uuid,uuid,uuid,text,text,timestamptz,text) from public,anon;
grant execute on function public.create_crm_task(uuid,uuid,uuid,text,text,timestamptz,text) to authenticated;

create or replace function public.update_crm_task(
  p_id uuid, p_expected_updated_at timestamptz, p_assigned_to uuid, p_title text,
  p_description text, p_due_at timestamptz, p_priority text, p_status text
)
returns setof public.tasks language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id(); before_row public.tasks%rowtype; after_row public.tasks%rowtype;
begin
  if actor is null or not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege'; end if;
  if length(trim(p_title))<1 or length(p_title)>200 or length(coalesce(p_description,''))>10000 then raise exception 'invalid task text' using errcode='check_violation'; end if;
  if p_priority not in ('LOW','NORMAL','HIGH','URGENT') or p_status not in ('OPEN','IN_PROGRESS','COMPLETED','CANCELLED') then raise exception 'invalid task state' using errcode='check_violation'; end if;
  if p_assigned_to is not null and not exists(select 1 from public.staff_profiles where id=p_assigned_to and active and role in ('OWNER','ADMIN','OPERATOR')) then raise exception 'invalid task assignee' using errcode='check_violation'; end if;
  select * into before_row from public.tasks where id=p_id for update;
  if not found then raise exception 'task not found' using errcode='no_data_found'; end if;
  if p_expected_updated_at is not null and before_row.updated_at<>p_expected_updated_at then raise exception 'task changed; reload and retry' using errcode='serialization_failure'; end if;
  update public.tasks set assigned_to=p_assigned_to,title=trim(p_title),description=nullif(trim(coalesce(p_description,'')),''),due_at=p_due_at,
    priority=p_priority,status=p_status,completed_at=case when p_status='COMPLETED' then coalesce(completed_at,timezone('utc',now())) else null end,
    version=version+1 where id=p_id returning * into after_row;
  insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,before_state,after_state)
  values('STAFF',actor,case when p_status='COMPLETED' and before_row.status<>'COMPLETED' then 'TASK_COMPLETED' when p_status='CANCELLED' and before_row.status<>'CANCELLED' then 'TASK_CANCELLED' when before_row.status='COMPLETED' and p_status<>'COMPLETED' then 'TASK_REOPENED' else 'TASK_UPDATED' end,
    'task',p_id,jsonb_build_object('status',before_row.status,'assigned_to',before_row.assigned_to,'due_at',before_row.due_at,'priority',before_row.priority),jsonb_build_object('status',after_row.status,'assigned_to',after_row.assigned_to,'due_at',after_row.due_at,'priority',after_row.priority));
  return next after_row;
end; $$;
revoke all on function public.update_crm_task(uuid,timestamptz,uuid,text,text,timestamptz,text,text) from public,anon;
grant execute on function public.update_crm_task(uuid,timestamptz,uuid,text,text,timestamptz,text,text) to authenticated;

insert into public.lead_scoring_models(model_key,version,name,active,configuration,configuration_hash,activated_at)
values ('ZAVLIO_LEAD',1,'Zavlio Lead V1',true,
$config${
  "scoreMin":0,"scoreCap":100,"lookbackDays":90,"staleAfterHours":24,
  "thresholds":[{"intent":"LOW","min":0},{"intent":"INTERESTED","min":25},{"intent":"WARM","min":50},{"intent":"HIGH","min":70},{"intent":"PRIORITY","min":85}],
  "decay":[{"maxDays":7,"factor":1},{"maxDays":14,"factor":0.9},{"maxDays":30,"factor":0.75},{"maxDays":60,"factor":0.5},{"maxDays":90,"factor":0.25},{"maxDays":null,"factor":0}],
  "serviceKeys":["strategy","brand","design","web","technology","ai_automation","ecommerce","growth","content"],
  "signals":[
    {"key":"homepage_viewed","points":1,"cap":3,"component":"behavioral","occurrence":"per_session","affinityPoints":0},
    {"key":"service_viewed","points":5,"cap":20,"component":"behavioral","occurrence":"distinct_entity","affinityPoints":15},
    {"key":"second_distinct_service","points":4,"cap":4,"component":"behavioral","occurrence":"once","affinityPoints":0},
    {"key":"project_viewed","points":7,"cap":21,"component":"behavioral","occurrence":"distinct_entity","affinityPoints":12},
    {"key":"multiple_projects","points":5,"cap":5,"component":"behavioral","occurrence":"once","affinityPoints":0},
    {"key":"return_session","points":8,"cap":24,"component":"engagement","occurrence":"per_session","affinityPoints":0},
    {"key":"start_project_opened","points":15,"cap":15,"component":"behavioral","occurrence":"once","affinityPoints":0},
    {"key":"project_form_started","points":20,"cap":20,"component":"behavioral","occurrence":"once","affinityPoints":0},
    {"key":"project_form_submitted","points":40,"cap":40,"component":"declared","occurrence":"once","affinityPoints":50},
    {"key":"contact_form_submitted","points":30,"cap":30,"component":"declared","occurrence":"once","affinityPoints":35},
    {"key":"budget_supplied","points":10,"cap":10,"component":"declared","occurrence":"once","affinityPoints":0},
    {"key":"high_value_service_combination","points":10,"cap":10,"component":"declared","occurrence":"once","affinityPoints":10},
    {"key":"repeat_engagement_7d","points":10,"cap":10,"component":"engagement","occurrence":"once","affinityPoints":0}
  ]
}$config$::jsonb,
encode(digest($config${"model":"ZAVLIO_LEAD_V1","schema":1}$config$,'sha256'),'hex'),timezone('utc',now()));
