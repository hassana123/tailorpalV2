import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { CreateMeasurementRequest } from '@/lib/types'
import { extractMeasurementMaps, sanitizeMeasurementMap } from '@/lib/utils/measurement-records'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const measurementMapSchema = z.record(z.string().min(1), z.number().positive())

const payloadSchema = z.object({
  shopId: z.string().uuid(),
  customerId: z.string().uuid(),
  standardMeasurements: measurementMapSchema.optional(),
  customMeasurements: measurementMapSchema.optional(),
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

    const standardMeasurements = sanitizeMeasurementMap(payload.standardMeasurements)
    const customMeasurements = sanitizeMeasurementMap(payload.customMeasurements)

    if (Object.keys(standardMeasurements).length === 0 && Object.keys(customMeasurements).length === 0) {
      return NextResponse.json({ error: 'Please provide at least one measurement value' }, { status: 400 })
    }

    const { data: existingRows, error: existingError } = await supabase
      .from('measurements')
      .select('*')
      .eq('shop_id', payload.shopId)
      .eq('customer_id', payload.customerId)
      .order('updated_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingError) {
      console.error('Error loading existing measurement:', existingError)
      return NextResponse.json({ error: 'Failed to create measurement' }, { status: 500 })
    }

    const existing = existingRows?.[0]
    const existingMaps = existing ? extractMeasurementMaps(existing) : { standard: {}, custom: {}, all: {} }
    const mergedStandard = { ...existingMaps.standard, ...standardMeasurements }
    const mergedCustom = { ...existingMaps.custom, ...customMeasurements }
    const notes = payload.notes?.trim() || existing?.notes || null

    const basePayload = {
      standard_measurements: mergedStandard,
      custom_measurements: mergedCustom,
      notes,
      status: 'completed' as const,
      updated_at: new Date().toISOString(),
    }

    const query = existing
      ? supabase
          .from('measurements')
          .update(basePayload)
          .eq('id', existing.id)
          .select('*')
          .single()
      : supabase
          .from('measurements')
          .insert([
            {
              shop_id: payload.shopId,
              customer_id: payload.customerId,
              ...basePayload,
              created_by: user.id,
            },
          ])
          .select('*')
          .single()

    const { data, error } = await query

    if (error) {
      console.error('Error creating measurement:', error)
      return NextResponse.json({ error: 'Failed to create measurement' }, { status: 500 })
    }

    return NextResponse.json({ measurement: data }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Error in measurements POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
