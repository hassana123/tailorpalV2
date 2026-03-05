'use client'

import Link from 'next/link'
import { Package } from 'lucide-react'

export function MyRequestsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
          <Package className="h-6 w-6 text-brand-gold" />
          My Requests
        </h1>
        <p className="text-sm text-brand-stone mt-1">
          Track every catalog request and follow order progress
        </p>
      </div>
      <Link
        href="/dashboard/customer/marketplace"
        className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-brand-ink hover:bg-brand-charcoal text-white text-sm font-medium rounded-xl shadow-brand transition-colors"
      >
        Browse Catalog
      </Link>
    </div>
  )
}
