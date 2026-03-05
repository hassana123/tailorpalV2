'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
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
import { CatalogRequestDetailModal } from '@/components/dashboard/orders/CatalogRequestDetailModal'
import {
  CatalogRequestActionFormState,
  CatalogRequestActionModal,
} from '@/components/dashboard/orders/CatalogRequestActionModal'
import { findLinkedOrder } from '@/components/dashboard/orders/status'
import { normalizeCatalogRequestStatus } from '@/lib/catalog-request-status'
import { useOrdersManagement } from '@/hooks/orders/useOrdersManagement'
import type { CatalogActionPayload, CatalogOrderRequest, EditOrderFormState, Order, OrderFormState, OrderStatus } from './types'

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

export default function OrdersPage() {
  const params = useParams()
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

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [requestDetailOpen, setRequestDetailOpen] = useState(false)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CatalogOrderRequest | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusValue, setStatusValue] = useState<OrderStatus>('pending')
  const [newOrder, setNewOrder] = useState<OrderFormState>(initialOrderForm)
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

  const orderColumns = getOrderColumns({ onOpenStatusModal })
  const requestColumns = getCatalogRequestColumns({ orders })

  function onOpenStatusModal(order: Order) {
    setSelectedOrder(order)
    setStatusValue(order.status)
    setStatusModalOpen(true)
  }

  const orderActions = (order: Order) => buildOrderActions(order, {
    onViewDetails: (value) => { setSelectedOrder(value); setOrderDetailOpen(true) },
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

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <OrdersHeader onCreateOrder={() => setAddModalOpen(true)} />
      <OrdersStatsGrid totalOrders={orders.length} activeOrders={activeOrders} completedOrders={completedOrders} pendingCatalogRequests={pendingRequests} />

      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">All Orders</h2>
          <p className="text-xs text-brand-stone mt-0.5">{orders.length} total orders</p>
        </div>
        <DataTable data={orders} columns={orderColumns} keyExtractor={(order) => order.id} searchKeys={['order_number', 'design_description']} emptyMessage="No orders yet. Create your first order to get started." actions={orderActions} />
      </div>

      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">Catalog Order Requests</h2>
          <p className="text-xs text-brand-stone mt-0.5">Requests submitted by marketplace visitors from catalog items</p>
        </div>
        <DataTable data={catalogOrderRequests} columns={requestColumns} keyExtractor={(request) => request.id} searchKeys={['requester_name', 'requester_email', 'requester_phone', 'status']} emptyMessage="No catalog requests yet." actions={requestActions} />
      </div>

      <CreateOrderModal open={addModalOpen} onOpenChange={setAddModalOpen} customers={customers} form={newOrder} onFormChange={setNewOrder} onSubmit={handleCreateOrder} isSubmitting={isSubmitting} />
      <EditOrderModal open={editOrderOpen} onOpenChange={setEditOrderOpen} order={selectedOrder} form={editOrderForm} onFormChange={setEditOrderForm} onSubmit={handleUpdateOrder} isSubmitting={isSubmitting} />
      <OrderDetailModal open={orderDetailOpen} onOpenChange={setOrderDetailOpen} order={selectedOrder} />
      <OrderStatusModal open={statusModalOpen} onOpenChange={setStatusModalOpen} order={selectedOrder} selectedStatus={statusValue} onStatusChange={setStatusValue} onSubmit={handleStatusUpdate} isSubmitting={isSubmitting} />
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
