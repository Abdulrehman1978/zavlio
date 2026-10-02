-- Packet 06 local Supabase/pgTAP checks. Run with: pnpm db:test
begin;
select plan(11);
select has_table('public', 'staff_profiles', 'staff profiles exists');
select has_table('public', 'people', 'people exists');
select has_table('public', 'events', 'events exists');
select has_table('public', 'opportunities', 'opportunities exists');
select has_table('public', 'automation_jobs', 'automation jobs exists');
select has_table('public', 'audit_logs', 'audit logs exists');
select has_function('public', 'set_updated_at', 'updated_at helper exists');
select has_function('public', 'claim_next_automation_job', ARRAY['uuid', 'integer'], 'claim primitive exists');
select col_is_pk('public', 'campaign_members', ARRAY['campaign_id', 'person_id'], 'campaign membership composite key');
select col_is_unique('public', 'automation_jobs', 'idempotency_key', 'automation idempotency unique');
select has_index('public', 'people', 'people_primary_email_unique', 'people primary email index exists');
select finish();
rollback;
