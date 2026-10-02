-- Zavlio Packet 06 / 09: deny-by-default RLS baseline.
-- No anonymous or authenticated policies are intentionally created in this packet.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'staff_profiles','authors','testimonials','services','projects','project_media','lab_projects','insights','site_settings','navigation_items','footer_links','reusable_content_blocks',
    'organizations','people','anonymous_visitors','sessions','identities','identity_match_candidates','consents','events','form_submissions','lead_scores',
    'pipeline_stages','opportunities','opportunity_stage_history','tasks','notes','touchpoints','conversations','messages','campaigns','campaign_members',
    'automation_agents','automation_settings','automation_jobs','automation_runs','automation_actions','automation_nonces','audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
