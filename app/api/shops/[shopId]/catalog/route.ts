import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({
  shopId: z.string().uuid(),
})

const createItemSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().optional(),
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

    const canManageCatalog = await hasStaffPermission(user.id, params.data.shopId, 'manage_catalog')
    if (!canManageCatalog) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('shop_catalog_items')
      .select('*')
      .eq('shop_id', params.data.shopId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load catalog items:', error)
      return NextResponse.json({ error: 'Failed to load catalog items' }, { status: 500 })
    }

    return NextResponse.json({ items: data ?? [] })
  } catch (error) {
    console.error('Catalog GET error:', error)
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

  const payload = createItemSchema.safeParse(await request.json())
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

    const { data, error } = await supabase
      .from('shop_catalog_items')
      .insert([
        {
          shop_id: params.data.shopId,
          name: payload.data.name,
          description: payload.data.description ?? null,
          price: payload.data.price,
          image_url: payload.data.imageUrl ?? null,
          is_active: payload.data.isActive ?? true,
          created_by: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Failed to create catalog item:', error)
      return NextResponse.json({ error: 'Failed to create catalog item' }, { status: 500 })
    }

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error) {
    console.error('Catalog POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
