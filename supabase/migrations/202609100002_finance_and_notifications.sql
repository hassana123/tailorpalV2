-- Apply after 202609100001_repair_workflow_rls.sql.
-- Operational finance records and in-app reminder feed.
begin;

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

-- Safe to run repeatedly: refreshes deadline, task, and low-stock reminders.
create or replace function public.refresh_shop_notifications(p_shop_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.shop_notifications(shop_id,type,title,body,order_id)
  select o.shop_id,
    case when o.estimated_delivery_date < current_date then 'overdue_order' else 'order_deadline' end,
    case when o.estimated_delivery_date < current_date then 'Order overdue' else 'Order deadline approaching' end,
    o.order_number || ' is due ' || to_char(o.estimated_delivery_date, 'DD Mon YYYY'), o.id
  from public.orders o
  where o.shop_id=p_shop_id and o.status in ('pending','in_progress') and o.estimated_delivery_date <= current_date + 3
  on conflict (shop_id,type,order_id,task_id) do nothing;
  insert into public.shop_notifications(shop_id,type,title,body,task_id)
  select t.shop_id, case when t.due_date < current_date then 'overdue_task' else 'task_deadline' end,
    case when t.due_date < current_date then 'Production task overdue' else 'Production task due soon' end,
    t.title || ' is due ' || to_char(t.due_date, 'DD Mon YYYY'), t.id
  from public.production_tasks t
  where t.shop_id=p_shop_id and t.status <> 'done' and t.due_date <= current_date + 1
  on conflict (shop_id,type,order_id,task_id) do nothing;
  insert into public.shop_notifications(shop_id,type,title,body)
  select i.shop_id, 'low_stock', 'Low stock alert', i.name || ' has ' || i.quantity_on_hand || ' ' || i.unit || ' remaining'
  from public.shop_inventory_items i where i.shop_id=p_shop_id and i.is_active and i.quantity_on_hand <= i.reorder_level
  on conflict (shop_id,type,order_id,task_id) do nothing;
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
commit;
