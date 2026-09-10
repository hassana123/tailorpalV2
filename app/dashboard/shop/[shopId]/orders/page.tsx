'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ConfirmDialog } from '@/components/dashboard/shared/ConfirmDialog'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { OrdersHeader } from '@/components/dashboard/orders/OrdersHeader'
import { OrdersStatsGrid } from '@/components/dashboard/orders/OrdersStatsGrid'
import { getOrderColumns } from '@/components/dashboard/orders/orderColumns'
import { getCatalogRequestColumns } from '@/components/dashboard/orders/catalogRequestColumns'
import { buildOrderActions, buildRequestActions } from '@/components/dashboard/orders/actions'
import { CreateOrderModal } from '@/components/dashboard/orders/CreateOrderModal'
import { EditOrderModal } from '@/components/dashboard/orders/EditOrderModal'
import { OrderDetailModal } from '@/components/dashboard/orders/OrderDetailModal'
import { OrderStatusModal } from '@/components/dashboard/orders/OrderStatusModal'
import { OrderProductionActivitiesModal } from '@/components/dashboard/orders/OrderProductionActivitiesModal'
import { CatalogRequestDetailModal } from '@/components/dashboard/orders/CatalogRequestDetailModal'
import {
  CatalogRequestActionFormState,
  CatalogRequestActionModal,
} from '@/components/dashboard/orders/CatalogRequestActionModal'
import { findLinkedOrder } from '@/components/dashboard/orders/status'
import { normalizeCatalogRequestStatus } from '@/lib/catalog-request-status'
import { createWhatsAppUrl, getOrderConfirmationMessage } from '@/lib/utils/whatsapp'
import { useOrdersManagement } from '@/hooks/orders/useOrdersManagement'
import type { CatalogActionPayload, CatalogOrderRequest, EditOrderFormState, Order, OrderFormState, OrderStatus } from './types'
import { cn } from '@/lib/utils'

const initialOrderForm: OrderFormState = {
  customerId: '',
  designDescription: '',
  estimatedDeliveryDate: '',
  totalPrice: '',
  notes: '',
}

const initialEditOrderForm: EditOrderFormState = {
  status: 'pending',
  designDescription: '',
  estimatedDeliveryDate: '',
  totalPrice: '',
  notes: '',
}

const initialActionForm: CatalogRequestActionFormState = {
  channel: 'none',
  message: '',
  estimatedDeliveryDate: '',
  totalPrice: '',
  orderNotes: '',
}

type FilterTab = 'all' | OrderStatus

