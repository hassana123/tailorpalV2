'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Users,
  Mic2,
  Ruler,
  BarChart3,
  LayoutGrid,
  ShieldCheck,
  CalendarClock,
  WalletCards,
  PackageCheck,
  UsersRound,
  Image as ImageIcon,
  MessageCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Crown,
} from 'lucide-react'

interface Feature {
  Icon: typeof CalendarClock
  label: string
  desc: string
  status: 'Now' | 'Next'
  category: 'production' | 'clients' | 'commerce'
  tag: string
  benefit: string
}

const FEATURES: Feature[] = [
  {
    Icon: CalendarClock,
    label: 'Production Planner',
    desc: 'Turn delivery dates and active work into a clear plan for the day.',
    status: 'Now',
    category: 'production',
    tag: 'Daily Dispatch',
    benefit: 'Clear daily goals for cutting table & seamstresses',
  },
  {
    Icon: Users,
    label: 'Customer Management',
    desc: 'Organise every customer profile, contact and order history in one elegant dashboard.',
    status: 'Now',
    category: 'clients',
    tag: 'Client Rolodex',
    benefit: 'Instant search by phone, city, or order number',
  },
  {
    Icon: Mic2,
    label: 'Voice AI Assistant',
    desc: 'Add customers and record measurements hands-free — just speak naturally.',
    status: 'Now',
    category: 'clients',
    tag: 'Hands-Free AI',
    benefit: 'Speak tape measurements without dropping the tape',
  },
  {
    Icon: Ruler,
    label: 'Measurement Tracking',
    desc: 'Record and store precise measurements for perfectly fitting garments, every time.',
    status: 'Now',
    category: 'clients',
    tag: 'Inches Anatomy',
    benefit: 'Senator, Agbada & Gown presets in standard inches (\")',
  },
  {
    Icon: BarChart3,
    label: 'Business Analytics',
    desc: 'Track sales, customer growth and performance with clean, real-time dashboards.',
    status: 'Now',
    category: 'commerce',
    tag: 'Revenue Insights',
    benefit: 'Monthly profit and completion velocity in ₦',
  },
  {
    Icon: LayoutGrid,
    label: 'Order Management',
    desc: 'Create and track every order from intake to delivery, with status and notifications.',
    status: 'Now',
    category: 'production',
    tag: 'Atelier Pipeline',
    benefit: '5-stage progress tracking: Intake to Delivery',
  },
  {
    Icon: ShieldCheck,
    label: 'Secure & Reliable',
    desc: 'Enterprise-grade security by Supabase. Your data is encrypted, backed up, protected.',
    status: 'Now',
    category: 'commerce',
    tag: 'Data Vault',
    benefit: '256-bit bank-grade encryption with automated backups',
  },
  {
    Icon: WalletCards,
    label: 'Profit & Payments',
    desc: 'Price confidently, record deposits and see outstanding balances.',
    status: 'Next',
    category: 'commerce',
    tag: 'Naira Invoicing',
    benefit: 'Itemized receipts with WhatsApp payment links',
  },
  {
    Icon: PackageCheck,
    label: 'Inventory',
    desc: 'Keep fabrics, trims and supplies ready with low-stock visibility.',
    status: 'Now',
    category: 'production',
    tag: 'Yardage Control',
    benefit: 'Stock tracking in yards, meters, pieces and lining',
  },
  {
    Icon: UsersRound,
    label: 'Team Workload',
    desc: 'Balance tasks across cutters, sewers and finishing specialists.',
    status: 'Next',
    category: 'production',
    tag: 'Labor Dispatch',
    benefit: 'Apprentice skill tagging and time entry tracking',
  },
  {
    Icon: ImageIcon,
    label: 'Design References',
    desc: 'Keep customer screenshots, fabric details and style notes together.',
    status: 'Next',
    category: 'production',
    tag: 'Visual Brief',
    benefit: 'Attach neckline & embroidery reference photos',
  },
  {
    Icon: MessageCircle,
    label: 'Customer Tracking',
    desc: 'Share updates and delivery progress without the “how far?” messages.',
    status: 'Next',
    category: 'clients',
    tag: 'Self-Serve Portal',
    benefit: 'Private live web tracking link per order (/track/...)',
  },
  {
    Icon: Crown,
    label: 'Wedding & Aso-Ebi',
    desc: 'Manage grouped outfits, fittings, payments and one event deadline.',
    status: 'Next',
    category: 'clients',
    tag: 'Group Orders',
    benefit: 'Unified event countdown for entire wedding parties',
  },
]

