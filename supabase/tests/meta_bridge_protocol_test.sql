begin;
select plan(32);

select has_table('public','automation_machine_operations','durable machine operation receipts exist');
select has_column('public','automation_agents','protocol_version','agents record negotiated protocol');
select has_column('public','automation_agents','bridge_version','agents record bridge version');
select has_column('public','automation_agents','executor_mode','agents record safe executor mode');
select has_column('public','automation_agents','instance_id','agents bind one runtime instance');
select has_column('public','automation_agents','last_handshake_at','agents record handshake time');
select has_column('public','automation_agents','clock_skew_ms','agents record bounded clock skew');
select has_column('public','automation_agents','negotiated_capabilities','agents retain negotiated capabilities');
select has_column('public','automation_jobs','machine_instance_id','jobs bind to a machine instance');
select has_column('public','automation_jobs','claim_operation_id','jobs retain claim idempotency identity');
select has_view('public','crm_automation_agents_projection','staff projection exposes protocol health');
select has_view('public','crm_automation_jobs_projection','staff projection exposes machine claim context');

select has_function('public','consume_automation_nonce',array['text','text','timestamp with time zone','timestamp with time zone'],'nonce consumption boundary exists');
select has_function('public','cleanup_automation_protocol_history',array['integer'],'bounded protocol cleanup exists');
select has_function('public','record_machine_handshake',array['uuid','uuid','text','integer','jsonb'],'handshake persistence boundary exists');
select has_function('public','record_machine_heartbeat',array['uuid','uuid','text','jsonb'],'machine heartbeat boundary exists');
select has_function('public','machine_claim_automation_job',array['uuid','uuid','text','uuid'],'idempotent machine claim exists');
select has_function('public','machine_extend_automation_lease',array['uuid','uuid','uuid','text','uuid','integer','timestamp with time zone'],'idempotent lease extension exists');
select has_function('public','machine_start_automation_job',array['uuid','uuid','uuid','text','uuid','integer','timestamp with time zone','text','integer'],'guarded machine start exists');
select has_function('public','machine_result_automation_job',array['uuid','uuid','uuid','text','uuid','integer','text','text','text','timestamp with time zone','jsonb'],'idempotent machine result exists');

select ok((select relrowsecurity from pg_class where oid='public.automation_machine_operations'::regclass),'machine receipts keep RLS enabled');
select ok(not has_table_privilege('authenticated','public.automation_machine_operations','SELECT'),'staff cannot read machine receipts directly');
select ok(not has_table_privilege('authenticated','public.automation_machine_operations','INSERT'),'staff cannot forge machine receipts');
select ok(not has_table_privilege('authenticated','public.automation_nonces','INSERT'),'staff cannot consume machine nonces directly');
select ok(not has_function_privilege('authenticated','public.consume_automation_nonce(text,text,timestamp with time zone,timestamp with time zone)','EXECUTE'),'staff cannot call nonce boundary');
select ok(not has_function_privilege('authenticated','public.machine_claim_automation_job(uuid,uuid,text,uuid)','EXECUTE'),'staff cannot call machine claim');
select ok(not has_function_privilege('anon','public.record_machine_handshake(uuid,uuid,text,integer,jsonb)','EXECUTE'),'anonymous callers cannot handshake');
select ok(has_function_privilege('service_role','public.machine_result_automation_job(uuid,uuid,uuid,text,uuid,integer,text,text,text,timestamp with time zone,jsonb)','EXECUTE'),'server boundary may record results');
select has_trigger('public','automation_machine_operations','automation_machine_operations_immutable','operation receipts have an immutability guard');
select ok((select count(*)=1 from pg_indexes where schemaname='public' and tablename='automation_machine_operations' and indexdef like 'CREATE UNIQUE INDEX% (agent_id, operation_type, operation_id)'),'operation identity is unique per agent and type');
select ok((select count(*)=1 from pg_indexes where schemaname='public' and tablename='automation_jobs' and indexname='automation_jobs_claim_operation_idx'),'claim operation identity is indexed uniquely');
select throws_ok($$select public.machine_claim_automation_job(gen_random_uuid(),gen_random_uuid(),repeat('0',64),gen_random_uuid())$$,'42501','service role required','unauthenticated callers fail closed before queue access');

select * from finish();
rollback;
