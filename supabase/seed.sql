-- TailorPal dummy scenarios. Run AFTER the master schema and signing up.
-- Configured for hassanaabdll1@gmail.com; change the setting below for another owner.
-- Creates a separate demo shop. Never removes existing shop data.
-- Entire seed is atomic; repeat runs leave the demo shop unchanged.
begin;
set local tailorpal.demo_owner_email = 'hassanaabdll1@gmail.com';
set local search_path = public, extensions;
do $$
declare
  owner_uuid uuid;
  shop_uuid uuid := 'de000000-0000-4000-8000-000000000001';
  customer_uuid uuid;
  staff_uuid uuid;
  order_uuid uuid;
  measurement_uuid uuid;
  item_uuid uuid := 'de000000-0000-4000-8000-000000000050';
  catalog_uuid uuid := 'de000000-0000-4000-8000-000000000060';
  supplier_uuid uuid := 'de000000-0000-4000-8000-000000000070';
  task_uuid uuid;
  stage_row record;
  scenario integer;
  scenario_status public.order_status;
  scenario_price numeric;
  scenario_due date;
begin
  select id into owner_uuid from auth.users
    where lower(email) = lower(current_setting('tailorpal.demo_owner_email'));
  if owner_uuid is null then
    raise exception 'Sign up first, then set tailorpal.demo_owner_email to your account email.';
  end if;
  if exists(select 1 from public.shops where id = shop_uuid) then
    if not exists(select 1 from public.shops where id = shop_uuid and owner_id = owner_uuid) then
      raise exception 'Demo shop belongs to another account.';
    end if;
    raise notice 'Demo shop already exists; seed skipped without changing data.';
    return;
  end if;
  insert into public.shops(id, owner_id, name, email, phone, slug, city, state, country, description)
  values(shop_uuid, owner_uuid, 'TailorPal Demo Atelier', current_setting('tailorpal.demo_owner_email'),
    '08000000000', 'tailorpal-demo-atelier', 'Lagos', 'Lagos', 'Nigeria', 'Dummy data for development and manual testing');
  insert into public.shop_planner_settings(shop_id, planner_mode, team_capacity) values(shop_uuid, 'pro', 3);
  insert into public.shop_inventory_items(id, shop_id, name, sku, unit, quantity_on_hand, reorder_level, cost_price, selling_price, created_by)
  values(item_uuid, shop_uuid, 'Demo navy fabric', 'DEMO-FABRIC', 'yards', 2, 5, 2500, 3500, owner_uuid),
    ('de000000-0000-4000-8000-000000000051', shop_uuid, 'Demo thread', 'DEMO-THREAD', 'pcs', 30, 5, 300, 500, owner_uuid);
  insert into public.inventory_suppliers(id, shop_id, name, phone, notes)
  values(supplier_uuid, shop_uuid, 'Demo Textile Supplier', '08000000000', 'Dummy supplier');
  insert into public.inventory_purchases(shop_id, inventory_item_id, supplier_id, quantity, unit_cost)
  values(shop_uuid, item_uuid, supplier_uuid, 10, 2500);
  insert into public.shop_catalog_items(id, shop_id, name, description, price, created_by)
  values(catalog_uuid, shop_uuid, 'Demo Senator Set', 'Kaftan and trousers', 80000, owner_uuid);
  insert into public.shop_catalog_items(shop_id, name, description, price, is_active, created_by)
  values(shop_uuid, 'Demo Draft Style', 'Inactive style should stay off public catalogue', 50000, false, owner_uuid);

  for scenario in 1..6 loop
    customer_uuid := gen_random_uuid();
    measurement_uuid := gen_random_uuid();
    order_uuid := gen_random_uuid();
    scenario_status := (array['pending','in_progress','completed','delivered','cancelled','pending']::public.order_status[])[scenario];
    scenario_price := (array[80000,180000,95000,70000,50000,120000])[scenario];
    scenario_due := current_date + (array[-2,2,0,-1,7,14])[scenario];
    insert into public.customers(id, shop_id, first_name, last_name, email, phone, city, country, notes, created_by)
    values(customer_uuid, shop_uuid, (array['Amara','Zainab','Tomiwa','Chidera','Kunle','Ada'])[scenario],
      'Demo', 'customer' || scenario || '@example.com', '0800000000' || scenario, 'Lagos', 'Nigeria', 'TailorPal demo customer', owner_uuid);
    insert into public.measurements(id, customer_id, shop_id, chest, waist, hip, measurement_unit,
      standard_measurements, custom_measurements, status, created_by)
    values(measurement_uuid, customer_uuid, shop_uuid, 38, 30, 40, 'inches',
      '{"chest":38,"waist":30,"hip":40,"shoulder_width":16}', '{"gown_length":58}', 'completed', owner_uuid);
    insert into public.orders(id, shop_id, customer_id, order_number, status, design_description,
      fabric_details, estimated_delivery_date, total_price, deposit_amount, priority, fitting_date,
      fitting_status, fitting_notes, delivery_date, delivery_status, group_order_name, created_by)
    values(order_uuid, shop_uuid, customer_uuid, 'DEMO-' || scenario, scenario_status,
      (array['Overdue senator set','Urgent bridal gown','Ready agbada','Delivered aso-ebi gown','Cancelled kaftan','Upcoming two-piece set'])[scenario],
      'Navy cotton; dummy test fabric', scenario_due, scenario_price,
      case when scenario in (3,4) then scenario_price when scenario = 2 then 60000 else 0 end,
      case when scenario = 2 then 'urgent' when scenario = 1 then 'high' else 'normal' end,
      case when scenario = 2 then current_date + 1 else null end,
      case when scenario = 2 then 'scheduled' else 'not_scheduled' end,
      case when scenario = 2 then 'Check sleeve fit' else null end, scenario_due,
      case when scenario = 4 then 'delivered' when scenario = 3 then 'ready' else 'scheduled' end,
      case when scenario in (4,6) then 'Demo Wedding Party' else null end, owner_uuid);
    insert into public.order_garments(order_id, name, quantity, details)
    values(order_uuid, 'Main garment', 1, 'Dummy bespoke garment'), (order_uuid, 'Matching accessory', 1, 'Multi-garment test');
    insert into public.order_measurement_links(order_id, measurement_id) values(order_uuid, measurement_uuid);
    if scenario in (2,3,4) then
      insert into public.order_payments(order_id, amount, payment_method, notes)
      values(order_uuid, case when scenario = 2 then 60000 else scenario_price end, 'transfer', 'Dummy payment');
    end if;
    insert into public.business_expenses(shop_id, order_id, category, description, amount)
    values(shop_uuid, order_uuid, 'materials', 'Demo fabric cost', 15000),
      (shop_uuid, order_uuid, 'labour', 'Demo labour cost', 10000);
    insert into public.order_design_notes(order_id, category, content, approval_status, approved_at)
    values(order_uuid, 'fabric', 'Navy cotton chosen by customer', 'approved', now()),
      (order_uuid, 'embroidery', 'Confirm monogram before stitching', 'pending', null);
    insert into public.order_design_references(order_id, image_url, label, notes)
    values(order_uuid, '/icons/icon-192x192.png', 'Demo placeholder', 'Replace with a real reference image to test uploads');
    if scenario in (3,4) then
      insert into public.order_progress_photos(order_id, image_url, caption)
      values(order_uuid, '/icons/icon-192x192.png', 'Dummy progress placeholder');
    end if;
    if scenario <= 3 then
      staff_uuid := gen_random_uuid();
      insert into public.shop_staff(id, shop_id, email, role, status, production_role, skills, phone)
      values(staff_uuid, shop_uuid, 'worker' || scenario || '@example.com',
        case when scenario = 1 then 'manager' else 'staff' end, 'active',
        (array['Lead cutter','Seamstress','Finisher'])[scenario], array['cutting','sewing'], '08000000000');
      insert into public.shop_staff_permissions(staff_id, can_manage_orders, can_manage_inventory, can_manage_measurements, can_manage_customers, can_manage_catalog)
      values(staff_uuid, true, scenario = 1, true, true, scenario = 1);
      insert into public.staff_alerts(shop_id, recipient_staff_id, title, body, due_at)
      values(shop_uuid, staff_uuid, 'Demo staff reminder', 'Review today''s assigned tasks', now() + interval '1 day');
    else
      select id into staff_uuid from public.shop_staff where shop_id = shop_uuid order by email limit 1;
    end if;
    for stage_row in select id, name, position from public.production_stages where shop_id = shop_uuid order by position loop
      task_uuid := gen_random_uuid();
      insert into public.production_tasks(id, shop_id, order_id, stage_id, title, assigned_staff_id,
        status, estimated_minutes, priority, due_date, completed_at)
      values(task_uuid, shop_uuid, order_uuid, stage_row.id, stage_row.name || ' - DEMO-' || scenario, staff_uuid,
        case when scenario in (3,4) or (scenario = 2 and stage_row.position <= 20) then 'done'
          when scenario = 2 and stage_row.position = 30 then 'in_progress' else 'todo' end,
        90, case when scenario = 2 then 2 else 0 end, scenario_due,
        case when scenario in (3,4) or (scenario = 2 and stage_row.position <= 20) then now() else null end);
      if scenario in (3,4) or (scenario = 2 and stage_row.position <= 20) then
        insert into public.production_time_entries(task_id, staff_id, started_at, ended_at, notes)
        values(task_uuid, staff_uuid, now() - interval '2 hours', now() - interval '30 minutes', 'Dummy completed work');
      elsif scenario = 2 and stage_row.position = 30 then
        insert into public.production_time_entries(task_id, staff_id, started_at, notes)
        values(task_uuid, staff_uuid, now() - interval '10 minutes', 'Dummy running timer');
      end if;
    end loop;
    if scenario = 2 then
      insert into public.order_inventory_usage(order_id, inventory_item_id, quantity) values(order_uuid, item_uuid, 8);
    end if;
  end loop;
  insert into public.catalog_order_requests(shop_id, catalog_item_id, requester_name, requester_email, notes)
  values(shop_uuid, catalog_uuid, 'Demo Public Customer', 'requester@example.com', 'Pending catalogue request');
  insert into public.shop_staff(shop_id, email, role, status) values(shop_uuid, 'invitee@example.com', 'staff', 'pending');
  insert into public.staff_invitations(shop_id, email, invited_by, token_hash, invite_code, expires_at)
  values(shop_uuid, 'invitee@example.com', owner_uuid, encode(digest('tailorpal-demo-invitation','sha256'),'hex'), 'DEMO2026', now() + interval '48 hours');
  insert into public.shop_notifications(shop_id, type, title, body)
  values(shop_uuid, 'low_stock', 'Demo low stock', 'Demo navy fabric has 2 yards remaining');
  raise notice 'Created demo shop %, six orders, six customers, three active staff and 36 tasks.', shop_uuid;
end $$;
commit;

