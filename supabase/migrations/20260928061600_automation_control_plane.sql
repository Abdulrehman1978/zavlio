-- Zavlio Packet 13: versioned policy, explainable approvals, and safe queue orchestration.
create table public.automation_policy_versions(
 id uuid primary key default gen_random_uuid(),version integer not null unique check(version>0),name text not null,
 configuration jsonb not null,configuration_hash text not null,active boolean not null default false,
 created_by uuid references public.staff_profiles(id) on delete set null,created_at timestamptz not null default timezone('utc',now()),activated_at timestamptz,
 check(jsonb_typeof(configuration)='object'));
create unique index automation_policy_one_active_idx on public.automation_policy_versions((active)) where active;
alter table public.automation_jobs add column communication_purpose text,add column action_class text not null default 'EXTERNAL_SIDE_EFFECT',
 add column risk_level text not null default 'HIGH',add column dry_run boolean not null default true,
 add column policy_version_id uuid references public.automation_policy_versions(id) on delete restrict,add column payload_hash text,
 add column approved_payload_hash text,add column approval_expires_at timestamptz,add column next_eligible_at timestamptz,
 add column failure_code text,add column failure_summary text,add column manual_action_note text,
 add column proposed_by uuid references public.staff_profiles(id) on delete set null,add column source_reference text,add column version integer not null default 1,
 add constraint automation_job_purpose_check check(communication_purpose is null or communication_purpose in('MARKETING','SALES_FOLLOW_UP','INBOUND_REPLY','TRANSACTIONAL','RELATIONSHIP','INTERNAL')),
 add constraint automation_job_channel_check check(channel in('EMAIL','INSTAGRAM','THREADS','FACEBOOK','LINKEDIN','INTERNAL','test')),
 add constraint automation_job_action_check check(type in('SEND_EMAIL','DM','REPLY','COMMENT','LIKE','FOLLOW','CONNECT','PUBLISH','CREATE_TASK','FLAG_FOR_REVIEW','NOOP','runtime')),
 add constraint automation_job_class_check check(action_class in('EXTERNAL_SIDE_EFFECT','INTERNAL_ONLY')),
 add constraint automation_job_risk_check check(risk_level in('LOW','MEDIUM','HIGH')),add constraint automation_job_priority_check check(priority between -10 and 10),
 add constraint automation_job_payload_schema_check check(payload?'schemaVersion' or type='runtime'),
 add constraint automation_job_external_purpose_check check(action_class='INTERNAL_ONLY' or communication_purpose is not null);
alter table public.automation_agents add column capabilities jsonb not null default '{"channels":[],"actions":[]}'::jsonb,add column runtime_state jsonb not null default '{}'::jsonb;
alter table public.automation_actions add column attempt_number integer not null default 1 check(attempt_number>0),add column dry_run boolean not null default true,add column execution_key text;
create unique index automation_actions_execution_key_idx on public.automation_actions(execution_key) where execution_key is not null;
create table public.automation_policy_decisions(
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.automation_jobs(id) on delete restrict,
 policy_version_id uuid not null references public.automation_policy_versions(id) on delete restrict,person_id uuid references public.people(id) on delete set null,
 phase text not null check(phase in('PROPOSAL','APPROVAL','CLAIM','EXECUTION')),decision text not null check(decision in('ALLOW','BLOCK','REQUIRE_APPROVAL','DEFER')),
 reason_codes text[] not null default '{}',snapshot jsonb not null default '{}',next_eligible_at timestamptz,evaluated_at timestamptz not null default timezone('utc',now()));
create table public.automation_approvals(
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.automation_jobs(id) on delete restrict,
 decision text not null check(decision in('APPROVED','REJECTED','REVOKED','EXPIRED')),decided_by uuid not null references public.staff_profiles(id) on delete restrict,
 decided_at timestamptz not null default timezone('utc',now()),reason text,policy_version_id uuid not null references public.automation_policy_versions(id) on delete restrict,
 policy_decision_id uuid references public.automation_policy_decisions(id) on delete restrict,payload_hash text not null,expires_at timestamptz,
 check(decision='APPROVED' or length(trim(coalesce(reason,''))) between 3 and 1000));
create table public.automation_job_events(
 id uuid primary key default gen_random_uuid(),job_id uuid not null references public.automation_jobs(id) on delete restrict,event_type text not null,
 from_status text,to_status text,actor_type text not null check(actor_type in('STAFF','AGENT','SYSTEM','TEST')),actor_id uuid,reason_code text,
 metadata jsonb not null default '{}',occurred_at timestamptz not null default timezone('utc',now()));
