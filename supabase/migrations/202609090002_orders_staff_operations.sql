begin;

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
commit;
