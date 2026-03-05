import { CheckCircle2, Clock, Loader2, Mail, TruckIcon, XCircle } from 'lucide-react'
import { normalizeCatalogRequestStatus } from '@/lib/catalog-request-status'
import type { CatalogOrderRequest, CatalogRequestStatus, Order, OrderStatus } from '@/app/dashboard/shop/[shopId]/orders/types'

export const ORDER_STATUS_STYLES: Record<OrderStatus, { label: string; className: string; Icon: React.ElementType }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700',
    Icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-sky-100 text-sky-700',
    Icon: Loader2,
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700',
    Icon: CheckCircle2,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-700',
    Icon: TruckIcon,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
    Icon: XCircle,
  },
}

export const REQUEST_STATUS_STYLES: Record<CatalogRequestStatus, { label: string; className: string; Icon: React.ElementType }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700',
    Icon: Clock,
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-sky-100 text-sky-700',
    Icon: Mail,
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-blue-100 text-blue-700',
    Icon: CheckCircle2,
  },
  converted: {
    label: 'Converted',
    className: 'bg-emerald-100 text-emerald-700',
    Icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700',
    Icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
    Icon: XCircle,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-700',
    Icon: Clock,
  },
}

export function getRequestStatusStyle(status: string) {
  const normalizedStatus = normalizeCatalogRequestStatus(status)
  return REQUEST_STATUS_STYLES[normalizedStatus]
}

export function findLinkedOrder(request: CatalogOrderRequest, orders: Order[]): Order | null {
  if (request.linked_order_id) {
    const direct = orders.find((order) => order.id === request.linked_order_id)
    if (direct) return direct
  }

  const byCatalogReference = orders.find((order) => order.catalog_request_id === request.id)
  return byCatalogReference ?? null
}
