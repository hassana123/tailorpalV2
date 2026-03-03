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
  Tag,
  ImageIcon,
  ShoppingBag,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types (unchanged) ────────────────────────────────────────────────────────

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

interface ShopDetailsResponse {
  shop?: Shop
  reviews?: Review[]
  catalogItems?: CatalogItem[]
  error?: string
}

interface ShopProfileContentProps {
  shopId: string
  backHref: string
  backLabel?: string
  loginReturnPath: string
  compactTop?: boolean
}

// ─── Star Picker (logic unchanged) ───────────────────────────────────────────

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

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="py-5 border-b border-brand-border last:border-0">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-brand-ink text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          <User size={14} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={i < review.rating ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}
                />
              ))}
            </div>
            <p className="text-[10px] text-brand-stone flex items-center gap-1">
              <Clock size={9} />
              {new Date(review.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <p className="text-sm text-brand-charcoal leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">{eyebrow}</p>
      <h2 className="font-display text-xl text-brand-ink">{title}</h2>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShopProfileContent({
  shopId,
  backHref,
  backLabel = 'Marketplace',
  loginReturnPath,
  compactTop = false,
}: ShopProfileContentProps) {
  const router = useRouter()
  const supabase = createClient()

  // ─── State (all logic unchanged) ──────────────────────────────────────

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

  // ─── Data fetching (all logic unchanged) ──────────────────────────────

  const fetchShop = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!shopId) {
        throw new Error('Invalid shop ID')
      }

      const [authRes, detailsRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/marketplace/shops/${encodeURIComponent(shopId)}`, {
          cache: 'no-store',
        }),
      ])
      const details = (await detailsRes.json().catch(() => null)) as ShopDetailsResponse | null

      if (!detailsRes.ok || !details?.shop) {
        throw new Error(details?.error || 'Failed to load shop details.')
      }

      setIsAuthenticated(Boolean(authRes.data.user))
      const nextShop = details.shop
      const nextReviews = details.reviews ?? []
      const nextCatalog = details.catalogItems ?? []
      setShop(nextShop)
      setReviews(nextReviews)
      setCatalogItems(nextCatalog)
      setSelectedCatalogItemId(nextCatalog[0]?.id ?? '')
      if (nextReviews.length > 0) {
        const avg = nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextReviews.length
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
    if (!comment.trim()) { toast.error('Please write a review comment.'); return }
    setSubmittingReview(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Please sign in to leave a review.'); router.push(loginPath); return }
      const { error: insertError } = await supabase
        .from('shop_ratings')
        .insert([{ shop_id: shopId, user_id: user.id, rating, comment }])
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
    if (!selectedCatalogItemId) { toast.error('Please choose a catalog item.'); return }
    if (!orderRequest.requesterName.trim()) { toast.error('Please enter your name.'); return }
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
      setOrderRequest({ requesterName: '', requesterEmail: '', requesterPhone: '', notes: '' })
      toast.success('Order request sent to shop owner')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit order request')
    } finally {
      setSubmittingRequest(false)
    }
  }

  // ─── Loading / Error states ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h1 className="font-display text-2xl text-brand-ink mb-2">Shop not found</h1>
        <p className="text-brand-stone text-sm mb-6">
          This shop may have been removed or the link is incorrect.
        </p>
        <Link
          href={backHref}
          className="inline-flex h-10 px-6 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all items-center gap-2"
        >
          <ArrowLeft size={14} />
          Back to marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-cream">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
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
            <div>
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

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 space-y-0">

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-6">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left / main column ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            <div className="bg-white rounded-2xl border border-brand-border p-6">
              <SectionHeader eyebrow="About this shop" title={shop.name} />
              <p className="text-brand-charcoal text-sm leading-relaxed">
                {shop.description || 'No description provided yet.'}
              </p>
            </div>

            {/* Location & contact */}
            <div className="bg-white rounded-2xl border border-brand-border p-6">
              <SectionHeader eyebrow="Shop details" title="Location and contact" />
              <div className="space-y-2.5 text-sm text-brand-charcoal">
                <p className="flex items-center gap-2.5">
                  <MapPin size={14} className="text-brand-gold flex-shrink-0" />
                  {[shop.address, shop.city, shop.state, shop.country].filter(Boolean).join(', ') ||
                    'Location not provided'}
                </p>
                {shop.email && (
                  <p className="flex items-center gap-2.5">
                    <Mail size={14} className="text-brand-gold flex-shrink-0" />
                    {shop.email}
                  </p>
                )}
                {shop.phone && (
                  <p className="flex items-center gap-2.5">
                    <Phone size={14} className="text-brand-gold flex-shrink-0" />
                    {shop.phone}
                  </p>
                )}
              </div>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 rounded-xl border border-brand-border px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-cream transition-colors"
                >
                  Open in Google Maps
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Catalog */}
            <div className="bg-white rounded-2xl border border-brand-border p-6">
              <SectionHeader
                eyebrow="Catalog"
                title={`${catalogItems.length} Item${catalogItems.length !== 1 ? 's' : ''}`}
              />
              {catalogItems.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-brand-border bg-brand-cream/30">
                  <Tag size={28} className="text-brand-border mx-auto mb-3" />
                  <p className="text-brand-stone text-sm">
                    This shop has not added catalog items yet.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {catalogItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'border rounded-2xl overflow-hidden transition-all cursor-pointer',
                        selectedCatalogItemId === item.id
                          ? 'border-brand-gold ring-2 ring-brand-gold/20'
                          : 'border-brand-border hover:border-brand-gold/50',
                      )}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-36 object-cover"
                        />
                      ) : (
                        <div className="w-full h-36 bg-brand-cream/60 flex items-center justify-center">
                          <ImageIcon size={24} className="text-brand-border" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-brand-ink text-sm">{item.name}</p>
                          <p className="text-sm font-bold text-brand-gold whitespace-nowrap">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        {item.description && (
                          <p className="text-xs text-brand-stone line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedCatalogItemId(item.id)}
                          className={cn(
                            'mt-3 w-full rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
                            selectedCatalogItemId === item.id
                              ? 'bg-brand-ink text-white border-brand-ink'
                              : 'bg-white text-brand-ink border-brand-border hover:bg-brand-cream',
                          )}
                        >
                          {selectedCatalogItemId === item.id ? '✓ Selected for order' : 'Order this item'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-brand-border p-6">
              <div className="flex items-start justify-between mb-6">
                <SectionHeader
                  eyebrow="Customer reviews"
                  title={reviews.length > 0 ? `${reviews.length} Review${reviews.length !== 1 ? 's' : ''}` : 'No reviews yet'}
                />
                {avgRating && (
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-4xl text-brand-ink leading-none">{avgRating}</div>
                    <div className="flex gap-0.5 justify-end mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < Math.floor(avgRating) ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-brand-stone mt-0.5">{reviews.length} reviews</p>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-brand-border bg-brand-cream/30">
                  <MessageSquare size={28} className="text-brand-border mx-auto mb-3" />
                  <p className="text-brand-stone text-sm">Be the first to review this shop!</p>
                </div>
              ) : (
                <div>
                  {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────────────── */}
          <div className="space-y-5 lg:sticky lg:top-24 lg:self-start h-fit">

            {/* Leave a review */}
            <div className="bg-white rounded-2xl border border-brand-border p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center">
                  <MessageSquare size={14} className="text-brand-gold" />
                </div>
                <h3 className="font-display text-base text-brand-ink">Leave a review</h3>
              </div>

              {submittedReview ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <p className="font-semibold text-brand-ink text-sm mb-1">Review submitted!</p>
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
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2 text-xs font-semibold text-white hover:bg-brand-charcoal transition-colors"
                  >
                    <Send size={11} />
                    Sign in to review
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-2">
                      Your rating
                    </label>
                    <StarPicker value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-2">
                      Your review
                    </label>
                    <textarea
                      placeholder="Share your experience with this shop..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-brand-cream/50 text-sm text-brand-charcoal placeholder:text-brand-stone resize-none focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
                    />
                  </div>
                  <button
                    onClick={submitReview}
                    disabled={submittingReview || !comment.trim()}
                    className="w-full h-10 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? (
                      <><Loader2 size={13} className="animate-spin" /> Submitting…</>
                    ) : (
                      <><Send size={13} /> Submit review</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Order from catalog */}
            <div className="bg-white rounded-2xl border border-brand-border p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center">
                  <ShoppingBag size={14} className="text-brand-gold" />
                </div>
                <h3 className="font-display text-base text-brand-ink">Order from catalog</h3>
              </div>

              <div className="space-y-3">
                {/* Catalog item select */}
                <div>
                  <label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-1.5">
                    Catalog item
                  </label>
                  <select
                    value={selectedCatalogItemId}
                    onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all appearance-none"
                  >
                    <option value="">Choose an item</option>
                    {catalogItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — ${item.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact fields */}
                {(['requesterName', 'requesterEmail', 'requesterPhone'] as const).map((field) => (
                  <input
                    key={field}
                    value={orderRequest[field]}
                    onChange={(e) => setOrderRequest((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={
                      field === 'requesterName' ? 'Your name *'
                      : field === 'requesterEmail' ? 'Your email'
                      : 'Your phone'
                    }
                    className="w-full h-10 px-3 rounded-xl border border-brand-border bg-white text-sm text-brand-ink placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
                  />
                ))}

                <textarea
                  value={orderRequest.notes}
                  onChange={(e) => setOrderRequest((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes about your order…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-ink placeholder:text-brand-stone resize-none focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
                />

                <button
                  type="button"
                  onClick={submitCatalogOrderRequest}
                  disabled={submittingRequest || catalogItems.length === 0}
                  className="w-full h-10 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRequest ? (
                    <><Loader2 size={13} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Send size={13} /> Send order request</>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
