import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

type ShopRatingRow = { rating: number }

type ShopRow = {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
  is_featured: boolean
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
  shop_ratings?: ShopRatingRow[]
}

const SHOP_SELECT = `
  id,
  name,
  description,
  owner_id,
  created_at,
  is_featured,
  email,
  phone,
  address,
  city,
  state,
  country,
  logo_url,
  banner_url,
  latitude,
  longitude,
  shop_ratings ( rating )
`

function withComputedRating(shop: ShopRow) {
  const ratings = shop.shop_ratings ?? []
  const rating = ratings.length
    ? Number((ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length).toFixed(1))
    : null

  const { shop_ratings, ...rest } = shop

  return {
    ...rest,
    rating,
    review_count: ratings.length,
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    const supabase = createAdminClient()

    let qb = supabase.from('shops').select(SHOP_SELECT).order('created_at', { ascending: false })

    if (query) {
      qb = qb.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%,country.ilike.%${query}%,address.ilike.%${query}%`,
      )
    }

    const { data, error } = await qb

    if (error) {
      console.error('Failed to fetch marketplace shops:', error)
      return NextResponse.json({ error: 'Failed to load shops' }, { status: 500 })
    }

    return NextResponse.json({
      shops: ((data ?? []) as ShopRow[]).map(withComputedRating),
    })
  } catch (error) {
    console.error('Marketplace shops endpoint error:', error)
    return NextResponse.json({ error: 'Failed to load shops' }, { status: 500 })
  }
}
