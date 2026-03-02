import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({
  shopId: z.string().uuid(),
  itemId: z.string().uuid(),
})

const updateInventorySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    sku: z.string().trim().optional(),
    description: z.string().optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    quantityOnHand: z.number().nonnegative().optional(),
    reorderLevel: z.number().nonnegative().optional(),
    costPrice: z.number().nonnegative().optional(),
    sellingPrice: z.number().nonnegative().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  })

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ shopId: string; itemId: string }> },
) {
  const params = paramsSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid route params' }, { status: 400 })
  }

  const payload = updateInventorySchema.safeParse(await request.json())
  if (!payload.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: payload.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canAccess = await hasShopAccess(user.id, params.data.shopId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canManageInventory = await hasStaffPermission(
      user.id,
      params.data.shopId,
      'manage_inventory',
    )
    if (!canManageInventory) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (payload.data.name !== undefined) {
      updates.name = payload.data.name
    }
    if (payload.data.sku !== undefined) {
      updates.sku = payload.data.sku || null
    }
    if (payload.data.description !== undefined) {
      updates.description = payload.data.description || null
    }
    if (payload.data.unit !== undefined) {
      updates.unit = payload.data.unit
    }
    if (payload.data.quantityOnHand !== undefined) {
      updates.quantity_on_hand = payload.data.quantityOnHand
    }
    if (payload.data.reorderLevel !== undefined) {
      updates.reorder_level = payload.data.reorderLevel
    }
    if (payload.data.costPrice !== undefined) {
      updates.cost_price = payload.data.costPrice
    }
    if (payload.data.sellingPrice !== undefined) {
      updates.selling_price = payload.data.sellingPrice
    }
    if (payload.data.isActive !== undefined) {
      updates.is_active = payload.data.isActive
    }

    const { data, error } = await supabase
      .from('shop_inventory_items')
      .update(updates)
      .eq('shop_id', params.data.shopId)
      .eq('id', params.data.itemId)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to update inventory item:', error)
      return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Inventory PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ shopId: string; itemId: string }> },
) {
  const params = paramsSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid route params' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canAccess = await hasShopAccess(user.id, params.data.shopId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canManageInventory = await hasStaffPermission(
      user.id,
      params.data.shopId,
      'manage_inventory',
    )
    if (!canManageInventory) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('shop_inventory_items')
      .delete()
      .eq('shop_id', params.data.shopId)
      .eq('id', params.data.itemId)

    if (error) {
      console.error('Failed to delete inventory item:', error)
      return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Inventory DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
