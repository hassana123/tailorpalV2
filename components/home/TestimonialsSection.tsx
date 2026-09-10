'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote, Sparkles } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote:
      "Before TailorPal, customer fitting dates were written on cardboard cartons and lost in the cutting room. Now, clients get live WhatsApp tracking links, and we've crossed ₦4.5M monthly revenue with zero missing garments.",
    name: 'Hajia Bilkisu Al-Hassan',
    role: 'Founder & Head Designer',
    atelier: "Bilkis Bespoke & Couture",
    location: 'Wuse II, Abuja',
    initial: 'B',
    stats: '+35% Order Completion',
  },
  {
    quote:
      "The Senator and Agbada 1-tap measurement presets save our apprentices 15 minutes on every single client. Plus, our clients love that their receipts and balances are properly formatted in Naira.",
    name: 'Emeka Nnamdi',
    role: 'Creative Director',
    atelier: 'Vangard Atelier',
    location: 'Lekki Phase 1, Lagos',
    initial: 'E',
    stats: '1,400+ Measurements Saved',
  },
  {
    quote:
      "Managing 2 workshops in Accra used to be continuous stress. The stage timers for Cutting and Sewing keep every tailor accountable. We deliver every wedding aso-ebi on time now.",
    name: 'Abigail Mensah',
    role: 'Managing Partner',
    atelier: 'Kente & Silk Studio',
    location: 'East Legon, Accra',
    initial: 'A',
    stats: 'Zero Missed Deadlines',
  },
  {
    quote:
      "The live client tracking link (/track/orderId) alone eliminated 80% of client phone calls asking 'is my cloth ready?'. Customers check their phone, see their fitting date, and pay their balance peacefully.",
    name: 'Fola Adeyemi',
    role: 'Master Craftsman',
    atelier: 'Signature Kaftans',
    location: 'GRA, Port Harcourt',
    initial: 'F',
    stats: '80% Fewer Phone Inquiries',
  },
  {
    quote:
      "Our fabric yardage and inventory are finally under control. We used to run out of black satin lining right before Saturday weddings. TailorPal alerts us well in advance.",
    name: 'Toyin Balogun',
    role: 'Owner & Tailor',
    atelier: 'Royal Stitches & Bridal',
    location: 'Bodija, Ibadan',
    initial: 'T',
    stats: '100% Stock Visibility',
  },
]

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 6000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused])

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length)
  }

  const current = TESTIMONIALS[activeIndex]

  return (
    <section
      id="testimonials"
      className="py-24 lg:py-32 bg-white relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream border border-brand-border text-brand-charcoal text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles size={12} className="text-brand-gold" />
              Atelier Success Stories
            </div>
            <h2 className="font-display text-4xl lg:text-5xl text-brand-ink leading-[1.1]">
              Trusted by 500+ Master Tailors & Couturiers
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-brand-stone">
              0{activeIndex + 1} / 0{TESTIMONIALS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="w-10 h-10 rounded-full border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-colors shadow-sm"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goNext}
                className="w-10 h-10 rounded-full border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-colors shadow-sm"
                aria-label="Next testimonial"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Featured Testimonial Hero Slider Card */}
        <div className="bg-brand-cream rounded-3xl border border-brand-border p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-sm transition-all duration-500">
          <Quote
            size={120}
            className="absolute -bottom-10 -right-6 text-brand-gold/10 pointer-events-none select-none"
          />

          <div className="max-w-4xl relative space-y-8">
            {/* Stars & Metric Badge */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={16} className="text-brand-gold fill-brand-gold" />
                ))}
                <span className="text-xs font-bold text-brand-charcoal ml-2">5.0 Atelier Rating</span>
              </div>
              <span className="px-3.5 py-1 rounded-full bg-brand-ink text-white text-xs font-bold shadow-sm">
                {current.stats}
              </span>
            </div>

            {/* Main Quote */}
            <blockquote className="font-display italic text-2xl sm:text-3xl lg:text-3.5xl text-brand-ink leading-relaxed">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            {/* Author Attribution */}
            <div className="flex items-center gap-4 pt-4 border-t border-brand-border/60">
              <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-brand-ink text-white flex items-center justify-center font-display font-bold text-lg shadow-md border border-brand-gold/30 flex-shrink-0">
                {current.initial}
              </div>
              <div>
                <h4 className="font-display font-bold text-lg text-brand-ink">
                  {current.name}
                </h4>
                <p className="text-xs text-brand-stone font-medium">
                  {current.role} · <strong className="text-brand-charcoal">{current.atelier}</strong> · {current.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Preview Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
          {TESTIMONIALS.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                idx === activeIndex
                  ? 'bg-brand-ink text-white border-brand-ink shadow-brand'
                  : 'bg-white text-brand-stone border-brand-border hover:border-brand-gold/40'
              }`}
            >
              <p className={`text-xs font-bold ${idx === activeIndex ? 'text-white' : 'text-brand-ink'}`}>
                {t.name.split(' ')[0]}
              </p>
              <p className={`text-[10px] truncate ${idx === activeIndex ? 'text-white/70' : 'text-brand-stone'}`}>
                {t.location}
              </p>
            </button>
          ))}
        </div>

      </div>
    </section>
  )
}