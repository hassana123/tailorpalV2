import { createClient } from '@/lib/supabase/server'
import { extractMeasurementMaps, sanitizeMeasurementMap } from '@/lib/utils/measurement-records'

export interface Measurement {
  id: string
  customer_id: string
  shop_id: string
  standard_measurements: Record<string, number>
  custom_measurements: Record<string, number>
  notes: string | null
  status: 'pending' | 'completed'
  created_by?: string
  created_at: string
  updated_at: string
}

export async function getCustomerMeasurements(customerId: string): Promise<Measurement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching measurements:', error)
    return []
  }

  return (data ?? []) as Measurement[]
}

export async function getLatestMeasurement(customerId: string): Promise<Measurement | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest measurement:', error)
  }

  return (data as Measurement | null) ?? null
}

export async function addMeasurement(
  customerId: string,
  shopId: string,
  measurementData: Partial<Measurement>,
): Promise<Measurement | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const incomingStandard = sanitizeMeasurementMap(measurementData.standard_measurements)
  const incomingCustom = sanitizeMeasurementMap(measurementData.custom_measurements)

  if (Object.keys(incomingStandard).length === 0 && Object.keys(incomingCustom).length === 0) {
    return null
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('measurements')
    .select('*')
    .eq('shop_id', shopId)
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) {
    console.error('Error loading measurement:', existingError)
    return null
  }

  const existing = existingRows?.[0]
  const existingMaps = existing ? extractMeasurementMaps(existing) : { standard: {}, custom: {}, all: {} }
  const basePayload = {
    standard_measurements: {
      ...existingMaps.standard,
      ...incomingStandard,
    },
    custom_measurements: {
      ...existingMaps.custom,
      ...incomingCustom,
    },
    notes: measurementData.notes ?? existing?.notes ?? null,
    status: measurementData.status ?? 'completed',
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
            customer_id: customerId,
            shop_id: shopId,
            created_by: measurementData.created_by ?? user?.id,
            ...basePayload,
          },
        ])
        .select('*')
        .single()

  const { data, error } = await query

  if (error) {
    console.error('Error adding measurement:', error)
  }

  return (data as Measurement | null) ?? null
}

export async function updateMeasurement(
  measurementId: string,
  updates: Partial<Measurement>,
): Promise<Measurement | null> {
  const supabase = await createClient()

  const patch: Partial<Measurement> = { ...updates, updated_at: new Date().toISOString() }

  if (updates.standard_measurements) {
    patch.standard_measurements = sanitizeMeasurementMap(updates.standard_measurements)
  }
  if (updates.custom_measurements) {
    patch.custom_measurements = sanitizeMeasurementMap(updates.custom_measurements)
  }

  const { data, error } = await supabase
    .from('measurements')
    .update(patch)
    .eq('id', measurementId)
    .select()
    .single()

  if (error) {
    console.error('Error updating measurement:', error)
  }

  return (data as Measurement | null) ?? null
}

export async function deleteMeasurement(measurementId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('measurements').delete().eq('id', measurementId)

  if (error) {
    console.error('Error deleting measurement:', error)
    return false
  }

  return true
}
