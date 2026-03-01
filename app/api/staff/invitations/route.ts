import { createClient } from '@/lib/supabase/server'
import {
  buildInviteLinks,
  buildSocialShareLinks,
  createInviteToken,
  createUniqueInviteCode,
  sendInviteViaSupabaseAuth,
  type InviteDeliveryMethod,
} from '@/lib/staff/invitations'
import { InviteStaffRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inviteSchema = z.object({
  shopId: z.string().uuid(),
  email: z.string().email(),
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

    const parsed = inviteSchema.safeParse((await request.json()) as InviteStaffRequest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const payload = parsed.data
    const inviteEmail = payload.email.toLowerCase()
    const deliveryMethod = payload.deliveryMethod as InviteDeliveryMethod

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id, name')
      .eq('id', payload.shopId)
      .eq('owner_id', user.id)
      .single()

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const { data: existingStaff } = await supabase
      .from('shop_staff')
      .select('id, status')
      .eq('shop_id', payload.shopId)
      .eq('email', inviteEmail)
      .maybeSingle()

    if (existingStaff?.status === 'pending' || existingStaff?.status === 'active') {
      return NextResponse.json(
        { error: 'Staff member already invited or active.' },
        { status: 409 },
      )
    }

    const { token, tokenHash } = createInviteToken()
    const inviteCode = await createUniqueInviteCode(supabase)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const { tokenInviteLink, codeInviteLink } = buildInviteLinks(appUrl, token, inviteCode)

    const { data: invitation, error: inviteError } = await supabase
      .from('staff_invitations')
      .insert([
        {
          shop_id: payload.shopId,
          email: inviteEmail,
          status: 'pending',
          token_hash: tokenHash,
          invite_code: inviteCode,
          expires_at: expiresAt,
          invited_by: user.id,
          sent_at: new Date().toISOString(),
        },
      ])
      .select('id, shop_id, email, invite_code, status, expires_at, created_at')
      .single()

    if (inviteError || !invitation) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    if (existingStaff?.status === 'revoked') {
      const { error: staffUpdateError } = await supabase
        .from('shop_staff')
        .update({
          user_id: null,
          role: 'staff',
          status: 'pending',
          invited_at: new Date().toISOString(),
          accepted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStaff.id)

      if (staffUpdateError) {
        console.error('Error updating revoked staff record:', staffUpdateError)
        return NextResponse.json({ error: 'Failed to create pending staff record' }, { status: 500 })
      }
    } else {
      const { error: staffInsertError } = await supabase.from('shop_staff').insert([
        {
          shop_id: payload.shopId,
          email: inviteEmail,
          role: 'staff',
          status: 'pending',
          invited_at: new Date().toISOString(),
        },
      ])

      if (staffInsertError) {
        console.error('Error creating pending staff record:', staffInsertError)
        return NextResponse.json({ error: 'Failed to create pending staff record' }, { status: 500 })
      }
    }

    let emailSent = false
    let warning: string | undefined

    if (deliveryMethod === 'supabase_email') {
      try {
        await sendInviteViaSupabaseAuth({
          to: inviteEmail,
          shopName: shop.name,
          inviterEmail: user.email ?? 'A shop owner',
          redirectTo: tokenInviteLink,
          inviteCode,
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        warning =
          'Invitation created but Supabase email delivery failed. Share the link or code manually.'
      }
    }

    return NextResponse.json(
      {
        invitation,
        deliveryMethod,
        emailSent,
        inviteLink: codeInviteLink,
        tokenInviteLink,
        inviteCode,
        shareLinks: buildSocialShareLinks(codeInviteLink, inviteCode, shop.name),
        warning,
      },
      { status: emailSent || deliveryMethod === 'manual_link' ? 201 : 202 },
    )
  } catch (error) {
    console.error('Error in staff invitations POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
