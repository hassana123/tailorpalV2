import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AcceptStaffInvitationRequest } from '@/lib/types'
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const acceptSchema = z
  .object({
    token: z.string().min(12).optional(),
    inviteCode: z.string().trim().min(4).max(32).optional(),
  })
  .refine((value) => Boolean(value.token || value.inviteCode), {
    message: 'Token or invite code is required',
    path: ['token'],
  })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = acceptSchema.safeParse((await request.json()) as AcceptStaffInvitationRequest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const token = parsed.data.token?.trim()
    const inviteCode = parsed.data.inviteCode?.trim().toUpperCase()

    let invitationQuery = supabase
      .from('staff_invitations')
      .select('*')
      .eq('status', 'pending')

    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex')
      invitationQuery = invitationQuery.eq('token_hash', tokenHash)
    } else if (inviteCode) {
      invitationQuery = invitationQuery.eq('invite_code', inviteCode)
    }

    const { data: invitation, error: inviteError } = await invitationQuery.single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation credentials' }, { status: 404 })
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is for a different email account.' },
        { status: 403 },
      )
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < now) {
      await supabase
        .from('staff_invitations')
        .update({ status: 'expired', updated_at: nowIso })
        .eq('id', invitation.id)
      return NextResponse.json({ error: 'Invitation has expired.' }, { status: 410 })
    }

    // Use admin client here: invited users cannot read pending shop_staff rows via RLS.
    const { data: existing, error: existingError } = await admin
      .from('shop_staff')
      .select('id')
      .eq('shop_id', invitation.shop_id)
      .eq('email', invitation.email)
      .in('status', ['pending', 'active', 'revoked'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing staff record:', existingError)
      return NextResponse.json({ error: 'Failed to join shop' }, { status: 500 })
    }

    let staffRecordId: string | null = null

    if (existing) {
      const { error: staffUpdateError } = await admin
        .from('shop_staff')
        .update({
          user_id: user.id,
          status: 'active',
          accepted_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', existing.id)

      if (staffUpdateError) {
        console.error('Error updating existing staff record:', staffUpdateError)
        return NextResponse.json({ error: 'Failed to join shop' }, { status: 500 })
      }
      staffRecordId = existing.id
    } else {
      const { data: createdStaff, error: createStaffError } = await admin
        .from('shop_staff')
        .insert([
          {
            shop_id: invitation.shop_id,
            user_id: user.id,
            email: invitation.email,
            role: 'staff',
            status: 'active',
            accepted_at: nowIso,
          },
        ])
        .select('id')
        .single()

      if (createStaffError) {
        console.error('Error creating staff record:', createStaffError)
        return NextResponse.json({ error: 'Failed to join shop' }, { status: 500 })
      }
      staffRecordId = createdStaff.id
    }

    if (staffRecordId) {
      const { error: permissionInsertError } = await admin.from('shop_staff_permissions').insert([
        {
          staff_id: staffRecordId,
        },
      ])

      if (permissionInsertError && permissionInsertError.code !== '23505') {
        console.error('Error initializing staff permissions:', permissionInsertError)
        return NextResponse.json({ error: 'Failed to finalize staff access' }, { status: 500 })
      }
    }

    const { error: invitationUpdateError } = await admin
      .from('staff_invitations')
      .update({
        status: 'accepted',
        accepted_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', invitation.id)

    if (invitationUpdateError) {
      console.error('Error updating invitation status:', invitationUpdateError)
      return NextResponse.json(
        { error: 'Joined shop but failed to finalize invitation status.' },
        { status: 500 },
      )
    }

    await supabase.from('profiles').update({ user_type: 'staff' }).eq('id', user.id)

    return NextResponse.json({ shopId: invitation.shop_id })
  } catch (error) {
    console.error('Error in invitation accept:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
