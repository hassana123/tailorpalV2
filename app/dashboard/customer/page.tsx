'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowRight,
  Clock3,
  Compass,
  Search,
  Sparkles,
  Star,
  Store,
  MessageSquareText,
} from 'lucide-react'

interface MarketplaceShop {
  id: string
  name: string
  description: string | null
  city: string | null
  state: string | null
  country: string | null
  logo_url: string | null
  is_featured: boolean
  rating: number | null
  review_count: number
}

interface CatalogRow {
  shop_id: string
}

interface UserReview {
  id: string
  shop_id: string
  rating: number
  comment: string
  created_at: string
}

interface DisplayShop extends Omit<MarketplaceShop, 'rating' | 'review_count'> {
  avgRating: number | null
  reviewCount: number
  catalogCount: number
}

interface MarketplaceShopsResponse {
  shops?: MarketplaceShop[]
  error?: string
}

interface CustomerReviewsResponse {
  reviews?: UserReview[]
  error?: string
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [shops, setShops] = useState<DisplayShop[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [shopNameById, setShopNameById] = useState<Record<string, string>>({})

  useEffect(() => {
    void loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.replace('/auth/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, user_type')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (!profile?.user_type) {
        router.replace('/auth/choose-role')
        return
      }

      if (profile.user_type === 'shop_owner') {
        router.replace('/dashboard/shop')
        return
      }
      if (profile.user_type === 'staff') {
        router.replace('/dashboard/staff')
        return
      }

      setFirstName(profile.first_name ?? '')

      const [marketplaceRes, catalogRes, reviewsRes] = await Promise.all([
        fetch('/api/marketplace/shops', { cache: 'no-store' }),
        supabase.from('shop_catalog_items').select('shop_id').eq('is_active', true),
        fetch('/api/customer/reviews', { cache: 'no-store' }),
      ])

      if (catalogRes.error) throw catalogRes.error

      const shopsPayload = (await marketplaceRes
        .json()
        .catch(() => null)) as MarketplaceShopsResponse | null
      if (!marketplaceRes.ok || !shopsPayload?.shops) {
        throw new Error(shopsPayload?.error || 'Failed to load shops')
      }

      const reviewsPayload = (await reviewsRes
        .json()
        .catch(() => null)) as CustomerReviewsResponse | null
      const rawShops = shopsPayload.shops
      const catalogRows = (catalogRes.data ?? []) as CatalogRow[]
      const myReviews = reviewsPayload?.reviews ?? []

      const catalogCountByShop = catalogRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.shop_id] = (acc[row.shop_id] ?? 0) + 1
        return acc
      }, {})

      const computedShops: DisplayShop[] = rawShops.map((shop) => {
        return {
          ...shop,
          avgRating: shop.rating,
          reviewCount: shop.review_count,
          catalogCount: catalogCountByShop[shop.id] ?? 0,
        }
      })

      setShops(computedShops)
      setReviews(myReviews)
      setShopNameById(
        rawShops.reduce<Record<string, string>>((acc, shop) => {
          acc[shop.id] = shop.name
          return acc
        }, {}),
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load customer dashboard'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const filteredShops = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return shops
    }

