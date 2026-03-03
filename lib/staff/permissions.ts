export type StaffPermissionColumn =
  | 'can_manage_customers'
  | 'can_manage_orders'
  | 'can_manage_measurements'
  | 'can_manage_catalog'
  | 'can_manage_inventory'

export interface StaffPermissionSet {
  can_manage_customers: boolean
  can_manage_orders: boolean
  can_manage_measurements: boolean
  can_manage_catalog: boolean
  can_manage_inventory: boolean
}

export const EMPTY_STAFF_PERMISSIONS: StaffPermissionSet = {
  can_manage_customers: false,
  can_manage_orders: false,
  can_manage_measurements: false,
  can_manage_catalog: false,
  can_manage_inventory: false,
}

export const STAFF_PERMISSION_LABELS: Record<StaffPermissionColumn, string> = {
  can_manage_customers: 'Customers',
  can_manage_orders: 'Orders',
  can_manage_measurements: 'Measurements',
  can_manage_catalog: 'Catalog',
  can_manage_inventory: 'Inventory',
}

export function hasAnyOperationalPermission(permissions: StaffPermissionSet) {
  return (
    permissions.can_manage_customers ||
    permissions.can_manage_orders ||
    permissions.can_manage_measurements ||
    permissions.can_manage_catalog ||
    permissions.can_manage_inventory
  )
}

export function countEnabledStaffPermissions(permissions: StaffPermissionSet) {
  return Object.values(permissions).filter(Boolean).length
}
