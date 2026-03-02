'use client'

import { SlidersHorizontal, Store } from 'lucide-react'
import { ShopCard, ShopSkeleton } from '@/components/marketplace/ShopCard'
import type { MarketplaceShop } from '@/lib/marketplace/types'

interface MarketplaceResultsProps {
  loading: boolean
  isSearching: boolean
  displayed: MarketplaceShop[]
  featuredShops: MarketplaceShop[]
  showFeatured?: boolean
  detailsBasePath?: string
  onClearSearch: () => void
}

export function MarketplaceResults({
  loading,
  isSearching,
  displayed,
  featuredShops,
  showFeatured = true,
  detailsBasePath = '/marketplace/shop',
  onClearSearch,
}: MarketplaceResultsProps) {
  return (
    <>
      {showFeatured && !isSearching && featuredShops.length > 0 && !loading && (
        <div className="mb-14">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-1">Hand-picked</p>
            <h2 className="font-display text-2xl text-brand-ink">Featured Shops</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} featured detailsBasePath={detailsBasePath} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            {isSearching ? (
              <>
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.22em] mb-1">Search results</p>
                <h2 className="font-display text-2xl text-brand-ink">
                  {displayed.length} {displayed.length === 1 ? 'shop' : 'shops'} found
                </h2>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.22em] mb-1">Browse all</p>
                <h2 className="font-display text-2xl text-brand-ink">All Shops</h2>
              </>
            )}
          </div>
          <button className="flex items-center gap-1.5 text-brand-stone text-xs font-medium border border-brand-border rounded-lg px-3 py-2 hover:bg-white transition-colors">
            <SlidersHorizontal size={13} />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, index) => <ShopSkeleton key={index} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-brand-border bg-white">
            <Store size={36} className="text-brand-border mx-auto mb-4" />
            <h3 className="font-display text-xl text-brand-ink mb-2">
              {isSearching ? 'No shops found' : 'No shops yet'}
            </h3>
            <p className="text-brand-stone text-sm">
              {isSearching
                ? 'Try different keywords or clear your search.'
                : 'Check back soon - shops are joining every day.'}
            </p>
            {isSearching && (
              <button
                onClick={onClearSearch}
                className="mt-4 text-sm text-brand-gold font-semibold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayed.map((shop) => (
              <ShopCard key={shop.id} shop={shop} detailsBasePath={detailsBasePath} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
