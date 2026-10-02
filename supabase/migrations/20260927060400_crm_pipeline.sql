-- Zavlio Packet 06 / 04: pipeline, opportunity, task, note, and touchpoint foundation.
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, sort_order integer not null check (sort_order >= 0),
  color_token text, is_closed boolean not null default false, is_won boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.opportunities (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete set null, title text not null,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict, estimated_value numeric(14,2) check (estimated_value is null or estimated_value >= 0),
  currency char(3) not null default 'INR' check (currency ~ '^[A-Z]{3}$'), probability numeric(5,2) check (probability is null or probability between 0 and 100),
  service_interest jsonb not null default '{}'::jsonb, source text, owner_id uuid references public.staff_profiles(id) on delete set null,
  expected_close_date date, lost_reason text, created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.opportunity_stage_history (
  id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  from_stage_id uuid references public.pipeline_stages(id) on delete set null, to_stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  changed_by uuid references public.staff_profiles(id) on delete set null, changed_at timestamptz not null default timezone('utc', now()), reason text, metadata jsonb not null default '{}'::jsonb
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), person_id uuid references public.people(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null, assigned_to uuid references public.staff_profiles(id) on delete set null,
  title text not null, description text, due_at timestamptz, status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','COMPLETED','CANCELLED')),
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','URGENT')), created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()), completed_at timestamptz
);
create table public.notes (
  id uuid primary key default gen_random_uuid(), person_id uuid references public.people(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null, opportunity_id uuid references public.opportunities(id) on delete set null,
  author_id uuid references public.staff_profiles(id) on delete set null, body text not null, visibility text not null default 'INTERNAL' check (visibility = 'INTERNAL'),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  check (person_id is not null or organization_id is not null or opportunity_id is not null)
);
create table public.touchpoints (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id) on delete restrict,
  opportunity_id uuid references public.opportunities(id) on delete set null, channel text not null, type text not null, direction text not null,
  subject text, content_summary text, external_reference text, occurred_at timestamptz not null default timezone('utc', now()), created_by_type text not null,
  created_by_id uuid, automation_run_id uuid, metadata jsonb not null default '{}'::jsonb
);
create trigger pipeline_stages_set_updated_at before update on public.pipeline_stages for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
