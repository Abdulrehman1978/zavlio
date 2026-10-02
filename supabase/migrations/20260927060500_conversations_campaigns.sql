-- Zavlio Packet 06 / 05: conversations, messages, and campaigns.
create table public.conversations (
  id uuid primary key default gen_random_uuid(), person_id uuid not null references public.people(id) on delete restrict,
  channel text not null, external_thread_id text, status text not null default 'OPEN', last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create unique index conversations_provider_thread_unique on public.conversations (channel, external_thread_id) where external_thread_id is not null;
create table public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete restrict, direction text not null check (direction in ('INBOUND','OUTBOUND','INTERNAL')),
  channel text not null, body text not null, external_message_id text, status text not null default 'RECEIVED', sent_at timestamptz,
  received_at timestamptz, automation_action_id uuid, created_at timestamptz not null default timezone('utc', now()),
  check ((direction = 'INBOUND' and received_at is not null) or direction <> 'INBOUND')
);
create unique index messages_external_id_unique on public.messages (channel, external_message_id) where external_message_id is not null;
create table public.campaigns (
  id uuid primary key default gen_random_uuid(), name text not null, type text not null, status text not null default 'DRAFT',
  starts_at timestamptz, ends_at timestamptz, audience_definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);
create table public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade, person_id uuid not null references public.people(id) on delete restrict,
  status text not null default 'ADDED', added_at timestamptz not null default timezone('utc', now()), primary key (campaign_id, person_id)
);
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
