-- Zavlio Packet 07 / 10: staff authorization helpers, grants, and RLS policies.
-- Auth identity is authoritative for authentication; staff_profiles is authoritative for Zavlio authorization.
create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select sp.id
  from public.staff_profiles as sp
  where sp.auth_user_id = auth.uid() and sp.active = true
  limit 1;
$$;

create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select sp.role
  from public.staff_profiles as sp
  where sp.auth_user_id = auth.uid() and sp.active = true
  limit 1;
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_staff_id() is not null;
$$;

create or replace function public.has_staff_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case public.current_staff_role()
    when 'OWNER' then true
    when 'ADMIN' then required_role in ('VIEWER', 'OPERATOR', 'ADMIN')
    when 'OPERATOR' then required_role in ('VIEWER', 'OPERATOR')
    when 'VIEWER' then required_role = 'VIEWER'
    else false
  end;
$$;

revoke all on function public.current_staff_id() from public, anon;
revoke all on function public.current_staff_role() from public, anon;
revoke all on function public.is_active_staff() from public, anon;
revoke all on function public.has_staff_role(text) from public, anon;
grant execute on function public.current_staff_id() to authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.has_staff_role(text) to authenticated;

create or replace function public.protect_last_active_owner()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  remaining_owners integer;
  removing_owner boolean;
begin
  removing_owner := old.active and old.role = 'OWNER' and (
    tg_op = 'DELETE' or new.active = false or new.role <> 'OWNER'
  );
  if removing_owner then
    select count(*) into remaining_owners
    from public.staff_profiles
    where active = true and role = 'OWNER' and id <> old.id;
    if remaining_owners = 0 then
      raise exception 'cannot remove the final active OWNER' using errcode = 'check_violation';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.protect_staff_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_role text;
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    actor_role := public.current_staff_role();
    if actor_role is null then
      raise exception 'active staff authorization required' using errcode = 'insufficient_privilege';
    end if;
    if actor_role <> 'OWNER' and new.auth_user_id is distinct from old.auth_user_id then
      raise exception 'only OWNER may change auth_user_id' using errcode = 'insufficient_privilege';
    end if;
    if actor_role = 'ADMIN' and (old.role not in ('OPERATOR', 'VIEWER') or new.role not in ('OPERATOR', 'VIEWER')) then
      raise exception 'ADMIN may manage only OPERATOR or VIEWER profiles' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_last_active_owner() from public, anon, authenticated;
revoke all on function public.protect_staff_security_fields() from public, anon, authenticated;

create trigger staff_profiles_last_owner_guard
before update or delete on public.staff_profiles
for each row execute function public.protect_last_active_owner();
create trigger staff_profiles_security_guard
before update on public.staff_profiles
for each row execute function public.protect_staff_security_fields();

-- Explicit authenticated grants: RLS policies below remain the authorization layer.
grant select on public.staff_profiles, public.authors, public.testimonials, public.services, public.projects, public.project_media, public.lab_projects, public.insights, public.site_settings, public.navigation_items, public.footer_links, public.reusable_content_blocks to authenticated;
grant select on public.organizations, public.people, public.anonymous_visitors, public.sessions, public.identities, public.identity_match_candidates, public.consents, public.events, public.form_submissions, public.lead_scores to authenticated;
grant select on public.pipeline_stages, public.opportunities, public.opportunity_stage_history, public.tasks, public.notes, public.touchpoints, public.conversations, public.messages, public.campaigns, public.campaign_members to authenticated;
grant select on public.automation_agents, public.automation_jobs, public.automation_runs, public.automation_actions to authenticated;
grant insert, update on public.people, public.organizations, public.opportunities, public.tasks, public.notes, public.touchpoints, public.conversations, public.messages, public.identity_match_candidates to authenticated;
grant insert, update on public.staff_profiles to authenticated;
grant insert, update on public.services, public.projects, public.project_media, public.lab_projects, public.insights, public.site_settings, public.navigation_items, public.footer_links, public.reusable_content_blocks to authenticated;
grant insert, update on public.campaigns, public.campaign_members to authenticated;
grant update on public.automation_agents, public.automation_settings to authenticated;
grant select on public.automation_settings, public.audit_logs to authenticated;
grant select on public.pipeline_stages to authenticated;
grant update on public.pipeline_stages to authenticated;
grant select on public.automation_agents to authenticated;

