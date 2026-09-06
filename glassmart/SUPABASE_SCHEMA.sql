-- Glassmart additive database setup.
-- Review against your existing Supabase schema before running.
-- Never put a service-role key in the Vite frontend.

create table if not exists public.orders (
  id text primary key default ('GM-' || to_char(now(),'YYYY') || '-' || upper(substr(md5(random()::text),1,6))),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'Order placed',
  customer_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  state text not null,
  pin text not null
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null,
  service text not null,
  requirements text not null,
  status text not null default 'New'
);

alter table public.orders enable row level security;
alter table public.enquiries enable row level security;

-- Customer policies: a signed-in customer can only see/create their own orders.
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders" on public.orders for insert to authenticated with check (auth.uid() = user_id);

-- Enquiries can be submitted from the public website. Only admins should read/manage them.
drop policy if exists "Anyone can submit enquiries" on public.enquiries;
create policy "Anyone can submit enquiries" on public.enquiries for insert to anon, authenticated with check (true);

-- Admin policies below assume your existing profiles table has a role column.
-- If your current admin role policy already exists, keep that policy instead.
-- The EXISTS check is intentionally scoped to the current user's profile.
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders" on public.orders for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can read enquiries" on public.enquiries;
create policy "Admins can read enquiries" on public.enquiries for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins can update enquiries" on public.enquiries;
create policy "Admins can update enquiries" on public.enquiries for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Ensure products can carry the single editable image path used by the frontend.
alter table if exists public.products add column if not exists image_url text;
