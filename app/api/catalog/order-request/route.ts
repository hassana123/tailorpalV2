import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CatalogOrderRequestPayload } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z
  .object({
    shopId: z.string().uuid(),
    catalogItemId: z.string().uuid(),
    requesterName: z.string().trim().min(1),
    requesterEmail: z.string().email().optional(),
    requesterPhone: z.string().trim().optional(),
    notes: z.string().optional(),
  })
  .refine((value) => Boolean(value.requesterEmail || value.requesterPhone), {
    message: 'Email or phone is required',
    path: ['requesterEmail'],
  })

export async function POST(request: NextRequest) {
  const parsed = payloadSchema.safeParse(
    (await request.json()) as CatalogOrderRequestPayload,
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const admin = createAdminClient()

    const { data: item, error: itemError } = await admin
      .from('shop_catalog_items')
      .select('id, shop_id, is_active')
      .eq('id', parsed.data.catalogItemId)
      .eq('shop_id', parsed.data.shopId)
      .maybeSingle()

    if (itemError) {
      console.error('Failed to validate catalog item:', itemError)
      return NextResponse.json({ error: 'Failed to validate catalog item' }, { status: 500 })
    }

    if (!item || !item.is_active) {
      return NextResponse.json({ error: 'Catalog item unavailable' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('catalog_order_requests')
      .insert([
        {
          shop_id: parsed.data.shopId,
          catalog_item_id: parsed.data.catalogItemId,
          requester_name: parsed.data.requesterName,
          requester_email: parsed.data.requesterEmail ?? null,
          requester_phone: parsed.data.requesterPhone ?? null,
          notes: parsed.data.notes ?? null,
          status: 'pending',
          customer_user_id: user?.id ?? null,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Failed to create catalog order request:', error)
      return NextResponse.json({ error: 'Failed to create order request' }, { status: 500 })
    }

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    console.error('Catalog order request POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