alter table public.automation_jobs add column last_policy_decision_id uuid references public.automation_policy_decisions(id) on delete set null;
create index automation_decisions_job_time_idx on public.automation_policy_decisions(job_id,evaluated_at desc);
create index automation_decisions_person_time_idx on public.automation_policy_decisions(person_id,evaluated_at desc) where person_id is not null;
create index automation_decisions_reason_idx on public.automation_policy_decisions using gin(reason_codes);
create index automation_approvals_job_time_idx on public.automation_approvals(job_id,decided_at desc);
create index automation_job_events_job_time_idx on public.automation_job_events(job_id,occurred_at desc);
create index automation_jobs_approval_idx on public.automation_jobs(status,created_at desc) where status='AWAITING_APPROVAL';
create index automation_jobs_recovery_idx on public.automation_jobs(lease_expires_at,id) where status in('CLAIMED','RUNNING');
create index automation_jobs_person_policy_idx on public.automation_jobs(person_id,channel,type,communication_purpose,created_at desc);
create index automation_actions_frequency_idx on public.automation_actions(person_id,platform,action_type,executed_at desc) where status='COMPLETED';
drop index if exists public.automation_jobs_status_scheduled_idx;
create index automation_jobs_claim_queue_idx on public.automation_jobs(priority desc,scheduled_for,created_at,id) where status='QUEUED';
alter table public.automation_policy_versions enable row level security;alter table public.automation_policy_decisions enable row level security;
alter table public.automation_approvals enable row level security;alter table public.automation_job_events enable row level security;
revoke all on public.automation_policy_versions,public.automation_policy_decisions,public.automation_approvals,public.automation_job_events from anon,authenticated;
grant select on public.automation_policy_decisions,public.automation_approvals,public.automation_job_events,public.automation_policy_versions to authenticated;
drop policy if exists automation_jobs_operator_select on public.automation_jobs;drop policy if exists automation_runs_operator_select on public.automation_runs;drop policy if exists automation_actions_operator_select on public.automation_actions;
create policy automation_jobs_staff_select on public.automation_jobs for select to authenticated using(public.is_active_staff());
create policy automation_runs_staff_select on public.automation_runs for select to authenticated using(public.is_active_staff());
create policy automation_actions_staff_select on public.automation_actions for select to authenticated using(public.is_active_staff());
create policy automation_policy_admin_select on public.automation_policy_versions for select to authenticated using(public.has_staff_role('ADMIN'));
create policy automation_decisions_staff_select on public.automation_policy_decisions for select to authenticated using(public.is_active_staff());
create policy automation_approvals_operator_select on public.automation_approvals for select to authenticated using(public.has_staff_role('OPERATOR'));
create policy automation_job_events_staff_select on public.automation_job_events for select to authenticated using(public.is_active_staff());
drop policy if exists automation_settings_admin_update on public.automation_settings;drop policy if exists automation_agents_operator_update on public.automation_agents;
revoke update on public.automation_settings,public.automation_agents from authenticated;
create or replace function public.automation_immutable_row() returns trigger language plpgsql set search_path=public as $$begin raise exception '% is append-only',tg_table_name using errcode='insufficient_privilege';end$$;
revoke all on function public.automation_immutable_row() from public,anon,authenticated;
create trigger automation_policy_decisions_immutable before update or delete on public.automation_policy_decisions for each row execute function public.automation_immutable_row();
create trigger automation_approvals_immutable before update or delete on public.automation_approvals for each row execute function public.automation_immutable_row();
create trigger automation_job_events_immutable before update or delete on public.automation_job_events for each row execute function public.automation_immutable_row();
create or replace function public.automation_payload_hash(p jsonb) returns text language sql immutable strict set search_path=public,extensions as $$select encode(extensions.digest(convert_to(p::text,'UTF8'),'sha256'),'hex')$$;
revoke all on function public.automation_payload_hash(jsonb) from public,anon;grant execute on function public.automation_payload_hash(jsonb) to authenticated,service_role;
insert into public.automation_policy_versions(version,name,configuration,configuration_hash,active,activated_at) values(1,'Conservative default',
 '{"enabled":false,"dryRun":true,"approvalRequired":true,"allowedChannels":[],"allowedActions":[],"allowedPurposes":["INTERNAL"],"workingHours":{"enabled":true,"timezone":"Asia/Kolkata","weekdays":[1,2,3,4,5],"start":"09:00","end":"18:00"},"cooldownMinutes":4320,"personDailyCap":1,"personWeeklyCap":3,"channelHourlyCaps":{},"actionHourlyCaps":{},"duplicateWindowMinutes":4320,"approvalValidityMinutes":1440,"leaseSeconds":300,"maxAttempts":3,"retryBackoffSeconds":[60,300,1800]}'::jsonb,
 encode(extensions.digest(convert_to('ZAVLIO_AUTOMATION_V1','UTF8'),'sha256'),'hex'),true,timezone('utc',now()));

create or replace function public.activate_automation_policy(p_configuration jsonb,p_name text)
returns setof public.automation_policy_versions language plpgsql security definer set search_path=public,auth,extensions as $$
declare actor uuid:=public.current_staff_id();v integer;r public.automation_policy_versions%rowtype;h text;
begin
 if actor is null or not public.has_staff_role('OWNER') then raise exception 'OWNER role required' using errcode='insufficient_privilege';end if;
 if jsonb_typeof(p_configuration)<>'object' or jsonb_typeof(p_configuration->'allowedChannels')<>'array' or jsonb_typeof(p_configuration->'allowedActions')<>'array' or not coalesce((p_configuration->>'dryRun')::boolean,false) then raise exception 'Packet 13 policy must be valid and dry-run only' using errcode='check_violation';end if;
 select coalesce(max(version),0)+1 into v from public.automation_policy_versions;h:=encode(extensions.digest(convert_to(p_configuration::text,'UTF8'),'sha256'),'hex');
 update public.automation_policy_versions set active=false where active;
 insert into public.automation_policy_versions(version,name,configuration,configuration_hash,active,created_by,activated_at) values(v,left(trim(p_name),120),p_configuration,h,true,actor,timezone('utc',now())) returning * into r;
 insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after_state) values('STAFF',actor,'AUTOMATION_POLICY_ACTIVATED','automation_policy',r.id,jsonb_build_object('version',v,'configuration_hash',h,'enabled',p_configuration->'enabled','dry_run',p_configuration->'dryRun'));
 return next r;
end$$;
revoke all on function public.activate_automation_policy(jsonb,text) from public,anon;grant execute on function public.activate_automation_policy(jsonb,text) to authenticated;

create or replace function public.automation_check_job(p_job_id uuid,p_phase text,p_as_of timestamptz default timezone('utc',now()))
returns uuid language plpgsql security definer set search_path=public,auth as $$
declare j public.automation_jobs%rowtype;p public.automation_policy_versions%rowtype;person public.people%rowtype;cfg jsonb;
 reasons text[]:=array[]::text[];decision text:='ALLOW';next_at timestamptz;approval public.automation_approvals%rowtype;d_id uuid;
 consent public.consents%rowtype;closed boolean;external boolean;proactive boolean;dups integer;c24 integer;c7 integer;cc integer;ac integer;last_out timestamptz;
 required text;permission boolean;local_time timestamp;day_no integer;start_time time;end_time time;
