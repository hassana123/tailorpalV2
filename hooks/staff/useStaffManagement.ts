'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  StaffMember,
  StaffPermissions,
  PendingInvitation,
  DeliveryMethod,
  InviteResultData,
} from '../../app/dashboard/shop/[shopId]/staff/types'

interface UseStaffManagementReturn {
  // State
  staff: StaffMember[]
  invitations: PendingInvitation[]
  isLoading: boolean
  error: string | null
  
  // Permissions state
  permissionsByStaff: Record<string, StaffPermissions>
  getPermissionState: (staffId: string) => StaffPermissions
  updatePermissionDraft: (staffId: string, key: keyof Omit<StaffPermissions, 'staff_id'>, value: boolean) => void
  savePermissions: (staffId: string) => Promise<void>
  savingPermissionsFor: string | null
  
  // Invite actions
  handleInviteStaff: (email: string, deliveryMethod: DeliveryMethod) => Promise<void>
  isInviting: boolean
  refreshInvitation: (invitationId: string, mode: DeliveryMethod) => Promise<void>
  sharingInviteId: string | null
  
  // Delete actions
  handleRemoveStaff: (staffId: string) => Promise<void>
  handleDeleteStaffRecord: (staffId: string) => Promise<void>
  deleteInvitation: (invitationId: string) => Promise<void>
  deletingStaffId: string | null
  deletingInviteId: string | null
  
  // Invite result
  latestInvite: InviteResultData | null
  setLatestInvite: (data: InviteResultData | null) => void
  
  // App origin for link building
  appOrigin: string
  buildStaffSignUpLink: (inviteCode: string) => string
  buildInviteInstructionsText: (inviteCode: string, inviteLink: string) => string
  shareInvite: () => Promise<void>
  
  // Refresh data
  refreshData: () => Promise<void>
}

