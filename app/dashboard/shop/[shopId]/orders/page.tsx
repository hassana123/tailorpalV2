'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface CustomerOption {
  id: string
  first_name: string
  last_name: string
}

interface Order {
  id: string
  shop_id: string
  customer_id: string
  order_number: string
  design_description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
  estimated_delivery_date?: string | null
  created_at: string
  customers?: CustomerOption | null
}

interface CatalogOrderRequest {
  id: string
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  notes: string | null
  status: 'pending' | 'contacted' | 'converted' | 'cancelled'
  created_at: string
  shop_catalog_items:
    | {
        name: string
        price: number
      }
    | {
        name: string
        price: number
      }[]
    | null
}

export default function OrdersPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [catalogOrderRequests, setCatalogOrderRequests] = useState<CatalogOrderRequest[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    designDescription: '',
    estimatedDeliveryDate: '',
    totalPrice: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [shopId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ordersResponse, customersResponse, requestsResponse] = await Promise.all([
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
          .select('*, shop_catalog_items(name, price)')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
      ])

      if (ordersResponse.error) {
        throw ordersResponse.error
      }
      if (customersResponse.error) {
        throw customersResponse.error
      }
      const normalizedOrders = (ordersResponse.data ?? []).map((order) => {
        const relation = order.customers as CustomerOption | CustomerOption[] | null | undefined
        const customer = Array.isArray(relation) ? relation[0] ?? null : relation ?? null
        return { ...order, customers: customer } as Order
      })

      setOrders(normalizedOrders)
      setCustomers((customersResponse.data ?? []) as CustomerOption[])
      if (requestsResponse.error) {
        console.error('Error loading catalog order requests:', requestsResponse.error)
        setCatalogOrderRequests([])
      } else {
        setCatalogOrderRequests((requestsResponse.data ?? []) as CatalogOrderRequest[])
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async () => {
    if (!newOrder.customerId || !newOrder.designDescription.trim()) {
      toast.error('Customer and design description are required')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerId: newOrder.customerId,
          designDescription: newOrder.designDescription,
          estimatedDeliveryDate: newOrder.estimatedDeliveryDate || undefined,
          totalPrice: newOrder.totalPrice ? Number.parseFloat(newOrder.totalPrice) : undefined,
          notes: newOrder.notes || undefined,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to create order')
      }

      setShowForm(false)
      setNewOrder({
        customerId: '',
        designDescription: '',
        estimatedDeliveryDate: '',
        totalPrice: '',
        notes: '',
      })
      await fetchData()
      toast.success('Order created')
    } catch (err) {
      console.error('Error creating order:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-2">Track and manage customer orders</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Close' : 'New Order'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={newOrder.customerId}
                onChange={(event) => setNewOrder((prev) => ({ ...prev, customerId: event.target.value }))}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Design Description</label>
              <Textarea
                className="mt-1"
                value={newOrder.designDescription}
                onChange={(event) =>
                  setNewOrder((prev) => ({ ...prev, designDescription: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Estimated Delivery Date</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={newOrder.estimatedDeliveryDate}
                  onChange={(event) =>
                    setNewOrder((prev) => ({ ...prev, estimatedDeliveryDate: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Total Price</label>
                <Input
                  type="number"
                  className="mt-1"
                  value={newOrder.totalPrice}
                  onChange={(event) => setNewOrder((prev) => ({ ...prev, totalPrice: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                className="mt-1"
                value={newOrder.notes}
                onChange={(event) => setNewOrder((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            <Button onClick={createOrder} disabled={creating}>
              {creating ? 'Creating...' : 'Create Order'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>Total: {orders.length} orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {order.customers?.first_name} {order.customers?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{order.design_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">#{order.order_number}</p>
                    {order.estimated_delivery_date && (
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(order.estimated_delivery_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Catalog Order Requests</CardTitle>
          <CardDescription>
            Requests submitted by marketplace visitors from catalog items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {catalogOrderRequests.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No catalog requests yet.</p>
          ) : (
            <div className="space-y-4">
              {catalogOrderRequests.map((request) => {
                const item = Array.isArray(request.shop_catalog_items)
                  ? request.shop_catalog_items[0] ?? null
                  : request.shop_catalog_items
                return (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{request.requester_name}</p>
                      <Badge>{request.status}</Badge>
                    </div>
                    {item && (
                      <p className="text-sm text-muted-foreground">
                        Item: {item.name} (${item.price.toFixed(2)})
                      </p>
                    )}
                    {request.requester_email && (
                      <p className="text-sm text-muted-foreground">
                        Email: {request.requester_email}
                      </p>
                    )}
                    {request.requester_phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {request.requester_phone}
                      </p>
                    )}
                    {request.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{request.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