begin
 if p_phase not in('PROPOSAL','APPROVAL','CLAIM','EXECUTION') then raise exception 'invalid policy phase' using errcode='check_violation';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if not found then raise exception 'job not found' using errcode='no_data_found';end if;
 select * into p from public.automation_policy_versions where active limit 1;if p.id is null then raise exception 'active policy missing';end if;
 cfg:=p.configuration;external:=j.action_class='EXTERNAL_SIDE_EFFECT';proactive:=j.communication_purpose in('MARKETING','SALES_FOLLOW_UP','RELATIONSHIP');
 if not coalesce((cfg->>'enabled')::boolean,false) then reasons:=array_append(reasons,'AUTOMATION_DISABLED');end if;
 select * into person from public.people where id=j.person_id;
 if external and person.id is null then reasons:=array_append(reasons,'PERSON_NOT_FOUND');elsif person.merged_into_person_id is not null then reasons:=array_append(reasons,'PERSON_MERGED');elsif person.lifecycle_stage='ARCHIVED' then reasons:=array_append(reasons,'PERSON_ARCHIVED');end if;
 if not coalesce(cfg->'allowedChannels','[]'::jsonb)?j.channel then reasons:=array_append(reasons,'CHANNEL_DISABLED');end if;
 if not coalesce(cfg->'allowedActions','[]'::jsonb)?j.type then reasons:=array_append(reasons,'ACTION_DISABLED');end if;
 if not coalesce(cfg->'allowedPurposes','[]'::jsonb)?j.communication_purpose then reasons:=array_append(reasons,'PURPOSE_DISABLED');end if;
 if proactive and coalesce(person.do_not_contact,false) then reasons:=array_append(reasons,'DNC_BLOCKED');end if;
 if j.communication_purpose in('MARKETING','SALES_FOLLOW_UP') then required:=case when j.channel='EMAIL' then 'marketing_email' when j.channel in('INSTAGRAM','THREADS','FACEBOOK','LINKEDIN') then 'marketing_social' end;end if;
 if required is not null then
  select * into consent from public.consents where person_id=j.person_id order by captured_at desc,id desc limit 1;
  if consent.id is null then reasons:=array_append(reasons,'CONSENT_MISSING');else permission:=case required when 'marketing_email' then consent.marketing_email else consent.marketing_social end;
   if consent.withdrawn_at is not null or not coalesce(permission,false) then reasons:=array_append(reasons,'CONSENT_WITHDRAWN');end if;end if;
 end if;
 if j.opportunity_id is not null then select ps.is_closed into closed from public.opportunities o join public.pipeline_stages ps on ps.id=o.stage_id where o.id=j.opportunity_id;if coalesce(closed,false) and j.communication_purpose='SALES_FOLLOW_UP' then reasons:=array_append(reasons,'OPPORTUNITY_CLOSED');end if;end if;
 select count(*) into dups from public.automation_jobs x where x.id<>j.id and x.person_id=j.person_id and x.channel=j.channel and x.type=j.type and x.communication_purpose=j.communication_purpose and x.status in('QUEUED','CLAIMED','RUNNING','AWAITING_APPROVAL','COMPLETED') and x.created_at>=p_as_of-make_interval(mins=>coalesce((cfg->>'duplicateWindowMinutes')::integer,0));
 if dups>0 then reasons:=array_append(reasons,'DUPLICATE_JOB');end if;
 select max(executed_at),count(*)filter(where executed_at>=p_as_of-interval '24 hours'),count(*)filter(where executed_at>=p_as_of-interval '7 days') into last_out,c24,c7 from public.automation_actions where person_id=j.person_id and status='COMPLETED' and not dry_run;
 if proactive and last_out is not null and last_out+make_interval(mins=>coalesce((cfg->>'cooldownMinutes')::integer,0))>p_as_of then reasons:=array_append(reasons,'PERSON_COOLDOWN');next_at:=last_out+make_interval(mins=>coalesce((cfg->>'cooldownMinutes')::integer,0));end if;
 if coalesce((cfg->>'personDailyCap')::integer,0)>0 and c24>=((cfg->>'personDailyCap')::integer) then reasons:=array_append(reasons,'PERSON_FREQUENCY_CAP');next_at:=greatest(coalesce(next_at,p_as_of),p_as_of+interval '24 hours');end if;
 if coalesce((cfg->>'personWeeklyCap')::integer,0)>0 and c7>=((cfg->>'personWeeklyCap')::integer) then reasons:=array_append(reasons,'PERSON_FREQUENCY_CAP');next_at:=greatest(coalesce(next_at,p_as_of),p_as_of+interval '7 days');end if;
 select count(*) into cc from public.automation_actions where platform=j.channel and status='COMPLETED' and not dry_run and executed_at>=p_as_of-interval '1 hour';
 if coalesce((cfg->'channelHourlyCaps'->>j.channel)::integer,0)>0 and cc>=((cfg->'channelHourlyCaps'->>j.channel)::integer) then reasons:=array_append(reasons,'CHANNEL_CAP');next_at:=greatest(coalesce(next_at,p_as_of),p_as_of+interval '1 hour');end if;
 select count(*) into ac from public.automation_actions where action_type=j.type and status='COMPLETED' and not dry_run and executed_at>=p_as_of-interval '1 hour';
 if coalesce((cfg->'actionHourlyCaps'->>j.type)::integer,0)>0 and ac>=((cfg->'actionHourlyCaps'->>j.type)::integer) then reasons:=array_append(reasons,'GLOBAL_ACTION_CAP');next_at:=greatest(coalesce(next_at,p_as_of),p_as_of+interval '1 hour');end if;
 if external and coalesce((cfg->'workingHours'->>'enabled')::boolean,false) then
  local_time:=p_as_of at time zone coalesce(cfg->'workingHours'->>'timezone','Asia/Kolkata');day_no:=extract(isodow from local_time);start_time:=(cfg->'workingHours'->>'start')::time;end_time:=(cfg->'workingHours'->>'end')::time;
  if not (cfg->'workingHours'->'weekdays' @> to_jsonb(day_no) and local_time::time>=start_time and local_time::time<end_time) then reasons:=array_append(reasons,'OUTSIDE_WORKING_HOURS');next_at:=coalesce(next_at,p_as_of+interval '1 hour');end if;
 end if;
 if external and coalesce((cfg->>'approvalRequired')::boolean,true) and p_phase in('CLAIM','EXECUTION') then
  select * into approval from public.automation_approvals where job_id=j.id order by decided_at desc,id desc limit 1;
  if approval.id is null or approval.decision<>'APPROVED' then reasons:=array_append(reasons,'APPROVAL_REQUIRED');elsif approval.expires_at<=p_as_of then reasons:=array_append(reasons,'APPROVAL_EXPIRED');elsif approval.policy_version_id<>p.id then reasons:=array_append(reasons,'POLICY_CHANGED');elsif approval.payload_hash<>public.automation_payload_hash(j.payload) then reasons:=array_append(reasons,'APPROVAL_INVALIDATED');end if;
 end if;
 if array_length(reasons,1) is null then decision:=case when external and coalesce((cfg->>'approvalRequired')::boolean,true) and p_phase in('PROPOSAL','APPROVAL') then 'REQUIRE_APPROVAL' else 'ALLOW' end;
 elsif reasons&&array['PERSON_COOLDOWN','PERSON_FREQUENCY_CAP','CHANNEL_CAP','GLOBAL_ACTION_CAP','OUTSIDE_WORKING_HOURS'] and not reasons&&array['AUTOMATION_DISABLED','PERSON_NOT_FOUND','PERSON_MERGED','PERSON_ARCHIVED','CHANNEL_DISABLED','ACTION_DISABLED','PURPOSE_DISABLED','DNC_BLOCKED','CONSENT_MISSING','CONSENT_WITHDRAWN','OPPORTUNITY_CLOSED','DUPLICATE_JOB','APPROVAL_REQUIRED','APPROVAL_EXPIRED','POLICY_CHANGED','APPROVAL_INVALIDATED'] then decision:='DEFER';else decision:='BLOCK';end if;
 insert into public.automation_policy_decisions(job_id,policy_version_id,person_id,phase,decision,reason_codes,snapshot,next_eligible_at,evaluated_at) values(j.id,p.id,j.person_id,p_phase,decision,reasons,jsonb_build_object('dryRun',coalesce((cfg->>'dryRun')::boolean,true),'count24Hours',c24,'count7Days',c7,'channelHour',cc,'actionHour',ac,'payloadHash',public.automation_payload_hash(j.payload)),next_at,p_as_of) returning id into d_id;
 update public.automation_jobs set policy_version_id=p.id,last_policy_decision_id=d_id,dry_run=coalesce((cfg->>'dryRun')::boolean,true),payload_hash=public.automation_payload_hash(payload),next_eligible_at=next_at,version=version+1 where id=j.id;
 return d_id;
