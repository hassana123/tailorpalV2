'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Ruler,
  Scissors,
  MessageSquare,
  PackageCheck,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Share2,
  AlertTriangle,
} from 'lucide-react'

interface Slide {
  id: string
  tag: string
  title: string
  description: string
  inspiration: string
  icon: typeof Ruler
  highlights: string[]
  statsBadge: string
  ctaText: string
  ctaLink: string
  previewContent: {
    title: string
    subtitle: string
    tag: string
    cardType: 'measurements' | 'production' | 'tracking' | 'inventory' | 'lookbook'
  }
}

const SLIDES: Slide[] = [
  {
    id: 'measurements',
    tag: 'Stitcha & HauteApp Inspired',
    title: 'Smart Garment Presets & Inches Anatomy',
    description:
      'Never write measurements on scraps of paper or cardboard again. Pick Senator, Agbada, Gown or Suit with one tap — required inches are generated instantly and exported to WhatsApp with ₦0 friction.',
    inspiration: '1-Tap Measurement Presets',
    icon: Ruler,
    highlights: [
      'Pre-built African tailoring templates (Senator, Agbada, Kaftan, Female Gowns)',
      'Accurate anatomy in inches (\") matching Nigerian standard tailor tapes',
      'One-tap export formatted WhatsApp card directly to the client',
    ],
    statsBadge: 'Saves 15 mins per client',
    ctaText: 'Explore Measurement Presets',
    ctaLink: '/how-it-works',
    previewContent: {
      title: 'Senator / Kaftan Bespoke Template',
      subtitle: 'Client: Chief Babatunde Adeleke · Recorded in Inches (\")',
      tag: 'African Bespoke Preset',
      cardType: 'measurements',
    },
  },
  {
    id: 'production',
    tag: 'Cresoa & OgaTailor Inspired',
    title: 'Visual Production Board & Real-Time Timers',
    description:
      'Know the exact status of every garment in your workshop. Drag orders across Cutting, Sewing, Fitting, and Ready. Track apprentice hours with live timers and eliminate delivery date panic.',
    inspiration: 'Atelier Production Pipeline',
    icon: Scissors,
    highlights: [
      'Visual 4-stage pipeline: Cutting → Sewing → Fitting → Ready',
      'Real-time workshop timers for apprentices and master cutters',
      'Strict fitting date countdowns with overdue warning flags',
    ],
    statsBadge: 'Zero missed wedding deadlines',
    ctaText: 'See Workshop Workflow',
    ctaLink: '/how-it-works',
    previewContent: {
      title: 'Bespoke Atelier Production Line',
      subtitle: '4 Orders in progress · 1 Fitting scheduled today at 3:00 PM',
      tag: 'Stage Timers Active',
      cardType: 'production',
    },
  },
  {
    id: 'tracking',
    tag: 'Noverd & MyStitchBook Inspired',
    title: 'Live Client Order Tracking & WhatsApp Receipts',
    description:
      'Give every customer a VIP experience. Every commission gets a unique tracking link (e.g. /track/ORD-9021) showing stage progress, Naira invoice balance, and direct WhatsApp atelier messaging.',
    inspiration: 'Self-Serve Client Portal',
    icon: MessageSquare,
    highlights: [
      'Unique live tracking web portal for each client commission',
      'Itemized invoices in Naira (₦) with deposit vs remaining balance',
      'Stops clients calling repeatedly to ask "is my cloth ready?"',
    ],
    statsBadge: 'Reduces WhatsApp calls by 75%',
    ctaText: 'Test Live Tracking Link',
    ctaLink: '/track/demo',
    previewContent: {
      title: 'Client Order Tracking Portal',
      subtitle: 'Order #TP-8492 · Mermaid Corset Evening Gown',
      tag: 'Live Web Link',
      cardType: 'tracking',
    },
  },
  {
    id: 'inventory',
    tag: 'Stock & Haberdashery',
    title: 'Fabric Yardage & Lining Stock Control',
    description:
      'Track your rolls of cashmere, wool, lace, and Aso-Oke by the yard or meter. Set minimum safety stock so you never discover you are out of black lining in the middle of a weekend rush.',
    inspiration: 'Haberdashery & Yardage Management',
    icon: PackageCheck,
    highlights: [
      'Track stock in yards, meters, pieces, and zippers',
      'Automatic low-stock warnings with visual warning badges',
      'Cost per yard tracking in Naira (₦) to calculate real profit margins',
    ],
    statsBadge: 'Avoid costly rush re-orders',
    ctaText: 'View Inventory Features',
    ctaLink: '/how-it-works',
    previewContent: {
      title: 'Atelier Fabric & Stock Depository',
      subtitle: '8 Fabric rolls · 3 Low stock warnings detected',
      tag: 'Stockyard Alert',
      cardType: 'inventory',
    },
  },
  {
    id: 'lookbook',
    tag: 'Pindder Inspired',
    title: 'Public Digital Lookbook & Commission Requests',
    description:
      'Turn your smartphone into a high-converting digital storefront. Showcase your best Senator cuts, Agbadas, and wedding gowns with fixed or starting prices in ₦. Clients order directly.',
    inspiration: 'Public Boutique Portfolio',
    icon: Sparkles,
    highlights: [
      'Shareable mobile lookbook link for your Instagram and WhatsApp bio',
      'Display clear prices in Naira (₦) with fabric requirements',
      'Receive pre-filled commission requests right inside your atelier inbox',
    ],
    statsBadge: 'Convert Instagram leads into orders',
    ctaText: 'Browse Atelier Marketplace',
    ctaLink: '/marketplace',
    previewContent: {
      title: 'Boutique Lookbook & Catalog',
      subtitle: '14 Curated Bespoke Styles · Direct Inquiry Enabled',
      tag: 'Social Bio Ready',
      cardType: 'lookbook',
    },
  },
]

