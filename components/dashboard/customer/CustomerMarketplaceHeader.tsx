'use client'

import { Loader2, Search, Sparkles } from 'lucide-react'

interface CustomerMarketplaceHeaderProps {
  searchQuery: string
  searching: boolean
  totalShops: number
  onSearch: (value: string) => void
}

export function CustomerMarketplaceHeader({
  searchQuery,
  searching,
  totalShops,
  onSearch,
}: CustomerMarketplaceHeaderProps) {
  return (
    <section className="rounded-3xl border border-brand-border bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-gold/10 border border-brand-gold/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
            <Sparkles size={12} />
            Customer marketplace
          </p>
          <h1 className="mt-3 font-display text-3xl text-brand-ink">Find your next tailor</h1>
          <p className="mt-1 text-sm text-brand-stone">
            Browse and compare {totalShops} shop{totalShops === 1 ? '' : 's'} without leaving your dashboard.
          </p>
        </div>

        <div className="relative max-w-2xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-stone pointer-events-none" />
          <input
            type="text"
            placeholder="Search by shop name, city, state, or country..."
            value={searchQuery}
            onChange={(event) => onSearch(event.target.value)}
            className="w-full h-12 pl-11 pr-12 rounded-xl bg-brand-cream border border-brand-border text-brand-ink text-sm font-medium placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
          />
          {searching && (
            <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-stone animate-spin" />
          )}
        </div>
      </div>
    </section>
  )
}
