
import Link from 'next/link'
import {
 
  Star,
  ArrowRight,
 

  BadgeCheck,
  ExternalLink,
  MapPin,
} from 'lucide-react'
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
  latitude: number | null
  longitude: number | null
}
export  function ShopCard({ shop, featured = false }: { shop: Shop; featured?: boolean }) {
  const locationLabel =
    [shop.city, shop.state, shop.country].filter(Boolean).join(', ') ||
    shop.address ||
    'Location not added yet'
  const mapUrl =
    typeof shop.latitude === 'number' && typeof shop.longitude === 'number'
      ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
      : shop.address || shop.city || shop.state || shop.country
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            [shop.address, shop.city, shop.state, shop.country].filter(Boolean).join(', '),
          )}`
        : null

  return (
      <div className="group h-full p-6 rounded-2xl border border-brand-border bg-white hover:border-brand-gold/40 hover:shadow-card-hover transition-all duration-300 card-hover flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          {/* Shop avatar */}
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={`${shop.name} logo`}
              className="w-12 h-12 rounded-xl object-cover border border-brand-border flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-brand-ink text-white flex items-center justify-center font-display text-lg flex-shrink-0">
              {shop.name[0]}
            </div>
          )}
          {featured && (
            <span className="inline-flex items-center gap-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-gold/25">
              <BadgeCheck size={10} />
              Featured
            </span>
          )}
        </div>

        {/* Name & description */}
        <Link href={`/marketplace/shop/${shop.id}`}>
          <h3 className="font-sans font-bold text-brand-ink text-base mb-1.5 line-clamp-1 group-hover:text-brand-gold transition-colors">
            {shop.name}
          </h3>
        </Link>
        <p className="text-sm text-brand-stone leading-relaxed flex-1 line-clamp-2 mb-4">
          {shop.description || 'A fashion professional on TailorPal.'}
        </p>
        <div className="space-y-1 mb-4 text-xs text-brand-stone">
          <p className="line-clamp-1 flex items-center gap-1.5">
            <MapPin size={12} />
            <span className="font-semibold text-brand-charcoal">Location:</span> {locationLabel}
          </p>
          {shop.phone && (
            <p className="line-clamp-1">
              <span className="font-semibold text-brand-charcoal">Phone:</span> {shop.phone}
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {shop.rating !== null ? (
              <>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={i < Math.floor(shop.rating!) ? 'text-brand-gold fill-brand-gold' : 'text-brand-border'}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-brand-charcoal">
                  {shop.rating}
                </span>
                <span className="text-xs text-brand-stone">
                  ({shop.review_count})
                </span>
              </>
            ) : (
              <span className="text-xs text-brand-stone">No reviews yet</span>
            )}
          </div>
          <Link href={`/marketplace/shop/${shop.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-stone hover:text-brand-gold transition-colors">
            View
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-all duration-200" />
          </Link>
        </div>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-charcoal hover:text-brand-gold transition-colors"
          >
            Open in Maps
            <ExternalLink size={12} />
          </a>
        )}
      </div>

  )
}

// ─── Loading skeleton ──────────────────────────────────────────────────────
export  function ShopSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-brand-border bg-white animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-brand-border mb-4" />
      <div className="h-4 bg-brand-border rounded w-3/4 mb-2" />
      <div className="h-3 bg-brand-border rounded w-full mb-1.5" />
      <div className="h-3 bg-brand-border rounded w-2/3 mb-4" />
      <div className="h-3 bg-brand-border rounded w-1/3" />
    </div>
  )
}
