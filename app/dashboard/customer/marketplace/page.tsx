'use client'

import { CustomerMarketplaceHeader } from '@/components/dashboard/customer/CustomerMarketplaceHeader'
import { MarketplaceResults } from '@/components/marketplace/MarketplaceResults'
import { useMarketplaceShops } from '@/lib/marketplace/use-marketplace-shops'

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
    <div className="p-5 md:p-8 space-y-8 bg-gradient-to-b from-brand-cream to-white min-h-full">
      <CustomerMarketplaceHeader
        totalShops={allShops.length}
        searchQuery={searchQuery}
        searching={searching}
        onSearch={handleSearch}
      />

      <section className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
        <MarketplaceResults
          loading={loading}
          isSearching={isSearching}
          displayed={displayed}
          featuredShops={featuredShops}
          detailsBasePath="/dashboard/customer/marketplace/shop"
          onClearSearch={clearSearch}
        />
      </section>
    </div>
  )
}
