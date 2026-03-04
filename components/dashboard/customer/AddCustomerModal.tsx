'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { CustomerFormData } from '@/app/dashboard/shop/[shopId]/customers/types'

interface AddCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CustomerFormData
  onFormDataChange: (data: CustomerFormData) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function AddCustomerModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: AddCustomerModalProps) {
  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Add New Customer"
      description="Enter customer details below. All fields marked with * are required."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onFormDataChange({ ...formData, firstName: e.target.value })}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onFormDataChange({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 8900"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onFormDataChange({ ...formData, city: e.target.value })}
            placeholder="New York"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => onFormDataChange({ ...formData, country: e.target.value })}
            placeholder="USA"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes about this customer..."
            rows={3}
          />
        </div>
      </div>
    </ModalForm>
  )
}
