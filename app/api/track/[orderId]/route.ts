import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface Params {
  params: Promise<{ orderId: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { orderId } = await params
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Query order by UUID or order_number
    let query = supabase
      .from('orders')
      .select(
        `id,
        order_number,
        status,
        design_description,
        fabric_details,
        estimated_delivery_date,
        total_price,
        created_at,
        notes,
        shop_id,
        customers (
          first_name,
          last_name
        ),
        shops (
          id,
          name,
          phone,
          email,
          city,
          state,
          address,
          logo_url
        )`
      )

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)

    if (isUuid) {
      query = query.eq('id', orderId)
    } else {
      query = query.eq('order_number', orderId)
    }

    const { data: order, error } = await query.maybeSingle()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { data: productionTasks } = await supabase
      .from('production_tasks')
      .select('status,production_stages(name,position)')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })
    const taskRows = (productionTasks ?? []) as unknown as { status: string; production_stages: { name: string; position: number } | null }[]
    const completedTasks = taskRows.filter((task) => task.status === 'done').length
    const activeTask = taskRows.find((task) => task.status === 'in_progress') || taskRows.find((task) => task.status !== 'done')

    // Extract any structured metadata from notes or fields safely
    let depositAmount: number | null = null
    let fittingDate: string | null = null

    // If order has deposit_amount or fitting_date directly in row (from optional migration)
    const rawOrder = order as Record<string, unknown>
    if (typeof rawOrder.deposit_amount === 'number') {
      depositAmount = rawOrder.deposit_amount
    }
    if (typeof rawOrder.fitting_date === 'string') {
      fittingDate = rawOrder.fitting_date
    }

    // Also check notes for deposit/fitting pattern if column not set
    if (depositAmount === null && typeof order.notes === 'string') {
      const depMatch = order.notes.match(/deposit[:\s]+(?:₦|NGN|\$)?([0-9,]+)/i)
      if (depMatch) {
        depositAmount = parseFloat(depMatch[1].replace(/,/g, ''))
      }
      const fitMatch = order.notes.match(/fitting[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})/i)
      if (fitMatch) {
        fittingDate = fitMatch[1]
      }
    }

    const publicTrackingData = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      designDescription: order.design_description,
      fabricDetails: order.fabric_details,
      estimatedDeliveryDate: order.estimated_delivery_date,
      fittingDate,
      totalPrice: order.total_price,
      depositAmount,
      balanceDue:
        order.total_price !== null && depositAmount !== null
          ? Math.max(0, order.total_price - depositAmount)
          : null,
      createdAt: order.created_at,
      customerFirstName: (order.customers as { first_name?: string } | null)?.first_name || 'Valued Client',
      currentStage: activeTask?.production_stages?.name || (order.status === 'completed' || order.status === 'delivered' ? 'Ready for Pickup' : 'Order confirmed'),
      productionProgress: taskRows.length ? Math.round((completedTasks / taskRows.length) * 100) : null,
      shop: order.shops,
    }

    return NextResponse.json({ tracking: publicTrackingData }, { status: 200 })
  } catch (error) {
    console.error('Error in track route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
