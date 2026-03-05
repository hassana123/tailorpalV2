'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { EditOrderFormState, Order } from '@/app/dashboard/shop/[shopId]/orders/types'

interface EditOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  form: EditOrderFormState
  onFormChange: (form: EditOrderFormState) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function EditOrderModal({
  open,
  onOpenChange,
  order,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
}: EditOrderModalProps) {
  if (!order) return null

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit Order #${order.order_number}`}
      description="Update order details"
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Save Changes"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <select
            className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
            value={form.status}
            onChange={(event) => onFormChange({ ...form, status: event.target.value as EditOrderFormState['status'] })}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Design Description *</Label>
          <Textarea
            rows={4}
            value={form.designDescription}
            onChange={(event) => onFormChange({ ...form, designDescription: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estimated Delivery Date</Label>
            <Input
              type="date"
              value={form.estimatedDeliveryDate}
              onChange={(event) => onFormChange({ ...form, estimatedDeliveryDate: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Total Price</Label>
            <Input
              type="number"
              value={form.totalPrice}
              onChange={(event) => onFormChange({ ...form, totalPrice: event.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={form.notes}
            onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
          />
        </div>
      </div>
    </ModalForm>
  )
}
