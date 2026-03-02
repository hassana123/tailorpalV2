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
      .select('id, shop_id')
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

    const updates: Record<string, unknown> = {
      staff_id: staffId,
      updated_at: new Date().toISOString(),
    }

    if (parsed.data.canManageCustomers !== undefined) {
      updates.can_manage_customers = parsed.data.canManageCustomers
    }
    if (parsed.data.canManageOrders !== undefined) {
      updates.can_manage_orders = parsed.data.canManageOrders
    }
    if (parsed.data.canManageMeasurements !== undefined) {
      updates.can_manage_measurements = parsed.data.canManageMeasurements
    }
    if (parsed.data.canManageCatalog !== undefined) {
      updates.can_manage_catalog = parsed.data.canManageCatalog
    }
    if (parsed.data.canManageInventory !== undefined) {
      updates.can_manage_inventory = parsed.data.canManageInventory
    }

    const { data: permissions, error: permissionsError } = await supabase
      .from('shop_staff_permissions')
      .upsert(updates, { onConflict: 'staff_id' })
      .select(
        'staff_id, can_manage_customers, can_manage_orders, can_manage_measurements, can_manage_catalog, can_manage_inventory',
      )
      .single()

    if (permissionsError) {
      console.error('Error updating staff permissions:', permissionsError)
      return NextResponse.json({ error: 'Failed to update staff permissions' }, { status: 500 })
    }

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error in staff permissions PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
