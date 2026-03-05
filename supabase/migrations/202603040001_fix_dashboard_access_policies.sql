begin;

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

commit;
