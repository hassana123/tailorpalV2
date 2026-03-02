import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { CreateMeasurementRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hip: z.number().positive().optional(),
  shoulderWidth: z.number().positive().optional(),
  sleeveLength: z.number().positive().optional(),
  inseam: z.number().positive().optional(),
  neck: z.number().positive().optional(),
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

    const parsed = payloadSchema.safeParse((await request.json()) as CreateMeasurementRequest)
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

    const canManageMeasurements = await hasStaffPermission(
      user.id,
      payload.shopId,
      'manage_measurements',
    )
    if (!canManageMeasurements) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('measurements')
      .insert([
        {
          shop_id: payload.shopId,
          customer_id: payload.customerId,
          chest: payload.chest ?? null,
          waist: payload.waist ?? null,
          hip: payload.hip ?? null,
          shoulder_width: payload.shoulderWidth ?? null,
          sleeve_length: payload.sleeveLength ?? null,
          inseam: payload.inseam ?? null,
          neck: payload.neck ?? null,
          notes: payload.notes ?? null,
          status: 'completed',
          created_by: user.id,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating measurement:', error)
      return NextResponse.json({ error: 'Failed to create measurement' }, { status: 500 })
    }

    return NextResponse.json({ measurement: data }, { status: 201 })
  } catch (error) {
    console.error('Error in measurements POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
