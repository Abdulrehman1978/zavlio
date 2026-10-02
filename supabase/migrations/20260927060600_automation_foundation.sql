-- Zavlio Packet 06 / 06: automation durable state and policy settings.
create table public.automation_agents (
  id uuid primary key default gen_random_uuid(), agent_key text not null unique, name text not null,
  status text not null default 'OFFLINE', version text, host text, last_heartbeat_at timestamptz,
  enabled boolean not null default false, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.automation_settings (
  id uuid primary key default gen_random_uuid(), settings_key text not null unique default 'default', enabled boolean not null default false,
  dry_run boolean not null default true, approval_mode text not null default 'APPROVAL_REQUIRED' check (approval_mode in ('OBSERVE_ONLY','DRAFT_ONLY','APPROVAL_REQUIRED','AUTONOMOUS')),
  allowed_platforms text[] not null default '{}', allowed_action_types text[] not null default '{}', max_contacts_per_person_week integer not null default 0 check (max_contacts_per_person_week >= 0),
  max_follow_ups integer not null default 0 check (max_follow_ups >= 0), cooldown_minutes integer not null default 0 check (cooldown_minutes >= 0),
  working_hours jsonb not null default '{}'::jsonb, timezone text not null default 'Asia/Kolkata', policy jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(), person_id uuid references public.people(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null, type text not null, channel text not null,
  priority integer not null default 0, status text not null default 'QUEUED' check (status in ('QUEUED','RETRY_WAIT','CLAIMED','RUNNING','AWAITING_APPROVAL','COMPLETED','FAILED','BLOCKED','MANUAL_ACTION_REQUIRED','CANCELLED')),
  payload jsonb not null default '{}'::jsonb, scheduled_for timestamptz not null default timezone('utc', now()), claimed_at timestamptz,
  claimed_by uuid references public.automation_agents(id) on delete set null, lease_expires_at timestamptz, attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0), idempotency_key text not null unique,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.automation_runs (
  id uuid primary key default gen_random_uuid(), agent_id uuid not null references public.automation_agents(id) on delete restrict,
  started_at timestamptz not null default timezone('utc', now()), finished_at timestamptz, status text not null,
  version text, host text, metadata jsonb not null default '{}'::jsonb, check (finished_at is null or finished_at >= started_at)
);
create table public.automation_actions (
  id uuid primary key default gen_random_uuid(), automation_job_id uuid not null references public.automation_jobs(id) on delete restrict,
  automation_run_id uuid references public.automation_runs(id) on delete set null, person_id uuid references public.people(id) on delete set null,
  platform text not null, action_type text not null, status text not null, requested_at timestamptz not null default timezone('utc', now()),
  executed_at timestamptz, verified_at timestamptz, failure_reason text, evidence jsonb not null default '{}'::jsonb,
  content_summary text, created_at timestamptz not null default timezone('utc', now())
);
create table public.automation_nonces (
  id uuid primary key default gen_random_uuid(), agent_id uuid not null references public.automation_agents(id) on delete restrict,
  nonce text not null, request_timestamp timestamptz not null, used_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null, created_at timestamptz not null default timezone('utc', now()), unique (agent_id, nonce), check (expires_at >= request_timestamp)
);
create trigger automation_agents_set_updated_at before update on public.automation_agents for each row execute function public.set_updated_at();
create trigger automation_settings_set_updated_at before update on public.automation_settings for each row execute function public.set_updated_at();
create trigger automation_jobs_set_updated_at before update on public.automation_jobs for each row execute function public.set_updated_at();
