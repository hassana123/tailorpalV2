begin;

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

commit;
