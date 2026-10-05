-- TailorPal complete fresh-project baseline (5 October 2026).
-- Run this entire file in the NEW Supabase project's SQL Editor.
-- Requires Supabase-managed auth/storage schemas. Never drops existing data.
-- This is a fresh-install baseline, not an upgrade for an existing project.
begin;
set local search_path = public, extensions;
do $$ begin
  if to_regclass('public.profiles') is not null or to_regclass('public.shops') is not null then
    raise exception 'TailorPal is already installed. This baseline requires a fresh project.';
  end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;


-- Incorporated: 202602260001_canonical_schema.sql

create extension if not exists "pgcrypto";

do $$
begin
  create type public.staff_status as enum ('pending', 'active', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('pending', 'in_progress', 'completed', 'delivered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.measurement_status as enum ('pending', 'completed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  user_type text check (user_type in ('shop_owner', 'staff', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists user_type text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles alter column user_type drop not null;
alter table public.profiles alter column user_type drop default;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'full_name'
  ) then
    execute '
      update public.profiles
      set first_name = split_part(full_name, '' '', 1),
          last_name = nullif(trim(replace(full_name, split_part(full_name, '' '', 1), '''')), '''')
      where full_name is not null
        and (first_name is null or first_name = '''')
    ';
  end if;
end $$;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  email text not null,
  phone text,
  address text,
  city text,
  state text,
  country text,
  latitude double precision,
  longitude double precision,
  logo_url text,
  banner_url text,
  slug text unique not null,
  is_featured boolean not null default false,
  rating numeric(3,2) not null default 0,
  total_ratings integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shops add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.shops add column if not exists name text;
alter table public.shops add column if not exists description text;
alter table public.shops add column if not exists email text;
alter table public.shops add column if not exists phone text;
alter table public.shops add column if not exists address text;
alter table public.shops add column if not exists city text;
alter table public.shops add column if not exists state text;
alter table public.shops add column if not exists country text;
alter table public.shops add column if not exists latitude double precision;
alter table public.shops add column if not exists longitude double precision;
alter table public.shops add column if not exists logo_url text;
alter table public.shops add column if not exists banner_url text;
alter table public.shops add column if not exists slug text;
alter table public.shops add column if not exists is_featured boolean not null default false;
alter table public.shops add column if not exists rating numeric(3,2) not null default 0;
alter table public.shops add column if not exists total_ratings integer not null default 0;
alter table public.shops add column if not exists created_at timestamptz not null default now();
alter table public.shops add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='shops' and column_name='featured'
  ) then
    execute 'update public.shops set is_featured = coalesce(is_featured, featured, false)';
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='shops' and column_name='total_reviews'
  ) then
    execute 'update public.shops set total_ratings = coalesce(total_ratings, total_reviews, 0)';
  end if;
end $$;

update public.shops
set slug = regexp_replace(lower(coalesce(name, 'shop') || '-' || substr(id::text, 1, 8)), '[^a-z0-9-]', '-', 'g')
where slug is null or slug = '';

create unique index if not exists idx_shops_slug_unique on public.shops(slug);
create index if not exists idx_shops_owner_id on public.shops(owner_id);
create index if not exists idx_shops_featured on public.shops(is_featured);

create table if not exists public.shop_staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'staff' check (role in ('staff', 'manager')),
  status public.staff_status not null default 'pending',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_staff_shop_id on public.shop_staff(shop_id);
create index if not exists idx_shop_staff_user_id on public.shop_staff(user_id);
create index if not exists idx_shop_staff_email on public.shop_staff(email);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='staff'
  ) then
    insert into public.shop_staff (
      id, shop_id, user_id, email, role, status, invited_at, accepted_at, created_at, updated_at
    )
    select
      s.id,
      s.shop_id,
      s.user_id,
      lower(s.email),
      'staff',
      case
        when s.status = 'accepted' then 'active'::public.staff_status
        when s.status = 'rejected' then 'revoked'::public.staff_status
        else 'pending'::public.staff_status
      end,
      coalesce(s.invited_at, now()),
      case when s.status = 'accepted' then coalesce(s.joined_at, s.invited_at, now()) else null end,
      coalesce(s.created_at, now()),
      now()
    from public.staff s
    where not exists (
      select 1 from public.shop_staff ss where ss.id = s.id
    );
  end if;
end $$;

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  token_hash text not null,
  invite_code text,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  sent_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_invitations add column if not exists invited_by uuid references auth.users(id) on delete set null;
alter table public.staff_invitations add column if not exists token_hash text;
alter table public.staff_invitations add column if not exists invite_code text;
alter table public.staff_invitations add column if not exists expires_at timestamptz;
alter table public.staff_invitations add column if not exists sent_at timestamptz;
alter table public.staff_invitations add column if not exists accepted_at timestamptz;
alter table public.staff_invitations add column if not exists revoked_at timestamptz;
alter table public.staff_invitations add column if not exists updated_at timestamptz not null default now();

do $$
begin
  update public.staff_invitations
  set token_hash = encode(digest(id::text, 'sha256'), 'hex')
  where token_hash is null or token_hash = '';

  update public.staff_invitations
  set invite_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
  where invite_code is null or invite_code = '';

  update public.staff_invitations
  set expires_at = coalesce(expires_at, created_at + interval '48 hours')
  where expires_at is null;

  begin
    alter table public.staff_invitations
      alter column status type public.invitation_status
      using case
        when status::text = 'accepted' then 'accepted'::public.invitation_status
        when status::text = 'revoked' then 'revoked'::public.invitation_status
        when status::text = 'expired' then 'expired'::public.invitation_status
        else 'pending'::public.invitation_status
      end;
  exception when others then
    null;
  end;
end $$;

alter table public.staff_invitations alter column token_hash set not null;
alter table public.staff_invitations alter column invite_code set not null;
alter table public.staff_invitations alter column expires_at set not null;
alter table public.staff_invitations alter column status set default 'pending';

create unique index if not exists idx_staff_invitations_token_hash on public.staff_invitations(token_hash);
create unique index if not exists idx_staff_invitations_invite_code on public.staff_invitations(invite_code);
create index if not exists idx_staff_invitations_shop_id on public.staff_invitations(shop_id);
create index if not exists idx_staff_invitations_email on public.staff_invitations(email);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  notes text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers add column if not exists first_name text;
alter table public.customers add column if not exists last_name text;
alter table public.customers add column if not exists city text;
alter table public.customers add column if not exists country text;
alter table public.customers add column if not exists notes text;
alter table public.customers add column if not exists created_by uuid references auth.users(id) on delete cascade;
alter table public.customers alter column last_name drop not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='customers' and column_name='name'
  ) then
    execute '
      update public.customers
      set first_name = split_part(name, '' '', 1),
          last_name = coalesce(nullif(trim(replace(name, split_part(name, '' '', 1), '''')), ''''), ''Customer'')
      where (first_name is null or first_name = '''')
        and name is not null
    ';
  end if;
end $$;

update public.customers
set first_name = coalesce(nullif(first_name, ''), 'Customer'),
    last_name = coalesce(nullif(last_name, ''), 'Unknown');

create index if not exists idx_customers_shop_id on public.customers(shop_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_number text not null,
  status public.order_status not null default 'pending',
  design_description text,
  fabric_details text,
  estimated_delivery_date date,
  total_price numeric(10,2),
  notes text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists design_description text;
alter table public.orders add column if not exists fabric_details text;
alter table public.orders add column if not exists estimated_delivery_date date;
alter table public.orders add column if not exists total_price numeric(10,2);
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists created_by uuid references auth.users(id) on delete cascade;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='orders' and column_name='description'
  ) then
    execute '
      update public.orders
      set design_description = coalesce(design_description, description)
      where design_description is null and description is not null
    ';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='orders' and column_name='due_date'
  ) then
    execute '
      update public.orders
      set estimated_delivery_date = coalesce(estimated_delivery_date, due_date)
      where estimated_delivery_date is null and due_date is not null
    ';
  end if;
end $$;

do $$
begin
  begin
    alter table public.orders
      alter column status type public.order_status
      using case
        when status::text = 'in-progress' then 'in_progress'::public.order_status
        when status::text = 'draft' then 'pending'::public.order_status
        when status::text = 'pending' then 'pending'::public.order_status
        when status::text = 'in_progress' then 'in_progress'::public.order_status
        when status::text = 'completed' then 'completed'::public.order_status
        when status::text = 'delivered' then 'delivered'::public.order_status
        when status::text = 'cancelled' then 'cancelled'::public.order_status
        else 'pending'::public.order_status
      end;
  exception when others then
    null;
  end;
end $$;

create index if not exists idx_orders_shop_id on public.orders(shop_id);
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_order_number on public.orders(order_number);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  chest numeric(10,2),
  waist numeric(10,2),
  hip numeric(10,2),
  shoulder_width numeric(10,2),
  sleeve_length numeric(10,2),
  inseam numeric(10,2),
  neck numeric(10,2),
  notes text,
  status public.measurement_status not null default 'pending',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.measurements add column if not exists hip numeric(10,2);
alter table public.measurements add column if not exists neck numeric(10,2);
alter table public.measurements add column if not exists status public.measurement_status not null default 'pending';
alter table public.measurements add column if not exists created_by uuid references auth.users(id) on delete cascade;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='measurements' and column_name='hips'
  ) then
    execute '
      update public.measurements
      set hip = coalesce(hip, hips)
      where hip is null and hips is not null
    ';
  end if;
end $$;

create index if not exists idx_measurements_shop_id on public.measurements(shop_id);
create index if not exists idx_measurements_customer_id on public.measurements(customer_id);

create table if not exists public.shop_ratings (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_ratings_shop_id on public.shop_ratings(shop_id);
create index if not exists idx_shop_ratings_user_id on public.shop_ratings(user_id);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='shop_reviews'
  ) then
    insert into public.shop_ratings (id, shop_id, user_id, rating, comment, created_at, updated_at)
    select
      sr.id,
      sr.shop_id,
      sr.customer_id,
      sr.rating,
      sr.review_text,
      coalesce(sr.created_at, now()),
      coalesce(sr.updated_at, now())
    from public.shop_reviews sr
    where exists (
      select 1 from auth.users u where u.id = sr.customer_id
    )
      and not exists (
      select 1 from public.shop_ratings r where r.id = sr.id
    );
  end if;
end $$;

alter table public.shops enable row level security;
alter table public.shop_staff enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.measurements enable row level security;
alter table public.shop_ratings enable row level security;
alter table public.profiles enable row level security;

-- Helper function: reads shops.owner_id bypassing RLS (security definer)
-- This breaks the circular dependency:
--   shops_staff_read -> shop_staff -> shop_staff_owner_access -> shops (loop!)
create or replace function public.get_shop_owner_id(p_shop_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_id from public.shops where id = p_shop_id;
$$;

drop policy if exists shops_owner_full_access on public.shops;
drop policy if exists shops_public_read on public.shops;
-- shops_staff_read is intentionally NOT recreated: it caused infinite recursion
-- because shop_staff_owner_access queries shops, creating a cycle.
-- shops_public_read (using true) already covers all SELECT access.
drop policy if exists shops_staff_read on public.shops;
create policy shops_owner_full_access on public.shops
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy shops_public_read on public.shops
for select using (true);

drop policy if exists shop_staff_owner_access on public.shop_staff;
drop policy if exists shop_staff_self_access on public.shop_staff;
-- Use the security-definer helper to avoid querying shops directly (no recursion)
create policy shop_staff_owner_access on public.shop_staff
for all
using  (public.get_shop_owner_id(shop_id) = auth.uid())
with check (public.get_shop_owner_id(shop_id) = auth.uid());
create policy shop_staff_self_access on public.shop_staff
for select using (auth.uid() = user_id);

drop policy if exists staff_invitations_owner_access on public.staff_invitations;
drop policy if exists staff_invitations_invitee_read on public.staff_invitations;
-- Use the security-definer helper here too (same reason)
create policy staff_invitations_owner_access on public.staff_invitations
for all
using  (public.get_shop_owner_id(shop_id) = auth.uid())
with check (public.get_shop_owner_id(shop_id) = auth.uid());
create policy staff_invitations_invitee_read on public.staff_invitations
for select using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists customers_shop_staff_access on public.customers;
create policy customers_shop_staff_access on public.customers
for all using (
  exists (
    select 1 from public.shops s where s.id = customers.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = customers.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
) with check (
  exists (
    select 1 from public.shops s where s.id = customers.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = customers.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
);

drop policy if exists orders_shop_staff_access on public.orders;
create policy orders_shop_staff_access on public.orders
for all using (
  exists (
    select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = orders.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
) with check (
  exists (
    select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = orders.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
);

drop policy if exists measurements_shop_staff_access on public.measurements;
create policy measurements_shop_staff_access on public.measurements
for all using (
  exists (
    select 1 from public.shops s where s.id = measurements.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = measurements.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
) with check (
  exists (
    select 1 from public.shops s where s.id = measurements.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = measurements.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
);

drop policy if exists shop_ratings_public_read on public.shop_ratings;
drop policy if exists shop_ratings_authenticated_insert on public.shop_ratings;
create policy shop_ratings_public_read on public.shop_ratings
for select using (true);
create policy shop_ratings_authenticated_insert on public.shop_ratings
for insert with check (auth.uid() = user_id);

drop policy if exists profiles_self_access on public.profiles;
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_self_access on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_public_read on public.profiles
for select using (true);

-- Automatic profiles for new Auth signups.
-- Automatic Profile Creation Trigger (without user_type assignment)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Dynamic measurements: current record per customer/shop.
alter table public.measurements
  add column standard_measurements jsonb not null default '{}'::jsonb,
  add column custom_measurements jsonb not null default '{}'::jsonb;
create unique index idx_measurements_shop_customer_unique on public.measurements(shop_id, customer_id);

-- Incorporated: 202602280001_fix_rls_infinite_recursion.sql
-- Fix: infinite recursion detected in policy for relation "shops"
--
-- Root cause: circular RLS policy dependency
--   shops_staff_read  → queries shop_staff
--   shop_staff_owner_access → queries shops   ← creates a loop
--
-- Solution:
--   1. Drop the redundant shops_staff_read policy (shops_public_read already
--      allows everyone to SELECT from shops, so this policy is unnecessary).
--   2. Replace the shop_staff_owner_access policy with one that uses a
--      SECURITY DEFINER helper function so it can read shops.owner_id
--      without triggering the shops RLS policies (breaking the cycle).
-- ─── Helper function (security definer = bypasses RLS on shops) ──────────────
create or replace function public.get_shop_owner_id(p_shop_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_id from public.shops where id = p_shop_id;
$$;

-- ─── shops ────────────────────────────────────────────────────────────────────
-- Remove the redundant staff-read policy that caused the recursion.
-- shops_public_read (using true) already covers all SELECT access.
drop policy if exists shops_staff_read on public.shops;

-- ─── shop_staff ───────────────────────────────────────────────────────────────
-- Replace the policy that queried shops (causing recursion) with one that
-- calls the security-definer helper instead.
drop policy if exists shop_staff_owner_access on public.shop_staff;

create policy shop_staff_owner_access on public.shop_staff
for all
using  (public.get_shop_owner_id(shop_id) = auth.uid())
with check (public.get_shop_owner_id(shop_id) = auth.uid());

-- ─── staff_invitations ────────────────────────────────────────────────────────
-- Same pattern: replace shops subquery with the helper function.
drop policy if exists staff_invitations_owner_access on public.staff_invitations;

create policy staff_invitations_owner_access on public.staff_invitations
for all
using  (public.get_shop_owner_id(shop_id) = auth.uid())
with check (public.get_shop_owner_id(shop_id) = auth.uid());

-- Incorporated: 202602280002_catalog_and_location.sql

alter table public.shops add column if not exists latitude double precision;
alter table public.shops add column if not exists longitude double precision;

create table if not exists public.shop_catalog_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_catalog_items_shop_id on public.shop_catalog_items(shop_id);
create index if not exists idx_shop_catalog_items_is_active on public.shop_catalog_items(is_active);

create table if not exists public.catalog_order_requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  catalog_item_id uuid not null references public.shop_catalog_items(id) on delete cascade,
  requester_name text not null,
  requester_email text,
  requester_phone text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'converted', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalog_order_requests_shop_id on public.catalog_order_requests(shop_id);
create index if not exists idx_catalog_order_requests_item_id on public.catalog_order_requests(catalog_item_id);

alter table public.shop_catalog_items enable row level security;
alter table public.catalog_order_requests enable row level security;

drop policy if exists shop_catalog_items_public_read_active on public.shop_catalog_items;
create policy shop_catalog_items_public_read_active on public.shop_catalog_items
for select
using (is_active = true);

drop policy if exists shop_catalog_items_shop_staff_access on public.shop_catalog_items;
create policy shop_catalog_items_shop_staff_access on public.shop_catalog_items
for all
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = shop_catalog_items.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
)
with check (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = shop_catalog_items.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);

drop policy if exists catalog_order_requests_public_insert on public.catalog_order_requests;
create policy catalog_order_requests_public_insert on public.catalog_order_requests
for insert
with check (true);

drop policy if exists catalog_order_requests_shop_staff_read on public.catalog_order_requests;
create policy catalog_order_requests_shop_staff_read on public.catalog_order_requests
for select
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = catalog_order_requests.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);

drop policy if exists catalog_order_requests_shop_staff_update on public.catalog_order_requests;
create policy catalog_order_requests_shop_staff_update on public.catalog_order_requests
for update
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = catalog_order_requests.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
)
with check (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = catalog_order_requests.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);

-- Incorporated: 202603010001_shop_state_and_media.sql

alter table public.shops add column if not exists state text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "shop_media_public_read" on storage.objects;
create policy "shop_media_public_read"
on storage.objects
for select
using (bucket_id = 'shop-media');

drop policy if exists "shop_media_user_upload" on storage.objects;
create policy "shop_media_user_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "shop_media_user_update" on storage.objects;
create policy "shop_media_user_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "shop_media_user_delete" on storage.objects;
create policy "shop_media_user_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'shop-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Incorporated: 202603010002_staff_invite_code_and_delivery.sql

create extension if not exists "pgcrypto";

alter table public.staff_invitations
  add column if not exists invite_code text;

do $$
declare
  invitation_row record;
  candidate_code text;
begin
  for invitation_row in
    select id
    from public.staff_invitations
    where invite_code is null or invite_code = ''
  loop
    loop
      candidate_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
      exit when not exists (
        select 1 from public.staff_invitations where invite_code = candidate_code
      );
    end loop;

    update public.staff_invitations
    set invite_code = candidate_code
    where id = invitation_row.id;
  end loop;
end $$;

alter table public.staff_invitations
  alter column invite_code set not null;

create unique index if not exists idx_staff_invitations_invite_code
  on public.staff_invitations(invite_code);

-- Incorporated: 202603010003_inventory_and_staff_permissions.sql

create table if not exists public.shop_staff_permissions (
  staff_id uuid primary key references public.shop_staff(id) on delete cascade,
  can_manage_customers boolean not null default false,
  can_manage_orders boolean not null default false,
  can_manage_measurements boolean not null default false,
  can_manage_catalog boolean not null default false,
  can_manage_inventory boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.shop_staff_permissions (staff_id)
select ss.id
from public.shop_staff ss
where not exists (
  select 1 from public.shop_staff_permissions sp where sp.staff_id = ss.id
);

alter table public.shop_staff_permissions enable row level security;

drop policy if exists shop_staff_permissions_owner_manage on public.shop_staff_permissions;
create policy shop_staff_permissions_owner_manage on public.shop_staff_permissions
for all
using (
  public.get_shop_owner_id(
    (select ss.shop_id from public.shop_staff ss where ss.id = shop_staff_permissions.staff_id)
  ) = auth.uid()
)
with check (
  public.get_shop_owner_id(
    (select ss.shop_id from public.shop_staff ss where ss.id = shop_staff_permissions.staff_id)
  ) = auth.uid()
);

drop policy if exists shop_staff_permissions_staff_read_own on public.shop_staff_permissions;
create policy shop_staff_permissions_staff_read_own on public.shop_staff_permissions
for select
using (
  exists (
    select 1
    from public.shop_staff ss
    where ss.id = shop_staff_permissions.staff_id
      and ss.user_id = auth.uid()
  )
);

create or replace function public.has_staff_permission(p_shop_id uuid, p_permission text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_staff_id uuid;
  permission_row record;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    return false;
  end if;

  if public.get_shop_owner_id(p_shop_id) = current_user_id then
    return true;
  end if;

  select ss.id
  into current_staff_id
  from public.shop_staff ss
  where ss.shop_id = p_shop_id
    and ss.user_id = current_user_id
    and ss.status = 'active'
  limit 1;

  if current_staff_id is null then
    return false;
  end if;

  select
    sp.can_manage_customers,
    sp.can_manage_orders,
    sp.can_manage_measurements,
    sp.can_manage_catalog,
    sp.can_manage_inventory
  into permission_row
  from public.shop_staff_permissions sp
  where sp.staff_id = current_staff_id;

  if not found then
    return false;
  end if;

  case p_permission
    when 'manage_customers' then return coalesce(permission_row.can_manage_customers, false);
    when 'manage_orders' then return coalesce(permission_row.can_manage_orders, false);
    when 'manage_measurements' then return coalesce(permission_row.can_manage_measurements, false);
    when 'manage_catalog' then return coalesce(permission_row.can_manage_catalog, false);
    when 'manage_inventory' then return coalesce(permission_row.can_manage_inventory, false);
    else return false;
  end case;
end;
$$;

drop policy if exists customers_shop_staff_access on public.customers;
drop policy if exists customers_shop_staff_read on public.customers;
drop policy if exists customers_owner_or_permitted_staff_write on public.customers;
create policy customers_shop_staff_read on public.customers
for select
using (
  exists (
    select 1 from public.shops s where s.id = customers.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = customers.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
);
create policy customers_owner_or_permitted_staff_write on public.customers
for all
using (public.has_staff_permission(shop_id, 'manage_customers'))
with check (public.has_staff_permission(shop_id, 'manage_customers'));

drop policy if exists orders_shop_staff_access on public.orders;
drop policy if exists orders_shop_staff_read on public.orders;
drop policy if exists orders_owner_or_permitted_staff_write on public.orders;
create policy orders_shop_staff_read on public.orders
for select
using (
  exists (
    select 1 from public.shops s where s.id = orders.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = orders.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
);
create policy orders_owner_or_permitted_staff_write on public.orders
for all
using (public.has_staff_permission(shop_id, 'manage_orders'))
with check (public.has_staff_permission(shop_id, 'manage_orders'));

drop policy if exists measurements_shop_staff_access on public.measurements;
drop policy if exists measurements_shop_staff_read on public.measurements;
drop policy if exists measurements_owner_or_permitted_staff_write on public.measurements;
create policy measurements_shop_staff_read on public.measurements
for select
using (
  exists (
    select 1 from public.shops s where s.id = measurements.shop_id and s.owner_id = auth.uid()
  ) or exists (
    select 1 from public.shop_staff ss
    where ss.shop_id = measurements.shop_id and ss.user_id = auth.uid() and ss.status = 'active'
  )
);
create policy measurements_owner_or_permitted_staff_write on public.measurements
for all
using (public.has_staff_permission(shop_id, 'manage_measurements'))
with check (public.has_staff_permission(shop_id, 'manage_measurements'));

drop policy if exists shop_catalog_items_shop_staff_access on public.shop_catalog_items;
drop policy if exists shop_catalog_items_shop_staff_read on public.shop_catalog_items;
drop policy if exists shop_catalog_items_owner_or_permitted_staff_write on public.shop_catalog_items;
create policy shop_catalog_items_shop_staff_read on public.shop_catalog_items
for select
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = shop_catalog_items.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);
create policy shop_catalog_items_owner_or_permitted_staff_write on public.shop_catalog_items
for all
using (public.has_staff_permission(shop_id, 'manage_catalog'))
with check (public.has_staff_permission(shop_id, 'manage_catalog'));

drop policy if exists catalog_order_requests_shop_staff_read on public.catalog_order_requests;
drop policy if exists catalog_order_requests_shop_staff_update on public.catalog_order_requests;
create policy catalog_order_requests_shop_staff_read on public.catalog_order_requests
for select
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = catalog_order_requests.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);
create policy catalog_order_requests_shop_staff_update on public.catalog_order_requests
for update
using (public.has_staff_permission(shop_id, 'manage_orders'))
with check (public.has_staff_permission(shop_id, 'manage_orders'));

create table if not exists public.shop_inventory_items (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sku text,
  description text,
  unit text not null default 'pcs',
  quantity_on_hand numeric(12,2) not null default 0 check (quantity_on_hand >= 0),
  reorder_level numeric(12,2) not null default 0 check (reorder_level >= 0),
  cost_price numeric(12,2),
  selling_price numeric(12,2),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_shop_inventory_items_shop_id on public.shop_inventory_items(shop_id);
create index if not exists idx_shop_inventory_items_is_active on public.shop_inventory_items(is_active);
create unique index if not exists idx_shop_inventory_items_shop_sku_unique
  on public.shop_inventory_items(shop_id, sku)
  where sku is not null and sku <> '';

alter table public.shop_inventory_items enable row level security;

drop policy if exists shop_inventory_items_shop_staff_read on public.shop_inventory_items;
drop policy if exists shop_inventory_items_owner_or_permitted_write on public.shop_inventory_items;
create policy shop_inventory_items_shop_staff_read on public.shop_inventory_items
for select
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = shop_inventory_items.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);
create policy shop_inventory_items_owner_or_permitted_write on public.shop_inventory_items
for all
using (public.has_staff_permission(shop_id, 'manage_inventory'))
with check (public.has_staff_permission(shop_id, 'manage_inventory'));

-- Incorporated: 202603010004_fix_profiles_permissions.sql

-- Required for profile self-upsert from authenticated sessions.
grant select on table public.profiles to anon;
grant select, insert, update on table public.profiles to authenticated;

-- Incorporated: 202603010005_fix_shops_permissions.sql

-- Required for shop creation/update from authenticated sessions.
grant select on table public.shops to anon;
grant select, insert, update, delete on table public.shops to authenticated;

-- Incorporated: 202603040001_fix_dashboard_access_policies.sql

alter table if exists public.shop_ratings enable row level security;

grant select on table public.shop_ratings to anon, authenticated;
grant insert on table public.shop_ratings to authenticated;

drop policy if exists shop_ratings_public_read on public.shop_ratings;
create policy shop_ratings_public_read on public.shop_ratings
for select
using (true);

drop policy if exists shop_ratings_authenticated_insert on public.shop_ratings;
create policy shop_ratings_authenticated_insert on public.shop_ratings
for insert
with check (auth.uid() = user_id);

alter table if exists public.shop_staff_permissions enable row level security;

grant select, insert, update, delete on table public.shop_staff_permissions to authenticated;

drop policy if exists shop_staff_permissions_owner_manage on public.shop_staff_permissions;
create policy shop_staff_permissions_owner_manage on public.shop_staff_permissions
for all
using (
  public.get_shop_owner_id(
    (select ss.shop_id from public.shop_staff ss where ss.id = shop_staff_permissions.staff_id)
  ) = auth.uid()
)
with check (
  public.get_shop_owner_id(
    (select ss.shop_id from public.shop_staff ss where ss.id = shop_staff_permissions.staff_id)
  ) = auth.uid()
);

drop policy if exists shop_staff_permissions_staff_read_own on public.shop_staff_permissions;
create policy shop_staff_permissions_staff_read_own on public.shop_staff_permissions
for select
using (
  exists (
    select 1
    from public.shop_staff ss
    where ss.id = shop_staff_permissions.staff_id
      and ss.user_id = auth.uid()
      and ss.status in ('active', 'pending')
  )
);

-- Incorporated: 202603040002_fix_catalog_order_requests_rls.sql

alter table if exists public.catalog_order_requests enable row level security;

grant insert on table public.catalog_order_requests to anon, authenticated;
grant select, update on table public.catalog_order_requests to authenticated;

drop policy if exists catalog_order_requests_public_insert on public.catalog_order_requests;
create policy catalog_order_requests_public_insert on public.catalog_order_requests
for insert
with check (
  exists (
    select 1
    from public.shop_catalog_items sci
    where sci.id = catalog_order_requests.catalog_item_id
      and sci.shop_id = catalog_order_requests.shop_id
      and sci.is_active = true
  )
);

drop policy if exists catalog_order_requests_shop_staff_read on public.catalog_order_requests;
create policy catalog_order_requests_shop_staff_read on public.catalog_order_requests
for select
using (
  public.get_shop_owner_id(shop_id) = auth.uid() or exists (
    select 1
    from public.shop_staff ss
    where ss.shop_id = catalog_order_requests.shop_id
      and ss.user_id = auth.uid()
      and ss.status = 'active'
  )
);

drop policy if exists catalog_order_requests_shop_staff_update on public.catalog_order_requests;
create policy catalog_order_requests_shop_staff_update on public.catalog_order_requests
for update
using (public.has_staff_permission(shop_id, 'manage_orders'))
with check (public.has_staff_permission(shop_id, 'manage_orders'));

-- Incorporated: 202603040003_catalog_request_order_workflow.sql

alter table if exists public.customers
  alter column last_name drop not null;

alter table if exists public.orders
  add column if not exists style_image_url text,
  add column if not exists catalog_request_id uuid references public.catalog_order_requests(id) on delete set null,
  add column if not exists customer_contact_email text,
  add column if not exists customer_contact_phone text;

create index if not exists idx_orders_catalog_request_id on public.orders(catalog_request_id);

alter table if exists public.catalog_order_requests
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists linked_order_id uuid references public.orders(id) on delete set null,
  add column if not exists owner_response_channel text
    check (owner_response_channel in ('email', 'whatsapp', 'none')),
  add column if not exists owner_response_message text,
  add column if not exists owner_response_sent_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz;

alter table if exists public.catalog_order_requests
  drop constraint if exists catalog_order_requests_status_check;

alter table if exists public.catalog_order_requests
  add constraint catalog_order_requests_status_check
  check (status in ('pending', 'contacted', 'accepted', 'converted', 'rejected', 'cancelled'));

create index if not exists idx_catalog_order_requests_customer_user_id
  on public.catalog_order_requests(customer_user_id);

create index if not exists idx_catalog_order_requests_linked_order_id
  on public.catalog_order_requests(linked_order_id);

create index if not exists idx_catalog_order_requests_status
  on public.catalog_order_requests(status);

-- Incorporated: 202603050001_measurement_unit_default_inches.sql

alter table public.measurements
  add column if not exists measurement_unit text not null default 'inches';

update public.measurements
set measurement_unit = 'inches'
where measurement_unit is null or trim(measurement_unit) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'measurements_measurement_unit_check'
  ) then
    alter table public.measurements
      add constraint measurements_measurement_unit_check
      check (measurement_unit in ('inches', 'cm'));
  end if;
end $$;

-- Incorporated: 202604020001_fix_shop_optional_fields_schema.sql

alter table if exists public.shops
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table if exists public.customers
  alter column last_name drop not null;

-- Incorporated: 202609090001_production_workflow.sql

alter table public.shop_staff add column if not exists production_role text;

create table if not exists public.production_stages (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  position integer not null default 0,
  color text not null default '#D97B2B',
  created_at timestamptz not null default now(),
  unique (shop_id, name),
  unique (shop_id, position)
);

create table if not exists public.production_tasks (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  stage_id uuid not null references public.production_stages(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  assigned_staff_id uuid references public.shop_staff(id) on delete set null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.production_time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.production_tasks(id) on delete cascade,
  staff_id uuid references public.shop_staff(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create index if not exists idx_production_stages_shop on public.production_stages(shop_id, position);
create index if not exists idx_production_tasks_shop on public.production_tasks(shop_id, status);
create index if not exists idx_production_tasks_order on public.production_tasks(order_id);
create index if not exists idx_production_time_entries_task on public.production_time_entries(task_id);

insert into public.production_stages (shop_id, name, position, color)
select s.id, v.name, v.position, v.color
from public.shops s
cross join (values
  ('Measurement', 10, '#7A9E8E'), ('Cutting', 20, '#D97B2B'), ('Sewing', 30, '#2563EB'),
  ('Fitting', 40, '#8B5CF6'), ('Finishing', 50, '#0F766E'), ('Quality check', 60, '#16A34A')
) as v(name, position, color)
on conflict (shop_id, name) do nothing;

alter table public.production_stages enable row level security;
alter table public.production_tasks enable row level security;
alter table public.production_time_entries enable row level security;

create policy production_stages_read on public.production_stages for select using (public.has_staff_permission(shop_id, 'manage_orders'));
create policy production_stages_manage on public.production_stages for all using (public.has_staff_permission(shop_id, 'manage_orders')) with check (public.has_staff_permission(shop_id, 'manage_orders'));
create policy production_tasks_read on public.production_tasks for select using (public.has_staff_permission(shop_id, 'manage_orders'));
create policy production_tasks_manage on public.production_tasks for all using (public.has_staff_permission(shop_id, 'manage_orders')) with check (public.has_staff_permission(shop_id, 'manage_orders'));
create policy production_time_entries_read on public.production_time_entries for select using (exists (select 1 from public.production_tasks t where t.id = production_time_entries.task_id and public.has_staff_permission(t.shop_id, 'manage_orders')));
create policy production_time_entries_manage on public.production_time_entries for all using (exists (select 1 from public.production_tasks t where t.id = production_time_entries.task_id and public.has_staff_permission(t.shop_id, 'manage_orders'))) with check (exists (select 1 from public.production_tasks t where t.id = production_time_entries.task_id and public.has_staff_permission(t.shop_id, 'manage_orders')));


-- Incorporated: 202609090002_orders_enhancements.sql
-- Optional enhancements for bespoke atelier order workflows
-- Adds deposit tracking, dedicated fitting dates, and Aso-Ebi group order tagging

alter table public.orders add column if not exists deposit_amount numeric(10,2) default 0;
alter table public.orders add column if not exists fitting_date date;
alter table public.orders add column if not exists group_order_name text;

create index if not exists idx_orders_fitting_date on public.orders(fitting_date);
create index if not exists idx_orders_group_order_name on public.orders(group_order_name);


-- Incorporated: 202609090002_orders_staff_operations.sql

alter table public.orders add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high','urgent'));
alter table public.shop_staff add column if not exists skills text[] not null default '{}';
alter table public.production_tasks add column if not exists priority integer not null default 0;
alter table public.production_tasks add column if not exists due_date date;

create table if not exists public.order_garments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 name text not null, quantity integer not null default 1 check(quantity > 0), details text, created_at timestamptz not null default now()
);
create table if not exists public.order_design_references (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 image_url text not null, label text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.order_measurement_links (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 measurement_id uuid not null references public.measurements(id) on delete cascade, created_at timestamptz not null default now(), unique(order_id, measurement_id)
);
create table if not exists public.order_payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 amount numeric(12,2) not null check(amount > 0), payment_method text not null default 'transfer', paid_at timestamptz not null default now(), notes text, created_at timestamptz not null default now()
);
create index if not exists idx_order_garments_order on public.order_garments(order_id);
create index if not exists idx_order_design_references_order on public.order_design_references(order_id);
create index if not exists idx_order_payments_order on public.order_payments(order_id);

alter table public.order_garments enable row level security;
alter table public.order_design_references enable row level security;
alter table public.order_measurement_links enable row level security;
alter table public.order_payments enable row level security;
create policy order_garments_access on public.order_garments for all using (exists(select 1 from public.orders o where o.id=order_garments.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_garments.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy order_design_references_access on public.order_design_references for all using (exists(select 1 from public.orders o where o.id=order_design_references.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_design_references.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy order_measurement_links_access on public.order_measurement_links for all using (exists(select 1 from public.orders o where o.id=order_measurement_links.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_measurement_links.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy order_payments_access on public.order_payments for all using (exists(select 1 from public.orders o where o.id=order_payments.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_payments.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));


-- Incorporated: 202609100001_repair_workflow_rls.sql

create or replace function public.can_read_shop(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.get_shop_owner_id(p_shop_id) = auth.uid()
    or exists (select 1 from public.shop_staff ss where ss.shop_id = p_shop_id and ss.user_id = auth.uid() and ss.status = 'active');
$$;

-- Supabase's REST role needs table privileges as well as RLS policies.
grant select, insert, update, delete on public.production_stages, public.production_tasks, public.production_time_entries to authenticated;
grant usage on schema public to authenticated;

drop policy if exists order_garments_access on public.order_garments;
drop policy if exists order_design_references_access on public.order_design_references;
drop policy if exists order_measurement_links_access on public.order_measurement_links;
drop policy if exists order_payments_access on public.order_payments;
drop policy if exists production_stages_read on public.production_stages;
drop policy if exists production_stages_manage on public.production_stages;
drop policy if exists production_tasks_read on public.production_tasks;
drop policy if exists production_tasks_manage on public.production_tasks;
drop policy if exists production_time_entries_read on public.production_time_entries;
drop policy if exists production_time_entries_manage on public.production_time_entries;

create policy order_garments_read on public.order_garments for select using (exists(select 1 from public.orders o where o.id=order_garments.order_id and public.can_read_shop(o.shop_id)));
create policy order_garments_write on public.order_garments for all using (exists(select 1 from public.orders o where o.id=order_garments.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_garments.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy order_design_references_read on public.order_design_references for select using (exists(select 1 from public.orders o where o.id=order_design_references.order_id and public.can_read_shop(o.shop_id)));
create policy order_design_references_write on public.order_design_references for all using (exists(select 1 from public.orders o where o.id=order_design_references.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_design_references.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy order_measurement_links_read on public.order_measurement_links for select using (exists(select 1 from public.orders o where o.id=order_measurement_links.order_id and public.can_read_shop(o.shop_id)));
create policy order_measurement_links_write on public.order_measurement_links for all using (exists(select 1 from public.orders o where o.id=order_measurement_links.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_measurement_links.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy order_payments_read on public.order_payments for select using (exists(select 1 from public.orders o where o.id=order_payments.order_id and public.can_read_shop(o.shop_id)));
create policy order_payments_write on public.order_payments for all using (exists(select 1 from public.orders o where o.id=order_payments.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_payments.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));
create policy production_stages_read on public.production_stages for select using (public.can_read_shop(shop_id));
create policy production_stages_manage on public.production_stages for all using (public.has_staff_permission(shop_id,'manage_orders')) with check (public.has_staff_permission(shop_id,'manage_orders'));
create policy production_tasks_read on public.production_tasks for select using (public.can_read_shop(shop_id));
create policy production_tasks_manage on public.production_tasks for all using (public.has_staff_permission(shop_id,'manage_orders')) with check (public.has_staff_permission(shop_id,'manage_orders'));
create policy production_time_entries_read on public.production_time_entries for select using (exists(select 1 from public.production_tasks t where t.id=production_time_entries.task_id and public.can_read_shop(t.shop_id)));
create policy production_time_entries_manage on public.production_time_entries for all using (exists(select 1 from public.production_tasks t where t.id=production_time_entries.task_id and public.has_staff_permission(t.shop_id,'manage_orders'))) with check (exists(select 1 from public.production_tasks t where t.id=production_time_entries.task_id and public.has_staff_permission(t.shop_id,'manage_orders')));


-- Incorporated: 202609100002_finance_and_notifications.sql
-- Apply after 202609100001_repair_workflow_rls.sql.
-- Operational finance records and in-app reminder feed.

create table if not exists public.business_expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  category text not null check (category in ('materials','labour','rent','transport','utilities','other')),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists business_expenses_shop_date_idx on public.business_expenses(shop_id, expense_date desc);
alter table public.business_expenses enable row level security;
grant select, insert, update, delete on public.business_expenses to authenticated;
drop policy if exists business_expenses_read on public.business_expenses;
drop policy if exists business_expenses_write on public.business_expenses;
create policy business_expenses_read on public.business_expenses for select using (public.can_read_shop(shop_id));
create policy business_expenses_write on public.business_expenses for all using (public.has_staff_permission(shop_id, 'manage_orders')) with check (public.has_staff_permission(shop_id, 'manage_orders'));

create table if not exists public.inventory_suppliers (
  id uuid primary key default gen_random_uuid(), shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null, phone text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.inventory_purchases (
  id uuid primary key default gen_random_uuid(), shop_id uuid not null references public.shops(id) on delete cascade,
  inventory_item_id uuid not null references public.shop_inventory_items(id) on delete cascade,
  supplier_id uuid references public.inventory_suppliers(id) on delete set null, quantity numeric(12,2) not null check(quantity > 0), unit_cost numeric(12,2) not null check(unit_cost >= 0), purchased_at date not null default current_date, created_at timestamptz not null default now()
);
create table if not exists public.order_inventory_usage (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  inventory_item_id uuid not null references public.shop_inventory_items(id) on delete restrict,
  quantity numeric(12,2) not null check(quantity > 0), used_at timestamptz not null default now(), unique(order_id, inventory_item_id)
);
alter table public.inventory_suppliers enable row level security;
alter table public.inventory_purchases enable row level security;
alter table public.order_inventory_usage enable row level security;
grant select, insert, update, delete on public.inventory_suppliers, public.inventory_purchases, public.order_inventory_usage to authenticated;
create policy inventory_suppliers_access on public.inventory_suppliers for all using (public.has_staff_permission(shop_id, 'manage_inventory')) with check (public.has_staff_permission(shop_id, 'manage_inventory'));
create policy inventory_purchases_access on public.inventory_purchases for all using (public.has_staff_permission(shop_id, 'manage_inventory')) with check (public.has_staff_permission(shop_id, 'manage_inventory'));
create policy order_inventory_usage_read on public.order_inventory_usage for select using (exists(select 1 from public.orders o where o.id=order_inventory_usage.order_id and public.can_read_shop(o.shop_id)));
create policy order_inventory_usage_write on public.order_inventory_usage for all using (exists(select 1 from public.orders o join public.shop_inventory_items i on i.shop_id=o.shop_id where o.id=order_inventory_usage.order_id and i.id=order_inventory_usage.inventory_item_id and public.has_staff_permission(o.shop_id, 'manage_inventory'))) with check (exists(select 1 from public.orders o join public.shop_inventory_items i on i.shop_id=o.shop_id where o.id=order_inventory_usage.order_id and i.id=order_inventory_usage.inventory_item_id and public.has_staff_permission(o.shop_id, 'manage_inventory')));

create or replace function public.use_order_inventory(p_order_id uuid, p_item_id uuid, p_quantity numeric)
returns void language plpgsql security definer set search_path=public as $$
declare v_shop uuid;
begin
  if p_quantity is null or p_quantity <= 0 then raise exception 'Quantity must be positive'; end if;
  select shop_id into v_shop from public.orders where id=p_order_id;
  if v_shop is null or not public.has_staff_permission(v_shop, 'manage_inventory') then raise exception 'Not permitted'; end if;
  update public.shop_inventory_items set quantity_on_hand=quantity_on_hand-p_quantity, updated_at=now() where id=p_item_id and shop_id=v_shop and quantity_on_hand>=p_quantity;
  if not found then raise exception 'Insufficient stock'; end if;
  insert into public.order_inventory_usage(order_id,inventory_item_id,quantity) values(p_order_id,p_item_id,p_quantity) on conflict(order_id,inventory_item_id) do update set quantity=order_inventory_usage.quantity+excluded.quantity, used_at=now();
end; $$;

create table if not exists public.shop_notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  order_id uuid references public.orders(id) on delete cascade,
  task_id uuid references public.production_tasks(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique(shop_id, type, order_id, task_id)
);
create index if not exists shop_notifications_feed_idx on public.shop_notifications(shop_id, read_at, created_at desc);
alter table public.shop_notifications enable row level security;
grant select, insert, update, delete on public.shop_notifications to authenticated;
drop policy if exists shop_notifications_read on public.shop_notifications;
drop policy if exists shop_notifications_write on public.shop_notifications;
create policy shop_notifications_read on public.shop_notifications for select using (public.can_read_shop(shop_id));
create policy shop_notifications_write on public.shop_notifications for all using (public.has_staff_permission(shop_id, 'manage_orders')) with check (public.has_staff_permission(shop_id, 'manage_orders'));

create unique index shop_notifications_order_unique on public.shop_notifications(shop_id,type,order_id) where order_id is not null and task_id is null;
create unique index shop_notifications_task_unique on public.shop_notifications(shop_id,type,task_id) where task_id is not null and order_id is null;
create unique index shop_notifications_stock_unique on public.shop_notifications(shop_id,type,body) where order_id is null and task_id is null;

-- Safe to run repeatedly: refreshes deadline, task, and low-stock reminders.
create or replace function public.refresh_shop_notifications(p_shop_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_read_shop(p_shop_id) then raise exception 'Not permitted'; end if;
  insert into public.shop_notifications(shop_id,type,title,body,order_id)
  select o.shop_id,
    case when o.estimated_delivery_date < current_date then 'overdue_order' else 'order_deadline' end,
    case when o.estimated_delivery_date < current_date then 'Order overdue' else 'Order deadline approaching' end,
    o.order_number || ' is due ' || to_char(o.estimated_delivery_date, 'DD Mon YYYY'), o.id
  from public.orders o
  where o.shop_id=p_shop_id and o.status in ('pending','in_progress') and o.estimated_delivery_date <= current_date + 3
  on conflict do nothing;
  insert into public.shop_notifications(shop_id,type,title,body,task_id)
  select t.shop_id, case when t.due_date < current_date then 'overdue_task' else 'task_deadline' end,
    case when t.due_date < current_date then 'Production task overdue' else 'Production task due soon' end,
    t.title || ' is due ' || to_char(t.due_date, 'DD Mon YYYY'), t.id
  from public.production_tasks t
  where t.shop_id=p_shop_id and t.status <> 'done' and t.due_date <= current_date + 1
  on conflict do nothing;
  insert into public.shop_notifications(shop_id,type,title,body)
  select i.shop_id, 'low_stock', 'Low stock alert', i.name || ' has ' || i.quantity_on_hand || ' ' || i.unit || ' remaining'
  from public.shop_inventory_items i where i.shop_id=p_shop_id and i.is_active and i.quantity_on_hand <= i.reorder_level
  on conflict do nothing;
end; $$;

create table if not exists public.order_design_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  category text not null check (category in ('fabric','embroidery','colour_material','instruction')),
  content text not null,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.order_design_notes enable row level security;
grant select, insert, update, delete on public.order_design_notes to authenticated;
drop policy if exists order_design_notes_read on public.order_design_notes;
drop policy if exists order_design_notes_write on public.order_design_notes;
create policy order_design_notes_read on public.order_design_notes for select using (exists(select 1 from public.orders o where o.id=order_design_notes.order_id and public.can_read_shop(o.shop_id)));
create policy order_design_notes_write on public.order_design_notes for all using (exists(select 1 from public.orders o where o.id=order_design_notes.order_id and public.has_staff_permission(o.shop_id, 'manage_orders'))) with check (exists(select 1 from public.orders o where o.id=order_design_notes.order_id and public.has_staff_permission(o.shop_id, 'manage_orders')));


-- Incorporated: 202609100003_order_lifecycle.sql

alter table public.orders add column if not exists fitting_status text not null default 'not_scheduled' check (fitting_status in ('not_scheduled','scheduled','completed','missed'));
alter table public.orders add column if not exists fitting_notes text;
alter table public.orders add column if not exists delivery_date date;
alter table public.orders add column if not exists delivery_status text not null default 'not_scheduled' check (delivery_status in ('not_scheduled','scheduled','ready','delivered'));
alter table public.orders add column if not exists delivery_notes text;
create table if not exists public.order_progress_photos (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, image_url text not null, caption text, created_at timestamptz not null default now()
);
alter table public.order_progress_photos enable row level security;
grant select,insert,update,delete on public.order_progress_photos to authenticated;
drop policy if exists order_progress_photos_read on public.order_progress_photos;
drop policy if exists order_progress_photos_write on public.order_progress_photos;
create policy order_progress_photos_read on public.order_progress_photos for select using(exists(select 1 from public.orders o where o.id=order_progress_photos.order_id and public.can_read_shop(o.shop_id)));
create policy order_progress_photos_write on public.order_progress_photos for all using(exists(select 1 from public.orders o where o.id=order_progress_photos.order_id and public.has_staff_permission(o.shop_id,'manage_orders'))) with check(exists(select 1 from public.orders o where o.id=order_progress_photos.order_id and public.has_staff_permission(o.shop_id,'manage_orders')));


-- Incorporated: 202609110001_planner_setup.sql

create table if not exists public.shop_planner_settings (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  planner_mode text not null default 'quick' check (planner_mode in ('quick','pro')),
  work_days_per_week integer not null default 6 check (work_days_per_week between 1 and 7),
  hours_per_day numeric(4,1) not null default 8 check (hours_per_day between 1 and 24),
  team_capacity integer not null default 1 check (team_capacity between 1 and 500),
  planner_active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.shop_planner_settings enable row level security;
grant select, insert, update, delete on public.shop_planner_settings to authenticated;
drop policy if exists shop_planner_settings_read on public.shop_planner_settings;
drop policy if exists shop_planner_settings_write on public.shop_planner_settings;
create policy shop_planner_settings_read on public.shop_planner_settings for select using (public.can_read_shop(shop_id));
create policy shop_planner_settings_write on public.shop_planner_settings for all using (public.has_staff_permission(shop_id,'manage_orders')) with check (public.has_staff_permission(shop_id,'manage_orders'));


-- Incorporated: 202609110002_staff_alerts.sql

alter table public.shop_staff add column if not exists phone text;
create table if not exists public.staff_alerts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  recipient_staff_id uuid not null references public.shop_staff(id) on delete cascade,
  title text not null,
  body text not null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists staff_alerts_shop_created_idx on public.staff_alerts(shop_id, created_at desc);
alter table public.staff_alerts enable row level security;
grant select, insert, update, delete on public.staff_alerts to authenticated;
drop policy if exists staff_alerts_read on public.staff_alerts;
drop policy if exists staff_alerts_write on public.staff_alerts;
create policy staff_alerts_read on public.staff_alerts for select using (public.can_read_shop(shop_id));
create policy staff_alerts_write on public.staff_alerts for all using (public.has_staff_permission(shop_id,'manage_orders')) with check (public.has_staff_permission(shop_id,'manage_orders'));


-- REST access requires grants as well as the table RLS policies above.
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke delete on public.profiles from authenticated;
revoke update, delete on public.shop_ratings from authenticated;
grant select on public.shops, public.profiles, public.shop_ratings, public.shop_catalog_items to anon;
grant insert on public.catalog_order_requests to anon;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Future shops receive the same default production stages as existing shops.
create or replace function public.initialize_shop_stages()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.production_stages(shop_id, name, position, color) values
    (new.id, 'Measurement', 10, '#7A9E8E'), (new.id, 'Cutting', 20, '#D97B2B'),
    (new.id, 'Sewing', 30, '#2563EB'), (new.id, 'Fitting', 40, '#8B5CF6'),
    (new.id, 'Finishing', 50, '#0F766E'), (new.id, 'Quality check', 60, '#16A34A');
  return new;
end; $$;
create trigger on_shop_created after insert on public.shops
  for each row execute function public.initialize_shop_stages();

-- Backfill profiles if an Auth user was created before this baseline ran.
insert into public.profiles(id, first_name, last_name)
select id, coalesce(raw_user_meta_data->>'first_name', ''), coalesce(raw_user_meta_data->>'last_name', '')
from auth.users on conflict(id) do nothing;
notify pgrst, 'reload schema';
commit;

