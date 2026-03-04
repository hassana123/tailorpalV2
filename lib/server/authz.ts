import { createClient } from '@/lib/supabase/server'

export type StaffPermission =
  | 'manage_customers'
  | 'manage_orders'
  | 'manage_measurements'
  | 'manage_catalog'
  | 'manage_inventory'

type StaffPermissionRow = {
  staff_id: string
  can_manage_customers: boolean | null
  can_manage_orders: boolean | null
  can_manage_measurements: boolean | null
  can_manage_catalog: boolean | null
  can_manage_inventory: boolean | null
}

const STAFF_PERMISSION_COLUMN: Record<StaffPermission, keyof Omit<StaffPermissionRow, 'staff_id'>> = {
  manage_customers: 'can_manage_customers',
  manage_orders: 'can_manage_orders',
  manage_measurements: 'can_manage_measurements',
  manage_catalog: 'can_manage_catalog',
  manage_inventory: 'can_manage_inventory',
}

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
    .maybeSingle()

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
    .maybeSingle()

  if (owned) {
    return true
  }

  const { data: staffRows } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)

  return Boolean(staffRows && staffRows.length > 0)
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
    .maybeSingle()

  if (owned) {
    return true
  }

  const { data: staffMemberships } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  const staffIds = (staffMemberships ?? []).map((membership) => membership.id)
  if (staffIds.length === 0) {
    return false
  }

  const { data: permissions } = await supabase
    .from('shop_staff_permissions')
    .select(
      'staff_id, can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
    )
    .in('staff_id', staffIds)

  if (!permissions || permissions.length === 0) {
    return false
  }

  const column = STAFF_PERMISSION_COLUMN[permission]
  return (permissions as StaffPermissionRow[]).some((row) => Boolean(row[column]))
}
