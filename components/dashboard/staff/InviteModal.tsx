'use client'


import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { cn } from '@/lib/utils'
import { DeliveryMethod } from '../../../app/dashboard/shop/[shopId]/staff/types'

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onEmailChange: (email: string) => void
  deliveryMethod: DeliveryMethod
  onDeliveryMethodChange: (method: DeliveryMethod) => void
  error: string | null
  isInviting: boolean
  onSubmit: () => void
}

export function InviteModal({
  open,
  onOpenChange,
  email,
  onEmailChange,
  deliveryMethod,
  onDeliveryMethodChange,
  error,
  isInviting,
  onSubmit,
}: InviteModalProps) {
  const deliveryOptions: { value: DeliveryMethod; title: string; desc: string }[] = [
    {
      value: 'supabase_email',
      title: 'Send Instructions Email',
      desc: 'Sends onboarding steps + signup link + invite code.',
    },
    {
      value: 'manual_link',
      title: 'Generate Signup + Code',
      desc: 'Share manually via WhatsApp, Instagram DM, etc.',
    },
  ]

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Invite Staff Member"
      description="Share staff onboarding details with signup steps and invite code."
      onSubmit={onSubmit}
      isSubmitting={isInviting}
      submitLabel="Create Invitation"
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Email Address *</Label>
          <Input
            type="email"
            placeholder="staff@example.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Delivery Method</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {deliveryOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDeliveryMethodChange(opt.value)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-all text-sm',
                  deliveryMethod === opt.value
                    ? 'border-brand-ink bg-brand-ink/4 shadow-sm'
                    : 'border-brand-border hover:border-brand-ink/30 hover:bg-brand-cream'
                )}
              >
                <p className="font-semibold text-brand-ink">{opt.title}</p>
                <p className="text-xs text-brand-stone mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}
      </div>
    </ModalForm>
  )
}
