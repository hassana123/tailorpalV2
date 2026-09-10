'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { Order, OrderStatus } from '@/app/dashboard/shop/[shopId]/orders/types'
import { ORDER_STATUS_STYLES } from '@/components/dashboard/orders/status'

interface OrderStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  selectedStatus: OrderStatus
  onStatusChange: (status: OrderStatus) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Order logged; waiting for fabric or pattern preparation',
  in_progress: 'Fabric cut, tailoring and sewing actively underway',
  completed: 'Sewing complete; garment pressed and ready for client pickup',
  delivered: 'Handed over to client or dispatched via courier',
  cancelled: 'Order discontinued or refunded',
}

export function OrderStatusModal({
  open,
  onOpenChange,
  order,
  selectedStatus,
  onStatusChange,
  onSubmit,
  isSubmitting,
}: OrderStatusModalProps) {
  if (!order) return null

  const statuses: OrderStatus[] = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled']

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Update Order #${order.order_number}`}
      description="Advance the production stage for this garment."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Status"
      maxWidth="md"
    >
      <div className="space-y-3">
        <p className="text-xs font-bold text-brand-stone uppercase tracking-wider">Select Production Stage:</p>
        <div className="grid grid-cols-1 gap-2">
          {statuses.map((status) => {
            const style = ORDER_STATUS_STYLES[status]
            const isSelected = selectedStatus === status
            const Icon = style.Icon

            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={cn(
                  'flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all text-left group',
                  isSelected
                    ? 'border-brand-ink bg-brand-ink text-white shadow-brand'
                    : 'border-brand-border bg-white hover:border-brand-gold/50 hover:bg-brand-cream/50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                    isSelected ? 'bg-white/15 text-brand-gold-light' : 'bg-brand-cream text-brand-stone'
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'font-bold text-sm',
                        isSelected ? 'text-white' : 'text-brand-ink group-hover:text-brand-gold transition-colors'
                      )}
                    >
                      {style.label}
                    </span>
                    {isSelected && <Check size={16} className="text-brand-gold-light" />}
                  </div>
                  <p
                    className={cn(
                      'text-xs mt-0.5 leading-relaxed',
                      isSelected ? 'text-white/70' : 'text-brand-stone'
                    )}
                  >
                    {STATUS_DESCRIPTIONS[status]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </ModalForm>
  )
}
