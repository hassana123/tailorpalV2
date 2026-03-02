export type UserRole = 'shop_owner' | 'staff' | 'customer'

export type StaffStatus = 'pending' | 'active' | 'revoked'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked'
export type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'cancelled'
export type MeasurementStatus = 'pending' | 'completed'

export interface StaffPermissionUpdateRequest {
  canManageCustomers?: boolean
  canManageOrders?: boolean
  canManageMeasurements?: boolean
  canManageCatalog?: boolean
  canManageInventory?: boolean
}

export interface CreateShopRequest {
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  latitude?: number
  longitude?: number
}

export interface UpsertCatalogItemRequest {
  shopId: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isActive?: boolean
}

export interface CatalogOrderRequestPayload {
  shopId: string
  catalogItemId: string
  requesterName: string
  requesterEmail?: string
  requesterPhone?: string
  notes?: string
}

export interface InviteStaffRequest {
  shopId: string
  email: string
  deliveryMethod?: 'supabase_email' | 'manual_link'
}

export interface AcceptStaffInvitationRequest {
  token?: string
  inviteCode?: string
}

export interface CreateCustomerRequest {
  shopId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  notes?: string
}

export interface CreateOrderRequest {
  shopId: string
  customerId: string
  designDescription: string
  fabricDetails?: string
  estimatedDeliveryDate?: string
  totalPrice?: number
  notes?: string
}

export interface CreateMeasurementRequest {
  shopId: string
  customerId: string
  standardMeasurements?: Record<string, number>
  customMeasurements?: Record<string, number>
  notes?: string
}

export interface CreateInventoryItemRequest {
  name: string
  sku?: string
  description?: string
  unit?: string
  quantityOnHand?: number
  reorderLevel?: number
  costPrice?: number
  sellingPrice?: number
  isActive?: boolean
}
