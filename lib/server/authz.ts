import { createClient } from '@/lib/supabase/server'

export type StaffPermission =
  | 'manage_customers'
  | 'manage_orders'
  | 'manage_measurements'
  | 'manage_catalog'
  | 'manage_inventory'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function isShopOwner(userId: string, shopId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (error) {
    return false
  }

  return !!data
}

export async function hasShopAccess(userId: string, shopId: string) {
  const supabase = await createClient()

  const { data: owned } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (owned) {
    return true
  }

  const { data: staff } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return !!staff
}

export async function hasStaffPermission(
  userId: string,
  shopId: string,
  permission: StaffPermission,
) {
  const supabase = await createClient()

  const { data: owned } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', userId)
    .single()

  if (owned) {
    return true
  }

  const { data: staffMembership } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!staffMembership?.id) {
    return false
  }

  const { data: permissions } = await supabase
    .from('shop_staff_permissions')
    .select(
      'can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
    )
    .eq('staff_id', staffMembership.id)
    .maybeSingle()

  if (!permissions) {
    return false
  }

  if (permission === 'manage_customers') {
    return Boolean(permissions.can_manage_customers)
  }
  if (permission === 'manage_orders') {
    return Boolean(permissions.can_manage_orders)
  }
  if (permission === 'manage_measurements') {
    return Boolean(permissions.can_manage_measurements)
  }
  if (permission === 'manage_catalog') {
    return Boolean(permissions.can_manage_catalog)
  }

  return Boolean(permissions.can_manage_inventory)
}
