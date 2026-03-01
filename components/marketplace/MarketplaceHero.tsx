import { Search, Store, Loader2 } from 'lucide-react'

interface MarketplaceHeroProps {
  shopCount: number
  searchQuery: string
  searching: boolean
  onSearch: (q: string) => void
}

export function MarketplaceHero({ shopCount, searchQuery, searching, onSearch }: MarketplaceHeroProps) {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(217,123,43,0.22) 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.032]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-5 sm:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/8 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/30 mb-6">
          <Store size={25} />
          {shopCount > 0 ? `${shopCount} shops available` : 'Fashion marketplace'}
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.2rem] text-white leading-[1.1] mb-5">
          Discover talented{' '}
          <span className="text-gradient-light italic">fashion professionals</span>
        </h1>
        <p className="text-white text-lg max-w-2xl mx-auto mb-9 leading-relaxed">
          Browse designers and tailors, read real reviews, and find the perfect professional for your custom clothing needs.
        </p>

        {/* Search bar */}
        <div className="relative max-w-xl mx-auto">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-stone pointer-events-none" />
          <input
            type="text"
            placeholder="Search by shop name or style…"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-12 rounded-xl bg-white border border-brand-border text-brand-ink text-sm font-medium placeholder:text-brand-stone shadow-card focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
          />
          {searching && (
            <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-stone animate-spin" />
          )}
        </div>
      </div>
    </section>
  )
}