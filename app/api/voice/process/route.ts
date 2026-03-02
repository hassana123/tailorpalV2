import { generateGroqReply } from '@/lib/ai/groq'
import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { checkRateLimit } from '@/lib/server/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { extractMeasurementMaps, sanitizeMeasurementMap } from '@/lib/utils/measurement-records'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const payloadSchema = z.object({
  message: z.string().min(1),
  shopId: z.string().uuid(),
})

// In-memory store for pending delete confirmations: key = `${userId}:${shopId}:${customerId}`
const pendingDeletes = new Map<string, { customerId: string; name: string; expiresAt: number }>()

// ─── Route handler ────────────────────────────────────────────────────────────

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

    const parsed = payloadSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { message, shopId } = parsed.data
    const normalized = message.trim().toLowerCase()

    const canAccess = await hasShopAccess(user.id, shopId)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rateLimit = checkRateLimit(`${user.id}:${shopId}`, 30, 60_000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before trying again.' },
        { status: 429 },
      )
    }

    // ── Intent routing ────────────────────────────────────────────────────────

    // Add customer
    if (/^add customer\b/i.test(normalized)) {
      const canManageCustomers = await hasStaffPermission(user.id, shopId, 'manage_customers')
      if (!canManageCustomers) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return handleAddCustomer({ supabase, message, shopId, userId: user.id })
    }

    // Record measurements
    if (/^(record|add|save|take)\s+measurements?\s+for\b/i.test(normalized)) {
      const canManageMeasurements = await hasStaffPermission(
        user.id,
        shopId,
        'manage_measurements',
      )
      if (!canManageMeasurements) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return handleMeasurement({ supabase, message, shopId, userId: user.id })
    }

    // Create order
    if (/^create\s+order\s+for\b/i.test(normalized)) {
      const canManageOrders = await hasStaffPermission(user.id, shopId, 'manage_orders')
      if (!canManageOrders) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return handleCreateOrder({ supabase, message, shopId, userId: user.id })
    }

    // Update order status
    if (/^update\s+order\b/i.test(normalized)) {
      const canManageOrders = await hasStaffPermission(user.id, shopId, 'manage_orders')
      if (!canManageOrders) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return handleUpdateOrder({ supabase, message, shopId })
    }

    // List customers
    if (/^(list|show|get)\s+customers?\b/i.test(normalized)) {
      return handleListCustomers({ supabase, shopId })
    }

    // Find / search customer
    if (/^(find|search|look\s+up)\s+customer\b/i.test(normalized)) {
      return handleFindCustomer({ supabase, message, shopId })
    }

    // List orders
    if (/^(list|show|get)\s+orders?\b/i.test(normalized)) {
      return handleListOrders({ supabase, shopId })
    }

    // Pending orders
    if (/\bpending\s+orders?\b/i.test(normalized)) {
      return handlePendingOrders({ supabase, shopId })
    }

    // Stats / analytics
    if (
      /\b(shop\s+statistics?|shop\s+stats?|analytics?|summary|overview)\b/i.test(normalized)
    ) {
      return handleStats({ supabase, shopId })
    }

    // Confirm pending delete
    if (/^confirm\s+delete\b/i.test(normalized)) {
      const canManageCustomers = await hasStaffPermission(user.id, shopId, 'manage_customers')
      if (!canManageCustomers) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return handleConfirmDelete({ supabase, userId: user.id, shopId })
    }

    // Delete customer
    if (/^delete\s+customer\b/i.test(normalized)) {
      const canManageCustomers = await hasStaffPermission(user.id, shopId, 'manage_customers')
      if (!canManageCustomers) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return handleDeleteCustomer({ supabase, message, shopId, userId: user.id })
    }

    // Help
    if (/^help\b/i.test(normalized)) {
      return NextResponse.json({
        reply: `Here's what I can do:
• Add customer [name] phone [number] email [email]
• Record measurements for [name] chest [x] waist [y] hip [z] shoulder [a] sleeve [b] inseam [c] neck [d]
• Create order for [name] for [description] due [YYYY-MM-DD]
• Update order [number] status to [pending|in_progress|completed|delivered|cancelled]
• List customers
• Find customer [name]
• List orders
• Show pending orders
• Show shop statistics
• Delete customer [name] (then say "Confirm delete" to confirm)`,
      })
    }

    // Fallback to AI
    const fallback = await generateGroqReply(
      `You are a friendly, concise tailoring shop assistant called TailorPal. 
       The user is managing their tailoring shop. 
       Keep replies under 3 sentences. 
       If the user asks something you can't do via voice commands, suggest the relevant command format.`,
      message,
    )

    return NextResponse.json({
      reply:
        fallback ??
        'I didn\'t quite catch that. Say "help" to hear what I can do for you.',
    })
  } catch (error) {
    console.error('Error processing voice command:', error)
    return NextResponse.json({ error: 'Failed to process command' }, { status: 500 })
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

async function handleAddCustomer({
  supabase,
  message,
  shopId,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  message: string
  shopId: string
  userId: string
}) {
  const parsed = parseAddCustomerCommand(message)
  if (!parsed) {
    return NextResponse.json({
      reply:
        'I need a name to add a customer. Try: "Add customer Jane Doe phone 08012345678"',
    })
  }

  const { data, error } = await supabase
    .from('customers')
    .insert([
      {
        shop_id: shopId,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        email: parsed.email ?? null,
        phone: parsed.phone ?? null,
        created_by: userId,
      },
    ])
    .select('id, first_name, last_name')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({
        reply: `A customer named ${parsed.firstName} ${parsed.lastName} may already exist in this shop.`,
      })
    }
    console.error('[voice/process] handleAddCustomer DB error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  return NextResponse.json({
    reply: `Done! I've added ${data.first_name} ${data.last_name} as a new customer.${parsed.phone ? ` Phone: ${parsed.phone}.` : ''}`,
    action: 'add_customer',
    customerId: data.id,
  })
}

