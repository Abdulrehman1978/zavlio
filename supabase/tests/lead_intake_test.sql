begin;
select plan(10);
select has_table('public', 'email_outbox', 'transactional email outbox exists');
select has_column('public', 'form_submissions', 'schema_version', 'form schema version exists');
select has_column('public', 'form_submissions', 'conflict_detected', 'form conflict flag exists');
select has_index('public', 'identities', 'identities_email_unique', 'email identity uniqueness index exists');
select has_function(
  'public',
  'intake_lead_submission',
  ARRAY['text','text','text','jsonb','text','text','text','text','text','text','jsonb','text','text','text','text','uuid','boolean','boolean','text','text','text','text','text','timestamp with time zone','integer','text','jsonb','jsonb'],
  'atomic lead intake function exists'
);
select ok((select relrowsecurity from pg_class where oid = 'public.email_outbox'::regclass), 'email outbox keeps RLS enabled');
select ok((select count(*) from pg_policies where schemaname = 'public' and tablename = 'email_outbox') = 1, 'email outbox has restricted staff read policy');
select has_index('public', 'email_outbox', 'email_outbox_pending_idx', 'pending outbox index exists');
select col_is_unique('public', 'email_outbox', 'idempotency_key', 'email idempotency is unique');
select ok((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'intake_lead_submission') = 1, 'intake function is callable by name');
select * from finish();
rollback;
