'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'
import { formatNaira, formatRelativeDate } from '@/lib/utils/format'
import { createWhatsAppUrl } from '@/lib/utils/whatsapp'
import {
  CheckCircle2,
  Scissors,
  Sparkles,
  Shirt,
  CreditCard,
  MessageCircle,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react'

interface TrackingShop {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  state?: string | null
  address?: string | null
  logo_url?: string | null
}

interface TrackingData {
  id: string
  orderNumber: string
  status: 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled'
  designDescription: string | null
  fabricDetails: string | null
  estimatedDeliveryDate: string | null
  fittingDate: string | null
  totalPrice: number | null
  depositAmount: number | null
  balanceDue: number | null
  createdAt: string
  customerFirstName: string
  currentStage: string
  productionProgress: number | null
  shop: TrackingShop | null
}

const PRODUCTION_STEPS = [
  { id: 'confirmed', label: 'Order Confirmed', description: 'Design specs & measurements locked in', icon: CheckCircle2 },
  { id: 'cutting', label: 'Pattern & Cutting', description: 'Fabric prepared and cut with precision', icon: Scissors },
  { id: 'tailoring', label: 'Tailoring & Sewing', description: 'Expert bespoke assembly underway', icon: Shirt },
  { id: 'fitting', label: 'Fitting Session', description: 'Personalized fitting & fine adjustments', icon: Sparkles },
  { id: 'ready', label: 'Ready for Pickup', description: 'Finishing, quality check, and pressing', icon: ShieldCheck },
]

function getStepIndexForStatus(status: TrackingData['status']): number {
  switch (status) {
    case 'pending':
      return 0
    case 'in_progress':
      return 2
    case 'completed':
      return 4
    case 'delivered':
      return 5
    case 'cancelled':
      return -1
    default:
      return 0
  }
}

export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.orderId

  const [tracking, setTracking] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTracking() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/track/${orderId}`)
        const data = await res.json()
        if (!res.ok || !data.tracking) {
          throw new Error(data.error || 'Order tracking not found')
        }
        setTracking(data.tracking)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to locate order')
      } finally {
        setLoading(false)
      }
    }
    if (orderId) {
      void fetchTracking()
    }
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-white border border-brand-border flex items-center justify-center shadow-sm mb-4">
          <Loader2 className="animate-spin text-brand-gold" size={26} />
        </div>
        <p className="font-semibold text-brand-ink text-base">Locating your bespoke order...</p>
        <p className="text-xs text-brand-stone mt-1">Please hold on while we fetch real-time updates</p>
      </div>
    )
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-brand-border p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="font-display text-2xl text-brand-ink mb-2">Order Not Found</h2>
          <p className="text-sm text-brand-stone leading-relaxed mb-6">
            We couldn&apos;t find an order matching <span className="font-mono font-bold text-brand-charcoal">#{orderId}</span>. Please verify the tracking link sent by your tailor.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center px-6 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all"
          >
            Go to TailorPal Home
          </Link>
        </div>
      </div>
    )
  }

  const currentStep = getStepIndexForStatus(tracking.status)
  const deliveryRelative = formatRelativeDate(tracking.estimatedDeliveryDate)
  const fittingRelative = tracking.fittingDate ? formatRelativeDate(tracking.fittingDate) : null

  const whatsappInquiryText = `Hello ${tracking.shop?.name || 'TailorPal Atelier'}, I am checking in on my order #${tracking.orderNumber} (${tracking.designDescription || 'Garment'}). Could you please provide an update? Thank you!`
  const whatsappUrl = createWhatsAppUrl(tracking.shop?.phone, whatsappInquiryText)

  return (
    <div className="min-h-screen bg-brand-cream pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <TailorPalLogo size="sm" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Atelier Tracking
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Atelier Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-ink text-white p-6 sm:p-8 shadow-brand">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 85% 20%, #D97B2B 0%, transparent 40%)',
            }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-brand-gold-light text-xs font-bold uppercase tracking-wider mb-2">
                <span>{tracking.shop?.name || 'TailorPal Atelier'}</span>
                {tracking.shop?.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-white/70 font-normal">
                      <MapPin size={11} /> {tracking.shop.city}
                      {tracking.shop.state ? `, ${tracking.shop.state}` : ''}
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl text-white">
                Hello, {tracking.customerFirstName}!
              </h1>
              <p className="text-white/70 text-sm mt-1.5 max-w-lg">
                Your bespoke piece is being handcrafted. Track each stage of your garment below.
              </p>
            </div>

            <div className="flex flex-col sm:items-end flex-shrink-0">
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Order Reference</span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-brand-gold-light">
                #{tracking.orderNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Garment Highlights & Quick Status */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-brand-border p-5">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider mb-1">Style / Outfit</p>
            <p className="font-semibold text-brand-ink text-base line-clamp-2">
              {tracking.designDescription || 'Custom Bespoke Outfit'}
            </p>
            {tracking.fabricDetails && (
              <p className="text-xs text-brand-stone mt-2 flex items-center gap-1">
                <Scissors size={12} /> {tracking.fabricDetails}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-brand-border p-5">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider mb-1">Expected Completion</p>
            <p className="font-display text-2xl text-brand-ink">
              {tracking.estimatedDeliveryDate
                ? new Date(tracking.estimatedDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : 'In Production'}
            </p>
            <p className={`text-xs mt-1 font-medium ${deliveryRelative.isUrgent ? 'text-brand-gold' : 'text-brand-stone'}`}>
              {deliveryRelative.text}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border p-5">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider mb-1">Fitting Date</p>
            <p className="font-display text-2xl text-brand-ink">
              {tracking.fittingDate
                ? new Date(tracking.fittingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : 'To be scheduled'}
            </p>
            <p className="text-xs text-brand-stone mt-1">
              {fittingRelative ? fittingRelative.text : 'Tailor will notify you'}
            </p>
          </div>
        </div>

        {/* Interactive Progress Stepper */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.2em]">Atelier Pipeline</p>
              <h2 className="font-display text-2xl text-brand-ink mt-1">Production Progress</h2>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-cream text-brand-charcoal border border-brand-border">
              {tracking.currentStage}{tracking.productionProgress !== null ? ` · ${tracking.productionProgress}%` : ''}
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-6">
            {PRODUCTION_STEPS.map((step, index) => {
              const isPast = index < currentStep
              const isCurrent = index === currentStep
              const Icon = step.icon

              return (
                <div key={step.id} className="relative flex items-start gap-4 sm:gap-6 group">
                  {/* Connecting Line */}
                  {index < PRODUCTION_STEPS.length - 1 && (
                    <div
                      className={`absolute left-5 sm:left-6 top-11 w-0.5 h-12 transition-colors ${
                        isPast ? 'bg-emerald-500' : 'bg-brand-border'
                      }`}
                    />
                  )}

                  {/* Step Icon Badge */}
                  <div
                    className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-md'
                        : isCurrent
                        ? 'bg-brand-ink text-white ring-4 ring-brand-gold/20 shadow-brand'
                        : 'bg-brand-cream text-brand-stone border border-brand-border'
                    }`}
                  >
                    <Icon size={isCurrent ? 20 : 18} />
                  </div>

                  {/* Step Details */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-base font-semibold ${
                          isCurrent ? 'text-brand-ink font-bold' : isPast ? 'text-brand-charcoal' : 'text-brand-stone'
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-gold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                          Current Stage
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-brand-stone mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment & Deposit Breakdown Card */}
        {tracking.totalPrice !== null && tracking.totalPrice !== undefined && (
          <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-brand-gold" />
              <h3 className="font-display text-xl text-brand-ink">Payment Summary</h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-brand-cream/60 rounded-2xl p-4 border border-brand-border">
                <p className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">Total Price</p>
                <p className="font-display text-2xl text-brand-ink mt-1">
                  {formatNaira(tracking.totalPrice)}
                </p>
              </div>

              <div className="bg-brand-cream/60 rounded-2xl p-4 border border-brand-border">
                <p className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">Deposit Paid</p>
                <p className="font-display text-2xl text-emerald-700 mt-1">
                  {formatNaira(tracking.depositAmount ?? 0, { showZero: true })}
                </p>
              </div>

              <div className="bg-brand-cream/60 rounded-2xl p-4 border border-brand-border">
                <p className="text-[11px] font-bold text-brand-stone uppercase tracking-wider">Balance Due Upon Pickup</p>
                <p className="font-display text-2xl text-brand-gold mt-1">
                  {formatNaira(
                    tracking.balanceDue !== null
                      ? tracking.balanceDue
                      : tracking.totalPrice,
                    { showZero: true }
                  )}
                </p>
              </div>
            </div>

            {tracking.balanceDue !== null && tracking.balanceDue === 0 ? (
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <CheckCircle2 size={14} />
                This order is fully paid. No balance remaining upon collection.
              </div>
            ) : null}
          </div>
        )}

        {/* WhatsApp & Contact Atelier Dock */}
        <div className="bg-gradient-to-br from-[#0D1A33] to-[#1A2744] rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-brand">
          <div>
            <h3 className="font-display text-xl sm:text-2xl">Need to speak with your tailor?</h3>
            <p className="text-sm text-white/70 mt-1 max-w-md">
              Have questions about fabric adjustments, fittings, or special delivery instructions? Reach out directly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <MessageCircle size={16} />
              Chat on WhatsApp
            </a>
            {tracking.shop?.phone && (
              <a
                href={`tel:${tracking.shop.phone}`}
                className="h-12 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold flex items-center justify-center gap-2 border border-white/15 transition-all"
              >
                <Phone size={14} />
                Call Shop
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
