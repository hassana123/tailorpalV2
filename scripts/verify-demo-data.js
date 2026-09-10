const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase URL or service key')
const db = createClient(url, key)
async function count(table) {
  const { count: value, error } = await db.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`${table}: ${error.message}`)
  return value || 0
}
async function run() {
  const tables = ['customers', 'orders', 'production_stages', 'production_tasks', 'order_garments', 'order_design_references', 'order_measurement_links', 'order_payments']
  for (const table of tables) console.log(`${table}: ${await count(table)}`)
  const { data: tasks, error } = await db.from('production_tasks').select('id,priority,due_date,status,estimated_minutes').limit(1)
  if (error) throw new Error(`workflow schema: ${error.message}`)
  console.log(`workflow schema: verified (${tasks?.length || 0} task sample)`)
}
run().catch(error => { console.error(`Verification failed: ${error.message}`); process.exitCode = 1 })
