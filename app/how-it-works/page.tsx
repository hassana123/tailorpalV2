'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Ruler,
  Scissors,
  MessageSquare,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Clock,
  Share2,
  Info,
  Calendar,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface Hotspot {
  id: string
  label: string
  x: string // percentage
  y: string // percentage
  title: string
  explanation: string
}

interface StepData {
  id: string
  stepNumber: number
  tabTitle: string
  icon: typeof Ruler
  title: string
  subtitle: string
  overview: string
  howToOperate: { step: string; text: string }[]
  proTip: string
  snapshotTitle: string
  snapshotCategory: string
  hotspots: Hotspot[]
}

const ONBOARDING_STEPS: StepData[] = [
  {
    id: 'presets-measurements',
    stepNumber: 1,
    tabTitle: 'Garment Presets & Measurements',
    icon: Ruler,
    title: '1. Select Garment Presets & Capture Measurements',
    subtitle: 'Never lose another scrap of paper. Tailor tapes standardized in inches (\").',
    overview:
      'TailorPal replaces messy notebooks and loose paper scraps with one-tap garment presets. When measuring a client for a Senator Kaftan, Agbada, Female Gown, or Suit, you select the preset and the app automatically displays the exact anatomical measurement points.',
    howToOperate: [
      {
        step: 'Step 1: Pick a Preset',
        text: 'Tap "Garment Presets" inside the Measurements drawer and choose Senator, Agbada, Gown, or Two-Piece.',
      },
      {
        step: 'Step 2: Input Body Inches',
        text: 'Enter the tape measurements in inches (\"). Fields auto-focus and validate so you can measure quickly.',
      },
      {
        step: 'Step 3: Export to WhatsApp',
        text: 'Tap "Share to WhatsApp". TailorPal crafts a clean, polite measurement breakdown and sends it to your client in seconds.',
      },
    ],
    proTip:
      'Nigerian Atelier Pro-Tip: You can attach up to 3 style reference photos directly to the client’s measurement record so apprentices cut the exact neck styling requested.',
    snapshotTitle: 'Measurement Vault · Senator Kaftan (Male)',
    snapshotCategory: 'Stitcha & HauteApp Inspired',
    hotspots: [
      {
        id: 'h1',
        label: '1',
        x: '20%',
        y: '18%',
        title: 'One-Tap Preset Chips',
        explanation: 'Clicking any chip loads the required measurements list (e.g. Agbada span, chest, sleeve, shirt length).',
      },
      {
        id: 'h2',
        label: '2',
        x: '55%',
        y: '48%',
        title: 'Inches (") Input Grid',
        explanation: 'All measurements are recorded in standard tailoring inches. Quick tab key lets you jump from Chest to Waist.',
      },
      {
        id: 'h3',
        label: '3',
        x: '75%',
        y: '85%',
        title: 'Instant WhatsApp Export',
        explanation: 'Generates a branded WhatsApp message formatted with all measurements and atelier contact details.',
      },
    ],
  },
  {
    id: 'orders-deadlines',
    stepNumber: 2,
    tabTitle: 'Bespoke Orders & Fitting Dates',
    icon: Calendar,
    title: '2. Create Bespoke Commissions & Protect Fitting Dates',
    subtitle: 'Track deposits, total pricing in Naira (₦), and set non-negotiable fitting alarms.',
    overview:
      'Every order starts with a clear production brief. Link customer measurements, specify fabric details (e.g. 4 yards Irish Cashmere provided by customer), record the agreed price in Naira (₦), and set the fitting deadline.',
    howToOperate: [
      {
        step: 'Step 1: Link Customer & Measurements',
        text: 'Select the client from your directory. Their latest measurements are automatically linked to this commission.',
      },
      {
        step: 'Step 2: Record Fabric & Financials',
        text: 'Enter the total bespoke fee (e.g. ₦65,000) and deposit paid (e.g. ₦40,000). The balance due is calculated automatically.',
      },
      {
        step: 'Step 3: Lock in Fitting Date',
        text: 'Choose a fitting date at least 48 hours before the event date. TailorPal schedules automated workshop alerts.',
      },
    ],
    proTip:
      'OgaTailor Pro-Tip: Setting the fitting date separately from the event date gives your cutters and seamstresses a safe buffer for minor alterations.',
    snapshotTitle: 'New Bespoke Commission Modal',
    snapshotCategory: 'HauteApp & OgaTailor Inspired',
    hotspots: [
      {
        id: 'o1',
        label: '1',
        x: '30%',
        y: '22%',
        title: 'Customer & Garment Brief',
        explanation: 'Choose existing customer or quickly add a new client with phone number for WhatsApp receipts.',
      },
      {
        id: 'o2',
        label: '2',
        x: '65%',
        y: '50%',
        title: 'Financial Breakdown in Naira (₦)',
        explanation: 'Clearly distinguishes Total Cost vs Deposit Received, keeping track of accounts receivable.',
      },
      {
        id: 'o3',
        label: '3',
        x: '35%',
        y: '78%',
        title: 'Fitting Date & Event Countdown',
        explanation: 'Flags orders due within 7 days in yellow and overdue orders in red across all dashboard views.',
      },
    ],
  },
  {
    id: 'production-workflow',
    stepNumber: 3,
    tabTitle: 'Workshop Stages & Timers',
    icon: Scissors,
    title: '3. Workshop Stages & Real-Time Production Timers',
    subtitle: 'From Cutting to Sewing to Fitting to Ready. Keep every apprentice on track.',
    overview:
      'Stop walking back and forth asking your cutters and seamstresses what stage they are on. The visual Production Workflow gives you a live look at your workshop floor. Team members can start live timers to log their exact tailoring hours.',
    howToOperate: [
      {
        step: 'Step 1: Visual Stage Tracking',
        text: 'Move orders across 4 stages: Cutting → Sewing → Fitting → Ready as garments progress through your atelier.',
      },
      {
        step: 'Step 2: Assign Master Cutters & Apprentices',
        text: 'Assign specific staff to each garment. Workers see their own task queue without disturbing other team members.',
      },
      {
        step: 'Step 3: Play/Stop Live Timers',
        text: 'Workers click "Start Timer" when cutting or stitching starts. Logged minutes give you true labor cost insight.',
      },
    ],
    proTip:
      'Cresoa Pro-Tip: Use the "Worker workload & skills" section to match complex Agbada embroidery tasks with your most skilled embroiderers.',
    snapshotTitle: 'Production Control Board',
    snapshotCategory: 'Cresoa Workflow Engine',
    hotspots: [
      {
        id: 'p1',
        label: '1',
        x: '25%',
        y: '25%',
        title: 'Cutting Stage Column',
        explanation: 'Fabrics queued for chalk marking and scissor work with priority badges.',
      },
      {
        id: 'p2',
        label: '2',
        x: '55%',
        y: '35%',
        title: 'Live Apprentice Timer',
        explanation: 'Active timer tracks logged minutes against estimated production time.',
      },
      {
        id: 'p3',
        label: '3',
        x: '75%',
        y: '65%',
        title: 'Fitting Stage Ready Queue',
        explanation: 'Garments ironed and basted for client trial fit before final hemming.',
      },
    ],
  },
  {
    id: 'client-tracking',
    stepNumber: 4,
    tabTitle: 'Live Client Order Tracking',
    icon: MessageSquare,
    title: '4. Self-Serve Client Tracking & WhatsApp Receipts',
    subtitle: 'Delight clients with live mobile tracking links. End repetitive phone calls.',
    overview:
      'Instead of calling you 5 times a week to ask "is my cloth ready?", every customer receives a link to their private tracking page (e.g. tailorpal.com/track/ORD-9021). They can check progress, view their invoice in Naira, and reach out on WhatsApp with 1 tap.',
    howToOperate: [
      {
        step: 'Step 1: Copy Tracking Link',
        text: 'On any order row, click the "Copy Tracking Link" button to copy the customer URL to your clipboard.',
      },
      {
        step: 'Step 2: Send WhatsApp Update',
        text: 'Tap "Send WhatsApp Update". TailorPal opens WhatsApp with a pre-composed status update including the link.',
      },
      {
        step: 'Step 3: Client Checks Progress',
        text: 'The client opens the link on their smartphone to view the 5-stage progress bar and remaining balance due in ₦.',
      },
    ],
    proTip:
      'Noverd Pro-Tip: Clients love transparency. When an order transitions to "Ready for Fitting", send the tracking link so they know to drop by the shop.',
    snapshotTitle: 'Public Client Portal (/track/[orderId])',
    snapshotCategory: 'Noverd & MyStitchBook Inspired',
    hotspots: [
      {
        id: 't1',
        label: '1',
        x: '50%',
        y: '28%',
        title: '5-Stage Progress Visualizer',
        explanation: 'Visual stepper shows: Order Booked → Cutting → Sewing → Fitting → Ready for Delivery.',
      },
      {
        id: 't2',
        label: '2',
        x: '30%',
        y: '60%',
        title: 'Financial Balance Overview',
        explanation: 'Total Price, Deposit Paid, and Outstanding Balance clearly broken down in Naira (₦).',
      },
      {
        id: 't3',
        label: '3',
        x: '70%',
        y: '80%',
        title: 'One-Tap WhatsApp Button',
        explanation: 'Allows client to immediately message the atelier manager without looking for phone numbers.',
      },
    ],
  },
  {
    id: 'inventory-stock',
    stepNumber: 5,
    tabTitle: 'Fabric Yardage & Haberdashery',
    icon: PackageCheck,
    title: '5. Fabric Yardage, Lining & Haberdashery Stock',
    subtitle: 'Never run out of black satin lining or metallic zippers before wedding weekend.',
    overview:
      'Managing stock in tailoring is different from generic retail. TailorPal lets you record items in yards, meters, pieces, or lining spools. Automatic low-stock warnings notify you well in advance so you can restock without pausing production.',
    howToOperate: [
      {
        step: 'Step 1: Log Fabric Rolls & Supplies',
        text: 'Add your fabrics, lining, thread, and buttons with unit measurements (yards, meters, pieces).',
      },
      {
        step: 'Step 2: Set Minimum Stock Thresholds',
        text: 'Define safety levels (e.g. alert when Italian wool drops below 5 yards or lining drops below 10 yards).',
      },
      {
        step: 'Step 3: Filter by Low Stock Alerts',
        text: 'Use the "⚠️ Low Stock" filter tab to instantly see everything that needs purchasing from the market.',
      },
    ],
    proTip:
      'Atelier Inventory Pro-Tip: Track your cost per yard in Naira (₦) to instantly know your fabric cost when quoting clients for bespoke Senator sets.',
    snapshotTitle: 'Atelier Fabric Vault & Inventory Grid',
    snapshotCategory: 'Haberdashery Management',
    hotspots: [
      {
        id: 'i1',
        label: '1',
        x: '30%',
        y: '25%',
        title: 'Units in Yards, Meters, Pieces',
        explanation: 'Tailored for fashion design — no confusing generic SKU units.',
      },
      {
        id: 'i2',
        label: '2',
        x: '65%',
        y: '35%',
        title: 'Cost per Yard in Naira (₦)',
        explanation: 'Tracks purchase price to determine exact profitability per yard cut.',
      },
      {
        id: 'i3',
        label: '3',
        x: '80%',
        y: '70%',
        title: '⚠️ Low Stock Warning Badge',
        explanation: 'Automatic indicator lights up when inventory drops below safety threshold.',
      },
    ],
  },
]

