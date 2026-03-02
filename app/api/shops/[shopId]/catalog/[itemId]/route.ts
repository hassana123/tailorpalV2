import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({
  shopId: z.string().uuid(),
  itemId: z.string().uuid(),
})

const updateItemSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    price: z.number().nonnegative().optional(),
    imageUrl: z.string().url().optional(),
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

  const payload = updateItemSchema.safeParse(await request.json())
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

    const canManageCatalog = await hasStaffPermission(user.id, params.data.shopId, 'manage_catalog')
    if (!canManageCatalog) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (payload.data.name !== undefined) {
      updates.name = payload.data.name
    }
    if (payload.data.description !== undefined) {
      updates.description = payload.data.description || null
    }
    if (payload.data.price !== undefined) {
      updates.price = payload.data.price
    }
    if (payload.data.imageUrl !== undefined) {
      updates.image_url = payload.data.imageUrl || null
    }
    if (payload.data.isActive !== undefined) {
      updates.is_active = payload.data.isActive
    }

    const { data, error } = await supabase
      .from('shop_catalog_items')
      .update(updates)
      .eq('shop_id', params.data.shopId)
      .eq('id', params.data.itemId)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to update catalog item:', error)
      return NextResponse.json({ error: 'Failed to update catalog item' }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Catalog PATCH error:', error)
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

    const canManageCatalog = await hasStaffPermission(user.id, params.data.shopId, 'manage_catalog')
    if (!canManageCatalog) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('shop_catalog_items')
      .delete()
      .eq('shop_id', params.data.shopId)
      .eq('id', params.data.itemId)

    if (error) {
      console.error('Failed to delete catalog item:', error)
      return NextResponse.json({ error: 'Failed to delete catalog item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Catalog DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
