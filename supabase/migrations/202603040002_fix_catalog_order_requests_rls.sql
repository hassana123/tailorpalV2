begin;

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

commit;
