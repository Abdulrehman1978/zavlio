\set ON_ERROR_STOP on
begin;

insert into public.organizations(id,name) values ('00000000-0000-0000-0000-000000000001','Runtime Test Org');
insert into public.people(id,display_name,primary_email,organization_id) values ('00000000-0000-0000-0000-000000000001','John Example','John@Example.com','00000000-0000-0000-0000-000000000001');
insert into public.people(id,display_name,primary_email) values ('00000000-0000-0000-0000-000000000002','Second Example','second@example.com');
insert into public.anonymous_visitors(id) values ('00000000-0000-0000-0000-000000000001');
insert into public.automation_agents(id,agent_key,name,enabled,status) values ('00000000-0000-0000-0000-000000000001','runtime-test','Runtime Test',true,'ONLINE');

-- Case-insensitive email uniqueness.
do $$ begin
  begin
    insert into public.people(id,display_name,primary_email) values ('00000000-0000-0000-0000-000000000003','Duplicate Email','john@example.com');
  exception when unique_violation then return;
  end;
  raise exception 'case-insensitive people email uniqueness did not reject duplicate';
end $$;

-- Required CHECK constraints.
do $$ begin
  begin insert into public.lead_scores(person_id,score,intent_level,model_version) values ('00000000-0000-0000-0000-000000000001',-1,'LOW','runtime'); exception when check_violation then return; end;
  raise exception 'lead score lower bound accepted';
end $$;
do $$ begin
  begin insert into public.lead_scores(person_id,score,intent_level,model_version) values ('00000000-0000-0000-0000-000000000001',101,'LOW','runtime'); exception when check_violation then return; end;
  raise exception 'lead score upper bound accepted';
end $$;
do $$ begin
  begin insert into public.opportunities(id,person_id,title,stage_id,probability) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Bad probability',(select id from public.pipeline_stages where slug='new'),101); exception when check_violation then return; end;
  raise exception 'probability upper bound accepted';
end $$;
do $$ begin
  begin insert into public.identity_match_candidates(person_a,person_b,confidence) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',0.5); exception when check_violation then return; end;
  raise exception 'identity self-match accepted';
end $$;
do $$ begin
  begin insert into public.consents(policy_version,source) values ('runtime','test'); exception when check_violation then return; end;
  raise exception 'consent without subject accepted';
end $$;
do $$ begin
  begin insert into public.people(id,display_name,lifecycle_stage) values ('00000000-0000-0000-0000-000000000003','Bad lifecycle','INVALID'); exception when check_violation then return; end;
  raise exception 'invalid lifecycle accepted';
end $$;
do $$ begin
  begin insert into public.automation_jobs(id,type,channel,status,idempotency_key) values ('00000000-0000-0000-0000-000000000001','runtime','test','INVALID','runtime-invalid'); exception when check_violation then return; end;
  raise exception 'invalid automation state accepted';
end $$;
do $$ begin
  begin insert into public.tasks(title,status) values ('Bad task','INVALID'); exception when check_violation then return; end;
  raise exception 'invalid task state accepted';
end $$;

-- Trigger monotonicity.
insert into public.site_settings(setting_key,value) values ('runtime_trigger','{}');
select pg_sleep(0.05);
update public.site_settings set value='{"updated":true}' where setting_key='runtime_trigger';
do $$ declare before_ts timestamptz; after_ts timestamptz; begin
  select created_at,updated_at into before_ts,after_ts from public.site_settings where setting_key='runtime_trigger';
  if after_ts <= before_ts then raise exception 'updated_at did not advance'; end if;
end $$;

-- Appendable consent history.
insert into public.consents(person_id,policy_version,source,marketing_email) values ('00000000-0000-0000-0000-000000000001','v1','runtime',true);
insert into public.consents(person_id,policy_version,source,marketing_email) values ('00000000-0000-0000-0000-000000000001','v2','runtime',false);
do $$ begin
  if (select count(*) from public.consents where person_id='00000000-0000-0000-0000-000000000001') <> 2 then raise exception 'consent history was not appendable'; end if;
end $$;

-- Duplicate idempotency, nonce, and campaign membership constraints.
insert into public.form_submissions(form_type,idempotency_key,payload) values ('runtime','form-runtime-1','{}');
do $$ begin
  begin insert into public.form_submissions(form_type,idempotency_key,payload) values ('runtime','form-runtime-1','{}'); exception when unique_violation then return; end;
  raise exception 'form idempotency duplicate accepted';
end $$;
insert into public.automation_jobs(id,type,channel,idempotency_key) values ('00000000-0000-0000-0000-000000000002','runtime','test','job-runtime-1');
do $$ begin
  begin insert into public.automation_jobs(id,type,channel,idempotency_key) values ('00000000-0000-0000-0000-000000000003','runtime','test','job-runtime-1'); exception when unique_violation then return; end;
  raise exception 'job idempotency duplicate accepted';
end $$;
insert into public.automation_nonces(agent_id,nonce,request_timestamp,expires_at) values ('00000000-0000-0000-0000-000000000001','nonce-1',clock_timestamp(),clock_timestamp()+interval '5 minutes');
do $$ begin
  begin insert into public.automation_nonces(agent_id,nonce,request_timestamp,expires_at) values ('00000000-0000-0000-0000-000000000001','nonce-1',clock_timestamp(),clock_timestamp()+interval '5 minutes'); exception when unique_violation then return; end;
  raise exception 'nonce duplicate accepted';
end $$;
insert into public.campaigns(id,name,type) values ('00000000-0000-0000-0000-000000000001','Runtime Campaign','TEST');
insert into public.campaign_members(campaign_id,person_id) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001');
do $$ begin
  begin insert into public.campaign_members(campaign_id,person_id) values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'); exception when unique_violation then return; end;
  raise exception 'campaign membership duplicate accepted';
end $$;

rollback;
select 'runtime_constraints_pass' as result;

