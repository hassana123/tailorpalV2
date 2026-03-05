'use client'

import { Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OrdersHeader({ onCreateOrder }: { onCreateOrder: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-brand-gold" />
          Orders
        </h1>
        <p className="text-sm text-brand-stone mt-1">
          Track and manage customer orders
        </p>
      </div>
      <Button
        onClick={onCreateOrder}
        className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Order
      </Button>
    </div>
  )
}