type FilterTab = 'all' | 'now' | 'next' | 'production' | 'clients' | 'commerce'

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const filteredFeatures = FEATURES.filter((f) => {
    if (activeTab === 'all') return true
    if (activeTab === 'now') return f.status === 'Now'
    if (activeTab === 'next') return f.status === 'Next'
    return f.category === activeTab
  })

  // Auto-slide every 5s if not paused
  useEffect(() => {
    if (isPaused) return
    const interval = setInterval(() => {
      handleNext()
    }, 5000)
    return () => clearInterval(interval)
  }, [isPaused, currentIndex, filteredFeatures.length])

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return
    const cardWidth = 370 // Card width + gap
    containerRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    })
    setCurrentIndex(index)
  }

  const handlePrev = () => {
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : filteredFeatures.length - 1
    scrollToIndex(nextIdx)
  }

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % filteredFeatures.length
    scrollToIndex(nextIdx)
  }

  return (
    <section
      id="features"
      className="py-24 lg:py-32 bg-white relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 -left-48 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-ink/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cream border border-brand-border text-brand-charcoal text-xs font-semibold uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles size={13} className="text-brand-gold" />
              Everything you need
            </div>
            <h2 className="font-display text-4xl sm:text-5xl text-brand-ink leading-[1.12]">
              Powerful tools for fashion professionals
            </h2>
            <p className="text-brand-stone text-base sm:text-lg leading-relaxed mt-4">
              From customer management to AI-powered voice assistance — built for the modern fashion business.
            </p>
          </div>

          {/* Slider Controls & Progress Counter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start lg:self-end">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-brand-stone bg-brand-cream border border-brand-border px-3 py-2 rounded-xl">
              <span className="text-brand-ink">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span>/</span>
              <span>{String(filteredFeatures.length).padStart(2, '0')}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-11 h-11 rounded-2xl border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-all shadow-sm hover:border-brand-gold active:scale-95"
                aria-label="Previous feature"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="w-11 h-11 rounded-2xl border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-all shadow-sm hover:border-brand-gold active:scale-95"
                aria-label="Next feature"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sophisticated Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {[
            { id: 'all', label: 'All Features', count: FEATURES.length },
            { id: 'now', label: '● Available Now', count: FEATURES.filter((f) => f.status === 'Now').length },
            { id: 'next', label: '✦ Roadmap Next', count: FEATURES.filter((f) => f.status === 'Next').length },
            { id: 'production', label: 'Workshop & Production', count: FEATURES.filter((f) => f.category === 'production').length },
            { id: 'clients', label: 'Clients & Measurements', count: FEATURES.filter((f) => f.category === 'clients').length },
            { id: 'commerce', label: 'Finance & Security', count: FEATURES.filter((f) => f.category === 'commerce').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as FilterTab)
                setCurrentIndex(0)
                if (containerRef.current) containerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeTab === tab.id
                  ? 'bg-brand-ink text-white border-brand-ink shadow-brand'
                  : 'bg-brand-cream/70 text-brand-stone border-brand-border hover:bg-white hover:text-brand-ink'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-brand-border/60 text-brand-charcoal'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Modern Sophisticated Slider Track */}
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 scroll-smooth no-scrollbar snap-x snap-mandatory"
        >
          {filteredFeatures.map((feature, idx) => {
            const { Icon, label, desc, status, tag, benefit } = feature
            const isNow = status === 'Now'
            const isFocused = idx === currentIndex

            return (
              <div
                key={label}
                className={`w-[320px] sm:w-[360px] flex-shrink-0 rounded-3xl border transition-all duration-300 snap-start flex flex-col justify-between p-7 relative ${
                  isFocused
                    ? 'bg-white border-brand-gold shadow-card-hover scale-[1.01]'
                    : 'bg-brand-cream/80 border-brand-border hover:bg-white hover:border-brand-gold/40 hover:shadow-card'
                }`}
              >
                <div>
                  {/* Top Status & Tag Bar */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-stone bg-white px-2.5 py-1 rounded-lg border border-brand-border">
                      {tag}
                    </span>

                    {isNow ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Now Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#D97B2B] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                        <Sparkles size={11} className="text-[#D97B2B]" />
                        Coming Next
                      </span>
                    )}
                  </div>

                  {/* Icon Block */}
                  <div className="w-14 h-14 rounded-2xl bg-brand-ink text-white flex items-center justify-center mb-6 shadow-md transition-transform duration-300 group-hover:scale-105 border border-white/10">
                    <Icon size={24} className="text-brand-gold" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-2xl text-brand-ink leading-tight mb-2.5">
                    {label}
                  </h3>
                  <p className="text-sm text-brand-stone leading-relaxed mb-6">
                    {desc}
                  </p>
                </div>

                {/* Bottom Benefit Footer */}
                <div className="pt-4 border-t border-brand-border/70 flex items-start gap-2 text-xs font-semibold text-brand-charcoal">
                  {isNow ? (
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Clock size={14} className="text-brand-gold flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{benefit}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Interactive Progress Indicators */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {filteredFeatures.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-brand-gold' : 'w-2 bg-brand-border hover:bg-brand-stone'
              }`}
              aria-label={`Go to feature slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
