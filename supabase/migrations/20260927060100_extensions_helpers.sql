-- Zavlio Packet 06 / 01: extensions and shared trigger helper.
create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', clock_timestamp());
  return new;
end;
$$;
