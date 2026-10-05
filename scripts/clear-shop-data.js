/* Deletes operational records for the first TailorPal shop only. Preserves auth users, shop account, and workflow-stage definitions. */
const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase URL or service key')
const db = createClient(url, key)
async function remove(table, column, value) {
  const { error } = await db.from(table).delete().eq(column, value)
  if (error && !['42P01', 'PGRST205'].includes(error.code)) throw new Error(`${table}: ${error.message}`)
}
async function run() {
  const { data: shop, error } = await db.from('shops').select('id,name').limit(1).maybeSingle()
  if (error || !shop) throw new Error('No shop found.')
  const { data: orderRows } = await db.from('orders').select('id').eq('shop_id', shop.id)
  const orderIds = (orderRows || []).map((row) => row.id)
  // Shop-scoped records with no dependency on an order.
  for (const table of ['shop_notifications', 'business_expenses', 'inventory_purchases', 'inventory_suppliers', 'shop_inventory_items', 'shop_planner_settings']) await remove(table, 'shop_id', shop.id)
  // Order deletion cascades tasks, time entries, progress photos, references, garments, design notes, and inventory usage.
  if (orderIds.length) { const { error: orderError } = await db.from('orders').delete().in('id', orderIds); if (orderError) throw new Error(`orders: ${orderError.message}`) }
  await remove('measurements', 'shop_id', shop.id)
  await remove('customers', 'shop_id', shop.id)
  // Removes staff profiles/invitations, but never auth users or the shop owner.
  await remove('shop_staff', 'shop_id', shop.id)
  console.log(`Cleared operational data for ${shop.name}. Preserved the shop account, login accounts, and production stage definitions.`)
}
run().catch((error) => { console.error(error.message); process.exitCode = 1 })
