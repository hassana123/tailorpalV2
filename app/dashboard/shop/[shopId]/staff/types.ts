// ─── Types for Staff Management ─────────────────────────────────────────────

export type DeliveryMethod = 'supabase_email' | 'manual_link'

export interface StaffMember {
  id: string
  email: string
  status: 'pending' | 'active' | 'revoked'
  invited_at: string
  accepted_at: string | null
}

export interface StaffPermissions {
  staff_id: string
  can_manage_customers: boolean
  can_manage_orders: boolean
  can_manage_measurements: boolean
  can_manage_catalog: boolean
  can_manage_inventory: boolean
}

export interface PendingInvitation {
  id: string
  email: string
  invite_code: string | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string | null
  created_at: string
}

export interface InviteResponse {
  invitation: { id: string }
  deliveryMethod: DeliveryMethod
  emailSent: boolean
  inviteLink: string
  tokenInviteLink: string
  inviteCode: string
  warning?: string
  shareLinks?: { whatsapp: string; twitter: string; telegram: string }
}

// ─── Permission Configuration ────────────────────────────────────────────────

export const PERMISSION_KEYS: { key: keyof Omit<StaffPermissions, 'staff_id'>; label: string }[] = [
  { key: 'can_manage_customers',    label: 'Customers'    },
  { key: 'can_manage_orders',       label: 'Orders'       },
  { key: 'can_manage_measurements', label: 'Measurements' },
  { key: 'can_manage_catalog',      label: 'Catalog'      },
  { key: 'can_manage_inventory',    label: 'Inventory'    },
]

// ─── Invite Result Data ─────────────────────────────────────────────────────

export interface InviteResultData {
  invitationId: string
  inviteLink: string
  tokenInviteLink: string
  inviteCode: string
  shareLinks?: InviteResponse['shareLinks']
}
