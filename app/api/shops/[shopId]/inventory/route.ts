import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { CreateInventoryItemRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({
  shopId: z.string().uuid(),
})

const createInventorySchema = z.object({
  name: z.string().trim().min(1),
  sku: z.string().trim().optional(),
  description: z.string().optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  quantityOnHand: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ shopId: string }> },
) {
  const params = paramsSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid shop id' }, { status: 400 })
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

    const { data, error } = await supabase
      .from('shop_inventory_items')
      .select('*')
      .eq('shop_id', params.data.shopId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load inventory items:', error)
      return NextResponse.json({ error: 'Failed to load inventory items' }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ shopId: string }> },
) {
  const params = paramsSchema.safeParse(await context.params)
  if (!params.success) {
    return NextResponse.json({ error: 'Invalid shop id' }, { status: 400 })
  }

  const payload = createInventorySchema.safeParse(
    (await request.json()) as CreateInventoryItemRequest,
  )
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

    const { data, error } = await supabase
      .from('shop_inventory_items')
      .insert([
        {
          shop_id: params.data.shopId,
          name: payload.data.name,
          sku: payload.data.sku || null,
          description: payload.data.description ?? null,
          unit: payload.data.unit ?? 'pcs',
          quantity_on_hand: payload.data.quantityOnHand ?? 0,
          reorder_level: payload.data.reorderLevel ?? 0,
          cost_price: payload.data.costPrice ?? null,
          selling_price: payload.data.sellingPrice ?? null,
          is_active: payload.data.isActive ?? true,
          created_by: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Failed to create inventory item:', error)
      return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
    }

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
