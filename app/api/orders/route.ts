import { hasShopAccess } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { CreateOrderRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  designDescription: z.string().min(1),
  fabricDetails: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  totalPrice: z.number().nonnegative().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = payloadSchema.safeParse((await request.json()) as CreateOrderRequest)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const payload = parsed.data
    const canAccess = await hasShopAccess(user.id, payload.shopId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orderNumber = `ORD-${Date.now()}`
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          shop_id: payload.shopId,
          customer_id: payload.customerId,
          order_number: orderNumber,
          status: 'pending',
          design_description: payload.designDescription,
          fabric_details: payload.fabricDetails ?? null,
          estimated_delivery_date: payload.estimatedDeliveryDate ?? null,
          total_price: payload.totalPrice ?? null,
          notes: payload.notes ?? null,
          created_by: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({ order: data }, { status: 201 })
  } catch (error) {
    console.error('Error in orders POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
