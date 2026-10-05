-- Local PostgreSQL harness only; NEVER run on Supabase.
do $$ begin
  if (select count(*) from public.orders) <> 6 then raise exception 'Expected six orders'; end if;
  if (select count(*) from public.production_tasks) <> 36 then raise exception 'Expected 36 tasks'; end if;
  if (select count(*) from public.measurements) <> 6 then raise exception 'Expected six measurement records'; end if;
  if exists(select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then raise exception 'Table missing RLS'; end if;
  if not exists(select 1 from public.profiles where id = '00000000-0000-4000-8000-000000000001') then raise exception 'Signup trigger failed'; end if;
end $$;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$ begin
  if (select count(*) from public.orders) <> 6 then raise exception 'Owner cannot read orders'; end if;
  if not public.has_staff_permission('de000000-0000-4000-8000-000000000001','manage_orders') then raise exception 'Owner permission failed'; end if;
end $$;
select public.refresh_shop_notifications('de000000-0000-4000-8000-000000000001');
select public.refresh_shop_notifications('de000000-0000-4000-8000-000000000001');
do $$ begin
  if exists(select 1 from public.shop_notifications group by shop_id, type, order_id, task_id, body having count(*) > 1) then raise exception 'Duplicate reminders'; end if;
end $$;
do $$ begin
  begin
    perform public.use_order_inventory('00000000-0000-4000-8000-000000000099','de000000-0000-4000-8000-000000000050',-1);
    raise exception 'Negative quantity accepted';
  exception when others then
    if sqlerrm <> 'Quantity must be positive' then raise; end if;
  end;
end $$;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';
do $$ begin
  if (select count(*) from public.orders) <> 0 then raise exception 'Cross-shop order leak'; end if;
  if (select count(*) from public.customers) <> 0 then raise exception 'Cross-shop customer leak'; end if;
  if (select count(*) from public.order_payments) <> 0 then raise exception 'Cross-shop payment leak'; end if;
  begin
    perform public.refresh_shop_notifications('de000000-0000-4000-8000-000000000001');
    raise exception 'Unauthorized notification refresh accepted';
  exception when others then
    if sqlerrm <> 'Not permitted' then raise; end if;
  end;
end $$;
reset role;
select 'Schema, seed, owner access, isolation, inventory validation and reminder deduplication passed' as result;
