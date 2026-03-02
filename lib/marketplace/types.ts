export interface MarketplaceShop {
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

export interface MarketplaceShopWithRatings extends MarketplaceShop {
  shop_ratings?: Array<{ rating: number }>
}
