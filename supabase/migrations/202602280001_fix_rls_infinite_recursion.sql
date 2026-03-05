-- Fix: infinite recursion detected in policy for relation "shops"
--
-- Root cause: circular RLS policy dependency
--   shops_staff_read  → queries shop_staff
--   shop_staff_owner_access → queries shops   ← creates a loop
--
-- Solution:
--   1. Drop the redundant shops_staff_read policy (shops_public_read already
--      allows everyone to SELECT from shops, so this policy is unnecessary).
--   2. Replace the shop_staff_owner_access policy with one that uses a
--      SECURITY DEFINER helper function so it can read shops.owner_id
--      without triggering the shops RLS policies (breaking the cycle).

begin;

-- ─── Helper function (security definer = bypasses RLS on shops) ──────────────
create or replace function public.get_shop_owner_id(p_shop_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_id from public.shops where id = p_shop_id;
$$;

-- ─── shops ────────────────────────────────────────────────────────────────────
-- Remove the redundant staff-read policy that caused the recursion.
-- shops_public_read (using true) already covers all SELECT access.
drop policy if exists shops_staff_read on public.shops;

-- ─── shop_staff ───────────────────────────────────────────────────────────────
-- Replace the policy that queried shops (causing recursion) with one that
-- calls the security-definer helper instead.
drop policy if exists shop_staff_owner_access on public.shop_staff;

create policy shop_staff_owner_access on public.shop_staff
for all
using  (public.get_shop_owner_id(shop_id) = auth.uid())
with check (public.get_shop_owner_id(shop_id) = auth.uid());

-- ─── staff_invitations ────────────────────────────────────────────────────────
-- Same pattern: replace shops subquery with the helper function.
drop policy if exists staff_invitations_owner_access on public.staff_invitations;

create policy staff_invitations_owner_access on public.staff_invitations
for all
using  (public.get_shop_owner_id(shop_id) = auth.uid())
with check (public.get_shop_owner_id(shop_id) = auth.uid());

commit;
