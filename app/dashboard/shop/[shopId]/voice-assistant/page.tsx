'use client'

import { useParams } from 'next/navigation'
import { VoiceAssistant } from '@/components/voice-assistant/voice-assistant'
import { Mic, Tag, Users, BarChart2, ShoppingBag, Hash, List, Search } from 'lucide-react'

// ─── Command card ─────────────────────────────────────────────────────────────

function CommandCard({
  icon: Icon,
  title,
  example,
  description,
}: {
  icon: React.ElementType
  title: string
  example: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 space-y-2 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
          <Icon size={13} className="text-brand-gold" />
        </div>
        <p className="font-semibold text-sm text-brand-ink">{title}</p>
      </div>
      <p className="text-xs font-mono bg-brand-cream/80 rounded-xl px-3 py-1.5 text-brand-charcoal border border-brand-border/60 leading-relaxed">
        {example}
      </p>
      <p className="text-xs text-brand-stone">{description}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VoiceAssistantPage() {
  const params = useParams()
  const rawShopId = params.shopId
  const shopId = (Array.isArray(rawShopId) ? rawShopId[0] : rawShopId) ?? ''

  return (
    /*
     * The outer wrapper fills the dashboard content area.
     * overflow-hidden prevents page-level scroll — all scrolling happens
     * inside the VoiceAssistant messages container.
     */
    <div className="min-h-full flex flex-col p-4 lg:p-6 xl:p-8 gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
          <Mic className="h-6 w-6 text-brand-gold" />
          Voice Assistant
        </h1>
        <p className="text-sm text-brand-stone mt-1">
          Run your entire shop hands-free. Enable{' '}
          <strong className="text-brand-charcoal">Loop</strong> and{' '}
          <strong className="text-brand-charcoal">Auto</strong> for the best experience — just
          speak naturally and pause when done.
        </p>
      </div>

      {/* ── Two-column layout: assistant left, commands right ─────────── */}
      <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-5 min-h-0 lg:overflow-hidden">

        {/*
         * Assistant panel — flex-1 + min-h-0 lets it fill available height
         * without causing page scroll. VoiceAssistant itself is h-full.
         */}
        <div className="min-h-[60vh] lg:min-h-0 flex flex-col">
          <VoiceAssistant shopId={shopId} />
        </div>

        {/* Commands reference — scrolls independently on overflow */}
        <div className="hidden lg:flex flex-col gap-3 overflow-y-auto min-h-0 pb-1">
          <div className="flex-shrink-0">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">
              Reference
            </p>
            <h2 className="font-display text-lg text-brand-ink">Voice Commands</h2>
          </div>

          <CommandCard
            icon={Users}
            title="Add a customer"
            example='"Add customer"'
            description="Starts a guided flow and asks each field one by one"
          />
          <CommandCard
            icon={Tag}
            title="Record measurements"
            example='"Add measurement"'
            description="Lets you choose a customer, capture values, then confirm before saving"
          />
          <CommandCard
            icon={ShoppingBag}
            title="Create an order"
            example='"Create order"'
            description="Guides you through customer, design, delivery date and confirmation"
          />
          <CommandCard
            icon={Hash}
            title="Update order status"
            example='"Update order status"'
            description="Prompts for order number and new status, then asks for confirmation"
          />
          <CommandCard
            icon={List}
            title="List customers"
            example='"List customers"'
            description="Shows customer names you can pick in guided flows"
          />
          <CommandCard
            icon={Search}
            title="Find a customer"
            example='"Find customer Jane"'
            description="Searches for matching customers by name, phone or email"
          />
          <CommandCard
            icon={ShoppingBag}
            title="List orders"
            example='"List orders" or "Pending orders"'
            description="Shows recent and pending work quickly"
          />
          <CommandCard
            icon={BarChart2}
            title="Shop statistics"
            example='"Show shop statistics" or "Shop summary"'
            description="Overview of customers, orders and measurements"
          />
        </div>
      </div>

      {/* Mobile commands (below assistant) */}
      <div className="lg:hidden flex-shrink-0 space-y-3">
        <div>
          <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">
            Reference
          </p>
          <h2 className="font-display text-lg text-brand-ink">Voice Commands</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <CommandCard icon={Users}      title="Add a customer"      example='"Add customer"'                                                 description="Guided customer flow" />
          <CommandCard icon={Tag}        title="Record measurements" example='"Add measurement"'                                              description="Guided measurement flow" />
          <CommandCard icon={ShoppingBag} title="Create an order"    example='"Create order"'                                                description="Guided order flow" />
          <CommandCard icon={Hash}       title="Update order status" example='"Update order status"'                                         description="Guided status update" />
          <CommandCard icon={List}       title="List customers"      example='"List customers"'                                              description="Shows recent customers" />
          <CommandCard icon={BarChart2}  title="Shop statistics"     example='"Show shop statistics"'                                        description="Overview of your shop" />
        </div>
      </div>
    </div>
  )
}
