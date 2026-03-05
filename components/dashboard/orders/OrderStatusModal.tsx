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
      title={`Update Order #${order.order_number} Status`}
      description="Click on a status below to change it"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Update Status"
      maxWidth="sm"
    >
      <div className="space-y-3">
        <p className="text-sm text-brand-stone">Select new status:</p>
        <div className="grid grid-cols-1 gap-2">
          {statuses.map((status) => {
            const style = ORDER_STATUS_STYLES[status]
            const isSelected = selectedStatus === status
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
                  isSelected ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-border hover:border-brand-gold/50',
                )}
              >
                <style.Icon className="h-5 w-5 text-brand-ink" />
                <span className="font-medium text-brand-ink">{style.label}</span>
                {isSelected && <Check className="h-4 w-4 ml-auto text-brand-gold" />}
              </button>
            )
          })}
        </div>
      </div>
    </ModalForm>
  )
}
