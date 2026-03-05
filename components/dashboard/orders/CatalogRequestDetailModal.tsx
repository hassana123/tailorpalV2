'use client'

import { Calendar, Link2, Mail, Phone, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { CatalogOrderRequest, Order } from '@/app/dashboard/shop/[shopId]/orders/types'
import { findLinkedOrder, getRequestStatusStyle } from '@/components/dashboard/orders/status'

interface CatalogRequestDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: CatalogOrderRequest | null
  orders: Order[]
}

function getCatalogItem(request: CatalogOrderRequest) {
  return Array.isArray(request.shop_catalog_items)
    ? request.shop_catalog_items[0] ?? null
    : request.shop_catalog_items
}

export function CatalogRequestDetailModal({
  open,
  onOpenChange,
  request,
  orders,
}: CatalogRequestDetailModalProps) {
  if (!request) return null

  const item = getCatalogItem(request)
  const statusStyle = getRequestStatusStyle(request.status)
  const linkedOrder = findLinkedOrder(request, orders)

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Request - ${request.requester_name}`}
      description="Marketplace catalog order request details"
      hideFooter
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-4 space-y-2.5">
          {request.requester_email && (
            <div className="flex items-center gap-2.5 text-sm text-brand-stone">
              <Mail size={14} className="text-brand-gold" />
              {request.requester_email}
            </div>
          )}
          {request.requester_phone && (
            <div className="flex items-center gap-2.5 text-sm text-brand-stone">
              <Phone size={14} className="text-brand-gold" />
              {request.requester_phone}
            </div>
          )}
          {item && (
            <div className="flex items-center gap-2.5 text-sm text-brand-stone">
              <Tag size={14} className="text-brand-gold" />
              {item.name} - ${item.price.toFixed(2)}
            </div>
          )}
          {linkedOrder && (
            <div className="flex items-center gap-2.5 text-sm text-brand-stone">
              <Link2 size={14} className="text-brand-gold" />
              Linked Order #{linkedOrder.order_number}
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-brand-stone">
            <Calendar size={14} className="text-brand-gold" />
            Created {new Date(request.created_at).toLocaleString()}
          </div>
          <div className="flex items-center gap-2.5 text-sm text-brand-stone">
            <Calendar size={14} className="text-brand-gold" />
            Updated {new Date(request.updated_at ?? request.created_at).toLocaleString()}
          </div>
        </div>

        {request.notes && (
          <div>
            <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Request Notes</p>
            <p className="text-sm text-brand-charcoal leading-relaxed">{request.notes}</p>
          </div>
        )}

        {request.owner_response_message && (
          <div>
            <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Shop Message</p>
            <p className="text-sm text-brand-charcoal leading-relaxed">{request.owner_response_message}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Status</p>
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', statusStyle.className)}>
            <statusStyle.Icon size={11} />
            {statusStyle.label}
          </span>
        </div>
      </div>
    </ModalForm>
  )
}
