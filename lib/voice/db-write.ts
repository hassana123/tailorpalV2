import { extractMeasurementMaps, sanitizeMeasurementMap } from '@/lib/utils/measurement-records'
import { AddCustomerDraft, AddMeasurementDraft, CreateOrderDraft, UpdateOrderDraft } from '@/lib/voice/types'
import { VoiceSupabase } from '@/lib/voice/db-types'

export async function createCustomer(
  supabase: VoiceSupabase,
  shopId: string,
  userId: string,
  draft: AddCustomerDraft,
) {
  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        shop_id: shopId,
        first_name: draft.firstName,
        last_name: draft.lastName,
        phone: draft.phone ?? null,
        email: draft.email ?? null,
        address: draft.address ?? null,
        city: draft.city ?? null,
        country: draft.country ?? null,
        notes: draft.notes ?? null,
        created_by: userId,
      },
    ])
    .select('id, first_name, last_name')
    .single()

  if (error) throw error
  return data
}

export async function upsertMeasurements(
  supabase: VoiceSupabase,
  shopId: string,
  userId: string,
  draft: AddMeasurementDraft,
) {
  const { data: existingRows, error: existingError } = await supabase
    .from('measurements')
    .select('*')
    .eq('shop_id', shopId)
    .eq('customer_id', draft.customerId!)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) throw existingError

  const existing = existingRows?.[0]
  const existingMaps = existing ? extractMeasurementMaps(existing) : { standard: {}, custom: {}, all: {} }

  const payload = {
    standard_measurements: sanitizeMeasurementMap({
      ...existingMaps.standard,
      ...draft.standardMeasurements,
    }),
    custom_measurements: sanitizeMeasurementMap({
      ...existingMaps.custom,
      ...draft.customMeasurements,
    }),
    notes: draft.notes ?? existing?.notes ?? null,
    status: 'completed' as const,
    updated_at: new Date().toISOString(),
  }

  const query = existing
    ? supabase.from('measurements').update(payload).eq('id', existing.id)
    : supabase.from('measurements').insert([
        {
          shop_id: shopId,
          customer_id: draft.customerId!,
          created_by: userId,
          ...payload,
        },
      ])

  const { error } = await query
  if (error) throw error
}

export async function createOrder(
  supabase: VoiceSupabase,
  shopId: string,
  userId: string,
  draft: CreateOrderDraft,
) {
  const orderNumber = `ORD-${Date.now()}`
  const { error } = await supabase.from('orders').insert([
    {
      shop_id: shopId,
      customer_id: draft.customerId!,
      order_number: orderNumber,
      status: 'pending',
      design_description: draft.designDescription!,
      fabric_details: draft.fabricDetails ?? null,
      estimated_delivery_date: draft.estimatedDeliveryDate ?? null,
      total_price: draft.totalPrice ?? null,
      notes: draft.notes ?? null,
      created_by: userId,
    },
  ])

  if (error) throw error
  return orderNumber
}

export async function updateOrderStatus(
  supabase: VoiceSupabase,
  shopId: string,
  draft: UpdateOrderDraft,
) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: draft.status!, updated_at: new Date().toISOString() })
    .eq('shop_id', shopId)
    .eq('order_number', draft.orderNumber!)
    .select('order_number, status')
    .single()

  if (error || !data) return null
  return data
}

export async function deleteCustomerById(supabase: VoiceSupabase, customerId: string) {
  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) throw error
}
