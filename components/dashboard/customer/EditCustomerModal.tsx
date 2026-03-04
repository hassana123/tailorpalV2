'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { Customer } from '@/app/dashboard/shop/[shopId]/customers/types'

interface EditCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: Partial<Customer>
  onFormDataChange: (data: Partial<Customer>) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function EditCustomerModal({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: EditCustomerModalProps) {
  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Customer"
      description="Update customer information below."
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editFirstName">First Name *</Label>
          <Input
            id="editFirstName"
            value={formData.first_name || ''}
            onChange={(e) => onFormDataChange({ ...formData, first_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editLastName">Last Name *</Label>
          <Input
            id="editLastName"
            value={formData.last_name || ''}
            onChange={(e) => onFormDataChange({ ...formData, last_name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editEmail">Email</Label>
          <Input
            id="editEmail"
            type="email"
            value={formData.email || ''}
            onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editPhone">Phone</Label>
          <Input
            id="editPhone"
            value={formData.phone || ''}
            onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="editAddress">Address</Label>
          <Input
            id="editAddress"
            value={formData.address || ''}
            onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editCity">City</Label>
          <Input
            id="editCity"
            value={formData.city || ''}
            onChange={(e) => onFormDataChange({ ...formData, city: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editCountry">Country</Label>
          <Input
            id="editCountry"
            value={formData.country || ''}
            onChange={(e) => onFormDataChange({ ...formData, country: e.target.value })}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="editNotes">Notes</Label>
          <Textarea
            id="editNotes"
            value={formData.notes || ''}
            onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    </ModalForm>
  )
}
