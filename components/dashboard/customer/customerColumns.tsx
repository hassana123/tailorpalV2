'use client'

import { Mail, Phone, MapPin } from 'lucide-react'
import { Customer } from '@/app/dashboard/shop/[shopId]/customers/types'

// ─── Customer Table Hook ─────────────────────────────────────────────────────

interface UseCustomerColumnsProps {
  onViewDetails: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onAddMeasurements: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function useCustomerColumns({
  onViewDetails,
  onEdit,
  onAddMeasurements,
  onDelete,
}: UseCustomerColumnsProps) {
  const columns = [
    {
      key: 'name',
      header: 'Customer',
      cell: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">
              {customer.first_name[0]}{customer.last_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink truncate">
              {customer.first_name} {customer.last_name}
            </p>
            <p className="text-xs text-brand-stone">
              {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (c: Customer) => `${c.first_name} ${c.last_name}`,
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (customer: Customer) => (
        <div className="space-y-1">
          {customer.email && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-1.5 text-xs text-brand-stone">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>
      ),
      hiddenOnMobile: true,
    },
    {
      key: 'location',
      header: 'Location',
      cell: (customer: Customer) => (
        <div className="flex items-center gap-1.5 text-xs text-brand-stone">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {[customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'}
          </span>
        </div>
      ),
      hiddenOnMobile: true,
    },
  ]

  const actions = (customer: Customer) => [
    {
      label: 'View Details',
      onClick: () => onViewDetails(customer),
      variant: 'default' as const,
    },
    {
      label: 'Edit',
      onClick: () => onEdit(customer),
      variant: 'outline' as const,
    },
    {
      label: 'Add Measurements',
      onClick: () => onAddMeasurements(customer),
      variant: 'outline' as const,
    },
    {
      label: 'Delete',
      onClick: () => onDelete(customer),
      variant: 'destructive' as const,
    },
  ]

  return { columns, actions }
}
