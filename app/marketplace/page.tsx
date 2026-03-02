'use client'

import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FinalCTA } from '@/components/home/FinalCTA'
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero'
import { MarketplaceResults } from '@/components/marketplace/MarketplaceResults'
import { useMarketplaceShops } from '@/lib/marketplace/use-marketplace-shops'

export default function MarketplacePage() {
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
    <div className="min-h-screen bg-brand-cream overflow-x-hidden">
      <Navbar />

      <MarketplaceHero
        shopCount={allShops.length}
        searchQuery={searchQuery}
        searching={searching}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-14">
        <MarketplaceResults
          loading={loading}
          isSearching={isSearching}
          displayed={displayed}
          featuredShops={featuredShops}
          onClearSearch={clearSearch}
        />
      </div>

      <FinalCTA />
      <Footer />
    </div>
  )
}