-- Active staff can read ordinary operational/content data.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'authors','testimonials','services','projects','project_media','lab_projects','insights','site_settings','navigation_items','footer_links','reusable_content_blocks',
    'organizations','people','anonymous_visitors','sessions','identities','identity_match_candidates','consents','events','form_submissions','lead_scores',
    'pipeline_stages','opportunities','opportunity_stage_history','tasks','notes','touchpoints','conversations','messages','campaigns','campaign_members'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (public.is_active_staff())', table_name || '_active_staff_select', table_name);
  end loop;
end $$;

-- Staff profiles: active staff may see active staff; ADMIN/OWNER may see inactive profiles.
create policy staff_profiles_select_active on public.staff_profiles
for select to authenticated
using (active = true and public.is_active_staff());
create policy staff_profiles_select_admin_all on public.staff_profiles
for select to authenticated
using (public.has_staff_role('ADMIN'));
create policy staff_profiles_insert_staff_admin on public.staff_profiles
for insert to authenticated
with check (
  public.has_staff_role('OWNER') or
  (public.has_staff_role('ADMIN') and role in ('OPERATOR', 'VIEWER'))
);
create policy staff_profiles_update_owner on public.staff_profiles
for update to authenticated
using (public.has_staff_role('OWNER'))
with check (public.has_staff_role('OWNER'));
create policy staff_profiles_update_admin_lower on public.staff_profiles
for update to authenticated
using (public.has_staff_role('ADMIN') and role in ('OPERATOR', 'VIEWER'))
with check (public.has_staff_role('ADMIN') and role in ('OPERATOR', 'VIEWER'));

-- Operational CRM writes: OPERATOR and above may insert/update, never delete history.
do $$
declare table_name text;
begin
  foreach table_name in array array['people','organizations','opportunities','tasks','notes','touchpoints','conversations','messages','identity_match_candidates'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_staff_role(''OPERATOR''))', table_name || '_operator_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_staff_role(''OPERATOR'')) with check (public.has_staff_role(''OPERATOR''))', table_name || '_operator_update', table_name);
  end loop;
end $$;

-- Content and campaign administration belongs to ADMIN/OWNER.
do $$
declare table_name text;
begin
  foreach table_name in array array['services','projects','project_media','lab_projects','insights','site_settings','navigation_items','footer_links','reusable_content_blocks','campaigns','campaign_members'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_staff_role(''ADMIN''))', table_name || '_admin_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_staff_role(''ADMIN'')) with check (public.has_staff_role(''ADMIN''))', table_name || '_admin_update', table_name);
  end loop;
end $$;

-- Stages and automation settings are administrative; agents are operationally visible.
create policy pipeline_stages_admin_update on public.pipeline_stages
for update to authenticated using (public.has_staff_role('ADMIN')) with check (public.has_staff_role('ADMIN'));
create policy automation_agents_operator_update on public.automation_agents
for update to authenticated using (public.has_staff_role('ADMIN')) with check (public.has_staff_role('ADMIN'));
create policy automation_agents_operator_select on public.automation_agents
for select to authenticated using (public.is_active_staff());
create policy automation_settings_admin_select on public.automation_settings
for select to authenticated using (public.has_staff_role('ADMIN'));
create policy automation_settings_admin_update on public.automation_settings
for update to authenticated using (public.has_staff_role('ADMIN')) with check (public.has_staff_role('ADMIN'));
create policy automation_jobs_operator_select on public.automation_jobs
for select to authenticated using (public.has_staff_role('OPERATOR'));
create policy automation_runs_operator_select on public.automation_runs
for select to authenticated using (public.has_staff_role('OPERATOR'));
create policy automation_actions_operator_select on public.automation_actions
for select to authenticated using (public.has_staff_role('OPERATOR'));

-- Audit logs are readable only by ADMIN/OWNER and are never directly writable by staff.
create policy audit_logs_admin_select on public.audit_logs
for select to authenticated using (public.has_staff_role('ADMIN'));

-- No policy or grant is created for automation_nonces. All DELETE remains denied.
