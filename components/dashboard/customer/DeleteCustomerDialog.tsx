'use client'

import { ConfirmDialog } from '@/components/dashboard/shared/ConfirmDialog'
import { Customer } from '@/app/dashboard/shop/[shopId]/customers/types'

interface DeleteCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteCustomerDialog({
  open,
  onOpenChange,
  customer,
  onConfirm,
  isLoading = false,
}: DeleteCustomerDialogProps) {
  const customerName = customer ? `${customer.first_name} ${customer.last_name}` : ''

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Customer"
      description={`Are you sure you want to delete ${customerName}? This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  )
}
