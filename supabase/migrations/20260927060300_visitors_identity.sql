-- Zavlio Packet 06 / 03: visitors, people, identities, consent, events, forms, and score history.
create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, domain public.citext, website text, industry text,
  size_range text, country text, notes text, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.people (
  id uuid primary key default gen_random_uuid(), first_name text, last_name text, display_name text not null,
  primary_email public.citext, primary_phone text, job_title text, organization_id uuid references public.organizations(id) on delete set null,
  lifecycle_stage text not null default 'IDENTIFIED' check (lifecycle_stage in ('IDENTIFIED','ENGAGED','QUALIFIED','OPPORTUNITY','CLIENT','RETURNING_CLIENT','LOST','ARCHIVED')),
  lead_status text, lead_source text, owner_id uuid references public.staff_profiles(id) on delete set null,
  do_not_contact boolean not null default false, first_touch_source text, latest_touch_source text,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()), last_activity_at timestamptz
);
create unique index people_primary_email_unique on public.people (primary_email) where primary_email is not null;
create table public.anonymous_visitors (
  id uuid primary key default gen_random_uuid(), visitor_key uuid not null unique default gen_random_uuid(),
  first_seen_at timestamptz not null default timezone('utc', now()), last_seen_at timestamptz not null default timezone('utc', now()),
  first_source text, first_referrer text, first_landing_page text, last_source text, session_count integer not null default 0 check (session_count >= 0),
  linked_person_id uuid references public.people(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(), visitor_id uuid not null references public.anonymous_visitors(id) on delete restrict,
  person_id uuid references public.people(id) on delete set null, started_at timestamptz not null default timezone('utc', now()), ended_at timestamptz,
  landing_page text, referrer text, utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text,
  device_category text, country text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc', now()),
  check (ended_at is null or ended_at >= started_at)
);
create table public.identities (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id) on delete restrict,
  provider text not null, provider_user_id text, username text, profile_url text, email public.citext, verified boolean not null default false,
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1), source text,
  discovered_at timestamptz not null default timezone('utc', now()), last_seen_at timestamptz, metadata jsonb not null default '{}'::jsonb
);
create unique index identities_provider_user_unique on public.identities (provider, provider_user_id) where provider_user_id is not null;
create table public.identity_match_candidates (
  id uuid primary key default gen_random_uuid(), person_a uuid not null references public.people(id) on delete restrict,
  person_b uuid not null references public.people(id) on delete restrict, confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  match_reasons jsonb not null default '{}'::jsonb, status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','REJECTED','AUTO_CONFIRMED')),
  reviewed_by uuid references public.staff_profiles(id) on delete set null, reviewed_at timestamptz, created_at timestamptz not null default timezone('utc', now()),
  check (person_a <> person_b)
);
create unique index identity_match_pair_unique on public.identity_match_candidates (least(person_a, person_b), greatest(person_a, person_b));
create table public.consents (
  id uuid primary key default gen_random_uuid(), person_id uuid references public.people(id) on delete restrict,
  visitor_id uuid references public.anonymous_visitors(id) on delete restrict, analytics boolean not null default false,
  marketing_email boolean not null default false, marketing_social boolean not null default false, personalization boolean not null default false,
  policy_version text not null, captured_at timestamptz not null default timezone('utc', now()), withdrawn_at timestamptz, source text not null,
  metadata jsonb not null default '{}'::jsonb, check (person_id is not null or visitor_id is not null), check (withdrawn_at is null or withdrawn_at >= captured_at)
);
create table public.events (
  id uuid primary key default gen_random_uuid(), visitor_id uuid references public.anonymous_visitors(id) on delete set null,
  person_id uuid references public.people(id) on delete set null, session_id uuid references public.sessions(id) on delete set null,
  event_name text not null, page_path text, occurred_at timestamptz not null default timezone('utc', now()), metadata jsonb not null default '{}'::jsonb,
  consent_snapshot jsonb not null default '{}'::jsonb, request_id text
);
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(), person_id uuid references public.people(id) on delete set null,
  visitor_id uuid references public.anonymous_visitors(id) on delete set null, form_type text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'RECEIVED', idempotency_key text not null unique, submitted_at timestamptz not null default timezone('utc', now()),
  source text, created_at timestamptz not null default timezone('utc', now())
);
create table public.lead_scores (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id) on delete restrict,
  score integer not null check (score between 0 and 100), intent_level text not null check (intent_level in ('LOW','INTERESTED','WARM','HIGH','PRIORITY')),
  service_interest jsonb not null default '{}'::jsonb, reasoning jsonb not null default '{}'::jsonb, model_version text not null,
  calculated_at timestamptz not null default timezone('utc', now())
);
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger people_set_updated_at before update on public.people for each row execute function public.set_updated_at();
create trigger anonymous_visitors_set_updated_at before update on public.anonymous_visitors for each row execute function public.set_updated_at();
