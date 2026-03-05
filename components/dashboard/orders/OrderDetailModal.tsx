'use client'

import { cn } from '@/lib/utils'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { Order } from '@/app/dashboard/shop/[shopId]/orders/types'
import { ORDER_STATUS_STYLES } from '@/components/dashboard/orders/status'

interface OrderDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function OrderDetailModal({
  open,
  onOpenChange,
  order,
}: OrderDetailModalProps) {
  if (!order) return null

  const statusStyle = ORDER_STATUS_STYLES[order.status]
  const StatusIcon = statusStyle.Icon

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Order #${order.order_number}`}
      description={`${order.customers?.first_name ?? ''} ${order.customers?.last_name ?? ''}`.trim()}
      hideFooter
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-4 space-y-2.5">
          <div className="text-sm text-brand-stone">
            <span className="font-semibold text-brand-ink">Created:</span>{' '}
            {new Date(order.created_at).toLocaleString()}
          </div>
          <div className="text-sm text-brand-stone">
            <span className="font-semibold text-brand-ink">Due date:</span>{' '}
            {order.estimated_delivery_date
              ? new Date(order.estimated_delivery_date).toLocaleDateString()
              : '-'}
          </div>
          <div className="text-sm text-brand-stone">
            <span className="font-semibold text-brand-ink">Price:</span>{' '}
            {order.total_price !== null && order.total_price !== undefined
              ? `$${order.total_price.toFixed(2)}`
              : '-'}
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
              statusStyle.className,
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
            {order.design_description || '-'}
          </p>
        </div>

        {order.notes && (
          <div>
            <p className="text-xs font-bold text-brand-stone uppercase tracking-wider mb-1.5">Notes</p>
            <p className="text-sm text-brand-charcoal leading-relaxed">{order.notes}</p>
          </div>
        )}
      </div>
    </ModalForm>
  )
}
