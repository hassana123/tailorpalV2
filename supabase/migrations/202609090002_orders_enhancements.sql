-- Optional enhancements for bespoke atelier order workflows
-- Adds deposit tracking, dedicated fitting dates, and Aso-Ebi group order tagging

begin;

alter table public.orders add column if not exists deposit_amount numeric(10,2) default 0;
alter table public.orders add column if not exists fitting_date date;
alter table public.orders add column if not exists group_order_name text;

create index if not exists idx_orders_fitting_date on public.orders(fitting_date);
create index if not exists idx_orders_group_order_name on public.orders(group_order_name);

commit;
