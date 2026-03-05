'use client'

import { Calendar, CheckCircle2, Clock, Mail, Package, Phone, Store, Tag, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { normalizeCatalogRequestStatus, type CatalogRequestStatus } from '@/lib/catalog-request-status'
import type { CatalogRequest, StatusStyle } from '@/app/dashboard/customer/my-requests/types'

const REQUEST_STATUS_STYLES: Record<CatalogRequestStatus, StatusStyle> = {
  pending: {
    label: 'Pending Review',
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
    label: 'Completed',
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
    label: 'Status Unavailable',
    className: 'bg-gray-100 text-gray-700',
    Icon: Package,
  },
}

const ORDER_STATUS_STYLES: Record<string, { label: string; className: string; progress: number }> = {
  pending: {
    label: 'Order Created',
    className: 'bg-amber-100 text-amber-700',
    progress: 72,
  },
  in_progress: {
    label: 'In Production',
    className: 'bg-blue-100 text-blue-700',
    progress: 84,
  },
  completed: {
    label: 'Ready',
    className: 'bg-emerald-100 text-emerald-700',
    progress: 93,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-700',
    progress: 100,
  },
  cancelled: {
    label: 'Order Cancelled',
    className: 'bg-red-100 text-red-700',
    progress: 100,
  },
}

const REQUEST_PROGRESS: Record<CatalogRequestStatus, number> = {
  pending: 22,
  contacted: 40,
  accepted: 62,
  converted: 100,
  rejected: 100,
  cancelled: 100,
  unknown: 10,
}

function getProgressInfo(request: CatalogRequest): { value: number; label: string; isFailed: boolean } {
  const normalizedStatus = normalizeCatalogRequestStatus(request.status)
  const orderStatus = request.order?.status

  if (orderStatus) {
    const orderMeta = ORDER_STATUS_STYLES[orderStatus]
    if (orderMeta) {
      return {
        value: orderMeta.progress,
        label: orderMeta.label,
        isFailed: orderStatus === 'cancelled',
      }
    }
  }

  if (normalizedStatus === 'rejected') {
    return { value: 100, label: 'Request Rejected', isFailed: true }
  }
  if (normalizedStatus === 'cancelled') {
    return { value: 100, label: 'Request Cancelled', isFailed: true }
  }
  if (normalizedStatus === 'accepted') {
    return { value: 62, label: 'Accepted - awaiting production updates', isFailed: false }
  }
  if (normalizedStatus === 'contacted') {
    return { value: 40, label: 'Shop contacted you', isFailed: false }
  }
  if (normalizedStatus === 'pending') {
    return { value: 22, label: 'Waiting for shop response', isFailed: false }
  }
  if (normalizedStatus === 'converted') {
    return { value: 100, label: 'Completed', isFailed: false }
  }

  return { value: REQUEST_PROGRESS[normalizedStatus], label: 'Status update pending', isFailed: false }
}

export function RequestCard({ request }: { request: CatalogRequest }) {
  const normalizedStatus = normalizeCatalogRequestStatus(request.status)
  const requestStatusStyle = REQUEST_STATUS_STYLES[normalizedStatus]
  const orderStatusStyle = request.order ? ORDER_STATUS_STYLES[request.order.status] : null
  const progress = getProgressInfo(request)
  const lastUpdatedAt = request.order?.updated_at ?? request.updated_at ?? request.created_at

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {request.shop?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.shop.logo_url}
                alt={request.shop.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center">
                <Store size={18} className="text-brand-gold" />
              </div>
            )}
            <div>
              <p className="font-semibold text-brand-ink">{request.shop?.name ?? 'Unknown Shop'}</p>
              <p className="text-xs text-brand-stone">
                Request ID: {request.id.slice(0, 8)} - Created {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {request.catalog_item && (
            <div className="flex items-center gap-2 text-sm text-brand-stone">
              <Tag size={14} className="text-brand-gold" />
              <span>{request.catalog_item.name}</span>
              <span className="font-medium">${request.catalog_item.price.toFixed(2)}</span>
            </div>
          )}

          {request.notes && (
            <div className="text-sm text-brand-stone">
              <span className="font-medium">Your notes:</span> {request.notes}
            </div>
          )}

          {request.owner_response_message && (
            <div className="rounded-xl border border-brand-border bg-brand-cream/40 px-3 py-2">
              <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1">Shop Response</p>
              <p className="text-sm text-brand-charcoal">{request.owner_response_message}</p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[280px] flex flex-col gap-3">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit', requestStatusStyle.className)}>
            <requestStatusStyle.Icon size={11} />
            {requestStatusStyle.label}
          </span>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-brand-stone">Progress</span>
              <span className="text-brand-ink">{progress.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-brand-border/60 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  progress.isFailed ? 'bg-red-500' : 'bg-brand-gold',
                )}
                style={{ width: `${progress.value}%` }}
              />
            </div>
            <p className="text-xs text-brand-stone">{progress.label}</p>
          </div>

          {request.order && (
            <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-brand-stone uppercase tracking-wider">Linked Order</span>
                {orderStatusStyle && (
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', orderStatusStyle.className)}>
                    {orderStatusStyle.label}
                  </span>
                )}
              </div>
              <p className="font-semibold text-brand-ink">#{request.order.order_number}</p>
              {request.order.estimated_delivery_date && (
                <div className="flex items-center gap-1.5 text-xs text-brand-stone mt-1">
                  <Calendar size={12} />
                  Due: {new Date(request.order.estimated_delivery_date).toLocaleDateString()}
                </div>
              )}
              {request.order.total_price !== null && (
                <p className="text-sm font-medium text-brand-ink mt-1">
                  ${request.order.total_price.toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-brand-stone">
            <p>Last updated: {new Date(lastUpdatedAt).toLocaleString()}</p>
            {request.owner_response_sent_at && request.owner_response_channel !== 'none' && (
              <p className="flex items-center gap-1 mt-0.5">
                {request.owner_response_channel === 'email' ? <Mail size={12} /> : <Phone size={12} />}
                via {request.owner_response_channel}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
