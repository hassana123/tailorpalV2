'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle } from 'lucide-react'

type PendingInvite = {
  id: string
  shop_id: string
  email: string
  invite_code: string | null
  expires_at: string | null
  shops: { id: string; name: string; description: string | null } | null
}

export default function StaffOnboardingPage() {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [token, setToken] = useState<string | null>(null)
  const [urlCode, setUrlCode] = useState<string | null>(null)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [hasActiveShop, setHasActiveShop] = useState(false)
  const [invitations, setInvitations] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search)
      const tokenParam = search.get('token')
      const codeParam = search.get('code')
      setToken(tokenParam)
      setUrlCode(codeParam ? codeParam.toUpperCase() : null)
      if (codeParam) {
        setInviteCodeInput(codeParam.toUpperCase())
      }
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    void initialize()
  }, [isReady, token, urlCode])

  const acceptInvitation = async (payload: { token?: string; inviteCode?: string }) => {
    setAccepting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/staff/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responsePayload = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(responsePayload.error || 'Failed to accept invitation')
      }

      setSuccess('Invitation accepted successfully.')
      setTimeout(() => router.push('/dashboard/staff'), 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const initialize = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: activeStaffRows } = await supabase
        .from('shop_staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
      setHasActiveShop(Boolean(activeStaffRows && activeStaffRows.length > 0))

      if (token) {
        await acceptInvitation({ token })
        return
      }

      if (urlCode) {
        await acceptInvitation({ inviteCode: urlCode })
        return
      }

      const { data, error: fetchError } = await supabase
        .from('staff_invitations')
        .select(
          `
          id,
          shop_id,
          email,
          invite_code,
          expires_at,
          shops(id, name, description)
        `,
        )
        .eq('email', user.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const normalizedInvites = (data ?? []).map((invite) => {
        const relation = invite.shops as PendingInvite['shops'] | PendingInvite['shops'][]
        const shop = Array.isArray(relation) ? relation[0] ?? null : relation
        return {
          id: invite.id,
          shop_id: invite.shop_id,
          email: invite.email,
          invite_code: invite.invite_code,
          expires_at: invite.expires_at,
          shops: shop,
        } satisfies PendingInvite
      })

      setInvitations(normalizedInvites)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitations')
    } finally {
      setLoading(false)
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Staff Onboarding</h1>
        <p className="text-muted-foreground mt-2">
          Join a shop with invite link or invite code shared by the shop owner.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {accepting && (
        <Card className="mb-6">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Accepting invitation...</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Have an invite code?</CardTitle>
          <CardDescription>
            Paste your invite code and accept it instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="Enter invite code"
            value={inviteCodeInput}
            onChange={(event) => setInviteCodeInput(event.target.value.toUpperCase())}
          />
          <Button
            onClick={() =>
              void acceptInvitation({ inviteCode: inviteCodeInput.trim().toUpperCase() })
            }
            disabled={!inviteCodeInput.trim() || accepting}
          >
            Accept with Code
          </Button>
        </CardContent>
      </Card>

      {hasActiveShop && !token && !urlCode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>You already joined at least one shop</CardTitle>
            <CardDescription>
              Go to your staff dashboard to continue working.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/staff')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      )}

      {!token && !urlCode && invitations.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No pending invitations</CardTitle>
            <CardDescription>
              Ask a shop owner for an invite link/code or check that you signed in with the invited email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/staff')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      )}

      {!token && !urlCode && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Accept from your pending list if it matches your account email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invite) => (
                <div key={invite.id} className="rounded-md border p-4">
                  <p className="font-medium">{invite.shops?.name ?? 'Unknown Shop'}</p>
                  <p className="text-sm text-muted-foreground">{invite.shops?.description}</p>
                  {invite.invite_code && (
                    <p className="text-xs mt-2">
                      Invite code: <span className="font-semibold tracking-wider">{invite.invite_code}</span>
                    </p>
                  )}
                  {invite.expires_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(invite.expires_at).toLocaleString()}
                    </p>
                  )}
                  <Button
                    className="mt-3"
                    onClick={() =>
                      void acceptInvitation({
                        inviteCode: invite.invite_code ?? undefined,
                      })
                    }
                    disabled={!invite.invite_code || accepting}
                  >
                    Accept Invitation
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
