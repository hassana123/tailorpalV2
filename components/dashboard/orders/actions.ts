import { TableAction } from '@/components/dashboard/shared/table-actions'
import { findLinkedOrder } from '@/components/dashboard/orders/status'
import { normalizeCatalogRequestStatus } from '@/lib/catalog-request-status'
import type { CatalogActionPayload, CatalogOrderRequest, Order } from '@/app/dashboard/shop/[shopId]/orders/types'

interface BuildOrderActionsOptions {
  onViewDetails: (order: Order) => void
  onEdit: (order: Order) => void
  onDelete: (order: Order) => void
}

export function buildOrderActions(order: Order, options: BuildOrderActionsOptions): TableAction[] {
  return [
    { label: 'View Details', onClick: () => options.onViewDetails(order), variant: 'default' },
    { label: 'Edit', onClick: () => options.onEdit(order), variant: 'outline' },
    { label: 'Delete', onClick: () => options.onDelete(order), variant: 'destructive' },
  ]
}

interface BuildRequestActionsOptions {
  orders: Order[]
  onViewDetails: (request: CatalogOrderRequest) => void
  onOpenAction: (request: CatalogOrderRequest, action: CatalogActionPayload['action']) => void
  onOpenLinkedOrder: (request: CatalogOrderRequest) => void
  onDelete: (request: CatalogOrderRequest) => void
}

export function buildRequestActions(
  request: CatalogOrderRequest,
  options: BuildRequestActionsOptions,
): TableAction[] {
  const normalizedStatus = normalizeCatalogRequestStatus(request.status)
  const linkedOrder = findLinkedOrder(request, options.orders)
  const actions: TableAction[] = [
    {
      label: 'View Details',
      onClick: () => options.onViewDetails(request),
      variant: 'default',
    },
  ]

  if ((normalizedStatus === 'pending' || normalizedStatus === 'contacted') && !linkedOrder) {
    actions.unshift(
      { label: 'Accept', onClick: () => options.onOpenAction(request, 'accept'), variant: 'default' },
      { label: 'Contact', onClick: () => options.onOpenAction(request, 'contact'), variant: 'outline' },
      { label: 'Reject', onClick: () => options.onOpenAction(request, 'reject'), variant: 'destructive' },
      { label: 'Cancel', onClick: () => options.onOpenAction(request, 'cancel'), variant: 'outline' },
    )
  }

  if (normalizedStatus === 'accepted') {
    actions.unshift(
      { label: 'Contact', onClick: () => options.onOpenAction(request, 'contact'), variant: 'outline' },
      { label: 'Mark Converted', onClick: () => options.onOpenAction(request, 'convert'), variant: 'success' },
    )
    if (linkedOrder) {
      actions.unshift({ label: 'View Linked Order', onClick: () => options.onOpenLinkedOrder(request), variant: 'default' })
    }
  }

  if (normalizedStatus === 'converted') {
    actions.unshift({ label: 'Contact', onClick: () => options.onOpenAction(request, 'contact'), variant: 'outline' })
    if (linkedOrder) {
      actions.unshift({ label: 'View Linked Order', onClick: () => options.onOpenLinkedOrder(request), variant: 'default' })
    }
  }

  if ((normalizedStatus === 'rejected' || normalizedStatus === 'cancelled') && !linkedOrder) {
    actions.unshift({ label: 'Reopen', onClick: () => options.onOpenAction(request, 'reopen'), variant: 'outline' })
    actions.push({ label: 'Delete', onClick: () => options.onDelete(request), variant: 'destructive' })
  }

  return actions
}
