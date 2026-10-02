-- Zavlio Packet 06 / 02: staff-safe content foundation.
create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email public.citext not null,
  role text not null default 'VIEWER' check (role in ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.authors (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  bio text, avatar_url text, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.testimonials (
  id uuid primary key default gen_random_uuid(), quote text not null, person_name text, person_role text,
  organization_name text, claim_status text check (claim_status is null or claim_status in ('DEMO','UNVERIFIED','VERIFIED','RETIRED')),
  demo_content boolean not null default false, created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.services (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, summary text,
  body jsonb not null default '{}'::jsonb, status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','INTERNAL')), published_at timestamptz,
  seo_title text, seo_description text, og_image text, canonical_url text, demo_content boolean not null default false,
  claim_status text check (claim_status is null or claim_status in ('DEMO','UNVERIFIED','VERIFIED','RETIRED')),
  metadata jsonb not null default '{}'::jsonb, created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, project_type text,
  year integer check (year is null or year between 1900 and 2200), disciplines text[] not null default '{}', hero_media_url text,
  gallery jsonb not null default '[]'::jsonb, results jsonb not null default '{}'::jsonb,
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','INTERNAL')), published_at timestamptz,
  seo_title text, seo_description text, og_image text, canonical_url text, demo_content boolean not null default false,
  claim_status text check (claim_status is null or claim_status in ('DEMO','UNVERIFIED','VERIFIED','RETIRED')),
  metadata jsonb not null default '{}'::jsonb, created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.project_media (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null check (media_type in ('IMAGE','VIDEO','MODEL','AUDIO','DOCUMENT')), url text not null,
  alt_text text, poster_url text, sort_order integer not null default 0 check (sort_order >= 0),
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default timezone('utc', now())
);
create table public.lab_projects (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, summary text,
  body jsonb not null default '{}'::jsonb, status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','INTERNAL')), published_at timestamptz,
  seo_title text, seo_description text, og_image text, canonical_url text, demo_content boolean not null default true,
  claim_status text check (claim_status is null or claim_status in ('DEMO','UNVERIFIED','VERIFIED','RETIRED')),
  metadata jsonb not null default '{}'::jsonb, created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.insights (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, category text,
  author_id uuid references public.authors(id) on delete set null, read_time_minutes integer check (read_time_minutes is null or read_time_minutes > 0),
  hero_image_url text, body jsonb not null default '{}'::jsonb, status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','INTERNAL')), published_at timestamptz,
  seo_title text, seo_description text, og_image text, canonical_url text, demo_content boolean not null default false,
  claim_status text check (claim_status is null or claim_status in ('DEMO','UNVERIFIED','VERIFIED','RETIRED')),
  metadata jsonb not null default '{}'::jsonb, created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.site_settings (
  id uuid primary key default gen_random_uuid(), setting_key text not null unique, value jsonb not null default '{}'::jsonb,
  created_by uuid references public.staff_profiles(id) on delete set null, updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(), label text not null, href text not null,
  location text not null default 'HEADER' check (location in ('HEADER','FOOTER')), sort_order integer not null default 0 check (sort_order >= 0),
  visible boolean not null default true, created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null, created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.footer_links (
  id uuid primary key default gen_random_uuid(), label text not null, href text not null, group_key text,
  sort_order integer not null default 0 check (sort_order >= 0), visible boolean not null default true,
  created_by uuid references public.staff_profiles(id) on delete set null, updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.reusable_content_blocks (
  id uuid primary key default gen_random_uuid(), block_key text not null unique, block_type text not null,
  content jsonb not null default '{}'::jsonb, status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  created_by uuid references public.staff_profiles(id) on delete set null, updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create trigger staff_profiles_set_updated_at before update on public.staff_profiles for each row execute function public.set_updated_at();
create trigger authors_set_updated_at before update on public.authors for each row execute function public.set_updated_at();
create trigger testimonials_set_updated_at before update on public.testimonials for each row execute function public.set_updated_at();
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger lab_projects_set_updated_at before update on public.lab_projects for each row execute function public.set_updated_at();
create trigger insights_set_updated_at before update on public.insights for each row execute function public.set_updated_at();
create trigger site_settings_set_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger navigation_items_set_updated_at before update on public.navigation_items for each row execute function public.set_updated_at();
create trigger footer_links_set_updated_at before update on public.footer_links for each row execute function public.set_updated_at();
create trigger reusable_content_blocks_set_updated_at before update on public.reusable_content_blocks for each row execute function public.set_updated_at();
