begin;

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

commit;
