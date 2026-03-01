import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ staffId: string }> }
) {
  try {
    const { staffId } = await params
    const supabase = await createClient()

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
      .select('shop_id, email')
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

    // Soft revoke staff member access
    const { error: deleteError } = await supabase
      .from('shop_staff')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', staffId)

    if (deleteError) {
      console.error('Error revoking staff:', deleteError)
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in staff removal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
