import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({
  requestId: z.string().uuid(),
})

const payloadSchema = z.object({
  action: z.enum(['accept', 'reject', 'contact']),
  channel: z.enum(['email', 'whatsapp', 'none']).optional(),
  message: z.string().optional(),
  estimatedDeliveryDate: z.string().optional(),
  totalPrice: z.number().nonnegative().optional(),
  orderNotes: z.string().optional(),
})

type CatalogRequestRow = {
  id: string
  shop_id: string
  catalog_item_id: string
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  notes: string | null
  status: string
  linked_order_id: string | null
  customer_user_id: string | null
  shop_catalog_items:
    | {
        name: string
        price: number
        image_url: string | null
      }
    | {
        name: string
        price: number
        image_url: string | null
      }[]
    | null
}

function getCatalogItem(
  value: CatalogRequestRow['shop_catalog_items'],
): { name: string; price: number; image_url: string | null } | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function parseRequesterName(name: string): { firstName: string; lastName: string | null } {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return { firstName: 'Customer', lastName: null }
  }

  const [firstName, ...rest] = normalized.split(' ')
  const lastName = rest.join(' ').trim() || null
  return { firstName, lastName }
}

function formatWhatsappPhone(phone: string) {
  return phone.replace(/[^\d]/g, '')
}

