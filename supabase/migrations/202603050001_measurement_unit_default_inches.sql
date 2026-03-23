begin;

alter table public.measurements
  add column if not exists measurement_unit text not null default 'inches';

update public.measurements
set measurement_unit = 'inches'
where measurement_unit is null or trim(measurement_unit) = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'measurements_measurement_unit_check'
  ) then
    alter table public.measurements
      add constraint measurements_measurement_unit_check
      check (measurement_unit in ('inches', 'cm'));
  end if;
end $$;

commit;
