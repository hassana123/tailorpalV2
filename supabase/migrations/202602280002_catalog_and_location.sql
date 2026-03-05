begin;

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

commit;
