'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { TableAction, TableActionVariant } from '@/components/dashboard/shared/table-actions'
import {
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle2,
  TruckIcon,
  XCircle,
  Loader2,
  Calendar,
  Hash,
  Mail,
  Phone,
  Tag,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  fabric_details?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
  estimated_delivery_date?: string | null
  total_price?: number | null
  notes?: string | null
  created_at: string
  updated_at?: string
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
  shop_catalog_items: { name: string; price: number } | { name: string; price: number }[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Order['status'], { label: string; className: string; Icon: React.ElementType }> = {
  pending:     { label: 'Pending',     className: 'bg-amber-100 text-amber-700',   Icon: Clock        },
  in_progress: { label: 'In Progress', className: 'bg-sky-100 text-sky-700',       Icon: Loader2      },
  completed:   { label: 'Completed',   className: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  delivered:   { label: 'Delivered',   className: 'bg-green-100 text-green-700',   Icon: TruckIcon    },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-100 text-red-700',       Icon: XCircle      },
}

const REQUEST_STATUS_STYLES: Record<CatalogOrderRequest['status'], string> = {
  pending:   'bg-amber-100 text-amber-700',
  contacted: 'bg-sky-100 text-sky-700',
  converted: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const supabase = createClient()

  const [orders, setOrders]                           = useState<Order[]>([])
  const [catalogOrderRequests, setCatalogOrderRequests] = useState<CatalogOrderRequest[]>([])
  const [customers, setCustomers]                     = useState<CustomerOption[]>([])
  const [loading, setLoading]                         = useState(true)

  // Modals
  const [addModalOpen, setAddModalOpen]               = useState(false)
  const [requestDetailOpen, setRequestDetailOpen]     = useState(false)
  const [orderDetailOpen, setOrderDetailOpen]         = useState(false)
  const [editOrderOpen, setEditOrderOpen]             = useState(false)
  const [selectedRequest, setSelectedRequest]         = useState<CatalogOrderRequest | null>(null)
  const [selectedOrder, setSelectedOrder]             = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState({
    status: 'pending' as Order['status'],
    designDescription: '',
    estimatedDeliveryDate: '',
    totalPrice: '',
    notes: '',
  })

  // Form
  const [isSubmitting, setIsSubmitting]               = useState(false)
  const [newOrder, setNewOrder] = useState({
    customerId: '', designDescription: '', estimatedDeliveryDate: '', totalPrice: '', notes: '',
  })

  // Action modals for catalog requests
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'contact' | null>(null)
  const [actionRequest, setActionRequest] = useState<CatalogOrderRequest | null>(null)
  const [actionChannel, setActionChannel] = useState<'email' | 'whatsapp' | 'none'>('none')
  const [actionMessage, setActionMessage] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  const [totalPrice, setTotalPrice] = useState('')

  // Quick status update for orders
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusOrder, setStatusOrder] = useState<Order | null>(null)

  useEffect(() => { fetchData() }, [shopId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [oRes, cRes, rRes] = await Promise.all([
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
      if (oRes.error) throw oRes.error
      if (cRes.error) throw cRes.error

      const normalizedOrders = (oRes.data ?? []).map((order) => {
        const rel = order.customers as CustomerOption | CustomerOption[] | null | undefined
        const customer = Array.isArray(rel) ? rel[0] ?? null : rel ?? null
        return { ...order, customers: customer } as Order
      })
      setOrders(normalizedOrders)
      setCustomers((cRes.data ?? []) as CustomerOption[])
      setCatalogOrderRequests(rRes.error ? [] : (rRes.data ?? []) as CatalogOrderRequest[])
    } catch (err) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!newOrder.customerId || !newOrder.designDescription.trim()) {
      toast.error('Customer and design description are required')
      return
    }
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerId: newOrder.customerId,
          designDescription: newOrder.designDescription,
          estimatedDeliveryDate: newOrder.estimatedDeliveryDate || undefined,
          totalPrice: newOrder.totalPrice ? parseFloat(newOrder.totalPrice) : undefined,
          notes: newOrder.notes || undefined,
        }),
      })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || 'Failed to create order')
      }
      toast.success('Order created successfully!')
      setNewOrder({ customerId: '', designDescription: '', estimatedDeliveryDate: '', totalPrice: '', notes: '' })
      setAddModalOpen(false)
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setOrderDetailOpen(true)
  }

  const openEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setEditOrder({
      status: order.status,
      designDescription: order.design_description ?? '',
      estimatedDeliveryDate: order.estimated_delivery_date ?? '',
      totalPrice: order.total_price?.toString() ?? '',
      notes: order.notes ?? '',
    })
    setEditOrderOpen(true)
  }

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return
    if (!editOrder.designDescription.trim()) {
      toast.error('Design description is required')
      return
    }

    try {
      setIsSubmitting(true)
      const parsedPrice = editOrder.totalPrice.trim()
        ? Number.parseFloat(editOrder.totalPrice)
        : null

      const { error } = await supabase
        .from('orders')
        .update({
          status: editOrder.status,
          design_description: editOrder.designDescription.trim(),
          estimated_delivery_date: editOrder.estimatedDeliveryDate || null,
          total_price: Number.isFinite(parsedPrice) ? parsedPrice : null,
          notes: editOrder.notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrder.id)

      if (error) throw error

      toast.success('Order updated')
      setEditOrderOpen(false)
      await fetchData()
    } catch (err) {
      toast.error('Failed to update order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`Delete order #${order.order_number}?`)) return

    try {
      const { error } = await supabase.from('orders').delete().eq('id', order.id)
      if (error) throw error
      toast.success('Order deleted')
      await fetchData()
    } catch (err) {
      toast.error('Failed to delete order')
    }
  }

  // Open action modal for catalog request
  const openActionModal = (request: CatalogOrderRequest, action: 'accept' | 'reject' | 'contact') => {
    setActionRequest(request)
    setActionType(action)
    setActionChannel('none')
    setActionMessage('')
    const item = Array.isArray(request.shop_catalog_items)
      ? request.shop_catalog_items[0] ?? null
      : request.shop_catalog_items
    setTotalPrice(item?.price?.toString() ?? '')
    setActionModalOpen(true)
  }

  // Handle action on catalog request (accept, reject, contact)
  const handleCatalogAction = async () => {
    if (!actionRequest || !actionType) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/catalog/order-request/${actionRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          channel: actionChannel,
          message: actionMessage || undefined,
          estimatedDeliveryDate: actionType === 'accept' && estimatedDeliveryDate ? estimatedDeliveryDate : undefined,
          totalPrice: actionType === 'accept' && totalPrice ? parseFloat(totalPrice) : undefined,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to process request')
      }

      // If there's a communication link, open it
      if (payload.communicationLink) {
        window.open(payload.communicationLink, '_blank')
      }

      toast.success(
        actionType === 'accept' ? 'Request accepted and order created!' :
        actionType === 'reject' ? 'Request rejected' : 'Request marked as contacted'
      )
      setActionModalOpen(false)
      await fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process request')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick status update - open modal when clicking on status
  const openStatusModal = (order: Order) => {
    setStatusOrder(order)
    setStatusModalOpen(true)
  }

  // Handle quick status update
  const handleStatusUpdate = async () => {
    if (!statusOrder) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('orders')
        .update({
          status: statusOrder.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', statusOrder.id)

      if (error) throw error

      toast.success('Order status updated')
      setStatusModalOpen(false)
      await fetchData()
    } catch (err) {
      toast.error('Failed to update status')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Orders table columns ───────────────────────────────────────────────

  const orderColumns = [
    {
      key: 'order',
      header: 'Order',
      cell: (order: Order) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">
              {order.customers?.first_name?.[0]}{order.customers?.last_name?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink truncate">
              {order.customers?.first_name} {order.customers?.last_name}
            </p>
            <p className="text-xs text-brand-stone flex items-center gap-1">
              <Hash size={10} />#{order.order_number}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (o: Order) => `${o.customers?.first_name ?? ''} ${o.customers?.last_name ?? ''}`,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (order: Order) => (
        <p className="text-sm text-brand-stone truncate max-w-[200px]">
          {order.design_description || '—'}
        </p>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'delivery',
      header: 'Due Date',
      cell: (order: Order) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-stone">
          <Calendar size={12} />
          {order.estimated_delivery_date
            ? new Date(order.estimated_delivery_date).toLocaleDateString()
            : '—'}
        </div>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (order: Order) => {
        const s = STATUS_STYLES[order.status]
        return (
          <button
            onClick={(e) => { e.stopPropagation(); openStatusModal(order) }}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity',
              s.className
            )}
            title="Click to change status"
          >
            <s.Icon size={11} />
            {s.label}
          </button>
        )
      },
    },
  ]

  // ─── Catalog requests table columns ────────────────────────────────────

  const requestColumns = [
    {
      key: 'requester',
      header: 'Requester',
      cell: (r: CatalogOrderRequest) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-gold">
              {r.requester_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink">{r.requester_name}</p>
            <p className="text-xs text-brand-stone">
              {new Date(r.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (r: CatalogOrderRequest) => r.requester_name,
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (r: CatalogOrderRequest) => (
        <div className="space-y-1">
          {r.requester_email && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Mail size={11} />{r.requester_email}
            </div>
          )}
          {r.requester_phone && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Phone size={11} />{r.requester_phone}
            </div>
          )}
        </div>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'item',
      header: 'Item',
      cell: (r: CatalogOrderRequest) => {
        const item = Array.isArray(r.shop_catalog_items)
          ? r.shop_catalog_items[0] ?? null : r.shop_catalog_items
        return item ? (
          <div className="flex items-center gap-1.5 text-xs text-brand-stone">
            <Tag size={11} />{item.name} · ${item.price.toFixed(2)}
          </div>
        ) : <span className="text-xs text-brand-stone/60">—</span>
      },
      hiddenOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (r: CatalogOrderRequest) => (
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', REQUEST_STATUS_STYLES[r.status])}>
          {r.status}
        </span>
      ),
    },
  ]

  const orderActions = (order: Order): TableAction[] => [
    {
      label: 'View Details',
      onClick: () => openOrderDetails(order),
      variant: 'default',
    },
    {
      label: 'Edit',
      onClick: () => openEditOrder(order),
      variant: 'outline',
    },
    {
      label: 'Delete',
      onClick: () => handleDeleteOrder(order),
      variant: 'destructive',
    },
  ]

  const requestActions = (r: CatalogOrderRequest): TableAction[] => {
    const actions: TableAction[] = [
      {
        label: 'View Details',
        onClick: () => { setSelectedRequest(r); setRequestDetailOpen(true) },
        variant: 'default',
      },
    ]

    // Only show action buttons for pending requests
    if (r.status === 'pending') {
      actions.unshift(
        {
          label: 'Accept',
          onClick: () => openActionModal(r, 'accept'),
          variant: 'default' as TableActionVariant,
        },
        {
          label: 'Reject',
          onClick: () => openActionModal(r, 'reject'),
          variant: 'destructive',
        },
        {
          label: 'Contact',
          onClick: () => openActionModal(r, 'contact'),
          variant: 'outline',
        }
      )
    }

    return actions
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  const activeOrders     = orders.filter((o) => o.status === 'in_progress').length
  const completedOrders  = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length
  const pendingRequests  = catalogOrderRequests.filter((r) => r.status === 'pending').length

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-brand-gold" />
            Orders
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Track and manage customer orders
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Orders"       value={orders.length}         icon={ShoppingCart}  color="bg-sky-100 text-sky-600"       />
        <StatCard label="Active"             value={activeOrders}          icon={Loader2}       color="bg-sky-100 text-sky-600"       />
        <StatCard label="Completed"          value={completedOrders}       icon={CheckCircle2}  color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Catalog Requests"   value={pendingRequests}       icon={Tag}           color="bg-amber-100 text-amber-600"   />
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">All Orders</h2>
          <p className="text-xs text-brand-stone mt-0.5">{orders.length} total orders</p>
        </div>
        <DataTable
          data={orders}
          columns={orderColumns}
          keyExtractor={(o) => o.id}
          searchKeys={['order_number', 'design_description']}
          emptyMessage="No orders yet. Create your first order to get started."
          actions={orderActions}
        />
      </div>

      {/* Catalog requests table */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">Catalog Order Requests</h2>
          <p className="text-xs text-brand-stone mt-0.5">
            Requests submitted by marketplace visitors from catalog items
          </p>
        </div>
        <DataTable
          data={catalogOrderRequests}
          columns={requestColumns}
          keyExtractor={(r) => r.id}
          searchKeys={['requester_name', 'requester_email', 'requester_phone']}
          emptyMessage="No catalog requests yet."
          actions={requestActions}
        />
      </div>

      {/* Create Order Modal */}
      <ModalForm
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        title="Create New Order"
        description="Enter order details below. All fields marked with * are required."
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
        submitLabel="Create Order"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Customer *</Label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
              value={newOrder.customerId}
              onChange={(e) => setNewOrder((p) => ({ ...p, customerId: e.target.value }))}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Design Description *</Label>
            <Textarea
              value={newOrder.designDescription}
              onChange={(e) => setNewOrder((p) => ({ ...p, designDescription: e.target.value }))}
              placeholder="Describe the garment design, fabric, style requirements…"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Delivery Date</Label>
              <Input
                type="date"
                value={newOrder.estimatedDeliveryDate}
                onChange={(e) => setNewOrder((p) => ({ ...p, estimatedDeliveryDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newOrder.totalPrice}
                onChange={(e) => setNewOrder((p) => ({ ...p, totalPrice: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={newOrder.notes}
              onChange={(e) => setNewOrder((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional notes…"
              rows={3}
            />
          </div>
        </div>
      </ModalForm>

      {/* Catalog Request Detail Modal */}
      {selectedOrder && (
        <ModalForm
          open={orderDetailOpen}
          onOpenChange={setOrderDetailOpen}
          title={`Order #${selectedOrder.order_number}`}
          description={`${selectedOrder.customers?.first_name ?? ''} ${selectedOrder.customers?.last_name ?? ''}`.trim()}
          hideFooter
          maxWidth="md"
        >
          {(() => {
            const statusStyle = STATUS_STYLES[selectedOrder.status]
            const StatusIcon = statusStyle.Icon
            return (
          <div className="space-y-4">
            <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-4 space-y-2.5">
              <div className="text-sm text-brand-stone">
                <span className="font-semibold text-brand-ink">Created:</span>{' '}
                {new Date(selectedOrder.created_at).toLocaleString()}
              </div>
              <div className="text-sm text-brand-stone">
                <span className="font-semibold text-brand-ink">Due date:</span>{' '}
                {selectedOrder.estimated_delivery_date
                  ? new Date(selectedOrder.estimated_delivery_date).toLocaleDateString()
                  : '—'}
              </div>
              <div className="text-sm text-brand-stone">
                <span className="font-semibold text-brand-ink">Price:</span>{' '}
                {selectedOrder.total_price ? `$${selectedOrder.total_price.toFixed(2)}` : '—'}
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                  statusStyle.className
                )}
              >
                <StatusIcon size={11} />
                {statusStyle.label}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">
                Design Description
              </p>
              <p className="text-sm text-brand-charcoal leading-relaxed">
                {selectedOrder.design_description || '—'}
              </p>
            </div>
            {selectedOrder.notes && (
              <div>
                <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-brand-charcoal leading-relaxed">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
            )
          })()}
        </ModalForm>
      )}

      {selectedOrder && (
        <ModalForm
          open={editOrderOpen}
          onOpenChange={setEditOrderOpen}
          title={`Edit Order #${selectedOrder.order_number}`}
          description="Update order details"
          onSubmit={handleUpdateOrder}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
                value={editOrder.status}
                onChange={(e) => setEditOrder((p) => ({ ...p, status: e.target.value as Order['status'] }))}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Design Description *</Label>
              <Textarea
                rows={4}
                value={editOrder.designDescription}
                onChange={(e) => setEditOrder((p) => ({ ...p, designDescription: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Delivery Date</Label>
                <Input
                  type="date"
                  value={editOrder.estimatedDeliveryDate}
                  onChange={(e) => setEditOrder((p) => ({ ...p, estimatedDeliveryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Price</Label>
                <Input
                  type="number"
                  value={editOrder.totalPrice}
                  onChange={(e) => setEditOrder((p) => ({ ...p, totalPrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={editOrder.notes}
                onChange={(e) => setEditOrder((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
        </ModalForm>
      )}

      {selectedRequest && (
        <ModalForm
          open={requestDetailOpen}
          onOpenChange={setRequestDetailOpen}
          title={`Request — ${selectedRequest.requester_name}`}
          description="Marketplace catalog order request details"
          hideFooter
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-4 space-y-2.5">
              {selectedRequest.requester_email && (
                <div className="flex items-center gap-2.5 text-sm text-brand-stone">
                  <Mail size={14} className="text-brand-gold" />
                  {selectedRequest.requester_email}
                </div>
              )}
              {selectedRequest.requester_phone && (
                <div className="flex items-center gap-2.5 text-sm text-brand-stone">
                  <Phone size={14} className="text-brand-gold" />
                  {selectedRequest.requester_phone}
                </div>
              )}
              {(() => {
                const item = Array.isArray(selectedRequest.shop_catalog_items)
                  ? selectedRequest.shop_catalog_items[0] ?? null
                  : selectedRequest.shop_catalog_items
                return item ? (
                  <div className="flex items-center gap-2.5 text-sm text-brand-stone">
                    <Tag size={14} className="text-brand-gold" />
                    {item.name} · ${item.price.toFixed(2)}
                  </div>
                ) : null
              })()}
              <div className="flex items-center gap-2.5 text-sm text-brand-stone">
                <Calendar size={14} className="text-brand-gold" />
                {new Date(selectedRequest.created_at).toLocaleString()}
              </div>
            </div>
            {selectedRequest.notes && (
              <div>
                <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-brand-charcoal leading-relaxed">{selectedRequest.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Status</p>
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', REQUEST_STATUS_STYLES[selectedRequest.status])}>
                {selectedRequest.status}
              </span>
            </div>
          </div>
        </ModalForm>
      )}

      {/* Action Modal for Catalog Request (Accept/Reject/Contact) */}
      {actionRequest && actionType && (
        <ModalForm
          open={actionModalOpen}
          onOpenChange={setActionModalOpen}
          title={
            actionType === 'accept' ? 'Accept Request' :
            actionType === 'reject' ? 'Reject Request' :
            'Contact Requester'
          }
          description={
            actionType === 'accept' 
              ? 'Accept this catalog request and create an order'
              : actionType === 'reject'
              ? 'Reject this catalog request'
              : 'Send a message to the requester'
          }
          onSubmit={handleCatalogAction}
          isSubmitting={isSubmitting}
          submitLabel={
            actionType === 'accept' ? 'Accept & Create Order' :
            actionType === 'reject' ? 'Reject Request' :
            'Send Message'
          }
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* Contact channel selection */}
            <div className="space-y-2">
              <Label>Contact Channel</Label>
              <select
                className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
                value={actionChannel}
                onChange={(e) => setActionChannel(e.target.value as 'email' | 'whatsapp' | 'none')}
              >
                <option value="none">No communication</option>
                {actionRequest.requester_email && <option value="email">Email</option>}
                {actionRequest.requester_phone && <option value="whatsapp">WhatsApp</option>}
              </select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                rows={3}
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder={
                  actionType === 'accept'
                    ? 'Enter order details or a welcome message...'
                    : actionType === 'reject'
                    ? 'Enter reason for rejection...'
                    : 'Enter your message...'
                }
              />
            </div>

            {/* Only show for Accept action */}
            {actionType === 'accept' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated Delivery Date</Label>
                    <Input
                      type="date"
                      value={estimatedDeliveryDate}
                      onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Price</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Preview of contact info */}
            {actionChannel !== 'none' && (
              <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-3 text-sm text-brand-stone">
                {actionChannel === 'email' && actionRequest.requester_email && (
                  <p>Message will be sent to: <span className="font-medium text-brand-ink">{actionRequest.requester_email}</span></p>
                )}
                {actionChannel === 'whatsapp' && actionRequest.requester_phone && (
                  <p>Message will be sent via WhatsApp to: <span className="font-medium text-brand-ink">{actionRequest.requester_phone}</span></p>
                )}
              </div>
            )}
          </div>
        </ModalForm>
      )}

      {/* Quick Status Update Modal */}
      {statusOrder && (
        <ModalForm
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          title={`Update Order #${statusOrder.order_number} Status`}
          description="Click on a status below to change it"
          onSubmit={handleStatusUpdate}
          isSubmitting={isSubmitting}
          submitLabel="Update Status"
          maxWidth="sm"
        >
          <div className="space-y-3">
            <p className="text-sm text-brand-stone">Select new status:</p>
            <div className="grid grid-cols-1 gap-2">
              {(['pending', 'in_progress', 'completed', 'delivered', 'cancelled'] as Order['status'][]).map((status) => {
                const s = STATUS_STYLES[status]
                const isSelected = statusOrder.status === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusOrder({ ...statusOrder, status })}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
                      isSelected 
                        ? 'border-brand-gold bg-brand-gold/5' 
                        : 'border-brand-border hover:border-brand-gold/50'
                    )}
                  >
                    <s.Icon className={cn('h-5 w-5', s.className.replace('bg-', 'text-').replace('text-', ''))} />
                    <span className="font-medium text-brand-ink">{s.label}</span>
                    {isSelected && <Check className="h-4 w-4 ml-auto text-brand-gold" />}
                  </button>
                )
              })}
            </div>
          </div>
        </ModalForm>
      )}

    </div>
  )
}
