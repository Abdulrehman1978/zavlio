-- Zavlio Packet 15: permit only the explicit dry-run social adapter capabilities.
-- Packet 14 INTERNAL/NOOP remains valid; no live execution capability is introduced.
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
  and ((a.protocol_version is null and dry_run) or (a.protocol_version=1 and dry_run and (
    (channel='INTERNAL' and type='NOOP' and coalesce(a.negotiated_capabilities->'channels','[]'::jsonb)?'INTERNAL' and coalesce(a.negotiated_capabilities->'actions','[]'::jsonb)?'NOOP')
    or (channel in('THREADS','FACEBOOK','LINKEDIN') and type in('DM','REPLY','COMMENT','LIKE','FOLLOW','CONNECT','PUBLISH') and coalesce(a.negotiated_capabilities->'channels','[]'::jsonb)?channel and coalesce(a.negotiated_capabilities->'actions','[]'::jsonb)?type and coalesce(a.negotiated_capabilities->'executionModes','[]'::jsonb)?'DRY_RUN_ONLY')
  )))
  order by priority desc,scheduled_for,created_at,id for update skip locked limit 1;
 if picked is null then return;end if;
 d_id:=public.automation_check_job(picked,'CLAIM',timezone('utc',now()));select * into d from public.automation_policy_decisions where id=d_id;
 if d.decision<>'ALLOW' then update public.automation_jobs set status=case when d.decision='DEFER' then 'QUEUED' else 'BLOCKED' end,scheduled_for=greatest(scheduled_for,coalesce(d.next_eligible_at,scheduled_for)),failure_code=d.reason_codes[1] where id=picked;return;end if;
 update public.automation_jobs set status='CLAIMED',claimed_at=timezone('utc',now()),claimed_by=p_agent_id,lease_expires_at=timezone('utc',now())+make_interval(secs=>p_lease_seconds),version=version+1 where id=picked returning * into j;
 insert into public.automation_job_events(job_id,event_type,from_status,to_status,actor_type,actor_id) values(j.id,'CLAIMED','QUEUED','CLAIMED','AGENT',p_agent_id);return next j;
end$$;
revoke all on function public.claim_next_automation_job(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_next_automation_job(uuid,integer) to service_role;

create or replace view public.crm_automation_agents_projection with(security_invoker=true) as
select a.id,a.agent_key,a.name,a.enabled,a.version,a.host,a.last_heartbeat_at,a.capabilities,
 case when not a.enabled then 'DISABLED' when a.last_heartbeat_at>=timezone('utc',now())-interval '2 minutes' then 'ONLINE' when a.last_heartbeat_at>=timezone('utc',now())-interval '5 minutes' then 'STALE' else 'OFFLINE' end derived_status,
 (select count(*) from public.automation_jobs j where j.claimed_by=a.id and j.status in('CLAIMED','RUNNING')) active_claims,
 a.protocol_version,a.bridge_version,a.executor_mode,a.instance_id,a.last_handshake_at,a.clock_skew_ms,a.negotiated_capabilities,a.runtime_state
 from public.automation_agents a;
grant select on public.crm_automation_agents_projection to authenticated;

create or replace view public.crm_automation_jobs_projection with(security_invoker=true) as
select j.id,j.person_id,j.opportunity_id,j.type,j.channel,j.communication_purpose,j.action_class,j.risk_level,j.status,j.priority,j.payload,j.scheduled_for,j.claimed_at,j.claimed_by,j.lease_expires_at,j.attempt_count,j.max_attempts,j.idempotency_key,j.dry_run,j.failure_code,j.failure_summary,j.approval_expires_at,j.version,j.created_at,j.updated_at,p.display_name person_name,p.do_not_contact,p.lifecycle_stage,o.name organization_name,op.title opportunity_title,s.score lead_score,s.intent_level,a.name agent_name,d.decision policy_decision,d.reason_codes,d.evaluated_at policy_evaluated_at,j.machine_instance_id,j.claim_operation_id,a.bridge_version,a.protocol_version,
 (select aa.evidence from public.automation_actions aa where aa.automation_job_id=j.id order by aa.requested_at desc,aa.id desc limit 1) execution_evidence
 from public.automation_jobs j left join public.people p on p.id=j.person_id left join public.organizations o on o.id=p.organization_id left join public.opportunities op on op.id=j.opportunity_id left join public.crm_current_lead_score s on s.person_id=j.person_id left join public.automation_agents a on a.id=j.claimed_by left join public.automation_policy_decisions d on d.id=j.last_policy_decision_id;
grant select on public.crm_automation_jobs_projection to authenticated;
