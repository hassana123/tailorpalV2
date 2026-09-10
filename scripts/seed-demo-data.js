/* Replaces only TailorPal DEMO-* records. Run: npm run seed:demo */
const { createClient } = require('@supabase/supabase-js')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Missing Supabase URL or service key')
const db = createClient(url, key)
const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
async function run() {
  const { data: shop, error } = await db.from('shops').select('id,owner_id,name').limit(1).maybeSingle()
  if (error || !shop) throw new Error('Create a shop and owner account before seeding.')
  // Deliberately narrow cleanup: no non-DEMO order, customer, staff, or inventory data is touched.
  const { data: demoOrders } = await db.from('orders').select('id').eq('shop_id', shop.id).like('order_number', 'DEMO-%')
  if (demoOrders?.length) await db.from('orders').delete().in('id', demoOrders.map((row) => row.id))
  await db.from('customers').delete().eq('shop_id', shop.id).in('notes', ['TailorPal demo customer', 'Demo customer'])
  await db.from('shop_staff').delete().eq('shop_id', shop.id).like('email', '%@demo.tailorpal.local')
  const { data: stages, error: stageError } = await db.from('production_stages').select('id,name').eq('shop_id', shop.id).order('position')
  if (stageError || !stages?.length) throw new Error('Apply production migrations before seeding demo data.')
  const stage = (name) => stages.find((row) => row.name.toLowerCase() === name.toLowerCase())?.id || stages[0].id
  const { data: staff, error: staffError } = await db.from('shop_staff').insert([
    { shop_id: shop.id, email: 'ada@demo.tailorpal.local', role: 'manager', status: 'active', production_role: 'Lead cutter', skills: ['cutting','pattern drafting','bridal'] },
    { shop_id: shop.id, email: 'mariam@demo.tailorpal.local', role: 'staff', status: 'active', production_role: 'Seamstress', skills: ['sewing','fitting','aso-ebi'] },
    { shop_id: shop.id, email: 'kunle@demo.tailorpal.local', role: 'staff', status: 'active', production_role: 'Finisher', skills: ['finishing','pressing','embroidery'] },
  ]).select('id,email')
  if (staffError) throw staffError
  const { data: customers, error: customerError } = await db.from('customers').insert([
    ['Amara','Okafor','08000000001'],['Zainab','Bello','08000000002'],['Chidera','Nwosu','08000000003'],['Tomiwa','Adeyemi','08000000004']
  ].map(([first_name,last_name,phone]) => ({ shop_id:shop.id,first_name,last_name,phone,city:'Lagos',country:'Nigeria',notes:'TailorPal demo customer',created_by:shop.owner_id }))).select()
  if (customerError) throw customerError
  const blueprints = [
    ['DEMO-BRIDAL','Bridal gown with beaded corset',2,180000,'in_progress','urgent','2026-09-18'],
    ['DEMO-AGBADA','Navy Agbada three-piece set',4,95000,'in_progress','high','2026-09-20'],
    ['DEMO-ASOEBI','Aso-ebi fitted gown',7,70000,'pending','normal','2026-09-23'],
    ['DEMO-SENATOR','Senator kaftan and trousers',10,80000,'pending','normal','2026-09-26'],
  ]
  const { data: orders, error: orderError } = await db.from('orders').insert(blueprints.map(([prefix, description, days, price, status, priority], index) => ({ shop_id:shop.id, customer_id:customers[index].id, order_number:`${prefix}-${Date.now()}`, design_description:description, estimated_delivery_date:date(days), fitting_date:index===0?date(1):null, total_price:price, status, priority, created_by:shop.owner_id }))).select()
  if (orderError) throw orderError
  const tasks=[]
  orders.forEach((order,index)=>{
    const assigned = staff[index % staff.length]?.id || null
    tasks.push({shop_id:shop.id,order_id:order.id,stage_id:stage('Cutting'),title:`Cut pattern — ${order.design_description}`,assigned_staff_id:assigned,estimated_minutes:120,priority:index===0?2:index===1?1:0,due_date:date(index+1),status:index===0?'done':'todo'})
    tasks.push({shop_id:shop.id,order_id:order.id,stage_id:stage('Sewing'),title:`Sew main garment — ${order.design_description}`,assigned_staff_id:staff[(index+1)%staff.length]?.id||null,estimated_minutes:240,priority:index===0?2:index===1?1:0,due_date:date(index+2),status:index===0?'in_progress':'todo'})
    tasks.push({shop_id:shop.id,order_id:order.id,stage_id:stage('Finishing'),title:`Finish and press — ${order.design_description}`,assigned_staff_id:staff[(index+2)%staff.length]?.id||null,estimated_minutes:90,priority:index===0?1:0,due_date:date(index+3),status:'todo'})
  })
  const { data: insertedTasks, error: taskError } = await db.from('production_tasks').insert(tasks).select('id,status')
  if (taskError) throw taskError
  const completed = insertedTasks.find((task) => task.status === 'done')
  if (completed) await db.from('production_time_entries').insert({ task_id:completed.id, staff_id:staff[0].id, started_at:new Date(Date.now()-150*60000).toISOString(), ended_at:new Date(Date.now()-30*60000).toISOString(), notes:'Demo completed cutting time' })
  console.log(`Replaced demo data for ${shop.name}: ${customers.length} customers, ${orders.length} orders, ${staff.length} staff and ${tasks.length} linked workflow tasks.`)
}
run().catch((error)=>{console.error(error.message);process.exitCode=1})
