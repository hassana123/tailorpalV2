'use client'

import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react'
import { Customer } from '@/app/dashboard/shop/[shopId]/customers/types'
import { cleanPhoneForWhatsApp } from '@/lib/utils/format'

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
  const getInitials = (customer: Customer) =>
    `${customer.first_name?.[0] ?? ''}${customer.last_name?.[0] ?? ''}`.toUpperCase()

  const getDisplayName = (customer: Customer) =>
    [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim()

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      cell: (customer: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-ink/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-brand-ink">
              {getInitials(customer)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-brand-ink truncate">
              {getDisplayName(customer)}
            </p>
            <p className="text-xs text-brand-stone">
              {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
      sortable: true,
      accessor: (c: Customer) => getDisplayName(c),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (customer: Customer) => {
        const waNumber = customer.phone ? cleanPhoneForWhatsApp(customer.phone) : null
        return (
          <div className="space-y-1">
            {customer.email && (
              <div className="flex items-center gap-1.5 text-xs text-brand-stone">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{customer.email}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-1.5 text-xs text-brand-stone flex-wrap">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{customer.phone}</span>
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors ml-1"
                    title="Chat on WhatsApp"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageSquare size={10} />
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        )
      },
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

  const actions = (customer: Customer) => {
    const wa = customer.phone ? cleanPhoneForWhatsApp(customer.phone) : null
    return [
      {
        label: 'View Details',
        onClick: () => onViewDetails(customer),
        variant: 'default' as const,
      },
      ...(wa
        ? [
            {
              label: 'Chat on WhatsApp',
              onClick: () => window.open(`https://wa.me/${wa}`, '_blank'),
              variant: 'outline' as const,
            },
          ]
        : []),
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
  }

  return { columns, actions }
}