end$$;
revoke all on function public.automation_check_job(uuid,text,timestamptz) from public,anon,authenticated;grant execute on function public.automation_check_job(uuid,text,timestamptz) to service_role;

create or replace function public.propose_automation_job(p_person_id uuid,p_opportunity_id uuid,p_channel text,p_action text,p_purpose text,p_payload jsonb,p_idempotency_key text,p_source_reference text default null,p_scheduled_for timestamptz default timezone('utc',now()),p_priority integer default 0)
returns setof public.automation_jobs language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id();canonical uuid;existing public.automation_jobs%rowtype;r public.automation_jobs%rowtype;d_id uuid;d public.automation_policy_decisions%rowtype;class text;risk text;
begin
 if actor is null or not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege';end if;
 if p_channel not in('EMAIL','INSTAGRAM','THREADS','FACEBOOK','LINKEDIN','INTERNAL') or p_action not in('SEND_EMAIL','DM','REPLY','COMMENT','LIKE','FOLLOW','CONNECT','PUBLISH','CREATE_TASK','FLAG_FOR_REVIEW','NOOP') or p_purpose not in('MARKETING','SALES_FOLLOW_UP','INBOUND_REPLY','TRANSACTIONAL','RELATIONSHIP','INTERNAL') or jsonb_typeof(p_payload)<>'object' or not p_payload?'schemaVersion' or length(p_idempotency_key) not between 8 and 200 or p_priority not between -10 and 10 then raise exception 'invalid automation proposal' using errcode='check_violation';end if;
 select * into existing from public.automation_jobs where idempotency_key=p_idempotency_key;if found then return next existing;return;end if;
 canonical:=public.resolve_canonical_person_id(p_person_id);class:=case when p_action in('CREATE_TASK','FLAG_FOR_REVIEW','NOOP') then 'INTERNAL_ONLY' else 'EXTERNAL_SIDE_EFFECT' end;risk:=case when p_action in('DM','REPLY','COMMENT','CONNECT','PUBLISH','SEND_EMAIL') then 'HIGH' when p_action in('LIKE','FOLLOW') then 'MEDIUM' else 'LOW' end;
 insert into public.automation_jobs(person_id,opportunity_id,type,channel,priority,status,payload,scheduled_for,max_attempts,idempotency_key,communication_purpose,action_class,risk_level,payload_hash,proposed_by,source_reference)
 values(canonical,p_opportunity_id,p_action,p_channel,p_priority,'QUEUED',p_payload,greatest(p_scheduled_for,timezone('utc',now())),3,p_idempotency_key,p_purpose,class,risk,public.automation_payload_hash(p_payload),actor,left(p_source_reference,200)) returning * into r;
 d_id:=public.automation_check_job(r.id,'PROPOSAL',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 update public.automation_jobs set status=case d.decision when 'BLOCK' then 'BLOCKED' when 'REQUIRE_APPROVAL' then 'AWAITING_APPROVAL' else 'QUEUED' end,scheduled_for=greatest(scheduled_for,coalesce(d.next_eligible_at,scheduled_for)),failure_code=case when d.decision='BLOCK' then d.reason_codes[1] end where id=r.id returning * into r;
 insert into public.automation_job_events(job_id,event_type,to_status,actor_type,actor_id,reason_code) values(r.id,'PROPOSED',r.status,'STAFF',actor,d.reason_codes[1]);
 insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after_state) values('STAFF',actor,'AUTOMATION_JOB_PROPOSED','automation_job',r.id,jsonb_build_object('channel',p_channel,'action',p_action,'purpose',p_purpose,'status',r.status));
 return next r;
exception when unique_violation then select * into existing from public.automation_jobs where idempotency_key=p_idempotency_key;return next existing;
end$$;
revoke all on function public.propose_automation_job(uuid,uuid,text,text,text,jsonb,text,text,timestamptz,integer) from public,anon;grant execute on function public.propose_automation_job(uuid,uuid,text,text,text,jsonb,text,text,timestamptz,integer) to authenticated;