async function handleMeasurement({
  supabase,
  message,
  shopId,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  message: string
  shopId: string
  userId: string
}) {
  const parsed = parseMeasurementCommand(message)
  if (!parsed) {
    return NextResponse.json({
      reply:
        'Please say: "Record measurements for Jane Doe chest 90 waist 70 hip 95"',
    })
  }

  // Find customer (fuzzy: first + last, or just first name)
  let customer = null
  const { data: exactMatch } = await supabase
    .from('customers')
    .select('id, first_name, last_name')
    .eq('shop_id', shopId)
    .ilike('first_name', parsed.firstName)
    .ilike('last_name', parsed.lastName)
    .maybeSingle()

  customer = exactMatch

  if (!customer) {
    // Try first name only
    const { data: firstNameMatch } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .eq('shop_id', shopId)
      .ilike('first_name', parsed.firstName)
      .limit(1)
      .maybeSingle()
    customer = firstNameMatch
  }

  if (!customer) {
    return NextResponse.json({
      reply: `I couldn't find a customer named ${parsed.firstName} ${parsed.lastName}. Please add them first.`,
    })
  }

  const incomingStandard = sanitizeMeasurementMap({
    chest: parsed.chest,
    waist: parsed.waist,
    hip: parsed.hip,
    shoulder_width: parsed.shoulderWidth,
    sleeve_length: parsed.sleeveLength,
    inseam: parsed.inseam,
    neck: parsed.neck,
  })

  const { data: existingRows, error: existingError } = await supabase
    .from('measurements')
    .select('*')
    .eq('shop_id', shopId)
    .eq('customer_id', customer.id)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingError) {
    console.error('[voice/process] handleMeasurement load error:', existingError)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  const existing = existingRows?.[0]
  const existingMaps = existing ? extractMeasurementMaps(existing) : { standard: {}, custom: {}, all: {} }
  const writePayload = {
    standard_measurements: {
      ...existingMaps.standard,
      ...incomingStandard,
    },
    custom_measurements: existingMaps.custom,
    notes: parsed.notes ?? existing?.notes ?? null,
    status: 'completed',
    updated_at: new Date().toISOString(),
  }

  const writeQuery = existing
    ? supabase
        .from('measurements')
        .update(writePayload)
        .eq('id', existing.id)
    : supabase
        .from('measurements')
        .insert([
          {
            shop_id: shopId,
            customer_id: customer.id,
            created_by: userId,
            ...writePayload,
          },
        ])

  const { error } = await writeQuery

  if (error) {
    console.error('[voice/process] handleMeasurement save error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  const recorded = [
    parsed.chest && `chest ${parsed.chest}cm`,
    parsed.waist && `waist ${parsed.waist}cm`,
    parsed.hip && `hip ${parsed.hip}cm`,
    parsed.shoulderWidth && `shoulder ${parsed.shoulderWidth}cm`,
    parsed.sleeveLength && `sleeve ${parsed.sleeveLength}cm`,
    parsed.inseam && `inseam ${parsed.inseam}cm`,
    parsed.neck && `neck ${parsed.neck}cm`,
  ]
    .filter(Boolean)
    .join(', ')

  return NextResponse.json({
    reply: `Measurements recorded for ${customer.first_name} ${customer.last_name}. ${recorded ? `Saved: ${recorded}.` : ''}`,
    action: 'record_measurement',
  })
}

async function handleCreateOrder({
  supabase,
  message,
  shopId,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  message: string
  shopId: string
  userId: string
}) {
  const parsed = parseCreateOrderCommand(message)
  if (!parsed) {
    return NextResponse.json({
      reply:
        'Please say: "Create order for Jane Doe for evening dress due 2026-03-15"',
    })
  }

  // Find customer
  let customer = null
  const { data: exactMatch } = await supabase
    .from('customers')
    .select('id, first_name, last_name')
    .eq('shop_id', shopId)
    .ilike('first_name', parsed.firstName)
    .ilike('last_name', parsed.lastName)
    .maybeSingle()

  customer = exactMatch

  if (!customer) {
    const { data: firstNameMatch } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .eq('shop_id', shopId)
      .ilike('first_name', parsed.firstName)
      .limit(1)
      .maybeSingle()
    customer = firstNameMatch
  }

  if (!customer) {
    return NextResponse.json({
      reply: `I couldn't find ${parsed.firstName} ${parsed.lastName}. Please add them as a customer first.`,
    })
  }

  const orderNumber = `ORD-${Date.now()}`
  const { error } = await supabase.from('orders').insert([
    {
      shop_id: shopId,
      customer_id: customer.id,
      order_number: orderNumber,
      status: 'pending',
      design_description: parsed.description,
      estimated_delivery_date: parsed.dueDate ?? null,
      created_by: userId,
    },
  ])

  if (error) {
    console.error('[voice/process] handleCreateOrder DB error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  return NextResponse.json({
    reply: `Order ${orderNumber} created for ${customer.first_name} ${customer.last_name} — ${parsed.description}.${parsed.dueDate ? ` Due: ${parsed.dueDate}.` : ''}`,
    action: 'create_order',
    orderNumber,
  })
}

async function handleUpdateOrder({
  supabase,
  message,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  message: string
  shopId: string
}) {
  // "update order ORD-xxx status to completed"
  const match = message.match(
    /update\s+order\s+(ORD-\d+)\s+status\s+to\s+(pending|in_progress|in progress|completed|delivered|cancelled)/i,
  )
  if (!match) {
    return NextResponse.json({
      reply:
        'Please say: "Update order ORD-123 status to completed". Valid statuses: pending, in progress, completed, delivered, cancelled.',
    })
  }

  const orderNumber = match[1].toUpperCase()
  const rawStatus = match[2].toLowerCase().replace(/\s+/g, '_')
  const validStatuses = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled']
  const status = validStatuses.includes(rawStatus) ? rawStatus : null

  if (!status) {
    return NextResponse.json({
      reply: `"${match[2]}" is not a valid status. Use: pending, in progress, completed, delivered, or cancelled.`,
    })
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('shop_id', shopId)
    .eq('order_number', orderNumber)
    .select('order_number, status')
    .single()

  if (error || !data) {
    return NextResponse.json({
      reply: `I couldn't find order ${orderNumber} in this shop.`,
    })
  }

  return NextResponse.json({
    reply: `Order ${data.order_number} has been updated to "${data.status}".`,
    action: 'update_order',
  })
}

async function handleListCustomers({
  supabase,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  shopId: string
}) {
  const { data, error } = await supabase
    .from('customers')
    .select('first_name, last_name, phone')
    .eq('shop_id', shopId)
    .order('first_name', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[voice/process] handleListCustomers DB error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ reply: 'You have no customers yet. Say "Add customer" to get started.' })
  }

  const list = data
    .map((c, i) => `${i + 1}. ${c.first_name} ${c.last_name}${c.phone ? ` (${c.phone})` : ''}`)
    .join('\n')

  return NextResponse.json({
    reply: `Here are your customers (showing up to 10):\n${list}`,
    action: 'list_customers',
  })
}

