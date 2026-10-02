begin;
select plan(16);

select has_column('public','automation_agents','runtime_state','agent runtime state projection is persisted');
select has_column('public','automation_actions','evidence','action evidence is available to the bounded projection');
select has_column('public','automation_jobs','channel','jobs retain adapter channel');
select has_view('public','crm_automation_agents_projection','adapter health is projected to staff');
select has_view('public','crm_automation_jobs_projection','sanitized adapter evidence is projected');
select has_function('public','claim_next_automation_job',array['uuid','integer'],'claim gate remains server-only');
select ok(not has_table_privilege('anon','public.automation_agents','SELECT'),'anon cannot inspect adapter health');
select ok(not has_table_privilege('authenticated','public.automation_jobs','UPDATE'),'browser cannot mutate adapter queue state');
select ok(has_function_privilege('service_role','public.claim_next_automation_job(uuid,integer)','EXECUTE'),'service role can claim through the gate');
select ok(not has_function_privilege('authenticated','public.claim_next_automation_job(uuid,integer)','EXECUTE'),'authenticated cannot claim through the gate');
select ok(position('DRY_RUN_ONLY' in pg_get_functiondef('public.claim_next_automation_job(uuid,integer)'::regprocedure))>0,'claim gate requires negotiated dry-run mode');
select ok(position('THREADS' in pg_get_functiondef('public.claim_next_automation_job(uuid,integer)'::regprocedure))>0,'claim gate names supported social channels');
select ok(position('INSTAGRAM' in pg_get_functiondef('public.claim_next_automation_job(uuid,integer)'::regprocedure))=0,'unsupported Instagram is absent from claim gate');
select ok(position('execution_evidence' in pg_get_viewdef('public.crm_automation_jobs_projection'))>0,'job projection exposes bounded execution evidence');
select ok(position('runtime_state' in pg_get_viewdef('public.crm_automation_agents_projection'))>0,'agent projection exposes scalar runtime state');
select is((select configuration->>'dryRun' from public.automation_policy_versions where active),'true','default automation remains dry-run');

select * from finish();
rollback;
