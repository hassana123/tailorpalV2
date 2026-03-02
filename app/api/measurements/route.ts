import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { CreateMeasurementRequest } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  standardMeasurements: z.record(z.number()).optional(),
  customMeasurements: z.record(z.number()).optional(),
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

    // Check if there's an existing measurement for this customer
    const { data: existingMeasurement } = await supabase
      .from('measurements')
      .select('id')
      .eq('customer_id', payload.customerId)
      .eq('shop_id', payload.shopId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let data, error

    if (existingMeasurement) {
      // Update existing measurement - merge new values with existing ones
      const { data: currentData } = await supabase
        .from('measurements')
        .select('standard_measurements, custom_measurements')
        .eq('id', existingMeasurement.id)
        .single()

      const currentStandard = (currentData?.standard_measurements || {}) as Record<string, number>
      const currentCustom = (currentData?.custom_measurements || {}) as Record<string, number>

      // Merge new measurements with existing ones
      const mergedStandard = {
        ...currentStandard,
        ...(payload.standardMeasurements || {}),
      }
      const mergedCustom = {
        ...currentCustom,
        ...(payload.customMeasurements || {}),
      }

      const { data: updateData, error: updateError } = await supabase
        .from('measurements')
        .update({
          standard_measurements: mergedStandard,
          custom_measurements: mergedCustom,
          notes: payload.notes ?? null,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingMeasurement.id)
        .select('*')
        .single()

      data = updateData
      error = updateError
    } else {
      // Create new measurement
      const { data: insertData, error: insertError } = await supabase
        .from('measurements')
        .insert([
          {
            shop_id: payload.shopId,
            customer_id: payload.customerId,
            standard_measurements: payload.standardMeasurements || {},
            custom_measurements: payload.customMeasurements || {},
            notes: payload.notes ?? null,
            status: 'completed',
            created_by: user.id,
          },
        ])
        .select('*')
        .single()

      data = insertData
      error = insertError
    }

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
