import { hasShopAccess } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { CreateCustomerRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  shopId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
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

    const parsed = payloadSchema.safeParse((await request.json()) as CreateCustomerRequest)
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

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          shop_id: payload.shopId,
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email ?? null,
          phone: payload.phone ?? null,
          address: payload.address ?? null,
          city: payload.city ?? null,
          country: payload.country ?? null,
          notes: payload.notes ?? null,
          created_by: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    return NextResponse.json({ customer: data }, { status: 201 })
  } catch (error) {
    console.error('Error in customers POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