create or replace function public.approve_automation_job(p_job_id uuid,p_expected_version integer)
returns setof public.automation_jobs language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id();j public.automation_jobs%rowtype;p public.automation_policy_versions%rowtype;d_id uuid;d public.automation_policy_decisions%rowtype;expiry timestamptz;
begin
 if actor is null or not public.has_staff_role('ADMIN') then raise exception 'ADMIN role required' using errcode='insufficient_privilege';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if j.status<>'AWAITING_APPROVAL' or j.version<>p_expected_version then raise exception 'job changed; reload and retry' using errcode='serialization_failure';end if;
 d_id:=public.automation_check_job(j.id,'APPROVAL',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 if d.decision='BLOCK' then update public.automation_jobs set status='BLOCKED',failure_code=d.reason_codes[1] where id=j.id;raise exception 'job no longer eligible: %',array_to_string(d.reason_codes,',') using errcode='check_violation';end if;
 select * into p from public.automation_policy_versions where id=d.policy_version_id;expiry:=timezone('utc',now())+make_interval(mins=>coalesce((p.configuration->>'approvalValidityMinutes')::integer,1440));
 insert into public.automation_approvals(job_id,decision,decided_by,policy_version_id,policy_decision_id,payload_hash,expires_at) values(j.id,'APPROVED',actor,p.id,d.id,public.automation_payload_hash(j.payload),expiry);
 update public.automation_jobs set status='QUEUED',approved_payload_hash=public.automation_payload_hash(payload),approval_expires_at=expiry,failure_code=null,version=version+1 where id=j.id returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id) values(j.id,'APPROVED','AWAITING_APPROVAL','QUEUED','STAFF',actor);
 insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id) values('STAFF',actor,'AUTOMATION_APPROVED','automation_job',j.id);return next j;
end$$;
revoke all on function public.approve_automation_job(uuid,integer) from public,anon;grant execute on function public.approve_automation_job(uuid,integer) to authenticated;

create or replace function public.reject_automation_job(p_job_id uuid,p_expected_version integer,p_reason text)
returns setof public.automation_jobs language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id();j public.automation_jobs%rowtype;p uuid;begin
 if actor is null or not public.has_staff_role('ADMIN') then raise exception 'ADMIN role required' using errcode='insufficient_privilege';end if;
 if length(trim(coalesce(p_reason,''))) not between 3 and 1000 then raise exception 'reason required' using errcode='check_violation';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if j.status<>'AWAITING_APPROVAL' or j.version<>p_expected_version then raise exception 'job changed; reload and retry' using errcode='serialization_failure';end if;
 select id into p from public.automation_policy_versions where active;insert into public.automation_approvals(job_id,decision,decided_by,reason,policy_version_id,payload_hash) values(j.id,'REJECTED',actor,trim(p_reason),p,public.automation_payload_hash(j.payload));
 update public.automation_jobs set status='CANCELLED',failure_code='APPROVAL_REJECTED',failure_summary=trim(p_reason),version=version+1 where id=j.id returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code) values(j.id,'REJECTED','AWAITING_APPROVAL','CANCELLED','STAFF',actor,'APPROVAL_REJECTED');
 insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id) values('STAFF',actor,'AUTOMATION_REJECTED','automation_job',j.id);return next j;
end$$;
revoke all on function public.reject_automation_job(uuid,integer,text) from public,anon;grant execute on function public.reject_automation_job(uuid,integer,text) to authenticated;

create or replace function public.cancel_automation_job(p_job_id uuid,p_expected_version integer,p_reason text)
returns setof public.automation_jobs language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id();j public.automation_jobs%rowtype;old_status text;begin
 if actor is null or not public.has_staff_role('OPERATOR') then raise exception 'OPERATOR role required' using errcode='insufficient_privilege';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if j.version<>p_expected_version or j.status not in('QUEUED','AWAITING_APPROVAL','BLOCKED','MANUAL_ACTION_REQUIRED') then raise exception 'job cannot be cancelled' using errcode='serialization_failure';end if;
 if public.current_staff_role()='OPERATOR' and j.proposed_by<>actor then raise exception 'OPERATOR may cancel only own proposal' using errcode='insufficient_privilege';end if;old_status:=j.status;
 update public.automation_jobs set status='CANCELLED',failure_code='CANCELLED_BY_STAFF',failure_summary=left(trim(p_reason),1000),claimed_by=null,claimed_at=null,lease_expires_at=null,version=version+1 where id=j.id returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code) values(j.id,'CANCELLED',old_status,'CANCELLED','STAFF',actor,'CANCELLED_BY_STAFF');
 insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id) values('STAFF',actor,'AUTOMATION_CANCELLED','automation_job',j.id);return next j;
end$$;
revoke all on function public.cancel_automation_job(uuid,integer,text) from public,anon;grant execute on function public.cancel_automation_job(uuid,integer,text) to authenticated;

create or replace function public.claim_next_automation_job(p_agent_id uuid,p_lease_seconds integer default 300)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
declare picked uuid;j public.automation_jobs%rowtype;d_id uuid;d public.automation_policy_decisions%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'machine boundary reserved for Packet 14' using errcode='insufficient_privilege';end if;
 if p_lease_seconds<30 or p_lease_seconds>3600 then raise exception 'lease seconds must be between 30 and 3600';end if;
 if not exists(select 1 from public.automation_agents where id=p_agent_id and enabled and last_heartbeat_at>=timezone('utc',now())-interval '5 minutes') then raise exception 'agent is disabled or offline';end if;
 select id into picked from public.automation_jobs where status='QUEUED' and scheduled_for<=timezone('utc',now()) and attempt_count<max_attempts order by priority desc,scheduled_for,created_at,id for update skip locked limit 1;
 if picked is null then return;end if;d_id:=public.automation_check_job(picked,'CLAIM',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 if d.decision<>'ALLOW' then update public.automation_jobs set status=case when d.decision='DEFER' then 'QUEUED' else 'BLOCKED' end,scheduled_for=greatest(scheduled_for,coalesce(d.next_eligible_at,scheduled_for)),failure_code=d.reason_codes[1] where id=picked;return;end if;
 update public.automation_jobs set status='CLAIMED',claimed_at=timezone('utc',now()),claimed_by=p_agent_id,lease_expires_at=timezone('utc',now())+make_interval(secs=>p_lease_seconds),version=version+1 where id=picked returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id) values(j.id,'CLAIMED','QUEUED','CLAIMED','AGENT',p_agent_id);return next j;
