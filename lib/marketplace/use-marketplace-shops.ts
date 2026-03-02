'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { MarketplaceShop, MarketplaceShopWithRatings } from '@/lib/marketplace/types'

export function useMarketplaceShops() {
  const supabase = useMemo(() => createClient(), [])
  const [allShops, setAllShops] = useState<MarketplaceShop[]>([])
  const [featuredShops, setFeaturedShops] = useState<MarketplaceShop[]>([])
  const [displayed, setDisplayed] = useState<MarketplaceShop[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('shops')
        .select('*, shop_ratings(rating)')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processed = ((data || []) as MarketplaceShopWithRatings[]).map((shop) => {
        const ratings = shop.shop_ratings || []
        const averageRating = ratings.length
          ? parseFloat((ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length).toFixed(1))
          : null

        return { ...shop, rating: averageRating, review_count: ratings.length }
      })

      setAllShops(processed)
      setDisplayed(processed)
      setFeaturedShops(processed.filter((shop) => shop.is_featured).slice(0, 3))
    } catch {
      toast.error('Failed to load shops. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchShops()
  }, [fetchShops])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)
      if (!query.trim()) {
        setDisplayed(allShops)
        return
      }

      setSearching(true)
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .or(
            `name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,country.ilike.%${query}%,address.ilike.%${query}%`,
          )

        if (error) throw error

        setDisplayed(
          ((data || []) as MarketplaceShop[]).map((shop) => ({
            ...shop,
            rating: null,
            review_count: 0,
          })),
        )
      } catch {
        toast.error('Search failed. Please try again.')
      } finally {
        setSearching(false)
      }
    },
    [allShops, supabase],
  )

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setDisplayed(allShops)
  }, [allShops])

  return {
    allShops,
    featuredShops,
    displayed,
    searchQuery,
    loading,
    searching,
    isSearching: Boolean(searchQuery.trim()),
    handleSearch,
    clearSearch,
    refresh: fetchShops,
  }
}
