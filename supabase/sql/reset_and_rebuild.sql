-- TailorPal database reset + rebuild helper for Supabase SQL Editor.
-- Run this file first, then run the migrations listed at the bottom in order.

begin;

drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres, service_role;

alter default privileges in schema public
grant all on tables to postgres, service_role;

alter default privileges in schema public
grant all on sequences to postgres, service_role;

alter default privileges in schema public
grant all on functions to postgres, service_role;

create extension if not exists "pgcrypto";

commit;

-- After running this reset, execute these migrations in order:
-- 1) supabase/migrations/202602260001_canonical_schema.sql
-- 2) supabase/migrations/202602280002_catalog_and_location.sql
-- 3) supabase/migrations/202603010001_shop_state_and_media.sql
-- 4) supabase/migrations/202603010002_staff_invite_code_and_delivery.sql
-- 5) supabase/migrations/202603010003_inventory_and_staff_permissions.sql
-- 6) supabase/migrations/202603010004_fix_profiles_permissions.sql
-- 7) supabase/migrations/202603010005_fix_shops_permissions.sql
