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

-- The browser should write profiles through the RPC below rather than having
-- unrestricted direct table write access. The session id is an analytics
-- identifier, not identity verification.
drop policy if exists "customer_profiles_public_insert" on public.customer_profiles;
drop policy if exists "customer_profiles_public_update" on public.customer_profiles;

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
security invoker
set search_path = public
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

create or replace function public.save_customer_profile(
  p_session_id text,
  p_name text default null,
  p_email text default null,
  p_phone text default null,
  p_marketing_consent boolean default false
)
returns public.customer_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.customer_profiles;
  clean_session text := trim(coalesce(p_session_id, ''));
  clean_name text := nullif(trim(coalesce(p_name, '')), '');
  clean_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  clean_phone text := nullif(trim(coalesce(p_phone, '')), '');
begin
  if length(clean_session) < 20 or length(clean_session) > 100 then
    raise exception 'Invalid session id';
  end if;

  if clean_name is null and clean_email is null and clean_phone is null then
    raise exception 'At least one customer detail is required';
  end if;

  if clean_name is not null and length(clean_name) > 120 then
    raise exception 'Name is too long';
  end if;

  if clean_email is not null and length(clean_email) > 254 then
    raise exception 'Email is too long';
  end if;

  if clean_phone is not null and length(clean_phone) > 30 then
    raise exception 'Phone is too long';
  end if;

  insert into public.customer_profiles (
    session_id,
    name,
    email,
    phone,
    marketing_consent,
    marketing_consent_at
  )
  values (
    clean_session,
    clean_name,
    clean_email,
    clean_phone,
    coalesce(p_marketing_consent, false),
    case when coalesce(p_marketing_consent, false) then now() else null end
  )
  on conflict (session_id) do update set
    name = coalesce(excluded.name, public.customer_profiles.name),
    email = coalesce(excluded.email, public.customer_profiles.email),
    phone = coalesce(excluded.phone, public.customer_profiles.phone),
    marketing_consent = excluded.marketing_consent,
    marketing_consent_at = case
      when excluded.marketing_consent then coalesce(public.customer_profiles.marketing_consent_at, now())
      else public.customer_profiles.marketing_consent_at
    end
  returning * into result;

  return result;
end;
$$;

revoke all on function public.save_customer_profile(text, text, text, text, boolean)
from public;
grant execute on function public.save_customer_profile(text, text, text, text, boolean)
to anon, authenticated;