end$$;
revoke all on function public.claim_next_automation_job(uuid,integer) from public,anon,authenticated;grant execute on function public.claim_next_automation_job(uuid,integer) to service_role;

create or replace function public.record_automation_heartbeat(p_agent_id uuid,p_version text,p_capabilities jsonb,p_runtime_state jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin if coalesce(auth.role(),'')<>'service_role' then raise exception 'machine boundary reserved for Packet 14' using errcode='insufficient_privilege';end if;
 update public.automation_agents set last_heartbeat_at=timezone('utc',now()),version=left(p_version,100),capabilities=coalesce(p_capabilities,'{}'),runtime_state=coalesce(p_runtime_state,'{}') where id=p_agent_id and enabled;
 if not found then raise exception 'agent is not enabled';end if;end$$;
revoke all on function public.record_automation_heartbeat(uuid,text,jsonb,jsonb) from public,anon,authenticated;grant execute on function public.record_automation_heartbeat(uuid,text,jsonb,jsonb) to service_role;

create or replace function public.start_automation_job(p_job_id uuid,p_agent_id uuid)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
declare j public.automation_jobs%rowtype;d_id uuid;d public.automation_policy_decisions%rowtype;run_id uuid;
begin if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if j.status<>'CLAIMED' or j.claimed_by<>p_agent_id or j.lease_expires_at<=timezone('utc',now()) then raise exception 'valid claim required' using errcode='serialization_failure';end if;
 d_id:=public.automation_check_job(j.id,'EXECUTION',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 if d.decision<>'ALLOW' then update public.automation_jobs set status='BLOCKED',failure_code=d.reason_codes[1],claimed_by=null,claimed_at=null,lease_expires_at=null,version=version+1 where id=j.id returning * into j;insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code) values(j.id,'BLOCKED','CLAIMED','BLOCKED','SYSTEM',p_agent_id,d.reason_codes[1]);return next j;end if;
 insert into public.automation_runs(agent_id,status,version,host) select id,'RUNNING',version,host from public.automation_agents where id=p_agent_id returning id into run_id;
 update public.automation_jobs set status='RUNNING',attempt_count=attempt_count+1,version=version+1 where id=j.id returning * into j;
 insert into public.automation_actions(automation_job_id,automation_run_id,person_id,platform,action_type,status,attempt_number,dry_run,execution_key) values(j.id,run_id,j.person_id,j.channel,j.type,'RUNNING',j.attempt_count,j.dry_run,j.id::text||':'||j.attempt_count);
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id) values(j.id,'STARTED','CLAIMED','RUNNING','AGENT',p_agent_id);return next j;
end$$;
revoke all on function public.start_automation_job(uuid,uuid) from public,anon,authenticated;grant execute on function public.start_automation_job(uuid,uuid) to service_role;

create or replace function public.complete_automation_job(p_job_id uuid,p_agent_id uuid,p_evidence jsonb default '{}'::jsonb)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
declare j public.automation_jobs%rowtype;run_id uuid;begin if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if j.status<>'RUNNING' or j.claimed_by<>p_agent_id then raise exception 'running claim required' using errcode='serialization_failure';end if;
 if not j.dry_run then raise exception 'Packet 13 refuses non-dry-run completion' using errcode='check_violation';end if;
 update public.automation_actions set status='COMPLETED',executed_at=timezone('utc',now()),verified_at=timezone('utc',now()),evidence=jsonb_build_object('dryRun',true)||coalesce(p_evidence,'{}') where automation_job_id=j.id and status='RUNNING' returning automation_run_id into run_id;
 update public.automation_runs set status='COMPLETED',finished_at=timezone('utc',now()) where id=run_id;
 update public.automation_jobs set status='COMPLETED',claimed_by=null,claimed_at=null,lease_expires_at=null,failure_code=null,version=version+1 where id=j.id returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code,metadata) values(j.id,'COMPLETED','RUNNING','COMPLETED','AGENT',p_agent_id,'DRY_RUN_COMPLETED','{"dryRun":true}');return next j;
end$$;
revoke all on function public.complete_automation_job(uuid,uuid,jsonb) from public,anon,authenticated;grant execute on function public.complete_automation_job(uuid,uuid,jsonb) to service_role;

create or replace function public.fail_automation_job(p_job_id uuid,p_agent_id uuid,p_code text,p_summary text,p_retry_at timestamptz default null)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
declare j public.automation_jobs%rowtype;target text;backoff integer[]:=array[60,300,1800];run_id uuid;
begin if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;if j.status<>'RUNNING' or j.claimed_by<>p_agent_id then raise exception 'running claim required' using errcode='serialization_failure';end if;
 target:=case when p_code in('SECURITY_CHECKPOINT','CAPTCHA','AUTH_REQUIRED','IDENTITY_VERIFICATION','EXECUTION_OUTCOME_UNKNOWN') then 'MANUAL_ACTION_REQUIRED' when p_code in('DNC_ENABLED','CONSENT_WITHDRAWN','PERSON_MERGED','POLICY_CHANGED') then 'BLOCKED' when p_code in('TRANSIENT_NETWORK','PROVIDER_TEMPORARY','RATE_LIMIT') and j.attempt_count<j.max_attempts then 'QUEUED' else 'FAILED' end;
 update public.automation_actions set status='FAILED',executed_at=timezone('utc',now()),failure_reason=p_code,evidence=jsonb_build_object('dryRun',j.dry_run,'summary',left(p_summary,500)) where automation_job_id=j.id and status='RUNNING' returning automation_run_id into run_id;
 update public.automation_runs set status=target,finished_at=timezone('utc',now()) where id=run_id;
 update public.automation_jobs set status=target,scheduled_for=case when target='QUEUED' then coalesce(p_retry_at,timezone('utc',now())+make_interval(secs=>backoff[least(attempt_count,array_length(backoff,1))])) else scheduled_for end,claimed_by=null,claimed_at=null,lease_expires_at=null,failure_code=p_code,failure_summary=left(p_summary,1000),version=version+1 where id=j.id returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code) values(j.id,case when target='QUEUED' then 'RETRY_SCHEDULED' when target='MANUAL_ACTION_REQUIRED' then 'MANUAL_ACTION_REQUIRED' else 'FAILED' end,'RUNNING',target,'AGENT',p_agent_id,p_code);return next j;
