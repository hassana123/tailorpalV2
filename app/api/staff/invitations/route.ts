import { createClient } from '@/lib/supabase/server'
import {
  buildInviteLinks,
  buildStaffOnboardingLink,
  buildStaffSignUpLink,
  buildSocialShareLinks,
  createInviteToken,
  createUniqueInviteCode,
  sendInviteViaSupabaseAuth,
  type InviteDeliveryMethod,
} from '@/lib/staff/invitations'
import { getRequestAppUrl } from '@/lib/utils/app-url'
import { InviteStaffRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const inviteSchema = z.object({
  shopId: z.string().uuid(),
  email: z.string().email(),
  deliveryMethod: z.enum(['supabase_email', 'manual_link']).default('supabase_email'),
})

const deleteSchema = z.object({
  invitationId: z.string().uuid(),
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

    const { data: existingStaffRows, error: existingStaffError } = await supabase
      .from('shop_staff')
      .select('id, status')
      .eq('shop_id', payload.shopId)
      .eq('email', inviteEmail)
      .in('status', ['pending', 'active', 'revoked'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingStaffError) {
      console.error('Error checking existing staff:', existingStaffError)
      return NextResponse.json({ error: 'Failed to verify existing staff records' }, { status: 500 })
    }

    const existingStaff = existingStaffRows?.[0] ?? null

    if (existingStaff?.status === 'pending' || existingStaff?.status === 'active') {
      return NextResponse.json(
        { error: 'Staff member already invited or active.' },
        { status: 409 },
      )
    }

    const { token, tokenHash } = createInviteToken()
    const inviteCode = await createUniqueInviteCode(supabase)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const appUrl = getRequestAppUrl(request)
    const { tokenInviteLink, codeInviteLink } = buildInviteLinks(appUrl, token, inviteCode)
    const signUpLink = buildStaffSignUpLink(appUrl, inviteCode)
    const onboardingLink = buildStaffOnboardingLink(appUrl, inviteCode)

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

    let staffRecordId: string | null = null

    if (existingStaff?.status === 'revoked') {
      const { data: updatedStaff, error: staffUpdateError } = await supabase
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
        .select('id')
        .single()

      if (staffUpdateError) {
        console.error('Error updating revoked staff record:', staffUpdateError)
        return NextResponse.json({ error: 'Failed to create pending staff record' }, { status: 500 })
      }
      staffRecordId = updatedStaff.id
    } else {
      const { data: insertedStaff, error: staffInsertError } = await supabase
        .from('shop_staff')
        .insert([
          {
            shop_id: payload.shopId,
            email: inviteEmail,
            role: 'staff',
            status: 'pending',
            invited_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single()

      if (staffInsertError) {
        console.error('Error creating pending staff record:', staffInsertError)
        return NextResponse.json({ error: 'Failed to create pending staff record' }, { status: 500 })
      }
      staffRecordId = insertedStaff.id
    }

    if (staffRecordId) {
      const { error: permissionInsertError } = await supabase.from('shop_staff_permissions').insert([
        {
          staff_id: staffRecordId,
        },
      ])

      if (permissionInsertError && permissionInsertError.code !== '23505') {
        console.error('Error creating staff permissions:', permissionInsertError)
        return NextResponse.json({ error: 'Failed to initialize staff permissions' }, { status: 500 })
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
          redirectTo: signUpLink,
          inviteCode,
          signUpLink,
          onboardingLink,
        })
        emailSent = true
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        warning =
          'Invitation created but email delivery failed. Share the signup link and invite code manually.'
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
        shareLinks: buildSocialShareLinks(signUpLink, codeInviteLink, inviteCode, shop.name),
        warning,
      },
      { status: emailSent || deliveryMethod === 'manual_link' ? 201 : 202 },
    )
  } catch (error) {
    console.error('Error in staff invitations POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = deleteSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { data: invitation, error: inviteError } = await supabase
      .from('staff_invitations')
      .select('id, shop_id, email, status, shops(owner_id)')
      .eq('id', parsed.data.invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const relation = invitation.shops as
      | { owner_id: string }
      | Array<{ owner_id: string }>
      | null
    const shop = Array.isArray(relation) ? relation[0] ?? null : relation
    if (!shop || shop.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteInviteError } = await supabase
      .from('staff_invitations')
      .delete()
      .eq('id', invitation.id)

    if (deleteInviteError) {
      console.error('Error deleting invitation:', deleteInviteError)
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
    }

    const { count: remainingPending } = await supabase
      .from('staff_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', invitation.shop_id)
      .eq('email', invitation.email)
      .eq('status', 'pending')

    if ((remainingPending ?? 0) === 0) {
      const { data: pendingStaffRows } = await supabase
        .from('shop_staff')
        .select('id')
        .eq('shop_id', invitation.shop_id)
        .eq('email', invitation.email)
        .eq('status', 'pending')

      const pendingStaffIds = (pendingStaffRows ?? []).map((row) => row.id)
      if (pendingStaffIds.length > 0) {
        await supabase.from('shop_staff_permissions').delete().in('staff_id', pendingStaffIds)
        await supabase.from('shop_staff').delete().in('id', pendingStaffIds)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in staff invitations DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