export default function OrdersPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shopId = params.shopId as string
  const {
    orders,
    catalogOrderRequests,
    customers,
    loading,
    isSubmitting,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    applyCatalogAction,
    deleteCatalogRequest,
  } = useOrdersManagement({ shopId })

  const [statusFilter, setStatusFilter] = useState<FilterTab>('all')
  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'week' | 'overdue'>('all')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [requestDetailOpen, setRequestDetailOpen] = useState(false)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [productionModalOpen, setProductionModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CatalogOrderRequest | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusValue, setStatusValue] = useState<OrderStatus>('pending')
  const [newOrder, setNewOrder] = useState<OrderFormState>(initialOrderForm)
  const styleFromCatalog = searchParams.get('style')
  const [editOrderForm, setEditOrderForm] = useState<EditOrderFormState>(initialEditOrderForm)
  const [actionType, setActionType] = useState<CatalogActionPayload['action'] | null>(null)
  const [actionForm, setActionForm] = useState<CatalogRequestActionFormState>(initialActionForm)
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    variant: 'default' as 'default' | 'destructive',
    onConfirm: () => {},
  })

  useEffect(() => {
    if (!styleFromCatalog) return
    setNewOrder((current) => ({ ...current, designDescription: current.designDescription || styleFromCatalog }))
    setAddModalOpen(true)
  }, [styleFromCatalog])

  const orderColumns = useMemo(
    () => getOrderColumns({ onOpenStatusModal }),
    []
  )
  const requestColumns = useMemo(
    () => getCatalogRequestColumns({ orders }),
    [orders]
  )

  function onOpenStatusModal(order: Order) {
    setSelectedOrder(order)
    setStatusValue(order.status)
    setStatusModalOpen(true)
  }

  const orderActions = (order: Order) => buildOrderActions(order, {
    onViewDetails: (value) => { setSelectedOrder(value); setOrderDetailOpen(true) },
    onViewProduction: (value) => { setSelectedOrder(value); setProductionModalOpen(true) },
    onOpenStatusModal,
    onCopyTracking: (value) => {
      const url = `${window.location.origin}/track/${value.id}`
      void navigator.clipboard.writeText(url)
      toast.success(`Client tracking link for #${value.order_number} copied to clipboard!`)
    },
    onWhatsApp: (value) => {
      const customerName = `${value.customers?.first_name ?? ''} ${value.customers?.last_name ?? ''}`.trim() || 'Valued Client'
      const customerPhone = (value.customers as { phone?: string | null } | null)?.phone
      const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/track/${value.id}` : ''
      const msg = getOrderConfirmationMessage({
        customerName,
        shopName: undefined,
        orderNumber: value.order_number,
        garmentDescription: value.design_description || 'Bespoke Garment',
        deliveryDate: value.estimated_delivery_date,
        totalPrice: value.total_price,
        trackingUrl,
      })
      const url = createWhatsAppUrl(customerPhone, msg)
      window.open(url, '_blank', 'noopener,noreferrer')
      toast.success(`Opening WhatsApp for ${customerName}`)
    },
    onEdit: openEditOrder,
    onDelete: (value) => {
      setConfirmConfig({
        title: `Delete Order #${value.order_number}`,
        description: 'Delete this order permanently? This action cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: () => { void deleteOrder(value.id) },
      })
      setConfirmDialogOpen(true)
    },
  })

  const requestActions = (request: CatalogOrderRequest) => buildRequestActions(request, {
    orders,
    onViewDetails: (value) => { setSelectedRequest(value); setRequestDetailOpen(true) },
    onOpenAction: openActionModal,
    onOpenLinkedOrder: openLinkedOrder,
    onDelete: (value) => {
      setConfirmConfig({
        title: 'Delete Catalog Request',
        description: 'Delete this catalog request permanently? This cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: () => { void deleteCatalogRequest(value.id) },
      })
      setConfirmDialogOpen(true)
    },
  })

  function openEditOrder(order: Order) {
    setSelectedOrder(order)
    setEditOrderForm({
      status: order.status,
      designDescription: order.design_description ?? '',
      estimatedDeliveryDate: order.estimated_delivery_date ?? '',
      totalPrice: order.total_price?.toString() ?? '',
      notes: order.notes ?? '',
    })
    setEditOrderOpen(true)
  }

  function openActionModal(request: CatalogOrderRequest, action: CatalogActionPayload['action']) {
    const item = Array.isArray(request.shop_catalog_items) ? request.shop_catalog_items[0] ?? null : request.shop_catalog_items
    setSelectedRequest(request)
    setActionType(action)
    setActionForm({
      ...initialActionForm,
      totalPrice: item?.price?.toString() ?? '',
    })
    setActionModalOpen(true)
  }

  function openLinkedOrder(request: CatalogOrderRequest) {
    const linkedOrder = findLinkedOrder(request, orders)
    if (!linkedOrder) {
      toast.error('Linked order not found')
      return
    }
    setSelectedOrder(linkedOrder)
    setOrderDetailOpen(true)
  }

  async function handleCreateOrder() {
    const success = await createOrder(newOrder)
    if (!success) return
    setNewOrder(initialOrderForm)
    setAddModalOpen(false)
  }

  async function handleUpdateOrder() {
    if (!selectedOrder) return
    const success = await updateOrder(selectedOrder.id, editOrderForm)
    if (!success) return
    setEditOrderOpen(false)
  }

  async function handleStatusUpdate() {
    if (!selectedOrder) return
    const success = await updateOrderStatus(selectedOrder.id, statusValue)
    if (!success) return
    setStatusModalOpen(false)
  }

  async function handleCatalogAction() {
    if (!selectedRequest || !actionType) return
    const payload: CatalogActionPayload = { action: actionType }

    if (['accept', 'reject', 'contact', 'cancel'].includes(actionType)) {
      payload.channel = actionForm.channel
    }
    if (actionForm.message.trim()) payload.message = actionForm.message.trim()
    if (actionType === 'accept' && actionForm.estimatedDeliveryDate) payload.estimatedDeliveryDate = actionForm.estimatedDeliveryDate
    if (actionType === 'accept' && actionForm.totalPrice.trim()) payload.totalPrice = Number.parseFloat(actionForm.totalPrice)
    if (actionType === 'accept' && actionForm.orderNotes.trim()) payload.orderNotes = actionForm.orderNotes.trim()

    const result = await applyCatalogAction(selectedRequest.id, payload)
    if (!result) return

    if (result.communicationLink) window.open(result.communicationLink, '_blank')
    toast.success(
      actionType === 'accept' ? 'Request accepted and order created.' :
      actionType === 'reject' ? 'Request rejected.' :
      actionType === 'contact' ? 'Contact update saved.' :
      actionType === 'reopen' ? 'Request reopened.' :
      actionType === 'convert' ? 'Request marked as converted.' :
      'Request cancelled.',
    )
    setActionModalOpen(false)
  }

  if (loading) return <LoadingState />

  const activeOrders = orders.filter((order) => order.status === 'pending' || order.status === 'in_progress' || order.status === 'completed').length
  const completedOrders = orders.filter((order) => order.status === 'delivered').length
  const pendingRequests = catalogOrderRequests.filter((request) => normalizeCatalogRequestStatus(request.status) === 'pending').length
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price || 0), 0)

  // Status counts
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (deadlineFilter === 'all') return true
    const due = order.estimated_delivery_date ? new Date(`${order.estimated_delivery_date}T00:00:00`).getTime() : Infinity
    return deadlineFilter === 'overdue' ? due < new Date().setHours(0, 0, 0, 0) : due <= Date.now() + 7 * 86400000
  })

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <OrdersHeader onCreateOrder={() => setAddModalOpen(true)} />

      <OrdersStatsGrid
        totalOrders={orders.length}
        activeOrders={activeOrders}
        completedOrders={completedOrders}
        pendingCatalogRequests={pendingRequests}
        totalRevenue={totalRevenue}
      />

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 lg:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-border">
          <div>
            <h2 className="font-display text-xl text-brand-ink">Client Orders</h2>
            <p className="text-xs text-brand-stone mt-0.5">Manage bespoke commissions, status progression, and tracking links</p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'All', count: counts.all },
                { id: 'pending', label: 'Pending', count: counts.pending },
                { id: 'in_progress', label: 'In Production', count: counts.in_progress },
                { id: 'completed', label: 'Ready', count: counts.completed },
                { id: 'delivered', label: 'Delivered', count: counts.delivered },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
                  statusFilter === tab.id
                    ? 'bg-brand-ink text-white shadow-sm'
                    : 'text-brand-stone hover:text-brand-ink hover:bg-brand-cream'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-brand-cream text-brand-stone'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-cream border border-brand-border rounded-xl">
              <Clock size={12} className="text-brand-gold flex-shrink-0" />
              <select
                value={deadlineFilter}
                onChange={(event) => setDeadlineFilter(event.target.value as typeof deadlineFilter)}
                className="bg-transparent text-xs font-semibold text-brand-ink focus:outline-none cursor-pointer"
                aria-label="Filter orders by deadline"
              >
                <option value="all">All Deadlines</option>
                <option value="week">Due in 7 Days</option>
                <option value="overdue">⚠️ Overdue</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          data={filteredOrders}
          columns={orderColumns}
          keyExtractor={(order) => order.id}
          searchKeys={['order_number', 'design_description']}
          onRowClick={(order) => {
            setSelectedOrder(order)
            setOrderDetailOpen(true)
          }}
          emptyMessage={
            statusFilter === 'all'
              ? 'No orders yet. Create your first bespoke order to get started.'
              : `No orders currently in "${statusFilter.replace('_', ' ')}" status.`
          }
          actions={orderActions}
        />
      </div>

      {/* Catalog Requests */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 lg:p-7 shadow-sm">
        <div className="mb-4">
          <h2 className="font-display text-xl text-brand-ink">Marketplace Inquiries & Style Requests</h2>
          <p className="text-xs text-brand-stone mt-0.5">Requests submitted by clients who browsed your public lookbook</p>
        </div>
        <DataTable
          data={catalogOrderRequests}
          columns={requestColumns}
          keyExtractor={(request) => request.id}
          searchKeys={['requester_name', 'requester_email', 'requester_phone', 'status']}
          emptyMessage="No catalog requests yet. Share your lookbook with prospective clients to receive order requests."
          actions={requestActions}
        />
      </div>

      <CreateOrderModal open={addModalOpen} onOpenChange={setAddModalOpen} customers={customers} form={newOrder} onFormChange={setNewOrder} onSubmit={handleCreateOrder} isSubmitting={isSubmitting} />
      <EditOrderModal open={editOrderOpen} onOpenChange={setEditOrderOpen} order={selectedOrder} form={editOrderForm} onFormChange={setEditOrderForm} onSubmit={handleUpdateOrder} isSubmitting={isSubmitting} />
      <OrderDetailModal open={orderDetailOpen} onOpenChange={setOrderDetailOpen} order={selectedOrder} shopId={shopId} />
      <OrderStatusModal open={statusModalOpen} onOpenChange={setStatusModalOpen} order={selectedOrder} selectedStatus={statusValue} onStatusChange={setStatusValue} onSubmit={handleStatusUpdate} isSubmitting={isSubmitting} />
      <OrderProductionActivitiesModal open={productionModalOpen} onOpenChange={setProductionModalOpen} order={selectedOrder} shopId={shopId} />
      <CatalogRequestDetailModal open={requestDetailOpen} onOpenChange={setRequestDetailOpen} request={selectedRequest} orders={orders} />
      <CatalogRequestActionModal open={actionModalOpen} onOpenChange={setActionModalOpen} request={selectedRequest} action={actionType} form={actionForm} onFormChange={setActionForm} onSubmit={handleCatalogAction} isSubmitting={isSubmitting} />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={confirmConfig.confirmLabel}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        isLoading={isSubmitting}
      />
    </div>
  )
}
