-- Deterministic development seed only. No auth users, secrets, customer data, or production claims.
insert into public.pipeline_stages (name, slug, sort_order, color_token, is_closed, is_won)
values
  ('New', 'new', 10, 'neutral', false, false),
  ('Qualified', 'qualified', 20, 'blue', false, false),
  ('Discovery', 'discovery', 30, 'violet', false, false),
  ('Proposal', 'proposal', 40, 'yellow', false, false),
  ('Negotiation', 'negotiation', 50, 'orange', false, false),
  ('Won', 'won', 60, 'green', true, true),
  ('Lost', 'lost', 70, 'red', true, false)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order, color_token = excluded.color_token, is_closed = excluded.is_closed, is_won = excluded.is_won;
insert into public.site_settings (setting_key, value)
values ('content_mode', '{"mode":"demo"}'::jsonb)
on conflict (setting_key) do update set value = excluded.value;
insert into public.automation_settings (settings_key, enabled, dry_run, approval_mode, allowed_platforms, allowed_action_types, max_contacts_per_person_week, max_follow_ups, cooldown_minutes, timezone)
values ('default', false, true, 'APPROVAL_REQUIRED', '{}', '{}', 0, 0, 0, 'Asia/Kolkata')
on conflict (settings_key) do update set enabled = excluded.enabled, dry_run = excluded.dry_run, approval_mode = excluded.approval_mode, timezone = excluded.timezone;
