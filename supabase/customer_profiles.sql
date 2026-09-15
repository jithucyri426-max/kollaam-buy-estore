-- Kollaam Buy e-Store: voluntary customer profile table
-- Run this once in the Supabase SQL Editor for project rbokelgzxngvuglzphwe.

create table if not exists public.customer_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  name text,
  email text,
  phone text,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

-- Anonymous visitors may create/update only the profile tied to their browser session.
-- The session id is an analytics identifier, not identity verification.
drop policy if exists "customer_profiles_public_insert" on public.customer_profiles;
create policy "customer_profiles_public_insert"
on public.customer_profiles
for insert
to anon, authenticated
with check (length(session_id) between 20 and 100);

drop policy if exists "customer_profiles_public_update" on public.customer_profiles;
create policy "customer_profiles_public_update"
on public.customer_profiles
for update
to anon, authenticated
using (session_id = current_setting('request.headers', true)::json->>'x-kollaam-session-id')
with check (session_id = current_setting('request.headers', true)::json->>'x-kollaam-session-id');

-- Admin access is handled through the existing is_admin() function.
drop policy if exists "customer_profiles_admin_select" on public.customer_profiles;
create policy "customer_profiles_admin_select"
on public.customer_profiles
for select
to authenticated
using (public.is_admin());

create index if not exists customer_profiles_created_at_idx
  on public.customer_profiles (created_at desc);

create index if not exists customer_profiles_phone_idx
  on public.customer_profiles (phone);

create index if not exists customer_profiles_email_idx
  on public.customer_profiles (lower(email));

create or replace function public.customer_profiles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customer_profiles_updated_at on public.customer_profiles;
create trigger customer_profiles_updated_at
before update on public.customer_profiles
for each row
execute function public.customer_profiles_set_updated_at();
