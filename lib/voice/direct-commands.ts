import {
  findCustomerByName,
  getPendingOrders,
  getRecentOrders,
  getShopStats,
  listCustomers,
} from '@/lib/voice/db-read'
import { extractNameQuery } from '@/lib/voice/parsers'
import { VOICE_HELP_TEXT } from '@/lib/voice/replies'
import { VoiceSupabase } from '@/lib/voice/db-types'
import { VoiceIntent, VoiceReply } from '@/lib/voice/types'

export async function runDirectCommand(
  supabase: VoiceSupabase,
  shopId: string,
  intent: VoiceIntent,
  message: string,
): Promise<VoiceReply | null> {
  if (intent === 'help_request') return { reply: VOICE_HELP_TEXT }

  if (intent === 'list_customers') {
    const customers = await listCustomers(supabase, shopId, 12)
    if (!customers.length) {
      return { reply: 'You have no customers yet. Say "add customer" to create one.' }
    }

    const lines = customers
      .map((customer, index) => {
        const phone = customer.phone ? ` (${customer.phone})` : ''
        return `${index + 1}. ${customer.first_name} ${customer.last_name}${phone}`
      })
      .join('\n')

    return { reply: `Here are your customers:\n${lines}`, action: 'list_customers' }
  }

  if (intent === 'find_customer') {
    const query = extractNameQuery(message)
    if (!query) return { reply: 'Please say the name to search. Example: "find customer Jane".' }

    const matches = await findCustomerByName(supabase, shopId, query, 6)
    if (!matches.length) return { reply: `No customer found for "${query}".` }

    const lines = matches
      .map((customer) => `${customer.first_name} ${customer.last_name}`)
      .join('\n')

    return { reply: `Found ${matches.length} matching customer(s):\n${lines}`, action: 'find_customer' }
  }

  if (intent === 'list_orders') {
    const orders = await getRecentOrders(supabase, shopId, 8)
    if (!orders.length) {
      return { reply: 'No orders yet. Say "create order" to start a new one.' }
    }

    const lines = orders
      .map((order) => {
        const rel = Array.isArray(order.customers) ? order.customers[0] : order.customers
        const customerName = rel ? `${rel.first_name} ${rel.last_name}` : 'Unknown customer'
        return `- ${order.order_number} | ${customerName} | ${order.status}`
      })
      .join('\n')

    return { reply: `Recent orders:\n${lines}`, action: 'list_orders' }
  }

  if (intent === 'pending_orders') {
    const orders = await getPendingOrders(supabase, shopId, 10)
    if (!orders.length) return { reply: 'Great news. No pending or in-progress orders right now.' }

    const lines = orders
      .map((order) => {
        const rel = Array.isArray(order.customers) ? order.customers[0] : order.customers
        const customerName = rel ? `${rel.first_name} ${rel.last_name}` : 'Unknown customer'
        const due = order.estimated_delivery_date ? ` | due ${order.estimated_delivery_date}` : ''
        return `- ${order.order_number} | ${customerName}${due}`
      })
      .join('\n')

    return { reply: `Pending or in-progress orders:\n${lines}`, action: 'pending_orders' }
  }

  if (intent === 'shop_stats') {
    const stats = await getShopStats(supabase, shopId)
    return {
      reply: `Shop summary:
- Customers: ${stats.customers}
- Total orders: ${stats.orders}
- Pending/in-progress orders: ${stats.pending}
- Completed orders: ${stats.completed}
- Measurement records: ${stats.measurements}`,
      action: 'shop_stats',
    }
  }

  return null
}
