'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { CustomerOption, OrderFormState } from '@/app/dashboard/shop/[shopId]/orders/types'
import { GARMENT_PRESETS } from '@/lib/constants/presets'
import { Sparkles, Calendar, User, Scissors } from 'lucide-react'

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
  const handleSelectPreset = (presetName: string) => {
    const current = form.designDescription.trim()
    const updated = current ? `${presetName} - ${current}` : presetName
    onFormChange({ ...form, designDescription: updated })
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Create Bespoke Order"
      description="Record client garment specifications, fabric, and delivery timeline."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Book Order"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Customer Select */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
            <User size={13} className="text-brand-gold" />
            Client / Customer *
          </Label>
          <select
            className="w-full h-11 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
            value={form.customerId}
            onChange={(event) => onFormChange({ ...form, customerId: event.target.value })}
          >
            <option value="">Choose a client...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Style Presets Strip */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-brand-stone flex items-center gap-1.5">
            <Sparkles size={12} className="text-brand-gold" />
            Quick Garment Presets (Tap to apply)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {GARMENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.name)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-cream border border-brand-border hover:bg-white hover:border-brand-gold hover:text-brand-ink transition-all flex items-center gap-1"
              >
                <span>{preset.icon}</span>
                <span>{preset.name.split('/')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Design Description */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
            <Scissors size={13} className="text-brand-gold" />
            Garment Design & Style Requirements *
          </Label>
          <Textarea
            value={form.designDescription}
            onChange={(event) => onFormChange({ ...form, designDescription: event.target.value })}
            placeholder="e.g., Men's Senator Kaftan with embroidered collar, hidden placket, paired with slim-cut trousers..."
            rows={3}
            className="rounded-xl border-brand-border text-sm"
          />
        </div>

        {/* Pricing & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-brand-ink">Total Price (₦ Naira)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-stone pointer-events-none">
                ₦
              </span>
              <Input
                type="number"
                placeholder="45000"
                value={form.totalPrice}
                onChange={(event) => onFormChange({ ...form, totalPrice: event.target.value })}
                className="pl-8 h-11 rounded-xl border-brand-border text-sm font-semibold"
              />
            </div>
            <span className="text-[10px] text-brand-stone">Standard agreed fee for this outfit</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
              <Calendar size={13} />
              Estimated Due Date
            </Label>
            <Input
              type="date"
              value={form.estimatedDeliveryDate}
              onChange={(event) => onFormChange({ ...form, estimatedDeliveryDate: event.target.value })}
              className="h-11 rounded-xl border-brand-border text-sm"
            />
            <span className="text-[10px] text-brand-stone">Target date for final collection</span>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-brand-stone">Atelier Notes & Deposit Info</Label>
          <Textarea
            value={form.notes}
            onChange={(event) => onFormChange({ ...form, notes: event.target.value })}
            placeholder="e.g. Deposit: 25,000 paid via transfer. Fitting date: Next Tuesday. Fabric supplied by client."
            rows={2}
            className="rounded-xl border-brand-border text-sm"
          />
        </div>
      </div>
    </ModalForm>
  )
}
