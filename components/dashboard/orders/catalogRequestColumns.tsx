'use client'

import { Calendar, Link2, Mail, Phone, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CatalogOrderRequest, Order } from '@/app/dashboard/shop/[shopId]/orders/types'
import { findLinkedOrder, getRequestStatusStyle } from '@/components/dashboard/orders/status'

interface CatalogRequestColumnsOptions {
  orders: Order[]
}

function getCatalogItem(request: CatalogOrderRequest) {
  return Array.isArray(request.shop_catalog_items)
    ? request.shop_catalog_items[0] ?? null
    : request.shop_catalog_items
}

export function getCatalogRequestColumns({ orders }: CatalogRequestColumnsOptions) {
  return [
    {
      key: 'requester',
      header: 'Requester',
      cell: (request: CatalogOrderRequest) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-gold">
              {request.requester_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink">{request.requester_name}</p>
            <p className="text-xs text-brand-stone">
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (request: CatalogOrderRequest) => request.requester_name,
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (request: CatalogOrderRequest) => (
        <div className="space-y-1">
          {request.requester_email && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Mail size={11} />{request.requester_email}
            </div>
          )}
          {request.requester_phone && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Phone size={11} />{request.requester_phone}
            </div>
          )}
          {!request.requester_email && !request.requester_phone && (
            <span className="text-xs text-brand-stone/60">No contact info</span>
          )}
        </div>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'item',
      header: 'Item',
      cell: (request: CatalogOrderRequest) => {
        const item = getCatalogItem(request)
        if (!item) return <span className="text-xs text-brand-stone/60">-</span>
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Tag size={11} />{item.name}
            </div>
            <p className="text-xs text-brand-ink font-medium">${item.price.toFixed(2)}</p>
          </div>
        )
      },
      hiddenOnMobile: true,
    },
    {
      key: 'linked_order',
      header: 'Linked Order',
      cell: (request: CatalogOrderRequest) => {
        const linkedOrder = findLinkedOrder(request, orders)
        if (!linkedOrder) return <span className="text-xs text-brand-stone/60">-</span>
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-brand-stone">
              <Link2 size={11} />#{linkedOrder.order_number}
            </div>
            <p className="text-xs text-brand-stone">
              {linkedOrder.estimated_delivery_date
                ? `Due ${new Date(linkedOrder.estimated_delivery_date).toLocaleDateString()}`
                : linkedOrder.status.replace('_', ' ')}
            </p>
          </div>
        )
      },
      hiddenOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (request: CatalogOrderRequest) => {
        const style = getRequestStatusStyle(request.status)
        return (
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', style.className)}>
            <style.Icon size={11} />
            {style.label}
          </span>
        )
      },
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (request: CatalogOrderRequest) => (
        <div className="flex items-center gap-1 text-xs text-brand-stone">
          <Calendar size={11} />
          {new Date(request.updated_at ?? request.created_at).toLocaleDateString()}
        </div>
      ),
      hiddenOnMobile: true,
    },
  ]
}
