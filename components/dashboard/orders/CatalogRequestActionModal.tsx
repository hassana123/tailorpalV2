'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import type { CatalogActionPayload, CatalogOrderRequest } from '@/app/dashboard/shop/[shopId]/orders/types'

export interface CatalogRequestActionFormState {
  channel: 'email' | 'whatsapp' | 'none'
  message: string
  estimatedDeliveryDate: string
  totalPrice: string
  orderNotes: string
}

interface CatalogRequestActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: CatalogOrderRequest | null
  action: CatalogActionPayload['action'] | null
  form: CatalogRequestActionFormState
  onFormChange: (form: CatalogRequestActionFormState) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const ACTION_COPY: Record<CatalogActionPayload['action'], { title: string; description: string; submitLabel: string }> = {
  accept: {
    title: 'Accept Request',
    description: 'Accept this catalog request and create an order.',
    submitLabel: 'Accept & Create Order',
  },
  reject: {
    title: 'Reject Request',
    description: 'Reject this request and optionally notify the customer.',
    submitLabel: 'Reject Request',
  },
  contact: {
    title: 'Contact Requester',
    description: 'Send a follow-up message and mark the request as contacted.',
    submitLabel: 'Save Contact Update',
  },
  reopen: {
    title: 'Reopen Request',
    description: 'Move this request back to pending so it can be processed again.',
    submitLabel: 'Reopen Request',
  },
  convert: {
    title: 'Mark as Converted',
    description: 'Mark this accepted request as converted/closed.',
    submitLabel: 'Mark Converted',
  },
  cancel: {
    title: 'Cancel Request',
    description: 'Cancel this request. This is useful when the customer opts out.',
    submitLabel: 'Cancel Request',
  },
}

function shouldShowContactControls(action: CatalogActionPayload['action']) {
  return action === 'accept' || action === 'reject' || action === 'contact' || action === 'cancel'
}

export function CatalogRequestActionModal({
  open,
  onOpenChange,
  request,
  action,
  form,
  onFormChange,
  onSubmit,
  isSubmitting,
}: CatalogRequestActionModalProps) {
  if (!request || !action) return null

  const copy = ACTION_COPY[action]
  const showContactControls = shouldShowContactControls(action)
  const showAcceptFields = action === 'accept'

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={copy.submitLabel}
      maxWidth="md"
    >
      <div className="space-y-4">
        {showContactControls && (
          <div className="space-y-2">
            <Label>Contact Channel</Label>
            <select
              className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold/55 transition-all appearance-none"
              value={form.channel}
              onChange={(event) => onFormChange({ ...form, channel: event.target.value as CatalogRequestActionFormState['channel'] })}
            >
              <option value="none">No communication</option>
              {request.requester_email && <option value="email">Email</option>}
              {request.requester_phone && <option value="whatsapp">WhatsApp</option>}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Message (optional)</Label>
          <Textarea
            rows={3}
            value={form.message}
            onChange={(event) => onFormChange({ ...form, message: event.target.value })}
            placeholder="Write a customer-facing update..."
          />
        </div>

        {showAcceptFields && (
          <>
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
              <Label>Internal Order Notes (optional)</Label>
              <Textarea
                rows={3}
                value={form.orderNotes}
                onChange={(event) => onFormChange({ ...form, orderNotes: event.target.value })}
                placeholder="Production or pricing notes for the order..."
              />
            </div>
          </>
        )}

        {showContactControls && form.channel !== 'none' && (
          <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-3 text-sm text-brand-stone">
            {form.channel === 'email' && request.requester_email && (
              <p>
                Message will be sent to:{' '}
                <span className="font-medium text-brand-ink">{request.requester_email}</span>
              </p>
            )}
            {form.channel === 'whatsapp' && request.requester_phone && (
              <p>
                Message will be sent via WhatsApp to:{' '}
                <span className="font-medium text-brand-ink">{request.requester_phone}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </ModalForm>
  )
}
