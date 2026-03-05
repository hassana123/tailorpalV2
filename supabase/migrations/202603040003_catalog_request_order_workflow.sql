begin;

alter table if exists public.customers
  alter column last_name drop not null;

alter table if exists public.orders
  add column if not exists style_image_url text,
  add column if not exists catalog_request_id uuid references public.catalog_order_requests(id) on delete set null,
  add column if not exists customer_contact_email text,
  add column if not exists customer_contact_phone text;

create index if not exists idx_orders_catalog_request_id on public.orders(catalog_request_id);

alter table if exists public.catalog_order_requests
  add column if not exists customer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists linked_order_id uuid references public.orders(id) on delete set null,
  add column if not exists owner_response_channel text
    check (owner_response_channel in ('email', 'whatsapp', 'none')),
  add column if not exists owner_response_message text,
  add column if not exists owner_response_sent_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz;

alter table if exists public.catalog_order_requests
  drop constraint if exists catalog_order_requests_status_check;

alter table if exists public.catalog_order_requests
  add constraint catalog_order_requests_status_check
  check (status in ('pending', 'contacted', 'accepted', 'converted', 'rejected', 'cancelled'));

create index if not exists idx_catalog_order_requests_customer_user_id
  on public.catalog_order_requests(customer_user_id);

create index if not exists idx_catalog_order_requests_linked_order_id
  on public.catalog_order_requests(linked_order_id);

create index if not exists idx_catalog_order_requests_status
  on public.catalog_order_requests(status);

commit;
