import { createClient } from '@/lib/supabase/server'
import {
  buildInviteLinks,
  buildSocialShareLinks,
  createInviteToken,
  createUniqueInviteCode,
  sendInviteViaSupabaseAuth,
  type InviteDeliveryMethod,
} from '@/lib/staff/invitations'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  invitationId: z.string().uuid(),
  deliveryMethod: z.enum(['supabase_email', 'manual_link']).default('supabase_email'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const deliveryMethod = parsed.data.deliveryMethod as InviteDeliveryMethod

    const { data: invitation, error: inviteError } = await supabase
      .from('staff_invitations')
      .select('id, shop_id, email, status, shops(name, owner_id)')
      .eq('id', parsed.data.invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const relation = invitation.shops as
      | { name: string; owner_id: string }
      | Array<{ name: string; owner_id: string }>
      | null
    const shop = Array.isArray(relation) ? relation[0] ?? null : relation
    if (!shop || shop.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invitations can be resent' }, { status: 409 })
    }

    const { token, tokenHash } = createInviteToken()
    const inviteCode = await createUniqueInviteCode(supabase)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const { tokenInviteLink, codeInviteLink } = buildInviteLinks(appUrl, token, inviteCode)

    const { error: updateError } = await supabase
      .from('staff_invitations')
      .update({
        token_hash: tokenHash,
        invite_code: inviteCode,
        expires_at: expiresAt,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to refresh invitation token' }, { status: 500 })
    }

    let emailSent = false
    let warning: string | undefined
    if (deliveryMethod === 'supabase_email') {
      try {
        await sendInviteViaSupabaseAuth({
          to: invitation.email,
          shopName: shop.name,
          inviterEmail: user.email ?? 'A shop owner',
          redirectTo: tokenInviteLink,
          inviteCode,
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to resend invitation email:', emailError)
        warning =
          'Invite refreshed but Supabase email delivery failed. Share the link or code manually.'
      }
    }

    return NextResponse.json({
      success: true,
      deliveryMethod,
      emailSent,
      inviteLink: codeInviteLink,
      tokenInviteLink,
      inviteCode,
      shareLinks: buildSocialShareLinks(codeInviteLink, inviteCode, shop.name),
      warning,
    })
  } catch (error) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
