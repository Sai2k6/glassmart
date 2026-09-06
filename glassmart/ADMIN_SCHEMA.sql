-- Glassmart admin management schema.
-- Run this in Supabase SQL Editor once.

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid references public.enquiries(id) on delete set null,
  customer_name text not null,
  email text,
  phone text,
  title text not null,
  amount numeric(12,2) default 0,
  status text default 'draft' check (status in ('draft','sent','accepted','rejected','expired')),
  notes text,
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Use a security-definer helper so the admin check does not recursively query
-- public.profiles from a policy attached to public.profiles itself.
create or replace function public.is_glassmart_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke execute on function public.is_glassmart_admin() from public;
grant execute on function public.is_glassmart_admin() to authenticated;

alter table public.quotations enable row level security;

drop policy if exists "Admins can manage quotations" on public.quotations;
create policy "Admins can manage quotations"
on public.quotations for all
to authenticated
using ((select public.is_glassmart_admin()))
with check ((select public.is_glassmart_admin()));

-- Admins need full management access to the business tables shown in the dashboard.
-- These policies do not grant access to normal users.
do $$
declare
  t text;
begin
  foreach t in array array['orders','enquiries','products','hardware_products','hardware_variants','profiles'] loop
    execute format('drop policy if exists %I on public.%I', 'Admins can manage ' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.is_glassmart_admin())) with check ((select public.is_glassmart_admin()))', 'Admins can manage ' || t, t);
  end loop;
end $$;

-- Keep timestamps current for quotations.
create or replace function public.set_quotation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotations_updated_at on public.quotations;
create trigger quotations_updated_at
before update on public.quotations
for each row execute function public.set_quotation_updated_at();

-- IMPORTANT: public registration must never self-assign admin privileges.
-- The app keeps the Admin option visible but creates such signups as customer
-- until an existing administrator explicitly promotes the profile.
