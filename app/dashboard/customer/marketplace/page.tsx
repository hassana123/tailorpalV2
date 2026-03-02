'use client'

// ─────────────────────────────────────────────────────────────────────────────
// CustomerMarketplacePage.tsx
// Same logic — UI elevated to match the Orders page standard
// ─────────────────────────────────────────────────────────────────────────────

import { CustomerMarketplaceHeader } from '@/components/dashboard/customer/CustomerMarketplaceHeader'
import { MarketplaceResults } from '@/components/marketplace/MarketplaceResults'
import { useMarketplaceShops } from '@/lib/marketplace/use-marketplace-shops'
import { Store } from 'lucide-react'

export default function CustomerMarketplacePage() {
  const {
    allShops,
    featuredShops,
    displayed,
    searchQuery,
    loading,
    searching,
    isSearching,
    handleSearch,
    clearSearch,
  } = useMarketplaceShops()

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
          <Store className="h-6 w-6 text-brand-gold" />
          Marketplace
        </h1>
        <p className="text-sm text-brand-stone mt-1">
          Discover and connect with tailors and fashion shops near you
        </p>
      </div>

      {/* ── Search / filter header ──────────────────────────────────────── */}
      <CustomerMarketplaceHeader
        totalShops={allShops.length}
        searchQuery={searchQuery}
        searching={searching}
        onSearch={handleSearch}
      />

      {/* ── Results card ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <MarketplaceResults
          loading={loading}
          isSearching={isSearching}
          displayed={displayed}
          featuredShops={featuredShops}
          detailsBasePath="/dashboard/customer/marketplace/shop"
          onClearSearch={clearSearch}
        />
      </div>

    </div>
  )
}