'use client'

import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomerHeaderProps {
  onAddCustomer: () => void
}

export function CustomerHeader({ onAddCustomer }: CustomerHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-gold" />
          Customers
        </h1>
        <p className="text-sm text-brand-stone mt-1">
          Manage your shop customers and their measurements
        </p>
      </div>
      <Button
        onClick={onAddCustomer}
        className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Customer
      </Button>
    </div>
  )
}
