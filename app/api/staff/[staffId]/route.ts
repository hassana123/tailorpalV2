import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params
    const supabase = await createClient()
    const requestUrl = new URL(request.url)
    const hardDelete = requestUrl.searchParams.get('hard') === 'true'

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get staff member and verify ownership
    const { data: staffMember, error: staffError } = await supabase
      .from('shop_staff')
      .select('id, shop_id, email, status')
      .eq('id', staffId)
      .single()

    if (staffError || !staffMember) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Verify shop ownership
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('owner_id')
      .eq('id', staffMember.shop_id)
      .single()

    if (shopError || !shop || shop.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (hardDelete) {
      const { error: permissionDeleteError } = await supabase
        .from('shop_staff_permissions')
        .delete()
        .eq('staff_id', staffId)

      if (permissionDeleteError) {
        console.error('Error deleting staff permissions:', permissionDeleteError)
        return NextResponse.json(
          { error: 'Failed to delete staff permissions' },
          { status: 500 }
        )
      }

      const { error: hardDeleteError } = await supabase
        .from('shop_staff')
        .delete()
        .eq('id', staffId)

      if (hardDeleteError) {
        console.error('Error hard deleting staff:', hardDeleteError)
        return NextResponse.json(
          { error: 'Failed to permanently delete staff member' },
          { status: 500 }
        )
      }

      await supabase
        .from('staff_invitations')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('shop_id', staffMember.shop_id)
        .eq('email', staffMember.email)
        .eq('status', 'pending')

      return NextResponse.json({ success: true, deleted: true })
    }

    // Soft revoke staff member access
    const { error: revokeError } = await supabase
      .from('shop_staff')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId)

    if (revokeError) {
      console.error('Error revoking staff:', revokeError)
      return NextResponse.json(
        { error: 'Failed to remove staff member' },
        { status: 500 }
      )
    }

    await supabase
      .from('staff_invitations')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
      })
      .eq('shop_id', staffMember.shop_id)
      .eq('email', staffMember.email)
      .eq('status', 'pending')

    return NextResponse.json({ success: true, deleted: false })
  } catch (error) {
    console.error('Error in staff removal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
