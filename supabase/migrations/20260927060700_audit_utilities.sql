-- Zavlio Packet 06 / 07: append-only audit and narrowly scoped database utilities.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_type text not null, actor_id uuid, action text not null,
  entity_type text not null, entity_id uuid, before_state jsonb, after_state jsonb, ip_hash text, request_id text,
  created_at timestamptz not null default timezone('utc', now())
);
create or replace function public.database_health()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select true; $$;
create or replace function public.claim_next_automation_job(p_agent_id uuid, p_lease_seconds integer default 300)
returns setof public.automation_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lease_seconds < 30 or p_lease_seconds > 3600 then
    raise exception 'lease seconds must be between 30 and 3600';
  end if;
  if not exists (select 1 from public.automation_agents where id = p_agent_id and enabled = true) then
    raise exception 'agent is not enabled';
  end if;
  return query
    with next_job as (
      select id from public.automation_jobs
      where status in ('QUEUED', 'RETRY_WAIT') and scheduled_for <= timezone('utc', now())
      order by priority desc, scheduled_for asc, created_at asc
      for update skip locked
      limit 1
    )
    update public.automation_jobs as job
    set status = 'CLAIMED', claimed_at = timezone('utc', now()), claimed_by = p_agent_id,
        lease_expires_at = timezone('utc', now()) + make_interval(secs => p_lease_seconds), updated_at = timezone('utc', now())
    from next_job
    where job.id = next_job.id
    returning job.*;
end;
$$;
revoke all on function public.database_health() from public, anon, authenticated;
revoke all on function public.claim_next_automation_job(uuid, integer) from public, anon, authenticated;
