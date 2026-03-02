'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Star,
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  Send,
  MapPin,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react'

interface Shop {
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

interface Review {
  id: string
  shop_id: string
  rating: number
  comment: string
  created_at: string
}

interface CatalogItem {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
}

interface ShopProfileContentProps {
  shopId: string
  backHref: string
  backLabel?: string
  loginReturnPath: string
  compactTop?: boolean
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={22}
            className={(hovered || value) >= n ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="py-6 border-b border-brand-border last:border-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-brand-ink text-white flex items-center justify-center text-xs font-bold">
          C
        </div>
        <div>
          <div className="flex gap-0.5 mb-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < review.rating ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}
              />
            ))}
          </div>
          <p className="text-xs text-brand-stone flex items-center gap-1">
            <Clock size={10} />
            {new Date(review.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
      <p className="text-sm text-brand-charcoal leading-relaxed">{review.comment}</p>
    </div>
  )
}

export function ShopProfileContent({
  shopId,
  backHref,
  backLabel = 'Marketplace',
  loginReturnPath,
  compactTop = false,
}: ShopProfileContentProps) {
  const router = useRouter()
  const supabase = createClient()

  const [shop, setShop] = useState<Shop | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [submittedReview, setSubmittedReview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState('')
  const [orderRequest, setOrderRequest] = useState({
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    notes: '',
  })

  const loginPath = `/auth/login?next=${encodeURIComponent(loginReturnPath)}`

  useEffect(() => {
    void fetchShop()
  }, [shopId])

  const mapUrl = useMemo(() => {
    if (!shop) return null

    if (typeof shop.latitude === 'number' && typeof shop.longitude === 'number') {
      return `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
    }

    const query = [shop.address, shop.city, shop.state, shop.country].filter(Boolean).join(', ')
    if (!query) return null
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }, [shop])

  const fetchShop = async () => {
    try {
      setLoading(true)
      const [authRes, shopRes, reviewsRes, catalogRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('shops').select('*').eq('id', shopId).single(),
        supabase
          .from('shop_ratings')
          .select('*')
          .eq('shop_id', shopId)
          .order('created_at', { ascending: false }),
        supabase
          .from('shop_catalog_items')
          .select('*')
          .eq('shop_id', shopId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ])

      if (shopRes.error) throw shopRes.error
      setIsAuthenticated(Boolean(authRes.data.user))

      const nextShop = shopRes.data as Shop
      const nextReviews = (reviewsRes.data ?? []) as Review[]
      const nextCatalog = catalogRes.error ? [] : ((catalogRes.data ?? []) as CatalogItem[])

      setShop(nextShop)
      setReviews(nextReviews)
      setCatalogItems(nextCatalog)
      setSelectedCatalogItemId(nextCatalog[0]?.id ?? '')

      if (nextReviews.length > 0) {
        const avg = nextReviews.reduce((sum, review) => sum + review.rating, 0) / nextReviews.length
        setAvgRating(Number(avg.toFixed(1)))
      } else {
        setAvgRating(null)
      }
    } catch {
      const message = 'Failed to load shop details.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!comment.trim()) {
      toast.error('Please write a review comment.')
      return
    }

    setSubmittingReview(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in to leave a review.')
        router.push(loginPath)
        return
      }

      const { error: insertError } = await supabase.from('shop_ratings').insert([
        { shop_id: shopId, user_id: user.id, rating, comment },
      ])

      if (insertError) throw insertError

      setComment('')
      setRating(5)
      setSubmittedReview(true)
      toast.success('Review submitted')
      await fetchShop()
      setTimeout(() => setSubmittedReview(false), 2500)
    } catch {
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const submitCatalogOrderRequest = async () => {
    if (!selectedCatalogItemId) {
      toast.error('Please choose a catalog item.')
      return
    }
    if (!orderRequest.requesterName.trim()) {
      toast.error('Please enter your name.')
      return
    }
    if (!orderRequest.requesterEmail.trim() && !orderRequest.requesterPhone.trim()) {
      toast.error('Please add email or phone.')
      return
    }

    try {
      setSubmittingRequest(true)
      const response = await fetch('/api/catalog/order-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          catalogItemId: selectedCatalogItemId,
          requesterName: orderRequest.requesterName.trim(),
          requesterEmail: orderRequest.requesterEmail.trim() || undefined,
          requesterPhone: orderRequest.requesterPhone.trim() || undefined,
          notes: orderRequest.notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Failed to create request')
      }

      setOrderRequest({
        requesterName: '',
        requesterEmail: '',
        requesterPhone: '',
        notes: '',
      })
      toast.success('Order request sent to shop owner')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit order request')
    } finally {
      setSubmittingRequest(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="text-brand-stone animate-spin" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-brand-ink mb-2">Shop not found</h1>
        <p className="text-brand-stone text-sm mb-6">
          This shop may have been removed or the link is incorrect.
        </p>
        <Link
          href={backHref}
          className="inline-flex h-10 px-6 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all items-center gap-2 mx-auto"
        >
          <ArrowLeft size={14} />
          Back to marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <section className={`relative ${compactTop ? 'pt-10' : 'pt-24'} pb-14 overflow-hidden`}>
        <div className="absolute inset-0 gradient-hero" />
        {shop.banner_url && (
          <div
            className="absolute inset-0 opacity-35 bg-cover bg-center"
            style={{ backgroundImage: `url(${shop.banner_url})` }}
          />
        )}
        <div
          className="absolute inset-0 opacity-18"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 40% 50%, rgba(217,123,43,0.2) 0%, transparent 70%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8"
          >
            <ArrowLeft size={13} />
            {backLabel}
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={`${shop.name} logo`}
                className="w-16 h-16 rounded-2xl border border-white/25 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-gold text-white flex items-center justify-center font-display text-3xl flex-shrink-0">
                {shop.name[0]}
              </div>
            )}
            <div className="flex-1">
              <h1 className="font-display text-3xl sm:text-4xl text-white mb-1">{shop.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                {avgRating ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < Math.floor(avgRating) ? 'text-brand-gold fill-brand-gold' : 'text-white/25'}
                        />
                      ))}
                    </div>
                    <span className="text-white font-semibold text-sm">{avgRating}</span>
                    <span className="text-white/50 text-xs">
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                ) : (
                  <span className="text-white/45 text-xs">No reviews yet</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-12">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-8">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-7">
            <div className="bg-white rounded-2xl border border-brand-border p-7">
              <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-3">
                About this shop
              </p>
              <p className="text-brand-charcoal text-sm leading-relaxed">
                {shop.description || 'No description provided yet.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-brand-border p-7">
              <div className="mb-5">
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">
                  Shop details
                </p>
                <h2 className="font-display text-xl text-brand-ink">Location and contact</h2>
              </div>
              <div className="space-y-2 text-sm text-brand-charcoal">
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-brand-gold" />
                  {[shop.address, shop.city, shop.state, shop.country].filter(Boolean).join(', ') ||
                    'Location not provided'}
                </p>
                {shop.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-brand-gold" />
                    {shop.email}
                  </p>
                )}
                {shop.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-brand-gold" />
                    {shop.phone}
                  </p>
                )}
              </div>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 rounded-lg border border-brand-border px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-cream transition-colors"
                >
                  Open in Google Maps
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-brand-border p-7">
              <div className="mb-6">
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">
                  Catalog
                </p>
                <h2 className="font-display text-xl text-brand-ink">
                  {catalogItems.length} Item{catalogItems.length !== 1 ? 's' : ''}
                </h2>
              </div>
              {catalogItems.length === 0 ? (
                <p className="text-brand-stone text-sm">
                  This shop has not added catalog items yet.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {catalogItems.map((item) => (
                    <div key={item.id} className="border border-brand-border rounded-xl p-4 bg-brand-cream/40">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-36 rounded-lg object-cover mb-3"
                        />
                      )}
                      <p className="font-semibold text-brand-ink">{item.name}</p>
                      <p className="text-sm text-brand-stone mt-1">{item.description || 'No description provided.'}</p>
                      <p className="mt-3 text-sm font-semibold text-brand-charcoal">
                        ${item.price.toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedCatalogItemId(item.id)}
                        className={`mt-3 w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          selectedCatalogItemId === item.id
                            ? 'bg-brand-ink text-white border-brand-ink'
                            : 'bg-white text-brand-ink border-brand-border hover:bg-brand-cream'
                        }`}
                      >
                        {selectedCatalogItemId === item.id ? 'Selected for order' : 'Order this item'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-brand-border p-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">
                    Customer reviews
                  </p>
                  <h2 className="font-display text-xl text-brand-ink">
                    {reviews.length > 0 ? `${reviews.length} Review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
                  </h2>
                </div>
                {avgRating && (
                  <div className="text-right">
                    <div className="font-display text-4xl text-brand-ink">{avgRating}</div>
                    <div className="flex gap-0.5 justify-end mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < Math.floor(avgRating) ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare size={32} className="text-brand-border mx-auto mb-3" />
                  <p className="text-brand-stone text-sm">Be the first to review this shop!</p>
                </div>
              ) : (
                <div>
                  {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start h-fit">
            <div className="bg-white rounded-2xl border border-brand-border p-6">
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare size={16} className="text-brand-gold" />
                <h3 className="font-sans font-bold text-brand-ink text-sm">Leave a review</h3>
              </div>

              {submittedReview ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle2 size={36} className="text-brand-sage mb-3" />
                  <p className="font-semibold text-brand-ink text-sm mb-1">Review submitted</p>
                  <p className="text-brand-stone text-xs">Thank you for your feedback.</p>
                </div>
              ) : !isAuthenticated ? (
                <div className="rounded-xl border border-brand-border bg-brand-cream/50 p-4">
                  <p className="text-sm font-semibold text-brand-ink mb-1">Sign in to leave a review</p>
                  <p className="text-xs text-brand-stone mb-3">
                    You can browse freely, but reviews require an account.
                  </p>
                  <Link
                    href={loginPath}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-ink px-3 py-2 text-xs font-semibold text-white hover:bg-brand-charcoal transition-colors"
                  >
                    <Send size={12} />
                    Sign in to review
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider block mb-2.5">
                      Your rating
                    </label>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider block mb-2.5">
                      Your review
                    </label>
                    <textarea
                      placeholder="Share your experience with this shop..."
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-brand-border bg-brand-cream text-sm text-brand-charcoal placeholder:text-brand-stone resize-none focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
                    />
                  </div>

                  <button
                    onClick={submitReview}
                    disabled={submittingReview || !comment.trim()}
                    className="w-full h-11 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all shadow-brand flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Submit review
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-brand-border p-6">
              <h3 className="font-sans font-bold text-brand-ink text-sm mb-4">Order from catalog</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider block mb-2">
                    Catalog item
                  </label>
                  <select
                    value={selectedCatalogItemId}
                    onChange={(event) => setSelectedCatalogItemId(event.target.value)}
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                  >
                    <option value="">Choose an item</option>
                    {catalogItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - ${item.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    value={orderRequest.requesterName}
                    onChange={(event) =>
                      setOrderRequest((prev) => ({ ...prev, requesterName: event.target.value }))
                    }
                    placeholder="Your name"
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <input
                    value={orderRequest.requesterEmail}
                    onChange={(event) =>
                      setOrderRequest((prev) => ({ ...prev, requesterEmail: event.target.value }))
                    }
                    placeholder="Your email"
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <input
                    value={orderRequest.requesterPhone}
                    onChange={(event) =>
                      setOrderRequest((prev) => ({ ...prev, requesterPhone: event.target.value }))
                    }
                    placeholder="Your phone"
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <textarea
                    value={orderRequest.notes}
                    onChange={(event) =>
                      setOrderRequest((prev) => ({ ...prev, notes: event.target.value }))
                    }
                    placeholder="Optional notes"
                    rows={4}
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={submitCatalogOrderRequest}
                  disabled={submittingRequest || catalogItems.length === 0}
                  className="w-full h-10 rounded-lg bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRequest ? 'Sending request...' : 'Send order request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
