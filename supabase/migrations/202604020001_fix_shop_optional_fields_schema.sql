begin;

alter table if exists public.shops
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table if exists public.customers
  alter column last_name drop not null;

commit;
