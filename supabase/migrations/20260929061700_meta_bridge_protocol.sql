-- Zavlio Packet 14: secure machine protocol receipts, sessions, and guarded transitions.
alter table public.automation_agents
  add column protocol_version integer,
  add column bridge_version text,
  add column executor_mode text,
  add column instance_id uuid,
  add column last_handshake_at timestamptz,
  add column clock_skew_ms integer,
  add column negotiated_capabilities jsonb not null default '{"channels":[],"actions":[],"executionModes":[]}'::jsonb,
  add constraint automation_agent_protocol_check check(protocol_version is null or protocol_version=1),
  add constraint automation_agent_executor_check check(executor_mode is null or executor_mode='DRY_RUN_ONLY'),
  add constraint automation_agent_clock_skew_check check(clock_skew_ms is null or clock_skew_ms between -300000 and 300000);

alter table public.automation_jobs
  add column machine_instance_id uuid,
  add column claim_operation_id uuid;

create table public.automation_machine_operations(
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null,
  agent_id uuid not null references public.automation_agents(id) on delete restrict,
  operation_type text not null check(operation_type in('CLAIM','LEASE','START','RESULT')),
  job_id uuid references public.automation_jobs(id) on delete restrict,
  request_hash text not null check(request_hash~'^[a-f0-9]{64}$'),
  response jsonb not null,
  created_at timestamptz not null default timezone('utc',now()),
  expires_at timestamptz not null,
  unique(agent_id,operation_type,operation_id),
  check(expires_at>created_at)
);
alter table public.automation_machine_operations enable row level security;
revoke all on public.automation_machine_operations from public,anon,authenticated;
create function public.automation_machine_operation_guard() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='DELETE' and coalesce(auth.role(),'')='service_role' and old.expires_at<timezone('utc',now()) then return old;end if;
 raise exception 'automation machine operation receipts are immutable' using errcode='insufficient_privilege';
end$$;
revoke all on function public.automation_machine_operation_guard() from public,anon,authenticated;
create trigger automation_machine_operations_immutable before update or delete on public.automation_machine_operations for each row execute function public.automation_machine_operation_guard();

create index automation_nonces_expiry_idx on public.automation_nonces(expires_at,id);
create index automation_machine_operations_expiry_idx on public.automation_machine_operations(expires_at,id);
create index automation_machine_operations_job_idx on public.automation_machine_operations(job_id,created_at desc) where job_id is not null;
create unique index automation_jobs_claim_operation_idx on public.automation_jobs(claimed_by,claim_operation_id) where claim_operation_id is not null;

