begin;
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
commit;