export function AtelierShowcaseSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const currentSlide = SLIDES[currentIndex]
  const IconComponent = currentSlide.icon

  // Auto-advance every 6.5s
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
    }, 6500)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused])

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
  }

  return (
    <section
      className="py-24 lg:py-32 bg-white relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background aesthetics */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-ink/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream border border-brand-border text-brand-charcoal text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles size={12} className="text-brand-gold" />
              World-Class Atelier Operating System
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-ink leading-[1.15]">
              Everything a modern tailoring house needs.{' '}
              <span className="text-brand-gold italic">All in one slider.</span>
            </h2>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <span className="text-xs font-semibold text-brand-stone font-mono">
              0{currentIndex + 1} / 0{SLIDES.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                className="w-10 h-10 rounded-full border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-colors shadow-sm hover:border-brand-gold"
                aria-label="Previous slide"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goToNext}
                className="w-10 h-10 rounded-full border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-colors shadow-sm hover:border-brand-gold"
                aria-label="Next slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Category Quick Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {SLIDES.map((slide, idx) => {
            const SIcon = slide.icon
            const isActive = idx === currentIndex
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-brand-ink text-white border-brand-ink shadow-brand'
                    : 'bg-brand-cream/80 text-brand-stone border-brand-border hover:bg-white hover:text-brand-ink'
                }`}
              >
                <SIcon size={13} className={isActive ? 'text-brand-gold' : 'text-brand-stone'} />
                <span>{slide.inspiration}</span>
              </button>
            )
          })}
        </div>

        {/* Main Slide Card (Dual Column Interactive Presentation) */}
        <div className="bg-brand-cream rounded-3xl border border-brand-border p-6 sm:p-8 lg:p-12 transition-all duration-500 shadow-sm relative">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 text-[11px] font-bold uppercase tracking-wider">
                  {currentSlide.tag}
                </span>
                <span className="text-xs text-brand-stone font-semibold">
                  {currentSlide.statsBadge}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-ink text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <IconComponent size={24} className="text-brand-gold" />
                </div>
                <div>
                  <h3 className="font-display text-2xl sm:text-3xl text-brand-ink leading-tight">
                    {currentSlide.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm sm:text-base text-brand-stone leading-relaxed">
                {currentSlide.description}
              </p>

              {/* Highlights List */}
              <div className="space-y-2.5 pt-2">
                {currentSlide.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-brand-charcoal">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link href={currentSlide.ctaLink}>
                  <button className="h-11 px-6 rounded-xl bg-brand-ink hover:bg-brand-charcoal text-white text-xs sm:text-sm font-bold transition-all shadow-brand flex items-center justify-center gap-2 w-full sm:w-auto">
                    <span>{currentSlide.ctaText}</span>
                    <ArrowRight size={14} />
                  </button>
                </Link>
                <Link href="/auth/sign-up">
                  <button className="h-11 px-6 rounded-xl bg-white border border-brand-border hover:border-brand-gold text-brand-ink text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                    Try Free Now
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Interactive Mockup Snapshot */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border border-brand-border p-5 sm:p-7 shadow-lg relative overflow-hidden">
                {/* Header of Snapshot */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border">
                  <div>
                    <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider block">
                      {currentSlide.previewContent.tag}
                    </span>
                    <h4 className="font-semibold text-sm text-brand-ink">
                      {currentSlide.previewContent.title}
                    </h4>
                    <p className="text-[11px] text-brand-stone">
                      {currentSlide.previewContent.subtitle}
                    </p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* SLIDE TYPE 1: MEASUREMENTS */}
                {currentSlide.previewContent.cardType === 'measurements' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { k: 'Neck', v: '17.0"' },
                        { k: 'Chest', v: '43.5"' },
                        { k: 'Shoulder', v: '19.5"' },
                        { k: 'Sleeve Length', v: '26.0"' },
                        { k: 'Shirt Length', v: '38.0"' },
                        { k: 'Trouser Length', v: '41.0"' },
                        { k: 'Waist', v: '35.0"' },
                        { k: 'Thigh', v: '26.0"' },
                        { k: 'Ankle / Base', v: '15.0"' },
                      ].map((item) => (
                        <div key={item.k} className="p-2 rounded-xl bg-brand-cream border border-brand-border text-center">
                          <p className="text-[10px] text-brand-stone">{item.k}</p>
                          <p className="text-xs font-bold text-brand-ink mt-0.5">{item.v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Share2 size={15} className="text-[#25D366]" />
                        <span className="text-xs font-semibold text-brand-ink">WhatsApp Ready Message</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-[#25D366] text-white rounded-lg">
                        1-Tap Send
                      </span>
                    </div>
                  </div>
                )}

                {/* SLIDE TYPE 2: PRODUCTION */}
                {currentSlide.previewContent.cardType === 'production' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-brand-cream border border-brand-border space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-brand-ink">Agbada Embroidery & Sewing</span>
                        <span className="px-2 py-0.5 bg-amber-500/15 text-amber-700 font-bold rounded-md text-[10px] flex items-center gap-1">
                          <Clock size={10} className="animate-spin" /> In Progress
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-brand-stone">
                        <span>Assigned: Tunde (Apprentice)</span>
                        <span className="font-mono font-bold text-brand-ink">Timer: 01h 42m</span>
                      </div>
                      <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full w-[70%]" />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                        ✓ Cutting
                      </div>
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                        ● Sewing
                      </div>
                      <div className="p-2 rounded-lg bg-brand-cream text-brand-stone border border-brand-border">
                        ○ Fitting
                      </div>
                      <div className="p-2 rounded-lg bg-brand-cream text-brand-stone border border-brand-border">
                        ○ Ready
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE TYPE 3: TRACKING */}
                {currentSlide.previewContent.cardType === 'tracking' && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-brand-cream rounded-xl border border-brand-border flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-brand-stone font-semibold">TOTAL COMMISSION</p>
                        <p className="text-base font-bold text-brand-ink">₦95,000</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-brand-stone font-semibold">BALANCE DUE</p>
                        <p className="text-sm font-bold text-brand-gold">₦35,000</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-brand-border rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-ink">Live Order Status</span>
                        <span className="text-emerald-600 font-bold text-[11px]">Ready for Fitting</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-brand-stone">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>All garments tailored and pressed for collection</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SLIDE TYPE 4: INVENTORY */}
                {currentSlide.previewContent.cardType === 'inventory' && (
                  <div className="space-y-2">
                    {[
                      { item: 'Navy Blue Super 140s Wool', qty: '42 Yards', status: 'In Stock', alert: false },
                      { item: 'White Polish Cotton', qty: '18 Yards', status: 'Adequate', alert: false },
                      { item: 'Gold Metallic Embroidery Thread', qty: '2 Spools', status: 'Low Stock', alert: true },
                      { item: 'Heavyweight Black Hair Canvas', qty: '4 Yards', status: 'Low Stock', alert: true },
                    ].map((row, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-brand-cream border border-brand-border flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-brand-ink">{row.item}</p>
                          <p className="text-[10px] text-brand-stone">{row.qty}</p>
                        </div>
                        {row.alert ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle size={10} /> {row.status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-bold">
                            {row.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* SLIDE TYPE 5: LOOKBOOK */}
                {currentSlide.previewContent.cardType === 'lookbook' && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: 'Imperial Senator Set', price: '₦55,000', cat: 'Men Bespoke' },
                      { name: 'Agbada Grandeur', price: '₦125,000', cat: 'Traditional' },
                      { name: 'Corset Evening Gown', price: '₦85,000', cat: 'Couture' },
                      { name: 'Casual Linen Kaftan', price: '₦40,000', cat: 'Contemporary' },
                    ].map((style, i) => (
                      <div key={i} className="p-3 rounded-xl bg-brand-cream border border-brand-border text-left">
                        <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider block">
                          {style.cat}
                        </span>
                        <p className="font-bold text-xs text-brand-ink mt-0.5">{style.name}</p>
                        <p className="text-xs font-semibold text-brand-stone mt-1">{style.price}</p>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* Slide Navigation Progress Indicator */}
          <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-brand-border/60">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-brand-gold' : 'w-2 bg-brand-border hover:bg-brand-stone'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