function buildCommunicationLink(input: {
  channel: 'email' | 'whatsapp' | 'none'
  email: string | null
  phone: string | null
  message: string
  subject: string
}) {
  if (input.channel === 'none') {
    return null
  }

  if (input.channel === 'email') {
    if (!input.email) return null
    return `mailto:${encodeURIComponent(input.email)}?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.message)}`
  }

  if (!input.phone) return null
  const digits = formatWhatsappPhone(input.phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(input.message)}`
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
  }

  const parsedBody = payloadSchema.safeParse(await request.json())
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsedBody.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: requestRow, error: requestError } = await supabase
      .from('catalog_order_requests')
      .select(
        'id, shop_id, catalog_item_id, requester_name, requester_email, requester_phone, notes, status, linked_order_id, customer_user_id, shop_catalog_items(name, price, image_url)',
      )
      .eq('id', parsedParams.data.requestId)
      .maybeSingle()

    if (requestError) {
      console.error('Failed to load catalog order request:', requestError)
      return NextResponse.json({ error: 'Failed to load request' }, { status: 500 })
    }

    if (!requestRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const canAccess = await hasShopAccess(user.id, requestRow.shop_id)
    if (!canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const canManageOrders = await hasStaffPermission(user.id, requestRow.shop_id, 'manage_orders')
    if (!canManageOrders) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = parsedBody.data
    const channel = body.channel ?? 'none'
    const message = body.message?.trim() || ''
    const nowIso = new Date().toISOString()
    const typedRequest = requestRow as CatalogRequestRow

    if (channel === 'email' && !typedRequest.requester_email) {
      return NextResponse.json({ error: 'Requester email is not available' }, { status: 400 })
    }
    if (channel === 'whatsapp' && !typedRequest.requester_phone) {
      return NextResponse.json({ error: 'Requester phone is not available' }, { status: 400 })
    }

    if (body.action === 'contact') {
      const { data: updated, error: updateError } = await supabase
        .from('catalog_order_requests')
        .update({
          status: 'contacted',
          owner_response_channel: channel,
          owner_response_message: message || null,
          owner_response_sent_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', typedRequest.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Failed to mark request as contacted:', updateError)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      return NextResponse.json({
        request: updated,
        communicationLink: buildCommunicationLink({
          channel,
          email: typedRequest.requester_email,
          phone: typedRequest.requester_phone,
          subject: 'Catalog order request update',
          message: message || `Hello ${typedRequest.requester_name}, your request has been reviewed.`,
        }),
      })
    }

    if (body.action === 'reject') {
      const { data: updated, error: updateError } = await supabase
        .from('catalog_order_requests')
        .update({
          status: 'rejected',
          owner_response_channel: channel,
          owner_response_message: message || null,
          owner_response_sent_at: nowIso,
          rejected_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', typedRequest.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Failed to reject request:', updateError)
        return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
      }

      return NextResponse.json({
        request: updated,
        communicationLink: buildCommunicationLink({
          channel,
          email: typedRequest.requester_email,
          phone: typedRequest.requester_phone,
          subject: 'Catalog order request status',
          message:
            message || `Hello ${typedRequest.requester_name}, your catalog request has been declined.`,
        }),
      })
    }

    if (typedRequest.linked_order_id) {
      return NextResponse.json(
        { error: 'This request has already been accepted.' },
        { status: 400 },
      )
    }

    const requesterName = parseRequesterName(typedRequest.requester_name)
    let customerId: string | null = null

    if (typedRequest.requester_email) {
      const { data: existingByEmail, error: existingByEmailError } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', typedRequest.shop_id)
        .eq('email', typedRequest.requester_email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingByEmailError) {
        console.error('Failed to load customer by email:', existingByEmailError)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
      }

      customerId = existingByEmail?.id ?? null
    }

    if (!customerId && typedRequest.requester_phone) {
      const { data: existingByPhone, error: existingByPhoneError } = await supabase
        .from('customers')
        .select('id')
        .eq('shop_id', typedRequest.shop_id)
        .eq('phone', typedRequest.requester_phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingByPhoneError) {
        console.error('Failed to load customer by phone:', existingByPhoneError)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
      }

      customerId = existingByPhone?.id ?? null
    }

    if (!customerId) {
      const { data: createdCustomer, error: createdCustomerError } = await supabase
        .from('customers')
        .insert([
          {
            shop_id: typedRequest.shop_id,
            first_name: requesterName.firstName,
            last_name: requesterName.lastName,
            email: typedRequest.requester_email,
            phone: typedRequest.requester_phone,
            notes: `Created from catalog request ${typedRequest.id}`,
            created_by: user.id,
          },
        ])
        .select('id')
        .single()

      if (createdCustomerError) {
        console.error('Failed to create customer from request:', createdCustomerError)
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }

      customerId = createdCustomer.id
    }

    const item = getCatalogItem(typedRequest.shop_catalog_items)
    const orderNumber = `ORD-${Date.now()}`

    const orderNotes = [typedRequest.notes, body.orderNotes?.trim(), message]
      .filter((value) => Boolean(value && value.trim()))
      .map((value) => value!.trim())
      .join('\n\n')

    const { data: createdOrder, error: createdOrderError } = await supabase
      .from('orders')
      .insert([
        {
          shop_id: typedRequest.shop_id,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'pending',
          design_description: item
            ? `Catalog order: ${item.name}`
            : `Catalog request ${typedRequest.id}`,
          estimated_delivery_date: body.estimatedDeliveryDate || null,
          total_price: body.totalPrice ?? item?.price ?? null,
          notes: orderNotes || null,
          style_image_url: item?.image_url ?? null,
          catalog_request_id: typedRequest.id,
          customer_contact_email: typedRequest.requester_email,
          customer_contact_phone: typedRequest.requester_phone,
          created_by: user.id,
        },
      ])
      .select('id, order_number, status')
      .single()

    if (createdOrderError) {
      console.error('Failed to create order from request:', createdOrderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const { data: updatedRequest, error: updatedRequestError } = await supabase
      .from('catalog_order_requests')
      .update({
        status: 'accepted',
        customer_id: customerId,
        linked_order_id: createdOrder.id,
        owner_response_channel: channel,
        owner_response_message: message || null,
        owner_response_sent_at: nowIso,
        accepted_at: nowIso,
        rejected_at: null,
        updated_at: nowIso,
      })
      .eq('id', typedRequest.id)
      .select('*')
      .single()

    if (updatedRequestError) {
      console.error('Failed to update accepted request:', updatedRequestError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    const fallbackMessage = `Hello ${typedRequest.requester_name}, your catalog request was accepted. Your order number is ${createdOrder.order_number}.`
    return NextResponse.json({
      request: updatedRequest,
      order: createdOrder,
      communicationLink: buildCommunicationLink({
        channel,
        email: typedRequest.requester_email,
        phone: typedRequest.requester_phone,
        subject: `Order ${createdOrder.order_number} accepted`,
        message: message || fallbackMessage,
      }),
    })
  } catch (error) {
    console.error('Catalog request PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
