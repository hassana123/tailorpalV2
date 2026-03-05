begin;

alter table public.measurements
  add column if not exists standard_measurements jsonb not null default '{}'::jsonb;

alter table public.measurements
  add column if not exists custom_measurements jsonb not null default '{}'::jsonb;

update public.measurements
set standard_measurements =
  jsonb_strip_nulls(
    jsonb_build_object(
      'chest', chest,
      'waist', waist,
      'hip', hip,
      'shoulder_width', shoulder_width,
      'sleeve_length', sleeve_length,
      'inseam', inseam,
      'neck', neck
    )
  ) || coalesce(standard_measurements, '{}'::jsonb);

with latest as (
  select distinct on (shop_id, customer_id)
    id,
    shop_id,
    customer_id
  from public.measurements
  order by shop_id, customer_id, updated_at desc nulls last, created_at desc nulls last, id desc
),
merged as (
  select
    l.id as keep_id,
    coalesce(
      (
        select jsonb_object_agg(e.key, e.value::numeric)
        from (
          select distinct on (e.key) e.key, e.value
          from public.measurements m2
          cross join lateral jsonb_each_text(coalesce(m2.standard_measurements, '{}'::jsonb)) as e(key, value)
          where m2.shop_id = l.shop_id and m2.customer_id = l.customer_id
          order by e.key, m2.updated_at desc nulls last, m2.created_at desc nulls last, m2.id desc
        ) e
      ),
      '{}'::jsonb
    ) as standard_measurements,
    coalesce(
      (
        select jsonb_object_agg(e.key, e.value::numeric)
        from (
          select distinct on (e.key) e.key, e.value
          from public.measurements m2
          cross join lateral jsonb_each_text(coalesce(m2.custom_measurements, '{}'::jsonb)) as e(key, value)
          where m2.shop_id = l.shop_id and m2.customer_id = l.customer_id
          order by e.key, m2.updated_at desc nulls last, m2.created_at desc nulls last, m2.id desc
        ) e
      ),
      '{}'::jsonb
    ) as custom_measurements,
    (
      select m2.notes
      from public.measurements m2
      where m2.shop_id = l.shop_id
        and m2.customer_id = l.customer_id
        and m2.notes is not null
        and btrim(m2.notes) <> ''
      order by m2.updated_at desc nulls last, m2.created_at desc nulls last, m2.id desc
      limit 1
    ) as notes
  from latest l
)
update public.measurements m
set
  standard_measurements = merged.standard_measurements,
  custom_measurements = merged.custom_measurements,
  notes = coalesce(merged.notes, m.notes),
  updated_at = now()
from merged
where m.id = merged.keep_id;

with latest as (
  select distinct on (shop_id, customer_id)
    id,
    shop_id,
    customer_id
  from public.measurements
  order by shop_id, customer_id, updated_at desc nulls last, created_at desc nulls last, id desc
)
delete from public.measurements m
using latest l
where m.shop_id = l.shop_id
  and m.customer_id = l.customer_id
  and m.id <> l.id;

create unique index if not exists idx_measurements_shop_customer_unique
  on public.measurements (shop_id, customer_id);

commit;
