/**
 * Shop Awareness System
 * Fetches and caches real-time shop data for intelligent assistant context
 */

import { VoiceSupabase } from '@/lib/voice/db-types'

export interface ShopContextData {
  shopId: string
  shopName?: string
  totalCustomers: number
  recentCustomers: Array<{ id: string; firstName: string; lastName?: string; lastContactDate?: string }>
  pendingOrders: number
  recentOrders: Array<{ id: string; customerName: string; status: string; dueDate?: string }>
  lowStockItems?: number
  busyDays?: string[]
  totalOrders: number
  completedOrders: number
  averageOrderValue?: number
  lastFetchTime: number
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttlSeconds: number
}

const shopContextCache = new Map<string, CacheEntry<ShopContextData>>()
const CACHE_TTL = 60 // seconds

/**
 * Get shop context data for voice assistant
 * Includes current customers, orders, and relevant shop metrics
 */
export async function getShopContext(supabase: VoiceSupabase, shopId: string): Promise<ShopContextData> {
  // Check cache first
  const cached = shopContextCache.get(shopId)
  if (cached && Date.now() - cached.timestamp < cached.ttlSeconds * 1000) {
    return cached.data
  }

  try {
    // Fetch shop name
    const { data: shopData } = await supabase.from('shops').select('name').eq('id', shopId).single()

    // Fetch total customers count
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)

    // Fetch recent customers
    const { data: recentCustomers = [] } = await supabase
      .from('customers')
      .select('id, firstName, lastName, updated_at')
      .eq('shop_id', shopId)
      .order('updated_at', { ascending: false })
      .limit(10)

    // Fetch pending orders count
    const { count: pendingOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .in('status', ['pending', 'in_progress'])

    // Fetch recent orders
    const { data: recentOrders = [] } = await supabase
      .from('orders')
      .select('id, customer:customers(firstName, lastName), status, estimated_delivery_date')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fetch order stats
    const { count: totalOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)

    const { count: completedOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'delivered')

    const shopContext: ShopContextData = {
      shopId,
      shopName: shopData?.name,
      totalCustomers: totalCustomers || 0,
      recentCustomers: recentCustomers.map((c: any) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        lastContactDate: c.updated_at,
      })),
      pendingOrders: pendingOrdersCount || 0,
      recentOrders: (recentOrders || []).map((o: any) => ({
        id: o.id,
        customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName || ''}`.trim() : 'Unknown',
        status: o.status,
        dueDate: o.estimated_delivery_date,
      })),
      totalOrders: totalOrdersCount || 0,
      completedOrders: completedOrdersCount || 0,
      lastFetchTime: Date.now(),
    }

    // Cache the result
    shopContextCache.set(shopId, {
      data: shopContext,
      timestamp: Date.now(),
      ttlSeconds: CACHE_TTL,
    })

    return shopContext
  } catch (error) {
    console.error('Error fetching shop context:', error)
    // Return minimal context on error
    return {
      shopId,
      totalCustomers: 0,
      recentCustomers: [],
      pendingOrders: 0,
      recentOrders: [],
      totalOrders: 0,
      completedOrders: 0,
      lastFetchTime: Date.now(),
    }
  }
}

/**
 * Format shop context for inclusion in LLM prompt
 */
export function formatShopContextForPrompt(context: ShopContextData): string {
  const lines: string[] = []

  if (context.shopName) {
    lines.push(`Shop: ${context.shopName}`)
  }

  lines.push(`Total Customers: ${context.totalCustomers}`)

  if (context.recentCustomers.length > 0) {
    const customerNames = context.recentCustomers
      .slice(0, 5)
      .map((c) => `${c.firstName}${c.lastName ? ` ${c.lastName}` : ''}`)
      .join(', ')
    lines.push(`Recent Customers: ${customerNames}`)
  }

  lines.push(`Pending Orders: ${context.pendingOrders}`)
  lines.push(`Total Orders: ${context.totalOrders} (Completed: ${context.completedOrders})`)

  if (context.recentOrders.length > 0) {
    const orderSummary = context.recentOrders
      .slice(0, 3)
      .map((o) => `${o.customerName} - ${o.status}`)
      .join('; ')
    lines.push(`Recent Orders: ${orderSummary}`)
  }

  return lines.join('\n')
}

/**
 * Generate intelligent suggestions based on shop context
 */
export function generateShopSuggestions(context: ShopContextData): string[] {
  const suggestions: string[] = []

  if (context.pendingOrders > 5) {
    suggestions.push(`You have ${context.pendingOrders} pending orders. Would you like to update their status?`)
  }

  if (context.recentCustomers.length > 0) {
    const oldestCustomer = context.recentCustomers[context.recentCustomers.length - 1]
    suggestions.push(
      `It's been a while since you heard from ${oldestCustomer.firstName}. Consider reaching out.`,
    )
  }

  if (context.totalCustomers === 0) {
    suggestions.push('Your shop has no customers yet. Start by adding your first customer.')
  }

  return suggestions
}

/**
 * Clear shop context cache
 */
export function clearShopContextCache(shopId?: string) {
  if (shopId) {
    shopContextCache.delete(shopId)
  } else {
    shopContextCache.clear()
  }
}
