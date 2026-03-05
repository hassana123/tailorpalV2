'use client'

import { Calendar, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order } from '@/app/dashboard/shop/[shopId]/orders/types'
import { ORDER_STATUS_STYLES } from '@/components/dashboard/orders/status'

interface OrderColumnsOptions {
  onOpenStatusModal: (order: Order) => void
}

export function getOrderColumns({ onOpenStatusModal }: OrderColumnsOptions) {
  return [
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
      accessor: (order: Order) => `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`,
    },
    {
      key: 'description',
      header: 'Description',
      cell: (order: Order) => (
        <p className="text-sm text-brand-stone truncate max-w-[220px]">
          {order.design_description || '-'}
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
            : '-'}
        </div>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (order: Order) => {
        const style = ORDER_STATUS_STYLES[order.status]
        return (
          <button
            onClick={(event) => {
              event.stopPropagation()
              onOpenStatusModal(order)
            }}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity',
              style.className,
            )}
            title="Click to change status"
          >
            <style.Icon size={11} />
            {style.label}
          </button>
        )
      },
    },
  ]
}
