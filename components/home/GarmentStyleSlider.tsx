'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Scissors,
  Ruler,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react'

interface GarmentStyle {
  id: string
  name: string
  nativeCategory: string
  yardsNeeded: string
  typicalPrice: string
  keyMeasurements: string[]
  description: string
  accentColor: string
}

const STYLES: GarmentStyle[] = [
  {
    id: 'senator',
    name: 'Executive Senator / Kaftan',
    nativeCategory: 'Men Bespoke · Contemporary',
    yardsNeeded: '4.0 Yards Cashmere or Wool',
    typicalPrice: '₦45,000 - ₦75,000',
    keyMeasurements: ['Neck: 16.5"', 'Chest: 42.0"', 'Shoulder: 19.0"', 'Shirt Length: 36.0"', 'Inseam: 31.0"'],
    description: 'Crisp, structured silhouette with clean breast pocket and tailored slim trousers. The most popular bespoke outfit across Nigeria.',
    accentColor: 'border-brand-gold/40',
  },
  {
    id: 'agbada',
    name: 'Grand Royal Agbada 3-Piece',
    nativeCategory: 'Traditional · Ceremonial',
    yardsNeeded: '7.0 - 8.0 Yards Damask / Guinea',
    typicalPrice: '₦90,000 - ₦180,000',
    keyMeasurements: ['Neck: 17.0"', 'Agbada Span: 58.0"', 'Chest: 44.0"', 'Kaftan Length: 39.0"', 'Trouser: 42.0"'],
    description: 'Statement ceremonial attire featuring wide-winged sleeves, intricate geometric embroidery on the chest, inner kaftan, and sokoto trousers.',
    accentColor: 'border-amber-500/40',
  },
  {
    id: 'corset-gown',
    name: 'Mermaid Corset Reception Gown',
    nativeCategory: 'Women Couture · Bridal',
    yardsNeeded: '5.5 Yards Satin, Lace & Lining',
    typicalPrice: '₦120,000 - ₦300,000',
    keyMeasurements: ['Bust: 36.0"', 'Underbust: 30.0"', 'Waist: 28.0"', 'Hip: 42.0"', 'Dress Length: 60.0"'],
    description: 'Fitted corset boning with hourglass waist cinch, flared mermaid hemline, and hand-beaded lace appliques.',
    accentColor: 'border-rose-400/40',
  },
  {
    id: 'iro-buba',
    name: 'Modern Iro & Buba with Gele',
    nativeCategory: 'Traditional · Occasion',
    yardsNeeded: '5.0 Yards Silk or Organza',
    typicalPrice: '₦60,000 - ₦110,000',
    keyMeasurements: ['Bust: 38.0"', 'Shoulder: 16.5"', 'Buba Length: 25.0"', 'Wrapper Length: 44.0"'],
    description: 'Contemporary reimagining of the classic Yoruba wrapper and blouse with structured tulip sleeves and modern knot wrap drape.',
    accentColor: 'border-emerald-500/40',
  },
  {
    id: 'safari-kaftan',
    name: 'Casual Two-Piece Safari Kaftan',
    nativeCategory: 'Smart Casual · Everyday',
    yardsNeeded: '3.5 Yards Cotton or Linen',
    typicalPrice: '₦35,000 - ₦60,000',
    keyMeasurements: ['Chest: 41.0"', 'Shoulder: 18.5"', 'Top Length: 32.0"', 'Waist: 33.0"', 'Length: 40.0"'],
    description: 'Relaxed collarless tunic top with patch pockets and drawstring trousers. Breathable and comfortable for daily wear.',
    accentColor: 'border-sky-500/40',
  },
  {
    id: 'bespoke-suit',
    name: 'Double-Breasted Bespoke Suit',
    nativeCategory: 'Formalwear · Sartorial',
    yardsNeeded: '3.5 - 4.0 Yards Super 130s Wool',
    typicalPrice: '₦150,000 - ₦350,000',
    keyMeasurements: ['Chest: 40.0"', 'Waist: 32.0"', 'Jacket Length: 30.0"', 'Sleeve: 25.5"', 'Inseam: 31.5"'],
    description: 'Fully canvassed jacket with peak lapels, horn buttons, surgeon cuffs, and side adjusters on flat-front trousers.',
    accentColor: 'border-violet-500/40',
  },
]

export function GarmentStyleSlider() {
  const [scrollIndex, setScrollIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return
    const cardWidth = 360
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth
    containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    
    // Update active index
    const newIdx = direction === 'left'
      ? Math.max(0, scrollIndex - 1)
      : Math.min(STYLES.length - 1, scrollIndex + 1)
    setScrollIndex(newIdx)
  }

  return (
    <section className="py-20 bg-brand-cream border-t border-brand-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-border text-brand-charcoal text-xs font-semibold uppercase tracking-wider mb-3">
              <Scissors size={12} className="text-brand-gold" />
              1-Tap Measurement Presets
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-brand-ink leading-tight">
              African Garments, <span className="text-brand-gold italic">Ready-to-Measure</span>
            </h2>
            <p className="text-sm text-brand-stone mt-2 max-w-xl">
              Every garment style comes pre-configured with the exact measurement fields required by Nigerian master tailors.
            </p>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScroll('left')}
              className="w-10 h-10 rounded-full border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-colors shadow-sm"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className="w-10 h-10 rounded-full border border-brand-border bg-white hover:bg-brand-cream text-brand-ink flex items-center justify-center transition-colors shadow-sm"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Cards Container */}
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto pb-6 scroll-smooth no-scrollbar snap-x snap-mandatory"
        >
          {STYLES.map((style) => (
            <div
              key={style.id}
              className={`w-[320px] sm:w-[360px] flex-shrink-0 bg-white rounded-3xl border border-brand-border p-6 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between snap-start ${style.accentColor}`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider bg-brand-cream px-2.5 py-1 rounded-lg border border-brand-border">
                    {style.nativeCategory}
                  </span>
                  <span className="text-xs font-bold text-brand-ink">
                    {style.typicalPrice}
                  </span>
                </div>

                <h3 className="font-display text-xl text-brand-ink mb-2">
                  {style.name}
                </h3>

                <p className="text-xs text-brand-stone leading-relaxed mb-4">
                  {style.description}
                </p>

                {/* Yardage Requirement */}
                <div className="flex items-center gap-2 p-2.5 bg-brand-cream/80 border border-brand-border rounded-xl text-xs text-brand-charcoal mb-4">
                  <Layers size={14} className="text-brand-gold flex-shrink-0" />
                  <span className="font-semibold">{style.yardsNeeded}</span>
                </div>

                {/* Key Measurements Preview */}
                <div>
                  <span className="text-[10px] font-bold text-brand-stone uppercase tracking-wider block mb-2 flex items-center gap-1">
                    <Ruler size={11} /> Key Measurements Anatomy (\")
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {style.keyMeasurements.map((m, i) => (
                      <div key={i} className="px-2 py-1 bg-brand-cream border border-brand-border rounded-lg text-[11px] font-mono text-brand-ink font-semibold">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-brand-border">
                <Link href="/how-it-works">
                  <button className="w-full py-2.5 px-4 bg-brand-ink hover:bg-brand-charcoal text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <Sparkles size={12} className="text-brand-gold" />
                    <span>Use {style.name.split(' ')[0]} Preset</span>
                    <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
