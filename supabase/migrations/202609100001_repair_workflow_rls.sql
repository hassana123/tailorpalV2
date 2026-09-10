begin;

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
commit;