create or replace function public.consume_automation_nonce(p_agent_key text,p_nonce text,p_request_timestamp timestamptz,p_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$
declare aid uuid;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 if p_nonce!~'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' or p_expires_at<=timezone('utc',now()) then raise exception 'invalid machine request' using errcode='check_violation';end if;
 select id into aid from public.automation_agents where agent_key=p_agent_key;
 if aid is null then raise exception 'invalid machine request' using errcode='insufficient_privilege';end if;
 insert into public.automation_nonces(agent_id,nonce,request_timestamp,expires_at) values(aid,p_nonce,p_request_timestamp,p_expires_at);
 return aid;
exception when unique_violation then raise exception 'machine request replayed' using errcode='unique_violation';
end$$;
revoke all on function public.consume_automation_nonce(text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.consume_automation_nonce(text,text,timestamptz,timestamptz) to service_role;

create or replace function public.cleanup_automation_protocol_history(p_limit integer default 500)
returns jsonb language plpgsql security definer set search_path=public as $$
declare n1 integer:=0;n2 integer:=0;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 if p_limit<1 or p_limit>2000 then raise exception 'invalid cleanup limit';end if;
 with doomed as(select id from public.automation_nonces where expires_at<timezone('utc',now()) order by expires_at limit p_limit) delete from public.automation_nonces n using doomed d where n.id=d.id;get diagnostics n1=row_count;
 with doomed as(select id from public.automation_machine_operations where expires_at<timezone('utc',now()) order by expires_at limit p_limit) delete from public.automation_machine_operations o using doomed d where o.id=d.id;get diagnostics n2=row_count;
 return jsonb_build_object('nonces',n1,'operations',n2);
end$$;
revoke all on function public.cleanup_automation_protocol_history(integer) from public,anon,authenticated;
grant execute on function public.cleanup_automation_protocol_history(integer) to service_role;

create or replace function public.record_machine_handshake(p_agent_id uuid,p_instance_id uuid,p_bridge_version text,p_clock_skew_ms integer,p_capabilities jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 update public.automation_agents set protocol_version=1,bridge_version=left(p_bridge_version,100),version=left(p_bridge_version,100),executor_mode='DRY_RUN_ONLY',instance_id=p_instance_id,last_handshake_at=timezone('utc',now()),clock_skew_ms=p_clock_skew_ms,negotiated_capabilities=p_capabilities,status='ONLINE' where id=p_agent_id and enabled;
 if not found then raise exception 'agent is disabled' using errcode='insufficient_privilege';end if;
end$$;
revoke all on function public.record_machine_handshake(uuid,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.record_machine_handshake(uuid,uuid,text,integer,jsonb) to service_role;

create or replace function public.record_machine_heartbeat(p_agent_id uuid,p_instance_id uuid,p_bridge_version text,p_runtime_state jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 if pg_column_size(coalesce(p_runtime_state,'{}'::jsonb))>8192 then raise exception 'runtime state too large' using errcode='program_limit_exceeded';end if;
 update public.automation_agents set last_heartbeat_at=timezone('utc',now()),status='ONLINE',bridge_version=left(p_bridge_version,100),version=left(p_bridge_version,100),runtime_state=coalesce(p_runtime_state,'{}'::jsonb) where id=p_agent_id and enabled and protocol_version=1 and executor_mode='DRY_RUN_ONLY' and instance_id=p_instance_id;
 if not found then raise exception 'agent session unavailable' using errcode='insufficient_privilege';end if;
end$$;
revoke all on function public.record_machine_heartbeat(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_machine_heartbeat(uuid,uuid,text,jsonb) to service_role;

-- Packet 14 fixes the Packet 13 blocked-start branch so RETURN NEXT cannot fall through into run/action creation.
create or replace function public.start_automation_job(p_job_id uuid,p_agent_id uuid)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
declare j public.automation_jobs%rowtype;d_id uuid;d public.automation_policy_decisions%rowtype;run_id uuid;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 select * into j from public.automation_jobs where id=p_job_id for update;
 if j.status<>'CLAIMED' or j.claimed_by<>p_agent_id or j.lease_expires_at<=timezone('utc',now()) then raise exception 'valid claim required' using errcode='serialization_failure';end if;
 d_id:=public.automation_check_job(j.id,'EXECUTION',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 if d.decision<>'ALLOW' then
  update public.automation_jobs set status='BLOCKED',failure_code=d.reason_codes[1],claimed_by=null,claimed_at=null,lease_expires_at=null,version=version+1 where id=j.id returning * into j;
  insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,reason_code) values(j.id,'BLOCKED','CLAIMED','BLOCKED','SYSTEM',p_agent_id,d.reason_codes[1]);
  return next j;
  return;
 end if;
 insert into public.automation_runs(agent_id,status,version,host) select id,'RUNNING',version,host from public.automation_agents where id=p_agent_id returning id into run_id;
 update public.automation_jobs set status='RUNNING',attempt_count=attempt_count+1,version=version+1 where id=j.id returning * into j;
 insert into public.automation_actions(automation_job_id,automation_run_id,person_id,platform,action_type,status,attempt_number,dry_run,execution_key) values(j.id,run_id,j.person_id,j.channel,j.type,'RUNNING',j.attempt_count,j.dry_run,j.id::text||':'||j.attempt_count);
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id) values(j.id,'STARTED','CLAIMED','RUNNING','AGENT',p_agent_id);
 return next j;
end$$;
revoke all on function public.start_automation_job(uuid,uuid) from public,anon,authenticated;
grant execute on function public.start_automation_job(uuid,uuid) to service_role;

-- Packet 13 claim remains authoritative; protocol-v1 agents are additionally constrained to negotiated INTERNAL/NOOP dry runs and one active job.
create or replace function public.claim_next_automation_job(p_agent_id uuid,p_lease_seconds integer default 300)
returns setof public.automation_jobs language plpgsql security definer set search_path=public as $$
declare picked uuid;j public.automation_jobs%rowtype;d_id uuid;d public.automation_policy_decisions%rowtype;a public.automation_agents%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 if p_lease_seconds<30 or p_lease_seconds>3600 then raise exception 'lease seconds must be between 30 and 3600';end if;
 select * into a from public.automation_agents where id=p_agent_id and enabled and last_heartbeat_at>=timezone('utc',now())-interval '5 minutes';
 if a.id is null then raise exception 'agent is disabled or offline';end if;
 if a.protocol_version=1 and exists(select 1 from public.automation_jobs where claimed_by=a.id and status in('CLAIMED','RUNNING')) then return;end if;
 select id into picked from public.automation_jobs where status='QUEUED' and scheduled_for<=timezone('utc',now()) and attempt_count<max_attempts
  and (a.protocol_version is null or (dry_run and channel='INTERNAL' and type='NOOP' and coalesce(a.negotiated_capabilities->'channels','[]'::jsonb)?'INTERNAL' and coalesce(a.negotiated_capabilities->'actions','[]'::jsonb)?'NOOP'))
  order by priority desc,scheduled_for,created_at,id for update skip locked limit 1;
 if picked is null then return;end if;
 d_id:=public.automation_check_job(picked,'CLAIM',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 if d.decision<>'ALLOW' then update public.automation_jobs set status=case when d.decision='DEFER' then 'QUEUED' else 'BLOCKED' end,scheduled_for=greatest(scheduled_for,coalesce(d.next_eligible_at,scheduled_for)),failure_code=d.reason_codes[1] where id=picked;return;end if;
 update public.automation_jobs set status='CLAIMED',claimed_at=timezone('utc',now()),claimed_by=p_agent_id,lease_expires_at=timezone('utc',now())+make_interval(secs=>p_lease_seconds),version=version+1 where id=picked returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id) values(j.id,'CLAIMED','QUEUED','CLAIMED','AGENT',p_agent_id);return next j;
end$$;

create or replace function public.machine_claim_automation_job(p_agent_id uuid,p_operation_id uuid,p_request_hash text,p_instance_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare op public.automation_machine_operations%rowtype;j public.automation_jobs%rowtype;secs integer;pv integer;r jsonb;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_agent_id::text||'CLAIM'||p_operation_id::text,0));
 select * into op from public.automation_machine_operations where agent_id=p_agent_id and operation_type='CLAIM' and operation_id=p_operation_id;
 if op.id is not null then if op.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='integrity_constraint_violation';end if;return op.response;end if;
 select greatest(30,least(3600,coalesce((configuration->>'leaseSeconds')::integer,300))),version into secs,pv from public.automation_policy_versions where active;
 select * into j from public.claim_next_automation_job(p_agent_id,secs) limit 1;
 if j.id is null then r:=jsonb_build_object('status','NO_JOB');else
  update public.automation_jobs set machine_instance_id=p_instance_id,claim_operation_id=p_operation_id where id=j.id returning * into j;
  r:=jsonb_build_object('status','CLAIMED','job',jsonb_build_object('jobId',j.id,'jobVersion',j.version,'leaseExpiresAt',j.lease_expires_at,'policyVersion',pv,'dryRun',j.dry_run,'channel',j.channel,'actionType',j.type,'purpose',j.communication_purpose,'payload',j.payload,'contentHash',j.payload_hash,'attemptNumber',j.attempt_count+1));
 end if;
 insert into public.automation_machine_operations(operation_id,agent_id,operation_type,job_id,request_hash,response,expires_at) values(p_operation_id,p_agent_id,'CLAIM',j.id,p_request_hash,r,timezone('utc',now())+interval '7 days');return r;
end$$;

create or replace function public.machine_extend_automation_lease(p_agent_id uuid,p_job_id uuid,p_operation_id uuid,p_request_hash text,p_instance_id uuid,p_expected_version integer,p_expected_lease timestamptz)
returns jsonb language plpgsql security definer set search_path=public as $$
declare op public.automation_machine_operations%rowtype;j public.automation_jobs%rowtype;secs integer;r jsonb;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;perform pg_advisory_xact_lock(hashtextextended(p_agent_id::text||'LEASE'||p_operation_id::text,0));
 select * into op from public.automation_machine_operations where agent_id=p_agent_id and operation_type='LEASE' and operation_id=p_operation_id;if op.id is not null then if op.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='integrity_constraint_violation';end if;return op.response;end if;
 select * into j from public.automation_jobs where id=p_job_id for update;
 if j.claimed_by<>p_agent_id or j.machine_instance_id<>p_instance_id or j.status not in('CLAIMED','RUNNING') or j.version<>p_expected_version or j.lease_expires_at<>p_expected_lease or j.lease_expires_at<=timezone('utc',now()) then raise exception 'LEASE_LOST' using errcode='serialization_failure';end if;
 select greatest(30,least(3600,coalesce((configuration->>'leaseSeconds')::integer,300))) into secs from public.automation_policy_versions where active;
 update public.automation_jobs set lease_expires_at=timezone('utc',now())+make_interval(secs=>secs),version=version+1 where id=j.id returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id,metadata) values(j.id,'LEASE_EXTENDED',j.status,j.status,'AGENT',p_agent_id,jsonb_build_object('operationId',p_operation_id));
 r:=jsonb_build_object('status','LEASE_EXTENDED','jobId',j.id,'jobVersion',j.version,'leaseExpiresAt',j.lease_expires_at);
 insert into public.automation_machine_operations(operation_id,agent_id,operation_type,job_id,request_hash,response,expires_at) values(p_operation_id,p_agent_id,'LEASE',j.id,p_request_hash,r,timezone('utc',now())+interval '7 days');return r;
end$$;

create or replace function public.machine_start_automation_job(p_agent_id uuid,p_job_id uuid,p_operation_id uuid,p_request_hash text,p_instance_id uuid,p_expected_version integer,p_expected_lease timestamptz,p_content_hash text,p_policy_version integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare op public.automation_machine_operations%rowtype;j public.automation_jobs%rowtype;current_policy integer;r jsonb;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;perform pg_advisory_xact_lock(hashtextextended(p_agent_id::text||'START'||p_operation_id::text,0));
 select * into op from public.automation_machine_operations where agent_id=p_agent_id and operation_type='START' and operation_id=p_operation_id;if op.id is not null then if op.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='integrity_constraint_violation';end if;return op.response;end if;
 select * into j from public.automation_jobs where id=p_job_id for update;select version into current_policy from public.automation_policy_versions where active;
 if j.claimed_by<>p_agent_id or j.machine_instance_id<>p_instance_id or j.version<>p_expected_version or j.lease_expires_at<>p_expected_lease or j.payload_hash<>p_content_hash or current_policy<>p_policy_version then raise exception 'JOB_STATE_CONFLICT' using errcode='serialization_failure';end if;
 select * into j from public.start_automation_job(p_job_id,p_agent_id) limit 1;
 r:=jsonb_build_object('status',j.status,'jobId',j.id,'jobVersion',j.version,'leaseExpiresAt',j.lease_expires_at,'dryRun',j.dry_run,'actionType',j.type,'channel',j.channel);
 insert into public.automation_machine_operations(operation_id,agent_id,operation_type,job_id,request_hash,response,expires_at) values(p_operation_id,p_agent_id,'START',j.id,p_request_hash,r,timezone('utc',now())+interval '30 days');return r;
end$$;

create or replace function public.machine_result_automation_job(p_agent_id uuid,p_job_id uuid,p_operation_id uuid,p_request_hash text,p_instance_id uuid,p_expected_version integer,p_result_type text,p_failure_code text,p_failure_summary text,p_retry_after timestamptz,p_evidence jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare op public.automation_machine_operations%rowtype;j public.automation_jobs%rowtype;code text;r jsonb;retry_at timestamptz;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required' using errcode='insufficient_privilege';end if;perform pg_advisory_xact_lock(hashtextextended(p_agent_id::text||'RESULT'||p_operation_id::text,0));
 select * into op from public.automation_machine_operations where agent_id=p_agent_id and operation_type='RESULT' and operation_id=p_operation_id;if op.id is not null then if op.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='integrity_constraint_violation';end if;return op.response;end if;
 select * into j from public.automation_jobs where id=p_job_id for update;
 if j.claimed_by<>p_agent_id or j.machine_instance_id<>p_instance_id or j.status<>'RUNNING' or j.version<>p_expected_version or j.lease_expires_at<=timezone('utc',now()) or not j.dry_run then raise exception 'LEASE_LOST' using errcode='serialization_failure';end if;
 if pg_column_size(coalesce(p_evidence,'{}'::jsonb))>16384 then raise exception 'evidence too large' using errcode='program_limit_exceeded';end if;
 if p_result_type='SUCCESS' then select * into j from public.complete_automation_job(p_job_id,p_agent_id,p_evidence) limit 1;
 else
  code:=case when p_result_type='UNKNOWN_OUTCOME' then 'EXECUTION_OUTCOME_UNKNOWN' when p_result_type='MANUAL_ACTION_REQUIRED' then case when p_failure_code in('SECURITY_CHECKPOINT','CAPTCHA','AUTH_REQUIRED','IDENTITY_VERIFICATION') then p_failure_code else 'SECURITY_CHECKPOINT' end when p_result_type='TRANSIENT_FAILURE' then case when p_failure_code in('TRANSIENT_NETWORK','PROVIDER_TEMPORARY','RATE_LIMIT') then p_failure_code else 'TRANSIENT_NETWORK' end else case when p_failure_code in('INVALID_TARGET','UNSUPPORTED_ACTION','EXECUTOR_UNAVAILABLE') then p_failure_code else 'EXECUTOR_UNAVAILABLE' end end;
  retry_at:=case when p_result_type='TRANSIENT_FAILURE' and p_retry_after is not null then greatest(timezone('utc',now()),least(p_retry_after,timezone('utc',now())+interval '1 hour')) end;
  select * into j from public.fail_automation_job(p_job_id,p_agent_id,code,coalesce(left(p_failure_summary,500),'Bridge result'),retry_at) limit 1;
 end if;
 r:=jsonb_build_object('status',j.status,'jobId',j.id,'jobVersion',j.version,'failureCode',j.failure_code);
 insert into public.automation_machine_operations(operation_id,agent_id,operation_type,job_id,request_hash,response,expires_at) values(p_operation_id,p_agent_id,'RESULT',j.id,p_request_hash,r,timezone('utc',now())+interval '30 days');return r;
end$$;

revoke all on function public.machine_claim_automation_job(uuid,uuid,text,uuid),public.machine_extend_automation_lease(uuid,uuid,uuid,text,uuid,integer,timestamptz),public.machine_start_automation_job(uuid,uuid,uuid,text,uuid,integer,timestamptz,text,integer),public.machine_result_automation_job(uuid,uuid,uuid,text,uuid,integer,text,text,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.machine_claim_automation_job(uuid,uuid,text,uuid),public.machine_extend_automation_lease(uuid,uuid,uuid,text,uuid,integer,timestamptz),public.machine_start_automation_job(uuid,uuid,uuid,text,uuid,integer,timestamptz,text,integer),public.machine_result_automation_job(uuid,uuid,uuid,text,uuid,integer,text,text,text,timestamptz,jsonb) to service_role;

create or replace view public.crm_automation_agents_projection with(security_invoker=true) as
select a.id,a.agent_key,a.name,a.enabled,a.version,a.host,a.last_heartbeat_at,a.capabilities,
 case when not a.enabled then 'DISABLED' when a.last_heartbeat_at>=timezone('utc',now())-interval '2 minutes' then 'ONLINE' when a.last_heartbeat_at>=timezone('utc',now())-interval '5 minutes' then 'STALE' else 'OFFLINE' end derived_status,
 (select count(*) from public.automation_jobs j where j.claimed_by=a.id and j.status in('CLAIMED','RUNNING')) active_claims,
 a.protocol_version,a.bridge_version,a.executor_mode,a.instance_id,a.last_handshake_at,a.clock_skew_ms,a.negotiated_capabilities from public.automation_agents a;
grant select on public.crm_automation_agents_projection to authenticated;

create or replace view public.crm_automation_jobs_projection with(security_invoker=true) as
select j.id,j.person_id,j.opportunity_id,j.type,j.channel,j.communication_purpose,j.action_class,j.risk_level,j.status,j.priority,j.payload,j.scheduled_for,j.claimed_at,j.claimed_by,j.lease_expires_at,j.attempt_count,j.max_attempts,j.idempotency_key,j.dry_run,j.failure_code,j.failure_summary,j.approval_expires_at,j.version,j.created_at,j.updated_at,p.display_name person_name,p.do_not_contact,p.lifecycle_stage,o.name organization_name,op.title opportunity_title,s.score lead_score,s.intent_level,a.name agent_name,d.decision policy_decision,d.reason_codes,d.evaluated_at policy_evaluated_at,j.machine_instance_id,j.claim_operation_id,a.bridge_version,a.protocol_version from public.automation_jobs j left join public.people p on p.id=j.person_id left join public.organizations o on o.id=p.organization_id left join public.opportunities op on op.id=j.opportunity_id left join public.crm_current_lead_score s on s.person_id=j.person_id left join public.automation_agents a on a.id=j.claimed_by left join public.automation_policy_decisions d on d.id=j.last_policy_decision_id;
grant select on public.crm_automation_jobs_projection to authenticated;
