import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z
  .object({
    canManageCustomers: z.boolean().optional(),
    canManageOrders: z.boolean().optional(),
    canManageMeasurements: z.boolean().optional(),
    canManageCatalog: z.boolean().optional(),
    canManageInventory: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one permission field is required',
  })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ staffId: string }> },
) {
  try {
    const { staffId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = payloadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { data: staffMember, error: staffError } = await supabase
      .from('shop_staff')
      .select('id, shop_id, email')
      .eq('id', staffId)
      .single()

    if (staffError || !staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('owner_id')
      .eq('id', staffMember.shop_id)
      .single()

    if (shopError || !shop || shop.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: relatedStaffRows, error: relatedStaffError } = await supabase
      .from('shop_staff')
      .select('id')
      .eq('shop_id', staffMember.shop_id)
      .eq('email', staffMember.email)
      .in('status', ['active', 'pending'])

    if (relatedStaffError) {
      console.error('Error loading related staff rows for permission sync:', relatedStaffError)
      return NextResponse.json({ error: 'Failed to update staff permissions' }, { status: 500 })
    }

    const targetStaffIds = Array.from(
      new Set([staffId, ...(relatedStaffRows ?? []).map((row) => row.id)]),
    )

    const sharedUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.canManageCustomers !== undefined) {
      sharedUpdates.can_manage_customers = parsed.data.canManageCustomers
    }
    if (parsed.data.canManageOrders !== undefined) {
      sharedUpdates.can_manage_orders = parsed.data.canManageOrders
    }
    if (parsed.data.canManageMeasurements !== undefined) {
      sharedUpdates.can_manage_measurements = parsed.data.canManageMeasurements
    }
    if (parsed.data.canManageCatalog !== undefined) {
      sharedUpdates.can_manage_catalog = parsed.data.canManageCatalog
    }
    if (parsed.data.canManageInventory !== undefined) {
      sharedUpdates.can_manage_inventory = parsed.data.canManageInventory
    }

    const updates = targetStaffIds.map((id) => ({
      staff_id: id,
      ...sharedUpdates,
    }))

    const { data: permissions, error: permissionsError } = await supabase
      .from('shop_staff_permissions')
      .upsert(updates, { onConflict: 'staff_id' })
      .select(
        'staff_id, can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
      )

    if (permissionsError) {
      console.error('Error updating staff permissions:', permissionsError)
      return NextResponse.json({ error: 'Failed to update staff permissions' }, { status: 500 })
    }

    const selectedPermissions =
      (permissions ?? []).find((entry) => entry.staff_id === staffId) ?? (permissions ?? [])[0] ?? null

    if (!selectedPermissions) {
      return NextResponse.json({ error: 'Failed to update staff permissions' }, { status: 500 })
    }

    return NextResponse.json({ permissions: selectedPermissions, updatedStaffIds: targetStaffIds })
  } catch (error) {
    console.error('Error in staff permissions PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