async function handleFindCustomer({
  supabase,
  message,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  message: string
  shopId: string
}) {
  const nameMatch = message.match(/(?:find|search|look\s+up)\s+customer\s+(.+)/i)
  if (!nameMatch) {
    return NextResponse.json({ reply: 'Please say: "Find customer Jane Doe"' })
  }

  const query = nameMatch[1].trim()
  const parts = query.split(/\s+/)
  const firstName = parts[0]
  const lastName = parts[1] || ''

  const { data } = await supabase
    .from('customers')
    .select('first_name, last_name, phone, email')
    .eq('shop_id', shopId)
    .ilike('first_name', `%${firstName}%`)
    .limit(5)

  if (!data || data.length === 0) {
    return NextResponse.json({
      reply: `No customers found matching "${query}". Check the spelling or add them first.`,
    })
  }

  const list = data
    .map(
      (c) =>
        `${c.first_name} ${c.last_name}${c.phone ? ` — ${c.phone}` : ''}${c.email ? ` — ${c.email}` : ''}`,
    )
    .join('\n')

  return NextResponse.json({
    reply: `Found ${data.length} customer${data.length > 1 ? 's' : ''} matching "${firstName}${lastName ? ' ' + lastName : ''}":\n${list}`,
    action: 'find_customer',
  })
}

