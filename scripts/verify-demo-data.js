/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node entrypoint uses CommonJS. */
const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase URL or service key')
const db = createClient(url, key)
const shopId = 'de000000-0000-4000-8000-000000000001'
async function count(table, column, values, expected) {
  let query = db.from(table).select('*', { count: 'exact', head: true })
  query = Array.isArray(values) ? query.in(column, values) : query.eq(column, values)
  const { count: value, error } = await query
  if (error) throw new Error(`${table}: ${error.message}`)
  if ((value || 0) < expected) throw new Error(`${table}: expected at least ${expected} demo rows, found ${value || 0}`)
  console.log(`${table}: ${value} (verified)`)
  return value || 0
}
async function run() {
  const { data: shop, error: shopError } = await db.from('shops').select('id,name').eq('id', shopId).maybeSingle()
  if (shopError) throw shopError
  if (!shop) throw new Error('Demo shop missing. Run supabase/seed.sql first.')
  const shopTables = { customers: 6, orders: 6, measurements: 6, shop_staff: 4,
    staff_invitations: 1, production_stages: 6, production_tasks: 36, business_expenses: 12,
    shop_inventory_items: 2, inventory_suppliers: 1, inventory_purchases: 1,
    shop_catalog_items: 2, catalog_order_requests: 1, shop_planner_settings: 1,
    staff_alerts: 3, shop_notifications: 1 }
  for (const [table, expected] of Object.entries(shopTables)) await count(table, 'shop_id', shopId, expected)
  const { data: orders, error } = await db.from('orders').select('id,status,total_price,deposit_amount,priority,fitting_status,delivery_status').eq('shop_id', shopId)
  if (error) throw error
  const ids = orders.map(order => order.id)
  for (const status of ['pending','in_progress','completed','delivered','cancelled']) {
    if (!orders.some(order => order.status === status)) throw new Error(`Missing ${status} order scenario`)
  }
  for (const [table, expected] of Object.entries({ order_garments: 12, order_design_references: 6,
    order_measurement_links: 6, order_payments: 3, order_design_notes: 12,
    order_progress_photos: 2, order_inventory_usage: 1 })) await count(table, 'order_id', ids, expected)
  const { data: tasks, error: taskError } = await db.from('production_tasks').select('id,priority,due_date,status,estimated_minutes').eq('shop_id', shopId)
  if (taskError) throw taskError
  await count('production_time_entries', 'task_id', tasks.map(task => task.id), 15)
  const { data: staff, error: staffError } = await db.from('shop_staff').select('id').eq('shop_id', shopId).eq('status','active')
  if (staffError) throw staffError
  await count('shop_staff_permissions', 'staff_id', staff.map(person => person.id), 3)
  console.log(`Verified demo fixtures for ${shop.name}. Service-key checks do not test browser RLS; follow docs/DATABASE_SETUP.md for access tests.`)
}
run().catch(error => { console.error(`Verification failed: ${error.message}`); process.exitCode = 1 })
