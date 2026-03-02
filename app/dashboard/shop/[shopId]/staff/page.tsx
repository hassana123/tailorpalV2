'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  shareLinks?: {
    whatsapp: string
    twitter: string
    telegram: string
  }
}

export default function StaffManagementPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('supabase_email')
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [savingPermissionsFor, setSavingPermissionsFor] = useState<string | null>(null)
  const [appOrigin, setAppOrigin] = useState('')
  const [sharingInviteId, setSharingInviteId] = useState<string | null>(null)
  const [latestInvite, setLatestInvite] = useState<{
    invitationId: string
    inviteLink: string
    tokenInviteLink: string
    inviteCode: string
    shareLinks?: InviteResponse['shareLinks']
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [permissionsByStaff, setPermissionsByStaff] = useState<Record<string, StaffPermissions>>({})
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    void fetchData()
  }, [shopId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin)
    }
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [staffResult, invitationsResult, permissionsResult] = await Promise.all([
        supabase
          .from('shop_staff')
          .select('*')
          .eq('shop_id', shopId)
          .order('invited_at', { ascending: false }),
        supabase
          .from('staff_invitations')
          .select('id, email, invite_code, status, expires_at, created_at')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('shop_staff_permissions')
          .select(
            'staff_id, can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
          ),
      ])

      if (staffResult.error) throw staffResult.error
      if (invitationsResult.error) throw invitationsResult.error
      if (permissionsResult.error) throw permissionsResult.error

      setStaff((staffResult.data ?? []) as StaffMember[])
      setInvitations((invitationsResult.data ?? []) as PendingInvitation[])
      const permissionMap = ((permissionsResult.data ?? []) as StaffPermissions[]).reduce<
        Record<string, StaffPermissions>
      >((accumulator, row) => {
        accumulator[row.staff_id] = row
        return accumulator
      }, {})
      setPermissionsByStaff(permissionMap)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load staff data'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }

  const shareInvite = async (payload: {
    inviteLink: string
    inviteCode: string
    shareLinks?: InviteResponse['shareLinks']
  }) => {
    const text = `TailorPal staff invite:\n${payload.inviteLink}\nInvite code: ${payload.inviteCode}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TailorPal Staff Invite',
          text,
          url: payload.inviteLink,
        })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success('Invite details copied. Share on WhatsApp/Twitter/Instagram.')
      }
    } catch {
      // User may cancel share sheet; keep silent.
    }

    if (payload.shareLinks) {
      window.open(payload.shareLinks.whatsapp, '_blank', 'noopener,noreferrer')
    }
  }

  const handleInviteStaff = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsInviting(true)
    setError(null)

    try {
      const response = await fetch('/api/staff/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          email: newEmail,
          deliveryMethod,
        }),
      })

      const payload = (await response.json()) as InviteResponse & { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to invite staff member')
      }

      setLatestInvite({
        invitationId: payload.invitation.id,
        inviteLink: payload.inviteLink,
        tokenInviteLink: payload.tokenInviteLink,
        inviteCode: payload.inviteCode,
        shareLinks: payload.shareLinks,
      })
      setNewEmail('')

      if (payload.emailSent) {
        toast.success('Invitation sent with Supabase email.')
      } else if (deliveryMethod === 'manual_link') {
        toast.success('Invite link and code generated for manual sharing.')
      } else {
        toast.error(payload.warning || 'Invite created but email delivery failed.')
      }

      await fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
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
        body: JSON.stringify({
          invitationId,
          deliveryMethod: mode,
        }),
      })

      const payload = (await response.json()) as
        | (Omit<InviteResponse, 'invitation'> & { success: boolean })
        | { error?: string }
      if (!response.ok || !('success' in payload)) {
        throw new Error((payload as { error?: string }).error || 'Failed to refresh invite')
      }

      setLatestInvite({
        invitationId,
        inviteLink: payload.inviteLink,
        tokenInviteLink: payload.tokenInviteLink,
        inviteCode: payload.inviteCode,
        shareLinks: payload.shareLinks,
      })

      if (payload.emailSent) {
        toast.success('Invitation resent with Supabase email.')
      } else if (mode === 'manual_link') {
        toast.success('Fresh invite link and code generated.')
      } else {
        toast.error(payload.warning || 'Invite refreshed but email delivery failed.')
      }

      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh invitation')
    } finally {
      setSharingInviteId(null)
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove staff member')
      }

      toast.success('Staff member removed')
      await fetchData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    }
  }

  const getPermissionState = (staffId: string): StaffPermissions => {
    return (
      permissionsByStaff[staffId] ?? {
        staff_id: staffId,
        can_manage_customers: false,
        can_manage_orders: false,
        can_manage_measurements: false,
        can_manage_catalog: false,
        can_manage_inventory: false,
      }
    )
  }

  const updatePermissionDraft = (
    staffId: string,
    key: keyof Omit<StaffPermissions, 'staff_id'>,
    value: boolean,
  ) => {
    setPermissionsByStaff((previous) => {
      const current = previous[staffId] ?? getPermissionState(staffId)
      return {
        ...previous,
        [staffId]: {
          ...current,
          [key]: value,
        },
      }
    })
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

      const payload = (await response.json()) as {
        error?: string
        permissions?: StaffPermissions
      }
      if (!response.ok || !payload.permissions) {
        throw new Error(payload.error || 'Failed to save permissions')
      }

      setPermissionsByStaff((previous) => ({
        ...previous,
        [staffId]: payload.permissions as StaffPermissions,
      }))
      toast.success('Staff permissions updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save permissions')
    } finally {
      setSavingPermissionsFor(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="mt-2 text-muted-foreground">
              Invite staff and share invitation links or codes the way you prefer.
            </p>
          </div>
          <Link href={`/dashboard/shop/${shopId}`}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Staff Member</CardTitle>
            <CardDescription>
              Choose how to deliver the invite: Supabase email or manual share link/code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteStaff} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@example.com"
                  required
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Delivery Method</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('supabase_email')}
                    className={`rounded-lg border px-4 py-3 text-left text-sm ${
                      deliveryMethod === 'supabase_email'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <p className="font-semibold">Send with Supabase Email</p>
                    <p className="text-muted-foreground">
                      TailorPal sends invitation to the staff email automatically.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('manual_link')}
                    className={`rounded-lg border px-4 py-3 text-left text-sm ${
                      deliveryMethod === 'manual_link'
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <p className="font-semibold">Generate Link and Code Only</p>
                    <p className="text-muted-foreground">
                      Copy and send via WhatsApp, Twitter, Instagram DM, or any channel.
                    </p>
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" disabled={isInviting} className="w-full">
                {isInviting ? 'Creating invitation...' : 'Create Invitation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {latestInvite && (
          <Card className="mb-8 border-primary/30">
            <CardHeader>
              <CardTitle>Latest Invite Details</CardTitle>
              <CardDescription>Share this immediately with your staff member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Invite Link</p>
                <p className="text-sm break-all">{latestInvite.inviteLink}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => copyText('Invite link', latestInvite.inviteLink)}
                >
                  Copy Link
                </Button>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Invite Code</p>
                <p className="text-lg font-semibold tracking-wider">{latestInvite.inviteCode}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => copyText('Invite code', latestInvite.inviteCode)}
                >
                  Copy Code
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    void shareInvite({
                      inviteLink: latestInvite.inviteLink,
                      inviteCode: latestInvite.inviteCode,
                      shareLinks: latestInvite.shareLinks,
                    })
                  }
                >
                  Share
                </Button>
                {latestInvite.shareLinks && (
                  <>
                    <a href={latestInvite.shareLinks.whatsapp} target="_blank" rel="noreferrer">
                      <Button variant="outline">WhatsApp</Button>
                    </a>
                    <a href={latestInvite.shareLinks.twitter} target="_blank" rel="noreferrer">
                      <Button variant="outline">Twitter</Button>
                    </a>
                    <a href={latestInvite.shareLinks.telegram} target="_blank" rel="noreferrer">
                      <Button variant="outline">Telegram</Button>
                    </a>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    copyText(
                      'Instagram-ready invite text',
                      `Join TailorPal staff.\nLink: ${latestInvite.inviteLink}\nCode: ${latestInvite.inviteCode}`,
                    )
                  }
                >
                  Copy for Instagram
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Refresh a link/code anytime or resend through Supabase email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading invitations...</p>
            ) : invitations.length === 0 ? (
              <p className="text-muted-foreground">No invitations yet.</p>
            ) : (
              <div className="space-y-3">
                {invitations.map((invite) => {
                  const inviteLink = invite.invite_code && appOrigin
                    ? `${appOrigin}/dashboard/staff/onboarding?code=${invite.invite_code}`
                    : ''
                  return (
                    <div key={invite.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {invite.status} • Expires:{' '}
                            {invite.expires_at
                              ? new Date(invite.expires_at).toLocaleString()
                              : 'N/A'}
                          </p>
                          {invite.invite_code ? (
                            <p className="text-xs mt-1">
                              Code: <span className="font-semibold tracking-wider">{invite.invite_code}</span>
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sharingInviteId === invite.id}
                            onClick={() => void refreshInvitation(invite.id, 'manual_link')}
                          >
                            Refresh Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sharingInviteId === invite.id}
                            onClick={() => void refreshInvitation(invite.id, 'supabase_email')}
                          >
                            Send Email
                          </Button>
                          {invite.invite_code ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void copyText('Invite code', invite.invite_code!)}
                            >
                              Copy Code
                            </Button>
                          ) : null}
                          {inviteLink ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void copyText('Invite link', inviteLink)}
                            >
                              Copy Link
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Members</CardTitle>
            <CardDescription>Total: {staff.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading staff...</p>
            ) : staff.length === 0 ? (
              <p className="text-muted-foreground">
                No staff members yet. Invite one to get started.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-medium">Email</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Invited</th>
                      <th className="p-3 text-left font-medium">Permissions</th>
                      <th className="p-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => (
                      <tr key={member.id} className="border-b align-top last:border-b-0">
                        <td className="p-3">{member.email}</td>
                        <td className="p-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                              member.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : member.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {new Date(member.invited_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              ['can_manage_customers', 'Customers'],
                              ['can_manage_orders', 'Orders'],
                              ['can_manage_measurements', 'Measurements'],
                              ['can_manage_catalog', 'Catalog'],
                              ['can_manage_inventory', 'Inventory'],
                            ].map(([key, label]) => (
                              <label key={key} className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  checked={
                                    getPermissionState(member.id)[
                                      key as keyof Omit<StaffPermissions, 'staff_id'>
                                    ]
                                  }
                                  onChange={(event) =>
                                    updatePermissionDraft(
                                      member.id,
                                      key as keyof Omit<StaffPermissions, 'staff_id'>,
                                      event.target.checked,
                                    )
                                  }
                                  className="h-3.5 w-3.5"
                                />
                                <span>{label}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingPermissionsFor === member.id}
                              onClick={() => void savePermissions(member.id)}
                            >
                              {savingPermissionsFor === member.id ? 'Saving...' : 'Save Perms'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveStaff(member.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
