'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { CustomerOption, OrderFormState } from '@/app/dashboard/shop/[shopId]/orders/types'

interface CreateOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: CustomerOption[]
  form: OrderFormState
  onFormChange: (form: OrderFormState) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function CreateOrderModal({
  open,
  onOpenChange,
  customers,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
}: CreateOrderModalProps) {
  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Order"
      description="Enter order details below. All fields marked with * are required."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Create Order"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Customer *</Label>
          <select
            className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
            value={form.customerId}
            onChange={(event) => onFormChange({ ...form, customerId: event.target.value })}
          >
            <option value="">Select customer...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Design Description *</Label>
          <Textarea
            value={form.designDescription}
            onChange={(event) => onFormChange({ ...form, designDescription: event.target.value })}
            placeholder="Describe the garment design, fabric, style requirements..."
            rows={4}
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
              placeholder="0.00"
              value={form.totalPrice}
              onChange={(event) => onFormChange({ ...form, totalPrice: event.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
            placeholder="Any additional notes..."
            rows={3}
          />
        </div>
      </div>
    </ModalForm>
  )
}