async function handleListOrders({
  supabase,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  shopId: string
}) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, status, design_description, customers(first_name, last_name)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    console.error('[voice/process] handleListOrders DB error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ reply: 'No orders yet. Say "Create order for [name] for [description]" to add one.' })
  }

  const list = data
    .map((o) => {
      const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers
      const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'
      return `• ${o.order_number} — ${name} — ${o.status} — ${o.design_description || 'No description'}`
    })
    .join('\n')

  return NextResponse.json({
    reply: `Recent orders (up to 8):\n${list}`,
    action: 'list_orders',
  })
}

async function handlePendingOrders({
  supabase,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  shopId: string
}) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, design_description, estimated_delivery_date, customers(first_name, last_name)')
    .eq('shop_id', shopId)
    .in('status', ['pending', 'in_progress'])
    .order('estimated_delivery_date', { ascending: true })
    .limit(10)

  if (error) {
    console.error('[voice/process] handlePendingOrders DB error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ reply: 'Great news — no pending or in-progress orders right now!' })
  }

  const list = data
    .map((o) => {
      const customer = Array.isArray(o.customers) ? o.customers[0] : o.customers
      const name = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'
      const due = o.estimated_delivery_date ? ` due ${o.estimated_delivery_date}` : ''
      return `• ${o.order_number} — ${name}${due}`
    })
    .join('\n')

  return NextResponse.json({
    reply: `You have ${data.length} pending/in-progress order${data.length > 1 ? 's' : ''}:\n${list}`,
    action: 'list_pending_orders',
  })
}

async function handleStats({
  supabase,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  shopId: string
}) {
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

  return NextResponse.json({
    reply: `Shop summary:
• Customers: ${customersRes.count ?? 0}
• Total orders: ${ordersRes.count ?? 0}
• Pending / in-progress: ${pendingRes.count ?? 0}
• Completed orders: ${completedRes.count ?? 0}
• Measurement records: ${measurementsRes.count ?? 0}`,
    action: 'get_stats',
  })
}

async function handleDeleteCustomer({
  supabase,
  message,
  shopId,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  message: string
  shopId: string
  userId: string
}) {
  const nameMatch = message.match(/delete\s+customer\s+(.+)/i)
  if (!nameMatch) {
    return NextResponse.json({ reply: 'Please say: "Delete customer Jane Doe"' })
  }

  const parts = nameMatch[1].trim().split(/\s+/)
  const firstName = capitalize(parts[0])
  const lastName = parts[1] ? capitalize(parts[1]) : ''

  // Fix: reassign query on each chain call (Supabase builder is immutable)
  let query = supabase
    .from('customers')
    .select('id, first_name, last_name')
    .eq('shop_id', shopId)
    .ilike('first_name', firstName)

  if (lastName) {
    query = query.ilike('last_name', lastName)
  }

  const { data } = await query.maybeSingle()

  if (!data) {
    return NextResponse.json({
      reply: `I couldn't find a customer named ${firstName}${lastName ? ' ' + lastName : ''}.`,
    })
  }

  // Store pending delete — requires "Confirm delete" within 30 seconds
  const pendingKey = `${userId}:${shopId}`
  pendingDeletes.set(pendingKey, {
    customerId: data.id,
    name: `${data.first_name} ${data.last_name}`,
    expiresAt: Date.now() + 30_000,
  })

  return NextResponse.json({
    reply: `Are you sure you want to delete ${data.first_name} ${data.last_name}? Say "Confirm delete" within 30 seconds to proceed, or say anything else to cancel.`,
    action: 'delete_customer_pending',
  })
}

