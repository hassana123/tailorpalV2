import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

type ShopRow = {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
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

type ReviewRow = {
  id: string
  shop_id: string
  rating: number
  comment: string
  created_at: string
}

type CatalogItemRow = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
}

type RouteContext = {
  params: Promise<{ shopId: string }>
}

const SHOP_SELECT = `
  id,
  name,
  description,
  owner_id,
  created_at,
  email,
  phone,
  address,
  city,
  state,
  country,
  logo_url,
  banner_url,
  latitude,
  longitude
`

export async function GET(_: Request, context: RouteContext) {
  try {
    const { shopId } = await context.params
    if (!shopId) {
      return NextResponse.json({ error: 'Missing shop id' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const [shopRes, reviewsRes, catalogRes] = await Promise.all([
      supabase.from('shops').select(SHOP_SELECT).eq('id', shopId).maybeSingle(),
      supabase
        .from('shop_ratings')
        .select('id, shop_id, rating, comment, created_at')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false }),
      supabase
        .from('shop_catalog_items')
        .select('id, name, description, price, image_url, is_active')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    ])

    if (shopRes.error) {
      console.error('Failed to fetch marketplace shop:', shopRes.error)
      return NextResponse.json({ error: 'Failed to load shop' }, { status: 500 })
    }

    if (!shopRes.data) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if (reviewsRes.error) {
      console.error('Failed to fetch shop reviews:', reviewsRes.error)
    }
    if (catalogRes.error) {
      console.error('Failed to fetch catalog items:', catalogRes.error)
    }

    return NextResponse.json({
      shop: shopRes.data as ShopRow,
      reviews: reviewsRes.error ? [] : ((reviewsRes.data ?? []) as ReviewRow[]),
      catalogItems: catalogRes.error ? [] : ((catalogRes.data ?? []) as CatalogItemRow[]),
    })
  } catch (error) {
    console.error('Marketplace shop endpoint error:', error)
    return NextResponse.json({ error: 'Failed to load shop' }, { status: 500 })
  }
}