end$$;
revoke all on function public.fail_automation_job(uuid,uuid,text,text,timestamptz) from public,anon,authenticated;grant execute on function public.fail_automation_job(uuid,uuid,text,text,timestamptz) to service_role;

create or replace function public.recover_expired_automation_jobs(p_as_of timestamptz default timezone('utc',now()))
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;begin if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 with expired as(select id,status,attempt_count,max_attempts from public.automation_jobs where status in('CLAIMED','RUNNING') and lease_expires_at<=p_as_of for update skip locked),
 changed as(update public.automation_jobs j set status=case when e.attempt_count>=e.max_attempts then 'FAILED' else 'QUEUED' end,scheduled_for=case when e.attempt_count>=e.max_attempts then j.scheduled_for else p_as_of+interval '1 minute' end,claimed_by=null,claimed_at=null,lease_expires_at=null,failure_code=case when e.attempt_count>=e.max_attempts then 'MAX_ATTEMPTS_EXCEEDED' else 'LEASE_EXPIRED' end,version=j.version+1 from expired e where j.id=e.id returning j.id,e.status as old_status,j.status as new_status)
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,reason_code) select id,'LEASE_RECOVERED',old_status,new_status,'SYSTEM','LEASE_EXPIRED' from changed;
 get diagnostics n=row_count;return n;end$$;
revoke all on function public.recover_expired_automation_jobs(timestamptz) from public,anon,authenticated;grant execute on function public.recover_expired_automation_jobs(timestamptz) to service_role;

create or replace view public.crm_automation_jobs_projection with(security_invoker=true) as
select j.id,j.person_id,j.opportunity_id,j.type,j.channel,j.communication_purpose,j.action_class,j.risk_level,j.status,j.priority,j.payload,j.scheduled_for,j.claimed_at,j.claimed_by,j.lease_expires_at,j.attempt_count,j.max_attempts,j.idempotency_key,j.dry_run,j.failure_code,j.failure_summary,j.approval_expires_at,j.version,j.created_at,j.updated_at,p.display_name person_name,p.do_not_contact,p.lifecycle_stage,o.name organization_name,op.title opportunity_title,s.score lead_score,s.intent_level,a.name agent_name,d.decision policy_decision,d.reason_codes,d.evaluated_at policy_evaluated_at from public.automation_jobs j left join public.people p on p.id=j.person_id left join public.organizations o on o.id=p.organization_id left join public.opportunities op on op.id=j.opportunity_id left join public.crm_current_lead_score s on s.person_id=j.person_id left join public.automation_agents a on a.id=j.claimed_by left join public.automation_policy_decisions d on d.id=j.last_policy_decision_id;
grant select on public.crm_automation_jobs_projection to authenticated;
create or replace view public.crm_automation_agents_projection with(security_invoker=true) as
select a.id,a.agent_key,a.name,a.enabled,a.version,a.host,a.last_heartbeat_at,a.capabilities,case when not a.enabled then 'DISABLED' when a.last_heartbeat_at>=timezone('utc',now())-interval '2 minutes' then 'ONLINE' when a.last_heartbeat_at>=timezone('utc',now())-interval '5 minutes' then 'STALE' else 'OFFLINE' end derived_status,(select count(*) from public.automation_jobs j where j.claimed_by=a.id and j.status in('CLAIMED','RUNNING')) active_claims from public.automation_agents a;
grant select on public.crm_automation_agents_projection to authenticated;

create or replace function public.crm_person_timeline(p_person_id uuid,p_before_at timestamptz default null,p_before_id uuid default null,p_category text default 'ALL',p_limit integer default 50)
returns table(item_id uuid,item_type text,category text,occurred_at timestamptz,title text,summary text,actor text,source_entity text,source_id uuid,visibility text)
language sql stable security invoker set search_path=public as $$
with items as(
 select e.id as item_id,e.event_name as item_type,case when e.event_name in('project_form_submitted','contact_form_submitted') then 'ENQUIRY' else 'WEBSITE' end as category,e.occurred_at,initcap(replace(e.event_name,'_',' ')) as title,coalesce('Viewed '||e.page_path,'Linked browser activity') as summary,'Browser' as actor,'events' as source_entity,e.id as source_id,'STAFF' as visibility from public.events e where e.person_id=p_person_id
 union all select s.id,'SESSION','WEBSITE',s.started_at,'Website session',coalesce('Linked browser activity from '||nullif(s.utm_source,''),'Linked browser activity')||coalesce(' · landing '||s.landing_page,''),'Browser','sessions',s.id,'STAFF' from public.sessions s where s.person_id=p_person_id
 union all select f.id,f.form_type,'ENQUIRY',f.submitted_at,case when f.form_type='START_A_PROJECT' then 'Project enquiry submitted' else 'Contact enquiry submitted' end,coalesce(f.source,'Website form'),'Inbound','form_submissions',f.id,'STAFF' from public.form_submissions f where f.person_id=p_person_id
 union all select t.id,t.type,case when t.channel='email' then 'EMAIL' else 'CRM' end,t.occurred_at,coalesce(t.subject,initcap(replace(t.type,'_',' '))),left(coalesce(t.content_summary,''),240),coalesce(t.created_by_type,'System'),'touchpoints',t.id,'STAFF' from public.touchpoints t where t.person_id=p_person_id
 union all select n.id,'NOTE_CREATED','NOTE',n.created_at,'Note added',left(n.body,240),coalesce(sp.name,'Staff'),'notes',n.id,n.visibility from public.notes n left join public.staff_profiles sp on sp.id=n.author_id where n.person_id=p_person_id
 union all select o.id,'OPPORTUNITY','OPPORTUNITY',o.created_at,o.title,'Opportunity created',coalesce(sp.name,'CRM'),'opportunities',o.id,'STAFF' from public.opportunities o left join public.staff_profiles sp on sp.id=o.owner_id where o.person_id=p_person_id
 union all select ta.id,'TASK','TASK',ta.created_at,ta.title,coalesce(ta.status,'Task'),coalesce(sp.name,'CRM'),'tasks',ta.id,'STAFF' from public.tasks ta left join public.staff_profiles sp on sp.id=ta.assigned_to where ta.person_id=p_person_id
 union all select c.id,'CONSENT_CHANGED','CONSENT',c.captured_at,'Consent preference recorded',c.source,'Consent','consents',c.id,'STAFF' from public.consents c where c.person_id=p_person_id
 union all select i.id,'IDENTITY_DISCOVERED','IDENTITY',i.discovered_at,initcap(i.provider)||' identity',coalesce(i.username,i.email,i.profile_url,'Identity recorded'),coalesce(i.source,'System'),'identities',i.id,'STAFF' from public.identities i where i.person_id=p_person_id
 union all select m.id,'MESSAGE','CONVERSATION',m.created_at,initcap(m.direction)||' '||m.channel||' message',left(m.body,240),'Conversation','messages',m.id,'STAFF' from public.messages m where m.person_id=p_person_id
 union all select je.id,je.event_type,'AUTOMATION',je.occurred_at,case when je.reason_code='DRY_RUN_COMPLETED' then 'Dry-run automation completed' else 'Automation '||lower(replace(je.event_type,'_',' ')) end,coalesce(je.reason_code,coalesce(je.to_status,'Automation event')),'Automation','automation_job_events',je.job_id,'STAFF' from public.automation_job_events je join public.automation_jobs j on j.id=je.job_id where j.person_id=p_person_id and je.event_type in('PROPOSED','APPROVED','BLOCKED','MANUAL_ACTION_REQUIRED','COMPLETED')
),filtered as(select * from items where(p_category='ALL' or category=p_category) and(p_before_at is null or(occurred_at,item_id)<(p_before_at,coalesce(p_before_id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))))
select * from filtered order by occurred_at desc,item_id desc limit greatest(1,least(coalesce(p_limit,50),100))$$;