export default function HowItWorksPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)

  const currentStep = ONBOARDING_STEPS[activeStepIndex]
  const StepIcon = currentStep.icon

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1)
      setActiveHotspot(null)
    }
  }

  const handleNext = () => {
    if (activeStepIndex < ONBOARDING_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1)
      setActiveHotspot(null)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 bg-[#0D1A33] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(217,123,43,0.35) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-semibold uppercase tracking-wider mb-5 backdrop-blur-md">
            <Sparkles size={13} className="text-[#D97B2B]" />
            Interactive Atelier Walkthrough & Tour
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white leading-tight max-w-4xl mx-auto">
            How TailorPal Works:{' '}
            <span className="text-[#D97B2B] italic">The 3-Minute Masterclass</span>
          </h1>

          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto mt-4 leading-relaxed">
            Click through the interactive snapshots below to explore how top Nigerian and African ateliers manage measurements, orders, stage timers, and client tracking.
          </p>

          {/* Step Selector Pills Bar */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-10">
            {ONBOARDING_STEPS.map((step, idx) => {
              const Icon = step.icon
              const isActive = idx === activeStepIndex
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveStepIndex(idx)
                    setActiveHotspot(null)
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                    isActive
                      ? 'bg-[#D97B2B] text-white border-[#D97B2B] shadow-gold scale-105'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={13} />
                  <span>{step.tabTitle}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Interactive Guide Walkthrough Section */}
      <section className="py-12 lg:py-20 flex-1">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          
          {/* Progress Tracker Bar */}
          <div className="bg-white rounded-2xl border border-brand-border p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-brand-ink text-white font-display text-sm font-bold flex items-center justify-center shadow-sm">
                0{currentStep.stepNumber}
              </span>
              <div>
                <p className="text-xs font-bold text-brand-gold uppercase tracking-wider">
                  Step {currentStep.stepNumber} of {ONBOARDING_STEPS.length}
                </p>
                <h3 className="font-semibold text-sm text-brand-ink flex items-center gap-1.5">
                  <StepIcon size={14} className="text-brand-gold" />
                  <span>{currentStep.tabTitle}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={activeStepIndex === 0}
                className="h-9 px-3 rounded-xl border border-brand-border bg-brand-cream hover:bg-white text-xs font-semibold text-brand-ink disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <button
                onClick={handleNext}
                disabled={activeStepIndex === ONBOARDING_STEPS.length - 1}
                className="h-9 px-4 rounded-xl bg-brand-ink hover:bg-brand-charcoal text-xs font-bold text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 shadow-brand"
              >
                <span>Next Step</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Dual Column Experience: Left Operating Guide, Right Interactive Snapshot */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">

            {/* Left Column: Instructions & Pro Tips */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider block mb-1">
                    Guided Walkthrough
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl text-brand-ink leading-tight">
                    {currentStep.title}
                  </h2>
                  <p className="text-xs text-brand-stone font-medium mt-1">
                    {currentStep.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-brand-charcoal leading-relaxed">
                  {currentStep.overview}
                </p>

                {/* How to operate steps */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-brand-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Info size={13} className="text-brand-gold" />
                    How to operate this feature
                  </h4>
                  {currentStep.howToOperate.map((item, idx) => (
                    <div key={idx} className="p-3 bg-brand-cream rounded-2xl border border-brand-border text-xs">
                      <p className="font-bold text-brand-ink mb-0.5">{item.step}</p>
                      <p className="text-brand-stone leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Pro tip card */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                  <Sparkles size={16} className="text-[#D97B2B] flex-shrink-0 mt-0.5" />
                  <p>{currentStep.proTip}</p>
                </div>

                {/* Hotspot callout banner */}
                <div className="p-3 bg-brand-ink text-white rounded-2xl text-xs flex items-center justify-between">
                  <span>👉 Click glowing pins on the preview</span>
                  <span className="font-mono text-[10px] text-brand-gold font-bold">HOTSPOTS ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive High-Fidelity UI Snapshot with Hotspots */}
            <div className="lg:col-span-7">
              <div className="bg-[#0D1A33] rounded-3xl border border-brand-gold/30 p-4 sm:p-6 shadow-2xl relative">
                
                {/* Snapshot Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-white">
                  <div>
                    <span className="text-[10px] font-bold text-[#D97B2B] uppercase tracking-wider block">
                      {currentStep.snapshotCategory}
                    </span>
                    <h3 className="font-display font-semibold text-base text-white">
                      {currentStep.snapshotTitle}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white/80 font-mono">
                    Interactive Preview
                  </span>
                </div>

                {/* UI Visual Simulation Box with Interactive Hotspot Pins */}
                <div className="relative bg-white rounded-2xl p-5 sm:p-6 text-brand-ink shadow-inner overflow-hidden min-h-[440px]">
                  
                  {/* STEP 1 SNAPSHOT VISUAL */}
                  {currentStep.id === 'presets-measurements' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-brand-border pb-3">
                        <div className="flex items-center gap-2">
                          <Ruler size={18} className="text-brand-gold" />
                          <span className="font-bold text-sm">Client Measurement Sheet</span>
                        </div>
                        <span className="text-xs bg-brand-cream border border-brand-border px-2.5 py-0.5 rounded-full font-bold">
                          Inches (&ldquo;)
                        </span>
                      </div>

                      {/* Preset Chips */}
                      <div>
                        <span className="text-[10px] font-bold text-brand-stone uppercase block mb-1.5">Garment Preset:</span>
                        <div className="flex gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-brand-ink text-white rounded-lg text-xs font-bold shadow-sm">
                            ✓ Senator / Kaftan
                          </span>
                          <span className="px-3 py-1 bg-brand-cream border border-brand-border text-brand-stone rounded-lg text-xs font-semibold">
                            Agbada 3-Piece
                          </span>
                          <span className="px-3 py-1 bg-brand-cream border border-brand-border text-brand-stone rounded-lg text-xs font-semibold">
                            Female Gown
                          </span>
                        </div>
                      </div>

                      {/* Measurement Grid */}
                      <div className="grid grid-cols-3 gap-2.5 pt-2">
                        {[
                          { l: 'Neck', v: '16.5"' },
                          { l: 'Chest', v: '42.0"' },
                          { l: 'Shoulder', v: '19.0"' },
                          { l: 'Sleeve Length', v: '26.0"' },
                          { l: 'Shirt Length', v: '36.0"' },
                          { l: 'Waist', v: '34.0"' },
                          { l: 'Thigh', v: '25.0"' },
                          { l: 'Inseam', v: '31.5"' },
                          { l: 'Base / Ankle', v: '14.5"' },
                        ].map((m) => (
                          <div key={m.l} className="p-2.5 rounded-xl bg-brand-cream border border-brand-border text-center">
                            <span className="text-[10px] text-brand-stone block">{m.l}</span>
                            <span className="text-sm font-bold text-brand-ink">{m.v}</span>
                          </div>
                        ))}
                      </div>

                      {/* WhatsApp Bar */}
                      <div className="pt-2">
                        <div className="p-3 bg-[#25D366]/15 border border-[#25D366]/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Share2 size={16} className="text-[#25D366]" />
                            <span className="text-xs font-bold text-brand-ink">Share Measurement Card to WhatsApp</span>
                          </div>
                          <button className="px-3 py-1 bg-[#25D366] text-white rounded-lg text-xs font-bold shadow-sm">
                            1-Tap Share
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 SNAPSHOT VISUAL */}
                  {currentStep.id === 'orders-deadlines' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-brand-border pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-brand-gold uppercase">Bespoke Commission #TP-9120</span>
                          <h4 className="font-bold text-sm text-brand-ink">Royal Agbada for Wedding Reception</h4>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-500/15 text-amber-700 rounded-full text-xs font-bold">
                          Fitting in 4 Days
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-brand-cream rounded-xl border border-brand-border">
                          <span className="text-[10px] text-brand-stone uppercase font-bold">Client</span>
                          <p className="text-xs font-bold text-brand-ink mt-0.5">Barrister Chijioke Okonkwo</p>
                          <p className="text-[11px] text-brand-stone">+234 803 294 8812</p>
                        </div>
                        <div className="p-3 bg-brand-cream rounded-xl border border-brand-border">
                          <span className="text-[10px] text-brand-stone uppercase font-bold">Fabric Details</span>
                          <p className="text-xs font-bold text-brand-ink mt-0.5">7 Yards White Gold Damask</p>
                          <p className="text-[11px] text-brand-stone">Customer provided</p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-brand-ink text-white rounded-2xl space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/70">Total Commission Price</span>
                          <span className="font-bold text-white">₦110,000</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/70">Deposit Received</span>
                          <span className="font-bold text-emerald-400">₦70,000 (Paid)</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-white/15">
                          <span className="text-[#D97B2B] font-bold">Balance Upon Fitting</span>
                          <span className="font-bold text-[#D97B2B]">₦40,000</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                        <Clock size={13} className="text-amber-600" />
                        <span>Fitting Scheduled: <strong>Friday 2:00 PM</strong> at Main Atelier</span>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 SNAPSHOT VISUAL */}
                  {currentStep.id === 'production-workflow' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-brand-border pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-brand-gold uppercase">Atelier Control Board</span>
                          <h4 className="font-bold text-sm text-brand-ink">Live Workshop Stages</h4>
                        </div>
                        <span className="text-xs text-brand-stone font-mono font-bold">3 Orders Active</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                          <span className="font-bold text-emerald-800 block">1. Cutting</span>
                          <span className="text-[10px] text-emerald-600 mt-1 block">Completed ✓</span>
                        </div>
                        <div className="p-2.5 bg-amber-50 border-2 border-[#D97B2B] rounded-xl shadow-sm">
                          <span className="font-bold text-amber-900 block">2. Sewing</span>
                          <span className="text-[10px] text-[#D97B2B] font-bold mt-1 block animate-pulse">● Active Now</span>
                        </div>
                        <div className="p-2.5 bg-brand-cream border border-brand-border rounded-xl">
                          <span className="font-semibold text-brand-stone block">3. Fitting</span>
                          <span className="text-[10px] text-brand-stone mt-1 block">Scheduled</span>
                        </div>
                        <div className="p-2.5 bg-brand-cream border border-brand-border rounded-xl">
                          <span className="font-semibold text-brand-stone block">4. Ready</span>
                          <span className="text-[10px] text-brand-stone mt-1 block">Delivery</span>
                        </div>
                      </div>

                      {/* Active timer card */}
                      <div className="p-4 bg-brand-cream border border-brand-border rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-xs text-brand-ink">Agbada Embroidery Work</p>
                            <p className="text-[10px] text-brand-stone">Assigned: Musa (Embroidery Apprentice)</p>
                          </div>
                          <span className="font-mono text-sm font-bold text-[#D97B2B] bg-white px-2.5 py-1 rounded-lg border border-brand-border">
                            01:34:20
                          </span>
                        </div>
                        <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
                          <div className="bg-[#D97B2B] h-full w-[65%]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4 SNAPSHOT VISUAL */}
                  {currentStep.id === 'client-tracking' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start border-b border-brand-border pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider block">
                            Client Tracking Portal
                          </span>
                          <h4 className="font-bold text-sm text-brand-ink">Order #TP-8492</h4>
                          <p className="text-[10px] text-brand-stone">Atelier: Bilkis Bespoke, Abuja</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-700 rounded-full text-xs font-bold">
                          Sewing Stage
                        </span>
                      </div>

                      {/* Stepper */}
                      <div className="py-2 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-brand-ink">
                          <span>Progress</span>
                          <span className="text-[#D97B2B]">Ready for Fitting in 2 days</span>
                        </div>
                        <div className="w-full bg-brand-cream h-2.5 rounded-full overflow-hidden border border-brand-border">
                          <div className="bg-gradient-to-r from-[#D97B2B] to-emerald-500 h-full w-[75%]" />
                        </div>
                      </div>

                      {/* Invoice summary */}
                      <div className="p-3.5 bg-brand-cream rounded-2xl border border-brand-border space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-brand-stone">Total Commission:</span>
                          <span className="font-bold text-brand-ink">₦95,000</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-brand-stone">Deposit Received:</span>
                          <span className="font-bold text-emerald-600">₦60,000</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1.5 border-t border-brand-border">
                          <span className="font-bold text-brand-ink">Balance Due:</span>
                          <span className="font-bold text-[#D97B2B]">₦35,000</span>
                        </div>
                      </div>

                      <button className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <MessageSquare size={14} />
                        Message Atelier on WhatsApp
                      </button>
                    </div>
                  )}

                  {/* STEP 5 SNAPSHOT VISUAL */}
                  {currentStep.id === 'inventory-stock' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-brand-border pb-3">
                        <div className="flex items-center gap-2">
                          <PackageCheck size={18} className="text-brand-gold" />
                          <span className="font-bold text-sm">Fabric Depository</span>
                        </div>
                        <span className="text-xs bg-amber-500/15 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                          ⚠️ 2 Items Need Restock
                        </span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { item: 'Navy Blue Super 140s Wool', qty: '36 Yards', cost: '₦12,500/yd', ok: true },
                          { item: 'White Polish Cotton', qty: '14 Yards', cost: '₦6,000/yd', ok: true },
                          { item: 'Black Satin Lining', qty: '3 Yards (Low)', cost: '₦2,500/yd', ok: false },
                          { item: 'Metallic Gold Zippers', qty: '4 Pcs (Low)', cost: '₦800/pc', ok: false },
                        ].map((s, i) => (
                          <div key={i} className="p-2.5 bg-brand-cream rounded-xl border border-brand-border flex items-center justify-between text-xs">
                            <div>
                              <p className="font-bold text-brand-ink">{s.item}</p>
                              <p className="text-[10px] text-brand-stone">Cost: {s.cost}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-brand-ink">{s.qty}</p>
                              <span className={`text-[10px] font-bold ${s.ok ? 'text-emerald-600' : 'text-amber-700'}`}>
                                {s.ok ? 'In Stock' : '⚠️ Re-order Now'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clickable Hotspot Pins Overlay */}
                  {currentStep.hotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => setActiveHotspot(activeHotspot?.id === hotspot.id ? null : hotspot)}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 ${
                        activeHotspot?.id === hotspot.id
                          ? 'bg-[#D97B2B] text-white ring-4 ring-[#D97B2B]/40 scale-125'
                          : 'bg-[#0D1A33] text-white hover:bg-[#D97B2B] hover:scale-110'
                      }`}
                      style={{ left: hotspot.x, top: hotspot.y }}
                      aria-label={`Hotspot pin ${hotspot.label}`}
                    >
                      {hotspot.label}
                    </button>
                  ))}

                  {/* Hotspot Tooltip Popover */}
                  {activeHotspot && (
                    <div className="absolute bottom-4 left-4 right-4 z-30 bg-[#0D1A33] text-white p-4 rounded-2xl border border-brand-gold/40 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={11} /> Feature Hotspot #{activeHotspot.label}
                        </span>
                        <button
                          onClick={() => setActiveHotspot(null)}
                          className="text-white/60 hover:text-white text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <h4 className="font-bold text-sm text-white mb-1">
                        {activeHotspot.title}
                      </h4>
                      <p className="text-xs text-white/80 leading-relaxed">
                        {activeHotspot.explanation}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>

          {/* Bottom Onboarding CTA */}
          <div className="mt-16 bg-[#0D1A33] text-white rounded-3xl p-8 sm:p-12 text-center border border-brand-gold/30 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-4">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-xs font-bold text-brand-gold uppercase tracking-wider inline-block">
                Start Running a Stress-Free Atelier
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-white">
                Ready to transform how your fashion business operates?
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                Join 500+ designers and tailors across Nigeria and Africa. Create your free account in under 2 minutes.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/sign-up">
                  <button className="h-12 px-8 rounded-xl bg-brand-gold hover:bg-[#c06d22] text-white font-bold text-sm transition-all shadow-gold flex items-center gap-2">
                    Start Free Atelier Now
                    <ArrowRight size={16} />
                  </button>
                </Link>
                <Link href="/">
                  <button className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-all">
                    Back to Home
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
