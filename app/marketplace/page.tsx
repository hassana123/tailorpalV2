'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar }            from '@/components/layout/Navbar'
import { Footer }            from '@/components/layout/Footer'
import { FinalCTA }          from '@/components/home/FinalCTA'
import { MarketplaceHero }   from '@/components/marketplace/MarketplaceHero'
import { ShopCard, ShopSkeleton } from '@/components/marketplace/ShopCard'
import { Store, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'

interface Shop {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  is_featured: boolean
  rating: number | null
  review_count: number
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  logo_url: string | null
  banner_url: string | null
  latitude: number | null
  longitude: number | null
}

interface ShopWithRatings extends Shop {
  shop_ratings?: Array<{ rating: number }>
}

export default function MarketplacePage() {
  const supabase = createClient()
  const [allShops, setAllShops]           = useState<Shop[]>([])
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([])
  const [displayed, setDisplayed]         = useState<Shop[]>([])
  const [searchQuery, setSearchQuery]     = useState('')
  const [loading, setLoading]             = useState(true)
  const [searching, setSearching]         = useState(false)

  useEffect(() => { fetchShops() }, [])

  const fetchShops = async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('shops')
        .select('*, shop_ratings(rating)')
        .order('created_at', { ascending: false })

      if (err) throw err

      const processed = ((data || []) as ShopWithRatings[]).map((shop) => {
        const ratings = shop.shop_ratings || []
        const avg = ratings.length
          ? parseFloat((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
          : null
        return { ...shop, rating: avg, review_count: ratings.length }
      })

      setAllShops(processed)
      setDisplayed(processed)
      setFeaturedShops(processed.filter((s) => s.is_featured).slice(0, 3))
    } catch {
      toast.error('Failed to load shops. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (!q.trim()) {
      setDisplayed(allShops)
      return
    }
    setSearching(true)
    try {
      const { data, error: err } = await supabase
        .from('shops')
        .select('*')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,country.ilike.%${q}%,address.ilike.%${q}%`)
      if (err) throw err
      setDisplayed(((data || []) as Shop[]).map((s) => ({ ...s, rating: null, review_count: 0 })))
    } catch {
      toast.error('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const isSearching = !!searchQuery.trim()

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

        {/* Featured shops */}
        {!isSearching && featuredShops.length > 0 && !loading && (
          <div className="mb-14">
            <div className="mb-6">
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-1">Hand-picked</p>
              <h2 className="font-display text-2xl text-brand-ink">Featured Shops</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} featured />
              ))}
            </div>
          </div>
        )}

        {/* All shops / search results */}
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
              {[...Array(6)].map((_, i) => <ShopSkeleton key={i} />)}
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
                  : 'Check back soon — shops are joining every day.'}
              </p>
              {isSearching && (
                <button
                  onClick={() => { setSearchQuery(''); setDisplayed(allShops) }}
                  className="mt-4 text-sm text-brand-gold font-semibold hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FinalCTA />
      <Footer />
    </div>
  )
}