    return shops.filter((shop) => {
      const location = [shop.city, shop.state, shop.country].filter(Boolean).join(' ').toLowerCase()
      return (
        shop.name.toLowerCase().includes(query) ||
        (shop.description ?? '').toLowerCase().includes(query) ||
        location.includes(query)
      )
    })
  }, [searchQuery, shops])

  const featuredCount = useMemo(
    () => shops.filter((shop) => Boolean(shop.is_featured)).length,
    [shops],
  )

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-8 space-y-8 bg-gradient-to-b from-brand-cream to-white min-h-full">
      <section className="rounded-3xl border border-brand-border bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-gold/10 border border-brand-gold/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">
              <Sparkles size={12} />
              Customer dashboard
            </p>
            <h1 className="mt-3 font-display text-3xl text-brand-ink">
              {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-brand-stone">
              Explore shops, compare catalogs, and leave reviews after each experience.
            </p>
          </div>

          <Link
            href="/dashboard/customer/marketplace"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-charcoal transition-colors"
          >
            Browse full marketplace
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mt-5 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-stone" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search shops by name, city, state, or country..."
            className="w-full rounded-xl border border-brand-border bg-brand-cream pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
          />
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <article className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-stone">Shops available</p>
          <p className="mt-2 font-display text-3xl text-brand-ink">{shops.length}</p>
        </article>
        <article className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-stone">Featured shops</p>
          <p className="mt-2 font-display text-3xl text-brand-ink">{featuredCount}</p>
        </article>
        <article className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-stone">Reviews you posted</p>
          <p className="mt-2 font-display text-3xl text-brand-ink">{reviews.length}</p>
        </article>
        <article className="rounded-2xl border border-brand-border bg-white p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-brand-stone">Action</p>
          <Link href="/dashboard/customer/marketplace" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold hover:text-brand-charcoal">
            <Compass size={14} />
            Continue browsing
          </Link>
        </article>
      </section>

      <section className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-2xl border border-brand-border bg-white p-5 md:p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-stone">Shops</p>
            <h2 className="font-display text-2xl text-brand-ink">
              {filteredShops.length} result{filteredShops.length === 1 ? '' : 's'}
            </h2>
          </div>

          {filteredShops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-border p-10 text-center">
              <Store size={28} className="mx-auto text-brand-border mb-3" />
              <p className="text-sm text-brand-stone">No shops matched your search.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredShops.map((shop) => (
                <article key={shop.id} className="rounded-xl border border-brand-border bg-brand-cream/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {shop.logo_url ? (
                        <img
                          src={shop.logo_url}
                          alt={`${shop.name} logo`}
                          className="w-10 h-10 rounded-lg object-cover border border-brand-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-ink text-white flex items-center justify-center font-semibold">
                          {shop.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-brand-ink">{shop.name}</p>
                        <p className="text-xs text-brand-stone">
                          {[shop.city, shop.state, shop.country].filter(Boolean).join(', ') || 'Location pending'}
                        </p>
                      </div>
                    </div>
                    {shop.is_featured ? (
                      <span className="rounded-full border border-brand-gold/30 bg-brand-gold/10 px-2 py-1 text-[10px] font-bold uppercase text-brand-gold">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm text-brand-stone line-clamp-2">
                    {shop.description || 'This shop has not added a description yet.'}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-xs text-brand-charcoal">
                    <span className="inline-flex items-center gap-1">
                      <Star size={12} className={shop.avgRating ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'} />
                      {shop.avgRating ? `${shop.avgRating} (${shop.reviewCount})` : 'No reviews yet'}
                    </span>
                    <span>{shop.catalogCount} catalog item{shop.catalogCount === 1 ? '' : 's'}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={`/dashboard/customer/marketplace/shop/${shop.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-ink px-3 py-2 text-xs font-semibold text-white hover:bg-brand-charcoal transition-colors"
                    >
                      View shop
                      <ArrowRight size={12} />
                    </Link>
                    <Link
                      href={`/dashboard/customer/marketplace/shop/${shop.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-2 text-xs font-semibold text-brand-ink hover:bg-white transition-colors"
                    >
                      Leave review
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-brand-border bg-white p-5 md:p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.14em] text-brand-stone">Your activity</p>
            <h2 className="font-display text-2xl text-brand-ink">Recent reviews</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-border p-8 text-center">
              <MessageSquareText size={24} className="mx-auto text-brand-border mb-3" />
              <p className="text-sm text-brand-stone">You have not reviewed any shop yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-brand-border bg-brand-cream/30 p-3.5">
                  <p className="text-sm font-semibold text-brand-ink">
                    {shopNameById[review.shop_id] ?? 'Shop'}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-brand-charcoal">
                    <Star size={12} className="text-brand-gold fill-brand-gold" />
                    {review.rating}/5
                    <span className="inline-flex items-center gap-1 text-brand-stone ml-2">
                      <Clock3 size={11} />
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-brand-stone line-clamp-3">{review.comment}</p>
                  <Link
                    href={`/dashboard/customer/marketplace/shop/${review.shop_id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-gold hover:text-brand-charcoal"
                  >
                    Open shop
                    <ArrowRight size={11} />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}
