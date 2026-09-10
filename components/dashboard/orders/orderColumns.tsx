'use client'

import { Calendar, Hash, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order } from '@/app/dashboard/shop/[shopId]/orders/types'
import { ORDER_STATUS_STYLES } from '@/components/dashboard/orders/status'
import { formatNaira, formatRelativeDate } from '@/lib/utils/format'

interface OrderColumnsOptions {
  onOpenStatusModal: (order: Order) => void
  shopName?: string
}

const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-50 text-red-600 border-red-200/60' },
  high: { label: 'High', className: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  normal: { label: 'Normal', className: 'bg-brand-cream text-brand-stone border-brand-border' },
  low: { label: 'Low', className: 'bg-slate-50 text-slate-600 border-slate-200' },
}

export function getOrderColumns({ onOpenStatusModal }: OrderColumnsOptions) {
  return [
    {
      key: 'order',
      header: 'Customer & Order',
      cell: (order: Order) => {
        const initials = `${order.customers?.first_name?.[0] ?? 'C'}${order.customers?.last_name?.[0] ?? ''}`.toUpperCase()

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-ink text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-brand-ink truncate text-sm">
                {order.customers?.first_name} {order.customers?.last_name}
              </p>
              <p className="text-xs text-brand-stone flex items-center gap-1 font-mono">
                <Hash size={10} />#{order.order_number}
              </p>
            </div>
          </div>
        )
      },
      sortable: true,
      accessor: (order: Order) => `${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`,
    },
    {
      key: 'description',
      header: 'Garment / Style',
      cell: (order: Order) => {
        const priority = order.priority || 'normal'
        const priorityStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal

        return (
          <div className="max-w-[220px] xl:max-w-[260px] space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-brand-ink truncate">
                {order.design_description || 'Custom Garment'}
              </p>
              {priority !== 'normal' && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                    priorityStyle.className
                  )}
                >
                  {priorityStyle.label}
                </span>
              )}
            </div>
            {order.fabric_details && (
              <p className="text-[11px] text-brand-stone truncate flex items-center gap-1">
                <Sparkles size={10} className="text-brand-gold flex-shrink-0" />
                {order.fabric_details}
              </p>
            )}
          </div>
        )
      },
      hiddenOnMobile: false,
    },
    {
      key: 'delivery',
      header: 'Due Date',
      cell: (order: Order) => {
        const relative = formatRelativeDate(order.estimated_delivery_date)
        return (
          <div>
            <div className="flex items-center gap-1.5 text-xs text-brand-charcoal font-medium">
              <Calendar size={12} className="text-brand-stone flex-shrink-0" />
              {order.estimated_delivery_date
                ? new Date(order.estimated_delivery_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : '—'}
            </div>
            {order.estimated_delivery_date && (
              <span
                className={cn(
                  'text-[10px] font-semibold block mt-0.5',
                  relative.isOverdue ? 'text-red-600' : relative.isUrgent ? 'text-brand-gold' : 'text-brand-stone'
                )}
              >
                {relative.text}
              </span>
            )}
          </div>
        )
      },
      sortable: true,
      accessor: (order: Order) => order.estimated_delivery_date ?? '',
    },
    {
      key: 'pricing',
      header: 'Total Price',
      cell: (order: Order) => (
        <div>
          <p className="text-sm font-bold text-brand-ink">
            {formatNaira(order.total_price)}
          </p>
          <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 inline-block mt-0.5">
            Bespoke
          </span>
        </div>
      ),
      sortable: true,
      accessor: (order: Order) => order.total_price ?? 0,
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
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-85 transition-opacity border',
              style.className
            )}
            title="Click to update order stage"
          >
            <style.Icon size={11} />
            {style.label}
          </button>
        )
      },
      sortable: true,
      accessor: (order: Order) => order.status,
    },
  ]
}
