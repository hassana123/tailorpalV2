'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import {
  Plus,
  Users,
  UserCheck,
  Clock,
  UserX,
  Mail,
  Copy,
  Share2,
  Check,
  Shield,
  MessageCircle,
  Twitter,
  Send,
  Instagram,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type DeliveryMethod = 'supabase_email' | 'manual_link'

interface StaffMember {
  id: string
  email: string
  status: 'pending' | 'active' | 'revoked'
  invited_at: string
  accepted_at: string | null
}

interface StaffPermissions {
  staff_id: string
  can_manage_customers: boolean
  can_manage_orders: boolean
  can_manage_measurements: boolean
  can_manage_catalog: boolean
  can_manage_inventory: boolean
}

interface PendingInvitation {
  id: string
  email: string
  invite_code: string | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string | null
  created_at: string
}

interface InviteResponse {
  invitation: { id: string }
  deliveryMethod: DeliveryMethod
  emailSent: boolean
  inviteLink: string
  tokenInviteLink: string
  inviteCode: string
  warning?: string
  shareLinks?: { whatsapp: string; twitter: string; telegram: string }
}

const PERMISSION_KEYS: { key: keyof Omit<StaffPermissions, 'staff_id'>; label: string }[] = [
  { key: 'can_manage_customers',    label: 'Customers'    },
  { key: 'can_manage_orders',       label: 'Orders'       },
  { key: 'can_manage_measurements', label: 'Measurements' },
  { key: 'can_manage_catalog',      label: 'Catalog'      },
  { key: 'can_manage_inventory',    label: 'Inventory'    },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-charcoal transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  )
}

// ─── Permission toggle row ────────────────────────────────────────────────────

function PermissionToggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all',
        checked
          ? 'bg-brand-ink text-white border-brand-ink'
          : 'bg-white text-brand-stone border-brand-border hover:bg-brand-cream'
      )}
    >
      {checked && <Check size={11} strokeWidth={2.5} />}
      {label}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffManagementPage() {
  const params = useParams()
  const shopId = params.shopId as string

  const [staff, setStaff]                       = useState<StaffMember[]>([])
  const [invitations, setInvitations]           = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading]               = useState(true)
  const [isInviting, setIsInviting]             = useState(false)
  const [savingPermissionsFor, setSavingPermissionsFor] = useState<string | null>(null)
  const [sharingInviteId, setSharingInviteId]   = useState<string | null>(null)
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null)
  const [deletingStaffId, setDeletingStaffId]   = useState<string | null>(null)
  const [appOrigin, setAppOrigin]               = useState('')
  const [permissionsByStaff, setPermissionsByStaff] = useState<Record<string, StaffPermissions>>({})

  // Modals
  const [inviteModalOpen, setInviteModalOpen]   = useState(false)
  const [inviteResultOpen, setInviteResultOpen] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff]       = useState<StaffMember | null>(null)
  const [latestInvite, setLatestInvite] = useState<{
    invitationId: string; inviteLink: string; tokenInviteLink: string
    inviteCode: string; shareLinks?: InviteResponse['shareLinks']
  } | null>(null)

  // Form
  const [newEmail, setNewEmail]                 = useState('')
  const [deliveryMethod, setDeliveryMethod]     = useState<DeliveryMethod>('supabase_email')
  const [error, setError]                       = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => { void fetchData() }, [shopId])
  useEffect(() => {
    if (typeof window !== 'undefined') setAppOrigin(window.location.origin)
  }, [])

  const fetchData = async () => {
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
      setError(msg); toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const getPermissionState = (staffId: string): StaffPermissions =>
    permissionsByStaff[staffId] ?? {
      staff_id: staffId,
      can_manage_customers: false, can_manage_orders: false,
      can_manage_measurements: false, can_manage_catalog: false, can_manage_inventory: false,
    }

  const updatePermissionDraft = (staffId: string, key: keyof Omit<StaffPermissions, 'staff_id'>, value: boolean) => {
    setPermissionsByStaff((prev) => ({
      ...prev,
      [staffId]: { ...(prev[staffId] ?? getPermissionState(staffId)), [key]: value },
    }))
  }

  const savePermissions = async (staffId: string) => {
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
      setPermissionsModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions')
    } finally {
      setSavingPermissionsFor(null)
    }
  }

  const handleInviteStaff = async () => {
    setIsInviting(true); setError(null)
    try {
      const response = await fetch('/api/staff/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, email: newEmail, deliveryMethod }),
      })
      const payload = await response.json() as InviteResponse & { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Failed to invite staff member')

      setLatestInvite({
        invitationId: payload.invitation.id,
        inviteLink: payload.inviteLink,
        tokenInviteLink: payload.tokenInviteLink,
        inviteCode: payload.inviteCode,
        shareLinks: payload.shareLinks,
      })
      setNewEmail('')
      setInviteModalOpen(false)
      setInviteResultOpen(true)

      if (payload.emailSent) toast.success('Invitation email sent with signup + code instructions.')
      else if (deliveryMethod === 'manual_link') toast.success('Signup link and invite code generated.')
      else toast.error(payload.warning || 'Invite created but email delivery failed.')

      await fetchData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setError(msg); toast.error(msg)
    } finally {
      setIsInviting(false)
    }
  }

  const refreshInvitation = async (invitationId: string, mode: DeliveryMethod) => {
    try {
      setSharingInviteId(invitationId)
      const response = await fetch('/api/staff/invitations/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, deliveryMethod: mode }),
      })
      const payload = await response.json() as (Omit<InviteResponse, 'invitation'> & { success: boolean }) | { error?: string }
      if (!response.ok || !('success' in payload)) throw new Error((payload as { error?: string }).error || 'Failed to refresh invite')

      setLatestInvite({
        invitationId,
        inviteLink: payload.inviteLink,
        tokenInviteLink: payload.tokenInviteLink,
        inviteCode: payload.inviteCode,
        shareLinks: payload.shareLinks,
      })
      setInviteResultOpen(true)
      if (payload.emailSent) toast.success('Invitation email resent.')
      else if (mode === 'manual_link') toast.success('Fresh signup link and code generated.')
      else toast.error(payload.warning || 'Invite refreshed but email failed.')
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh invitation')
    } finally {
      setSharingInviteId(null)
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Remove this staff member access? You can restore by inviting again.')) return
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
  }

  const handleDeleteStaffRecord = async (staffId: string) => {
    if (!confirm('Delete this staff record permanently? This cannot be undone.')) return
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
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Delete this invitation?')) return
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
  }

  const buildStaffSignUpLink = (inviteCode: string) =>
    `${appOrigin || 'http://localhost:3000'}/auth/sign-up?role=staff&inviteCode=${inviteCode}`

  const buildInviteInstructionsText = (inviteCode: string, inviteLink: string) =>
    `TailorPal staff onboarding:\n1) Sign up: ${buildStaffSignUpLink(inviteCode)}\n2) Choose role: Staff\n3) Open onboarding or use this link: ${inviteLink}\n4) Enter invite code: ${inviteCode}`

  const shareInvite = async () => {
    if (!latestInvite) return
    const text = buildInviteInstructionsText(latestInvite.inviteCode, latestInvite.inviteLink)
    try {
      if (navigator.share) await navigator.share({ title: 'TailorPal Staff Invite', text, url: buildStaffSignUpLink(latestInvite.inviteCode) })
      else { await navigator.clipboard.writeText(text); toast.success('Invite details copied.') }
    } catch { /* user cancelled */ }
  }

  // ─── Staff table columns ─────────────────────────────────────────────────

  const staffColumns = [
    {
      key: 'member',
      header: 'Staff Member',
      cell: (m: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">{m.email[0].toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink truncate">{m.email}</p>
            <p className="text-xs text-brand-stone">
              Invited {new Date(m.invited_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (m: StaffMember) => m.email,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (m: StaffMember) => (
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
          m.status === 'active'  ? 'bg-emerald-100 text-emerald-700' :
          m.status === 'pending' ? 'bg-amber-100 text-amber-700'    :
                                   'bg-red-100 text-red-700'
        )}>
          {m.status === 'active'  ? <UserCheck size={11} /> :
           m.status === 'pending' ? <Clock size={11} />     :
                                    <UserX size={11} />      }
          {m.status}
        </span>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'permissions',
      header: 'Permissions',
      cell: (m: StaffMember) => {
        const perms = getPermissionState(m.id)
        const count = PERMISSION_KEYS.filter(({ key }) => perms[key]).length
        return (
          <span className="text-xs text-brand-stone font-medium">
            {count === 0 ? 'None set' : `${count} of ${PERMISSION_KEYS.length} enabled`}
          </span>
        )
      },
      hiddenOnMobile: true,
    },
  ]

  const staffActions = (m: StaffMember) => [
    {
      label: 'Manage Permissions',
      onClick: () => { setSelectedStaff(m); setPermissionsModalOpen(true) },
      variant: 'default' as const,
    },
    {
      label: deletingStaffId === m.id ? 'Working...' : 'Remove Access',
      onClick: () => handleRemoveStaff(m.id),
      variant: 'destructive' as const,
    },
    ...(m.status === 'revoked'
      ? [
          {
            label: deletingStaffId === m.id ? 'Deleting...' : 'Delete Record',
            onClick: () => handleDeleteStaffRecord(m.id),
            variant: 'destructive' as const,
          },
        ]
      : []),
  ]

  // ─── Invitations table columns ────────────────────────────────────────────

  const invitationColumns = [
    {
      key: 'email',
      header: 'Email',
      cell: (inv: PendingInvitation) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
            <Mail size={16} className="text-brand-gold" />
          </div>
          <div>
            <p className="font-semibold text-brand-ink">{inv.email}</p>
            <p className="text-xs text-brand-stone">{new Date(inv.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (inv: PendingInvitation) => inv.email,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inv: PendingInvitation) => (
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full',
          inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
          inv.status === 'pending'  ? 'bg-amber-100 text-amber-700'     :
          inv.status === 'expired'  ? 'bg-red-100 text-red-700'         :
                                      'bg-gray-100 text-gray-700'
        )}>
          {inv.status}
        </span>
      ),
    },
    {
      key: 'expires',
      header: 'Expires',
      cell: (inv: PendingInvitation) => (
        <span className="text-xs text-brand-stone">
          {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'N/A'}
        </span>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'code',
      header: 'Code',
      cell: (inv: PendingInvitation) => (
        inv.invite_code
          ? <span className="font-mono text-xs font-bold text-brand-charcoal tracking-wider">{inv.invite_code}</span>
          : <span className="text-xs text-brand-stone/50">—</span>
      ),
      hiddenOnMobile: true,
    },
  ]

 const invitationActions = (inv: PendingInvitation) => [
  ...(inv.status === 'pending'
    ? [
        {
          label: sharingInviteId === inv.id ? 'Refreshing...' : 'Refresh Link',
          onClick: () => void refreshInvitation(inv.id, 'manual_link'),
          variant: 'default' as const,
        },
        {
          label: sharingInviteId === inv.id ? 'Sending...' : 'Resend Email',
          onClick: () => void refreshInvitation(inv.id, 'supabase_email'),
          variant: 'outline' as const,
        },
      ]
    : []),
  {
    label: deletingInviteId === inv.id ? 'Deleting...' : 'Delete Invite',
    onClick: () => void deleteInvitation(inv.id),
    variant: 'destructive' as const,
  },
]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  const activeStaff  = staff.filter((s) => s.status === 'active').length
  const pendingStaff = staff.filter((s) => s.status === 'pending').length
  const pendingInvitations = invitations.filter((i) => i.status === 'pending').length

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-gold" />
            Staff Management
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Invite staff members and manage their permissions
          </p>
        </div>
        <Button
          onClick={() => setInviteModalOpen(true)}
          className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
        >
          <Plus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Staff"        value={staff.length}         icon={Users}     color="bg-sky-100 text-sky-600"       />
        <StatCard label="Active"             value={activeStaff}          icon={UserCheck} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Pending"            value={pendingStaff}         icon={Clock}     color="bg-amber-100 text-amber-600"   />
        <StatCard label="Open Invitations"   value={pendingInvitations}   icon={Mail}      color="bg-violet-100 text-violet-600" />
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">Staff Members</h2>
          <p className="text-xs text-brand-stone mt-0.5">{staff.length} total members</p>
        </div>
        <DataTable
          data={staff}
          columns={staffColumns}
          keyExtractor={(m) => m.id}
          searchKeys={['email', 'status']}
          emptyMessage="No staff members yet. Invite someone to get started."
          actions={staffActions}
        />
      </div>

      {/* Invitations table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">Pending Invitations</h2>
          <p className="text-xs text-brand-stone mt-0.5">Refresh, resend, or delete invitations</p>
        </div>
        <DataTable
          data={invitations}
          columns={invitationColumns}
          keyExtractor={(i) => i.id}
          searchKeys={['email', 'status']}
          emptyMessage="No invitations yet."
          actions={invitationActions}
        />
      </div>

      {/* ── Invite Staff Modal ─────────────────────────────────────────── */}
      <ModalForm
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        title="Invite Staff Member"
        description="Share staff onboarding details with signup steps and invite code."
        onSubmit={handleInviteStaff}
        isSubmitting={isInviting}
        submitLabel="Create Invitation"
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input
              type="email"
              placeholder="staff@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Delivery Method</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    value: 'supabase_email' as DeliveryMethod,
                    title: 'Send Instructions Email',
                    desc: 'Sends onboarding steps + signup link + invite code.',
                  },
                  {
                    value: 'manual_link' as DeliveryMethod,
                    title: 'Generate Signup + Code',
                    desc: 'Share manually via WhatsApp, Instagram DM, etc.',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDeliveryMethod(opt.value)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all text-sm',
                    deliveryMethod === opt.value
                      ? 'border-brand-ink bg-brand-ink/4 shadow-sm'
                      : 'border-brand-border hover:border-brand-ink/30 hover:bg-brand-cream'
                  )}
                >
                  <p className="font-semibold text-brand-ink">{opt.title}</p>
                  <p className="text-xs text-brand-stone mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>
      </ModalForm>

      {/* ── Invite Result Modal ────────────────────────────────────────── */}
      {latestInvite && (
        <ModalForm
          open={inviteResultOpen}
          onOpenChange={setInviteResultOpen}
          title="Invitation Created"
          description="Share the signup flow and invite code with your staff member."
          hideFooter
          maxWidth="md"
        >
          <div className="space-y-4">

            {/* Signup link */}
            <div className="bg-brand-cream border border-brand-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Signup Link</p>
                <CopyButton value={buildStaffSignUpLink(latestInvite.inviteCode)} label="Signup Link" />
              </div>
              <p className="text-xs text-brand-charcoal break-all font-mono leading-relaxed">
                {buildStaffSignUpLink(latestInvite.inviteCode)}
              </p>
            </div>

            {/* Invite link */}
            <div className="bg-brand-cream border border-brand-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Invite Link</p>
                <CopyButton value={latestInvite.inviteLink} label="Link" />
              </div>
              <p className="text-xs text-brand-charcoal break-all font-mono leading-relaxed">
                {latestInvite.inviteLink}
              </p>
            </div>

            {/* Invite code */}
            <div className="bg-brand-cream border border-brand-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Invite Code</p>
                <CopyButton value={latestInvite.inviteCode} label="Code" />
              </div>
              <p className="font-mono text-2xl font-bold text-brand-ink tracking-[0.3em]">
                {latestInvite.inviteCode}
              </p>
            </div>

            {/* Share buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={shareInvite}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-charcoal transition-all"
              >
                <Share2 size={13} /> Share
              </button>
              {latestInvite.shareLinks && (
                <>
                  <a href={latestInvite.shareLinks.whatsapp} target="_blank" rel="noreferrer">
                    <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 text-xs font-semibold hover:bg-[#25D366]/15 transition-all">
                      <MessageCircle size={13} /> WhatsApp
                    </button>
                  </a>
                  <a href={latestInvite.shareLinks.twitter} target="_blank" rel="noreferrer">
                    <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition-all">
                      <Twitter size={13} /> Twitter
                    </button>
                  </a>
                  <a href={latestInvite.shareLinks.telegram} target="_blank" rel="noreferrer">
                    <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition-all">
                      <Send size={13} /> Telegram
                    </button>
                  </a>
                </>
              )}
              <button
                onClick={async () => {
                  const text = buildInviteInstructionsText(latestInvite.inviteCode, latestInvite.inviteLink)
                  await navigator.clipboard.writeText(text)
                  toast.success('Copied for Instagram')
                }}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 text-xs font-semibold hover:bg-pink-100 transition-all"
              >
                <Instagram size={13} /> Instagram
              </button>
            </div>

            <p className="text-[11px] text-brand-stone/60 flex items-center gap-1.5">
              <Sparkles size={10} className="text-brand-gold" />
              Staff flow: sign up, choose Staff role, then accept with invite code on onboarding.
            </p>
          </div>
        </ModalForm>
      )}

      {/* ── Permissions Modal ─────────────────────────────────────────── */}
      {selectedStaff && (
        <ModalForm
          open={permissionsModalOpen}
          onOpenChange={setPermissionsModalOpen}
          title={`Permissions — ${selectedStaff.email}`}
          description="Toggle what this staff member can manage in your shop."
          onSubmit={() => void savePermissions(selectedStaff.id)}
          isSubmitting={savingPermissionsFor === selectedStaff.id}
          submitLabel="Save Permissions"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-brand-cream/40 border border-brand-border rounded-xl p-4 flex items-center gap-3">
              <Shield size={16} className="text-brand-gold flex-shrink-0" />
              <p className="text-xs text-brand-stone leading-relaxed">
                Permissions take effect immediately after saving. Staff can only see pages they have access to.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PERMISSION_KEYS.map(({ key, label }) => (
                <PermissionToggle
                  key={key}
                  label={label}
                  checked={getPermissionState(selectedStaff.id)[key]}
                  onChange={(v) => updatePermissionDraft(selectedStaff.id, key, v)}
                />
              ))}
            </div>
          </div>
        </ModalForm>
      )}

    </div>
  )
}
