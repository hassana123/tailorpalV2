import { hasShopAccess, hasStaffPermission } from '@/lib/server/authz'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({
  requestId: z.string().uuid(),
})

const payloadSchema = z.object({
  action: z.enum(['accept', 'reject', 'contact', 'reopen', 'convert', 'cancel']),
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

type BasicCatalogRequestRow = {
  id: string
  shop_id: string
  linked_order_id: string | null
}

function getCatalogItem(
  value: CatalogRequestRow['shop_catalog_items'],
): { name: string; price: number; image_url: string | null } | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function parseRequesterName(name: string): { firstName: string; lastName: string | null } {
  const normalized = name.trim().replace(/\s+/g, ' ')
  if (!normalized) return { firstName: 'Customer', lastName: null }

  const [firstName, ...rest] = normalized.split(' ')
  return { firstName, lastName: rest.join(' ').trim() || null }
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
  if (input.channel === 'none') return null

  if (input.channel === 'email') {
    if (!input.email) return null
    return `mailto:${encodeURIComponent(input.email)}?subject=${encodeURIComponent(input.subject)}&body=${encodeURIComponent(input.message)}`
  }

  if (!input.phone) return null
  const digits = formatWhatsappPhone(input.phone)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(input.message)}`
}

function requiresContactValidation(channel: 'email' | 'whatsapp' | 'none') {
  return channel === 'email' || channel === 'whatsapp'
}

async function assertCanManageRequest(userId: string, shopId: string) {
  const canAccess = await hasShopAccess(userId, shopId)
  if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const canManageOrders = await hasStaffPermission(userId, shopId, 'manage_orders')
  if (!canManageOrders) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return null
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

    const accessError = await assertCanManageRequest(user.id, requestRow.shop_id)
    if (accessError) return accessError

    const typedRequest = requestRow as CatalogRequestRow
    const action = parsedBody.data.action
    const channel = parsedBody.data.channel ?? 'none'
    const message = parsedBody.data.message?.trim() || ''
    const nowIso = new Date().toISOString()

    if (requiresContactValidation(channel) && channel === 'email' && !typedRequest.requester_email) {
      return NextResponse.json({ error: 'Requester email is not available' }, { status: 400 })
    }
    if (requiresContactValidation(channel) && channel === 'whatsapp' && !typedRequest.requester_phone) {
      return NextResponse.json({ error: 'Requester phone is not available' }, { status: 400 })
    }

    if (action === 'contact') {
      const nextStatus =
        typedRequest.status === 'accepted' || typedRequest.status === 'converted'
          ? typedRequest.status
          : 'contacted'

      const { data: updated, error: updateError } = await supabase
        .from('catalog_order_requests')
        .update({
          status: nextStatus,
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

    if (action === 'reopen') {
      if (typedRequest.linked_order_id) {
        return NextResponse.json(
          { error: 'Cannot reopen a request that already has a linked order.' },
          { status: 400 },
        )
      }

      const updates: Record<string, unknown> = {
        status: 'pending',
        accepted_at: null,
        rejected_at: null,
        updated_at: nowIso,
      }

      if (message || channel !== 'none') {
        updates.owner_response_channel = channel
        updates.owner_response_message = message || null
        updates.owner_response_sent_at = nowIso
      }

      const { data: updated, error: updateError } = await supabase
        .from('catalog_order_requests')
        .update(updates)
        .eq('id', typedRequest.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Failed to reopen request:', updateError)
        return NextResponse.json({ error: 'Failed to reopen request' }, { status: 500 })
      }

      return NextResponse.json({ request: updated })
    }

    if (action === 'convert') {
      if (!typedRequest.linked_order_id) {
        return NextResponse.json(
          { error: 'Only accepted requests with linked orders can be marked converted.' },
          { status: 400 },
        )
      }

      const updates: Record<string, unknown> = {
        status: 'converted',
        updated_at: nowIso,
      }
      if (message || channel !== 'none') {
        updates.owner_response_channel = channel
        updates.owner_response_message = message || null
        updates.owner_response_sent_at = nowIso
      }

      const { data: updated, error: updateError } = await supabase
        .from('catalog_order_requests')
        .update(updates)
        .eq('id', typedRequest.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Failed to convert request:', updateError)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      return NextResponse.json({
        request: updated,
        communicationLink: buildCommunicationLink({
          channel,
          email: typedRequest.requester_email,
          phone: typedRequest.requester_phone,
          subject: 'Catalog request converted',
          message:
            message ||
            `Hello ${typedRequest.requester_name}, your request has been marked as completed.`,
        }),
      })
    }

    if (action === 'reject' || action === 'cancel') {
      if (typedRequest.linked_order_id) {
        return NextResponse.json(
          { error: 'Cannot change this request because it already has a linked order.' },
          { status: 400 },
        )
      }

      const nextStatus = action === 'reject' ? 'rejected' : 'cancelled'
      const fallbackMessage =
        action === 'reject'
          ? `Hello ${typedRequest.requester_name}, your catalog request has been declined.`
          : `Hello ${typedRequest.requester_name}, your catalog request has been cancelled.`

      const { data: updated, error: updateError } = await supabase
        .from('catalog_order_requests')
        .update({
          status: nextStatus,
          owner_response_channel: channel,
          owner_response_message: message || null,
          owner_response_sent_at: nowIso,
          rejected_at: nowIso,
          accepted_at: null,
          updated_at: nowIso,
        })
        .eq('id', typedRequest.id)
        .select('*')
        .single()

      if (updateError) {
        console.error(`Failed to ${action} request:`, updateError)
        return NextResponse.json({ error: `Failed to ${action} request` }, { status: 500 })
      }

      return NextResponse.json({
        request: updated,
        communicationLink: buildCommunicationLink({
          channel,
          email: typedRequest.requester_email,
          phone: typedRequest.requester_phone,
          subject: 'Catalog order request status',
          message: message || fallbackMessage,
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
    const orderNotes = [typedRequest.notes, parsedBody.data.orderNotes?.trim(), message]
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
          estimated_delivery_date: parsedBody.data.estimatedDeliveryDate || null,
          total_price: parsedBody.data.totalPrice ?? item?.price ?? null,
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

    return NextResponse.json({
      request: updatedRequest,
      order: createdOrder,
      communicationLink: buildCommunicationLink({
        channel,
        email: typedRequest.requester_email,
        phone: typedRequest.requester_phone,
        subject: `Order ${createdOrder.order_number} accepted`,
        message:
          message ||
          `Hello ${typedRequest.requester_name}, your catalog request was accepted. Your order number is ${createdOrder.order_number}.`,
      }),
    })
  } catch (error) {
    console.error('Catalog request PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const parsedParams = paramsSchema.safeParse(await context.params)
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid request id' }, { status: 400 })
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
      .select('id, shop_id, linked_order_id')
      .eq('id', parsedParams.data.requestId)
      .maybeSingle()

    if (requestError) {
      console.error('Failed to load catalog request for delete:', requestError)
      return NextResponse.json({ error: 'Failed to load request' }, { status: 500 })
    }
    if (!requestRow) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const typedRequest = requestRow as BasicCatalogRequestRow
    const accessError = await assertCanManageRequest(user.id, typedRequest.shop_id)
    if (accessError) return accessError

    if (typedRequest.linked_order_id) {
      return NextResponse.json(
        { error: 'Cannot delete a request with a linked order. Delete the order first.' },
        { status: 400 },
      )
    }

    const { error: deleteError } = await supabase
      .from('catalog_order_requests')
      .delete()
      .eq('id', typedRequest.id)

    if (deleteError) {
      console.error('Failed to delete catalog request:', deleteError)
      return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Catalog request DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
