import { VoiceSupabase } from '@/lib/voice/db-types'

export async function listCustomers(supabase: VoiceSupabase, shopId: string, limit = 10) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, phone, email')
    .eq('shop_id', shopId)
    .order('first_name', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function findCustomerByName(
  supabase: VoiceSupabase,
  shopId: string,
  query: string,
  limit = 5,
) {
  const trimmed = query.trim()
  if (!trimmed) return []

  const parts = trimmed.split(/\s+/)
  const first = parts[0]

  const { data, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, phone, email')
    .eq('shop_id', shopId)
    .or(
      `first_name.ilike.%${first}%,last_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`,
    )
    .order('first_name', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getRecentOrders(supabase: VoiceSupabase, shopId: string, limit = 8) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, status, design_description, customers(first_name, last_name)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getPendingOrders(supabase: VoiceSupabase, shopId: string, limit = 10) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, estimated_delivery_date, customers(first_name, last_name)')
    .eq('shop_id', shopId)
    .in('status', ['pending', 'in_progress'])
    .order('estimated_delivery_date', { ascending: true })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function getShopStats(supabase: VoiceSupabase, shopId: string) {
  const [customersRes, ordersRes, measurementsRes, pendingRes, completedRes] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
    supabase.from('measurements').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .in('status', ['pending', 'in_progress']),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'completed'),
  ])

  return {
    customers: customersRes.count ?? 0,
    orders: ordersRes.count ?? 0,
    measurements: measurementsRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    completed: completedRes.count ?? 0,
  }
}