async function handleConfirmDelete({
  supabase,
  userId,
  shopId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  shopId: string
}) {
  const pendingKey = `${userId}:${shopId}`
  const pending = pendingDeletes.get(pendingKey)

  if (!pending || Date.now() > pending.expiresAt) {
    pendingDeletes.delete(pendingKey)
    return NextResponse.json({
      reply: 'No pending delete found, or it has expired. Please say "Delete customer [name]" again.',
    })
  }

  pendingDeletes.delete(pendingKey)

  const { error } = await supabase.from('customers').delete().eq('id', pending.customerId)

  if (error) {
    console.error('[voice/process] handleConfirmDelete DB error:', error)
    return NextResponse.json({ error: 'A database error occurred.' }, { status: 500 })
  }

  return NextResponse.json({
    reply: `Customer ${pending.name} has been permanently deleted.`,
    action: 'delete_customer',
  })
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseAddCustomerCommand(message: string) {
  const withoutPrefix = message.replace(/^\s*add\s+customer\s*/i, '').trim()
  if (!withoutPrefix) return null

  const emailMatch = withoutPrefix.match(/\bemail\s+([^\s]+@[^\s]+)\b/i)
  const phoneMatch = withoutPrefix.match(/\bphone\s+([+\d][\d\s()-]{4,})/i)

  let namePart = withoutPrefix
  if (emailMatch) namePart = namePart.replace(emailMatch[0], '')
  if (phoneMatch) namePart = namePart.replace(phoneMatch[0], '')

  // Strip filler words
  namePart = namePart.replace(/\b(with|and|the)\b/gi, '').trim()

  const { firstName, lastName } = splitName(namePart.trim())
  if (!firstName) return null

  return {
    firstName,
    lastName: lastName || 'Unknown',
    email: emailMatch?.[1],
    phone: phoneMatch?.[1]?.trim(),
  }
}

function parseMeasurementCommand(message: string) {
  const match = message.match(
    /(?:record|add|save|take)\s+measurements?\s+for\s+([a-zA-Z''-]+)\s+([a-zA-Z''-]+)/i,
  )
  if (!match) return null

  return {
    firstName: capitalize(match[1]),
    lastName: capitalize(match[2]),
    chest: parseNumberField(message, 'chest'),
    waist: parseNumberField(message, 'waist'),
    hip: parseNumberField(message, 'hip'),
    shoulderWidth: parseNumberField(message, 'shoulder'),
    sleeveLength: parseNumberField(message, 'sleeve'),
    inseam: parseNumberField(message, 'inseam'),
    neck: parseNumberField(message, 'neck'),
    notes: parseNotes(message),
  }
}

function parseCreateOrderCommand(message: string) {
  // "create order for Jane Doe for evening dress due 2026-03-15"
  const pattern =
    /create\s+order\s+for\s+([a-zA-Z''-]+)\s+([a-zA-Z''-]+)\s*(?:for\s+(.+?))?(?:\s+due\s+(\d{4}-\d{2}-\d{2}))?$/i
  const match = message.match(pattern)
  if (!match) return null

  return {
    firstName: capitalize(match[1]),
    lastName: capitalize(match[2]),
    description: match[3]?.trim() || 'Custom tailoring order',
    dueDate: match[4],
  }
}

function parseNumberField(message: string, key: string) {
  const match = message.match(new RegExp(`\\b${key}\\s+(\\d+(?:\\.\\d+)?)`, 'i'))
  return match ? Number.parseFloat(match[1]) : undefined
}

function parseNotes(message: string) {
  const match = message.match(/\bnotes?\s+(.+)$/i)
  return match ? match[1].trim() : undefined
}

function splitName(name: string) {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  const firstName = capitalize(parts[0])
  const lastName = parts.length > 1 ? capitalize(parts.slice(1).join(' ')) : ''
  return { firstName, lastName }
}

function capitalize(value: string) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
