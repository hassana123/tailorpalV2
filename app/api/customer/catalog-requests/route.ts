import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RequestRow = {
  id: string
  shop_id: string
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
  owner_response_channel: 'email' | 'whatsapp' | 'none' | null
  owner_response_message: string | null
  owner_response_sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  linked_order_id: string | null
  shops:
    | {
        name: string
        logo_url: string | null
      }
    | {
        name: string
        logo_url: string | null
      }[]
    | null
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

type OrderRow = {
  id: string
  order_number: string
  status: string
  estimated_delivery_date: string | null
  total_price: number | null
  updated_at: string
}

function firstRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: requestRows, error: requestError } = await admin
      .from('catalog_order_requests')
      .select(
        'id, shop_id, requester_name, requester_email, requester_phone, notes, status, created_at, updated_at, owner_response_channel, owner_response_message, owner_response_sent_at, accepted_at, rejected_at, linked_order_id, shops(name, logo_url), shop_catalog_items(name, price, image_url)',
      )
      .eq('customer_user_id', user.id)
      .order('created_at', { ascending: false })

    if (requestError) {
      console.error('Failed to load customer catalog requests:', requestError)
      return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
    }

    const typedRequests = (requestRows ?? []) as RequestRow[]
    const linkedOrderIds = typedRequests
      .map((row) => row.linked_order_id)
      .filter((value): value is string => Boolean(value))

    let orderById: Record<string, OrderRow> = {}
    if (linkedOrderIds.length > 0) {
      const { data: orderRows, error: orderError } = await admin
        .from('orders')
        .select('id, order_number, status, estimated_delivery_date, total_price, updated_at')
        .in('id', linkedOrderIds)

      if (orderError) {
        console.error('Failed to load linked orders for customer requests:', orderError)
        return NextResponse.json({ error: 'Failed to load request progress' }, { status: 500 })
      }

      orderById = (orderRows ?? []).reduce<Record<string, OrderRow>>((acc, row) => {
        acc[row.id] = row as OrderRow
        return acc
      }, {})
    }

    return NextResponse.json({
      requests: typedRequests.map((row) => ({
        ...row,
        shop: firstRelation(row.shops),
        catalog_item: firstRelation(row.shop_catalog_items),
        order: row.linked_order_id ? (orderById[row.linked_order_id] ?? null) : null,
      })),
    })
  } catch (error) {
    console.error('Customer catalog requests endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
