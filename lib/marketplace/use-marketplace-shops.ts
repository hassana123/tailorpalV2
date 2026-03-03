'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { MarketplaceShop } from '@/lib/marketplace/types'

type MarketplaceShopsResponse = {
  shops?: MarketplaceShop[]
  error?: string
}

const MARKETPLACE_SHOPS_API = '/api/marketplace/shops'

async function fetchMarketplaceShops(query?: string) {
  const trimmed = query?.trim() ?? ''
  const url = trimmed
    ? `${MARKETPLACE_SHOPS_API}?q=${encodeURIComponent(trimmed)}`
    : MARKETPLACE_SHOPS_API

  const response = await fetch(url, { cache: 'no-store' })
  const payload = (await response.json().catch(() => null)) as MarketplaceShopsResponse | null

  if (!response.ok || !payload?.shops) {
    throw new Error(payload?.error || 'Failed to load shops')
  }

  return payload.shops
}

export function useMarketplaceShops() {
  const [allShops, setAllShops] = useState<MarketplaceShop[]>([])
  const [featuredShops, setFeaturedShops] = useState<MarketplaceShop[]>([])
  const [displayed, setDisplayed] = useState<MarketplaceShop[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true)
      const shops = await fetchMarketplaceShops()
      const processed = shops

      setAllShops(processed)
      setDisplayed(processed)
      setFeaturedShops(processed.filter((shop) => shop.is_featured).slice(0, 3))
    } catch {
      toast.error('Failed to load shops. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

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
        const shops = await fetchMarketplaceShops(query)
        setDisplayed(shops)
      } catch {
        toast.error('Search failed. Please try again.')
      } finally {
        setSearching(false)
      }
    },
    [allShops],
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
