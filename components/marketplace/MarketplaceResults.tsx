'use client'

// ─────────────────────────────────────────────────────────────────────────────
// MarketplaceResults.tsx
// Same logic as original — UI elevated to match the Orders page standard
// ─────────────────────────────────────────────────────────────────────────────

import { SlidersHorizontal, Store, Sparkles } from 'lucide-react'
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
    <div className="space-y-8">

      {/* ── Featured shops ────────────────────────────────────────────── */}
      {showFeatured && !isSearching && featuredShops.length > 0 && !loading && (
        <div>
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-1">
                Hand-picked
              </p>
              <h2 className="font-display text-xl text-brand-ink flex items-center gap-2">
                <Sparkles size={16} className="text-brand-gold" />
                Featured Shops
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
              {featuredShops.length} featured
            </span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} featured detailsBasePath={detailsBasePath} />
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-brand-border mt-8" />
        </div>
      )}

      {/* ── All shops / search results ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            {isSearching ? (
              <>
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.22em] mb-1">
                  Search results
                </p>
                <h2 className="font-display text-xl text-brand-ink">
                  {displayed.length}{' '}
                  <span className="text-brand-stone">
                    {displayed.length === 1 ? 'shop' : 'shops'} found
                  </span>
                </h2>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.22em] mb-1">
                  Browse all
                </p>
                <h2 className="font-display text-xl text-brand-ink">All Shops</h2>
              </>
            )}
          </div>
          <button className="flex items-center gap-1.5 text-brand-stone text-xs font-semibold border border-brand-border rounded-xl px-3 py-2 hover:bg-brand-cream transition-colors bg-white">
            <SlidersHorizontal size={13} />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <ShopSkeleton key={i} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-brand-border bg-white">
            <div className="w-14 h-14 rounded-2xl bg-brand-cream flex items-center justify-center mx-auto mb-4">
              <Store size={24} className="text-brand-border" />
            </div>
            <h3 className="font-display text-xl text-brand-ink mb-2">
              {isSearching ? 'No shops found' : 'No shops yet'}
            </h3>
            <p className="text-brand-stone text-sm">
              {isSearching
                ? 'Try different keywords or clear your search.'
                : 'Check back soon — shops are joining every day.'}
            </p>
            {isSearching && (
              <button
                onClick={onClearSearch}
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-brand-gold font-semibold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((shop) => (
              <ShopCard key={shop.id} shop={shop} detailsBasePath={detailsBasePath} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}