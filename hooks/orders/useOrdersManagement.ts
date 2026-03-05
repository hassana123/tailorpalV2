'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type {
  CatalogActionPayload,
  CatalogOrderRequest,
  CustomerOption,
  EditOrderFormState,
  Order,
  OrderFormState,
  OrderStatus,
} from '@/app/dashboard/shop/[shopId]/orders/types'

interface UseOrdersManagementOptions {
  shopId: string
}

interface UseOrdersManagementReturn {
  orders: Order[]
  catalogOrderRequests: CatalogOrderRequest[]
  customers: CustomerOption[]
  loading: boolean
  isSubmitting: boolean
  refreshData: () => Promise<void>
  createOrder: (payload: OrderFormState) => Promise<boolean>
  updateOrder: (orderId: string, payload: EditOrderFormState) => Promise<boolean>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>
  deleteOrder: (orderId: string) => Promise<boolean>
  applyCatalogAction: (
    requestId: string,
    payload: CatalogActionPayload,
  ) => Promise<{ communicationLink?: string | null } | null>
  deleteCatalogRequest: (requestId: string) => Promise<boolean>
}

export function useOrdersManagement({
  shopId,
}: UseOrdersManagementOptions): UseOrdersManagementReturn {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [catalogOrderRequests, setCatalogOrderRequests] = useState<CatalogOrderRequest[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!shopId) return

    try {
      setLoading(true)
      const [ordersRes, customersRes, requestsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, customers(id, first_name, last_name)')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('customers')
          .select('id, first_name, last_name')
          .eq('shop_id', shopId)
          .order('first_name', { ascending: true }),
        supabase
          .from('catalog_order_requests')
          .select(
            'id, requester_name, requester_email, requester_phone, notes, status, created_at, updated_at, linked_order_id, owner_response_channel, owner_response_message, owner_response_sent_at, accepted_at, rejected_at, shop_catalog_items(name, price)',
          )
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
      ])

      if (ordersRes.error) throw ordersRes.error
      if (customersRes.error) throw customersRes.error
      if (requestsRes.error) throw requestsRes.error

      const normalizedOrders = (ordersRes.data ?? []).map((order) => {
        const relation = order.customers as CustomerOption | CustomerOption[] | null | undefined
        const customer = Array.isArray(relation) ? relation[0] ?? null : relation ?? null
        return { ...order, customers: customer } as Order
      })

      setOrders(normalizedOrders)
      setCustomers((customersRes.data ?? []) as CustomerOption[])
      setCatalogOrderRequests((requestsRes.data ?? []) as CatalogOrderRequest[])
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [shopId, supabase])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const createOrder = useCallback(
    async (payload: OrderFormState) => {
      if (!payload.customerId || !payload.designDescription.trim()) {
        toast.error('Customer and design description are required')
        return false
      }

      try {
        setIsSubmitting(true)
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId,
            customerId: payload.customerId,
            designDescription: payload.designDescription,
            estimatedDeliveryDate: payload.estimatedDeliveryDate || undefined,
            totalPrice: payload.totalPrice ? Number.parseFloat(payload.totalPrice) : undefined,
            notes: payload.notes || undefined,
          }),
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Failed to create order')

        toast.success('Order created successfully')
        await fetchData()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create order')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [fetchData, shopId],
  )

  const updateOrder = useCallback(
    async (orderId: string, payload: EditOrderFormState) => {
      if (!payload.designDescription.trim()) {
        toast.error('Design description is required')
        return false
      }

      try {
        setIsSubmitting(true)
        const parsedPrice = payload.totalPrice.trim() ? Number.parseFloat(payload.totalPrice) : null
        const { error } = await supabase
          .from('orders')
          .update({
            status: payload.status,
            design_description: payload.designDescription.trim(),
            estimated_delivery_date: payload.estimatedDeliveryDate || null,
            total_price: Number.isFinite(parsedPrice) ? parsedPrice : null,
            notes: payload.notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (error) throw error

        toast.success('Order updated')
        await fetchData()
        return true
      } catch {
        toast.error('Failed to update order')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [fetchData, supabase],
  )

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        setIsSubmitting(true)
        const { error } = await supabase
          .from('orders')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (error) throw error

        toast.success('Order status updated')
        await fetchData()
        return true
      } catch {
        toast.error('Failed to update status')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [fetchData, supabase],
  )

  const deleteOrder = useCallback(
    async (orderId: string) => {
      try {
        setIsSubmitting(true)
        const { error } = await supabase.from('orders').delete().eq('id', orderId)
        if (error) throw error

        toast.success('Order deleted')
        await fetchData()
        return true
      } catch {
        toast.error('Failed to delete order')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [fetchData, supabase],
  )

  const applyCatalogAction = useCallback(
    async (requestId: string, payload: CatalogActionPayload) => {
      try {
        setIsSubmitting(true)
        const response = await fetch(`/api/catalog/order-request/${requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Failed to process request')

        await fetchData()
        return body as { communicationLink?: string | null }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to process request')
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [fetchData],
  )

  const deleteCatalogRequest = useCallback(
    async (requestId: string) => {
      try {
        setIsSubmitting(true)
        const response = await fetch(`/api/catalog/order-request/${requestId}`, {
          method: 'DELETE',
        })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Failed to delete request')

        toast.success('Catalog request deleted')
        await fetchData()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete request')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [fetchData],
  )

  return {
    orders,
    catalogOrderRequests,
    customers,
    loading,
    isSubmitting,
    refreshData: fetchData,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    applyCatalogAction,
    deleteCatalogRequest,
  }
}
