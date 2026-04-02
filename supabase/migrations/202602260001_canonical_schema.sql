begin;

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

commit;