export function useStaffManagement(): UseStaffManagementReturn {
  const params = useParams()
  const shopId = params.shopId as string

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Permission state
  const [permissionsByStaff, setPermissionsByStaff] = useState<Record<string, StaffPermissions>>({})
  const [savingPermissionsFor, setSavingPermissionsFor] = useState<string | null>(null)
  
  // Loading states for actions
  const [sharingInviteId, setSharingInviteId] = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null)
  
  // Invite result
  const [latestInvite, setLatestInvite] = useState<InviteResultData | null>(null)
  const [appOrigin, setAppOrigin] = useState('')

  const supabase = useMemo(() => createClient(), [])

  // Set app origin on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin)
    }
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [staffResult, invitationsResult] = await Promise.all([
        supabase.from('shop_staff').select('*').eq('shop_id', shopId).order('invited_at', { ascending: false }),
        supabase.from('staff_invitations').select('id, email, invite_code, status, expires_at, created_at').eq('shop_id', shopId).order('created_at', { ascending: false }),
      ])
      
      if (staffResult.error) throw staffResult.error
      if (invitationsResult.error) throw invitationsResult.error

      const staffRows = (staffResult.data ?? []) as StaffMember[]
      const staffIds = staffRows.map((member) => member.id)

      let permissionRows: StaffPermissions[] = []
      if (staffIds.length > 0) {
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('shop_staff_permissions')
          .select('staff_id, can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory')
          .in('staff_id', staffIds)

        if (permissionsError) throw permissionsError
        permissionRows = (permissionsData ?? []) as StaffPermissions[]
      }

      setStaff(staffRows)
      setInvitations((invitationsResult.data ?? []) as PendingInvitation[])
      const permMap = permissionRows.reduce<Record<string, StaffPermissions>>(
        (acc, row) => { acc[row.staff_id] = row; return acc }, {}
      )
      setPermissionsByStaff(permMap)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load staff data'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [shopId, supabase])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Permission helpers
  const getPermissionState = useCallback((staffId: string): StaffPermissions => {
    return permissionsByStaff[staffId] ?? {
      staff_id: staffId,
      can_manage_customers: false,
      can_manage_orders: false,
      can_manage_measurements: false,
      can_manage_catalog: false,
      can_manage_inventory: false,
    }
  }, [permissionsByStaff])

  const updatePermissionDraft = useCallback((staffId: string, key: keyof Omit<StaffPermissions, 'staff_id'>, value: boolean) => {
    setPermissionsByStaff((prev) => ({
      ...prev,
      [staffId]: { ...(prev[staffId] ?? getPermissionState(staffId)), [key]: value },
    }))
  }, [getPermissionState])

  const savePermissions = useCallback(async (staffId: string) => {
    try {
      setSavingPermissionsFor(staffId)
      const current = getPermissionState(staffId)
      const response = await fetch(`/api/staff/${staffId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canManageCustomers: current.can_manage_customers,
          canManageOrders: current.can_manage_orders,
          canManageMeasurements: current.can_manage_measurements,
          canManageCatalog: current.can_manage_catalog,
          canManageInventory: current.can_manage_inventory,
        }),
      })
      const payload = await response.json() as { error?: string; permissions?: StaffPermissions }
      if (!response.ok || !payload.permissions) throw new Error(payload.error || 'Failed to save permissions')
      setPermissionsByStaff((prev) => ({ ...prev, [staffId]: payload.permissions! }))
      toast.success('Permissions updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions')
    } finally {
      setSavingPermissionsFor(null)
    }
  }, [getPermissionState])

  // Invite staff
  const handleInviteStaff = useCallback(async (email: string, deliveryMethod: DeliveryMethod) => {
    setIsInviting(true)
    setError(null)
    try {
      const response = await fetch('/api/staff/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, email, deliveryMethod }),
      })
      const payload = await response.json() as { error?: string; invitation: { id: string }; inviteLink: string; tokenInviteLink: string; inviteCode: string; emailSent: boolean; warning?: string; shareLinks?: { whatsapp: string; twitter: string; telegram: string } }
      
      if (!response.ok) throw new Error(payload.error || 'Failed to invite staff member')

      setLatestInvite({
        invitationId: payload.invitation.id,
        inviteLink: payload.inviteLink,
        tokenInviteLink: payload.tokenInviteLink,
        inviteCode: payload.inviteCode,
        shareLinks: payload.shareLinks,
      })

      if (payload.emailSent) toast.success('Invitation email sent with signup + code instructions.')
      else if (deliveryMethod === 'manual_link') toast.success('Signup link and invite code generated.')
      else toast.error(payload.warning || 'Invite created but email delivery failed.')

      await fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsInviting(false)
    }
  }, [shopId, fetchData])

  // Refresh invitation
  const refreshInvitation = useCallback(async (invitationId: string, mode: DeliveryMethod) => {
    try {
      setSharingInviteId(invitationId)
      const response = await fetch('/api/staff/invitations/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, deliveryMethod: mode }),
      })
      const payload = await response.json() as { error?: string; success?: boolean; inviteLink: string; tokenInviteLink: string; inviteCode: string; emailSent?: boolean; warning?: string; shareLinks?: { whatsapp: string; twitter: string; telegram: string } }
      
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to refresh invite')

      setLatestInvite({
        invitationId,
        inviteLink: payload.inviteLink,
        tokenInviteLink: payload.tokenInviteLink,
        inviteCode: payload.inviteCode,
        shareLinks: payload.shareLinks,
      })

      if (payload.emailSent) toast.success('Invitation email resent.')
      else if (mode === 'manual_link') toast.success('Fresh signup link and code generated.')
      else toast.error(payload.warning || 'Invite refreshed but email failed.')
      
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh invitation')
    } finally {
      setSharingInviteId(null)
    }
  }, [fetchData])

  // Remove staff (soft delete)
  const handleRemoveStaff = useCallback(async (staffId: string) => {
    try {
      setDeletingStaffId(staffId)
      const response = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'Failed to remove staff member')
      toast.success('Staff access removed')
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeletingStaffId(null)
    }
  }, [fetchData])

  // Delete staff record (hard delete)
  const handleDeleteStaffRecord = useCallback(async (staffId: string) => {
    try {
      setDeletingStaffId(staffId)
      const response = await fetch(`/api/staff/${staffId}?hard=true`, { method: 'DELETE' })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'Failed to delete staff record')
      toast.success('Staff record deleted')
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete staff record')
    } finally {
      setDeletingStaffId(null)
    }
  }, [fetchData])

  // Delete invitation
  const deleteInvitation = useCallback(async (invitationId: string) => {
    try {
      setDeletingInviteId(invitationId)
      const response = await fetch('/api/staff/invitations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'Failed to delete invitation')
      toast.success('Invitation deleted')
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete invitation')
    } finally {
      setDeletingInviteId(null)
    }
  }, [fetchData])

  // Link builders
  const buildStaffSignUpLink = useCallback((inviteCode: string) => {
    return `${appOrigin || 'http://localhost:3000'}/auth/sign-up?role=staff&inviteCode=${inviteCode}`
  }, [appOrigin])

  const buildInviteInstructionsText = useCallback((inviteCode: string, inviteLink: string) => {
    return `TailorPal staff onboarding:\n1) Sign up: ${buildStaffSignUpLink(inviteCode)}\n2) Choose role: Staff\n3) Open onboarding or use this link: ${inviteLink}\n4) Enter invite code: ${inviteCode}`
  }, [buildStaffSignUpLink])

  // Share invite
  const shareInvite = useCallback(async () => {
    if (!latestInvite) return
    const text = buildInviteInstructionsText(latestInvite.inviteCode, latestInvite.inviteLink)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TailorPal Staff Invite', text, url: buildStaffSignUpLink(latestInvite.inviteCode) })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success('Invite details copied.')
      }
    } catch {
      // User cancelled or error
    }
  }, [latestInvite, buildStaffSignUpLink, buildInviteInstructionsText])

  return {
    // State
    staff,
    invitations,
    isLoading,
    error,
    
    // Permissions
    permissionsByStaff,
    getPermissionState,
    updatePermissionDraft,
    savePermissions,
    savingPermissionsFor,
    
    // Invite
    handleInviteStaff,
    isInviting,
    refreshInvitation,
    sharingInviteId,
    latestInvite,
    setLatestInvite,
    
    // Delete
    handleRemoveStaff,
    handleDeleteStaffRecord,
    deleteInvitation,
    deletingStaffId,
    deletingInviteId,
    
    // Utils
    appOrigin,
    buildStaffSignUpLink,
    buildInviteInstructionsText,
    shareInvite,
    
    // Refresh
    refreshData: fetchData,
  }
}