create or replace function public.set_automation_agent_enabled(p_agent_id uuid,p_enabled boolean)
returns setof public.automation_agents language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id();r public.automation_agents%rowtype;begin if actor is null or not public.has_staff_role('OWNER') then raise exception 'OWNER role required' using errcode='insufficient_privilege';end if;update public.automation_agents set enabled=p_enabled where id=p_agent_id returning * into r;if not found then raise exception 'agent not found';end if;insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id,after_state) values('STAFF',actor,case when p_enabled then 'AUTOMATION_AGENT_ENABLED' else 'AUTOMATION_AGENT_DISABLED' end,'automation_agent',r.id,jsonb_build_object('enabled',p_enabled));return next r;end$$;
revoke all on function public.set_automation_agent_enabled(uuid,boolean) from public,anon;grant execute on function public.set_automation_agent_enabled(uuid,boolean) to authenticated;

create or replace function public.resolve_automation_manual_action(p_job_id uuid,p_expected_version integer,p_resolution text,p_note text)
returns setof public.automation_jobs language plpgsql security definer set search_path=public,auth as $$
declare actor uuid:=public.current_staff_id();j public.automation_jobs%rowtype;begin if actor is null or not public.has_staff_role('ADMIN') then raise exception 'ADMIN role required' using errcode='insufficient_privilege';end if;if p_resolution not in('RESOLVED_AND_REQUEUE','CANCEL') or length(trim(coalesce(p_note,''))) not between 3 and 1000 then raise exception 'valid resolution and note required' using errcode='check_violation';end if;select * into j from public.automation_jobs where id=p_job_id for update;if j.status<>'MANUAL_ACTION_REQUIRED' or j.version<>p_expected_version then raise exception 'job changed; reload and retry' using errcode='serialization_failure';end if;update public.automation_jobs set status=case when p_resolution='CANCEL' then 'CANCELLED' else 'QUEUED' end,scheduled_for=case when p_resolution='RESOLVED_AND_REQUEUE' then timezone('utc',now()) else scheduled_for end,manual_action_note=trim(p_note),failure_code=null,version=version+1 where id=j.id returning * into j;insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code,metadata) values(j.id,'MANUAL_RESOLVED','MANUAL_ACTION_REQUIRED',j.status,'STAFF',actor,p_resolution,jsonb_build_object('note',trim(p_note)));insert into public.audit_logs(actor_type,actor_id,action,entity_type,entity_id) values('STAFF',actor,'AUTOMATION_MANUAL_RESOLVED','automation_job',j.id);return next j;end$$;
revoke all on function public.resolve_automation_manual_action(uuid,integer,text,text) from public,anon;grant execute on function public.resolve_automation_manual_action(uuid,integer,text,text) to authenticated;

create or replace function public.block_automation_for_merged_person() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.merged_into_person_id is null and new.merged_into_person_id is not null then
  with changed as(update public.automation_jobs set status='BLOCKED',failure_code='PERSON_MERGED',failure_summary='Source person merged; create a newly reviewed job for the canonical person.',claimed_by=null,claimed_at=null,lease_expires_at=null,version=version+1 where person_id=old.id and status in('QUEUED','CLAIMED','AWAITING_APPROVAL','MANUAL_ACTION_REQUIRED') returning id,status)
  insert into public.automation_job_events(job_id,event_type,to_status,actor_type,reason_code) select id,'BLOCKED','BLOCKED','SYSTEM','PERSON_MERGED' from changed;
 end if;return new;
end$$;
revoke all on function public.block_automation_for_merged_person() from public,anon,authenticated;
create trigger people_block_automation_on_merge after update of merged_into_person_id on public.people for each row execute function public.block_automation_for_merged_person();
create or replace function public.block_automation_job_rebind() returns trigger language plpgsql security definer set search_path=public as $$
begin if old.person_id is distinct from new.person_id and old.status in('QUEUED','CLAIMED','RUNNING','AWAITING_APPROVAL','MANUAL_ACTION_REQUIRED') then new.status:='BLOCKED';new.failure_code:='PERSON_MERGED';new.failure_summary:='Target person changed during canonical merge; create a newly reviewed job.';new.claimed_by:=null;new.claimed_at:=null;new.lease_expires_at:=null;new.version:=old.version+1;end if;return new;end$$;
revoke all on function public.block_automation_job_rebind() from public,anon,authenticated;
create trigger automation_jobs_block_rebind before update of person_id on public.automation_jobs for each row execute function public.block_automation_job_rebind();
