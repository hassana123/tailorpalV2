'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Star, Sparkles, Ruler, Clock, MessageSquare, CheckCircle2, Scissors } from 'lucide-react'

const AVATAR_INITIALS = ['F', 'K', 'A', 'O', 'C']

const DASHBOARD_STATS = [
  { label: 'Customers',     value: '247',   change: '+12%', color: 'text-sky-300'     },
  { label: 'Active Orders', value: '38',    change: '+5%',  color: 'text-amber-300'   },
  { label: 'Revenue',       value: '₦2.4M', change: '+18%', color: 'text-emerald-300' },
  { label: 'Measurements',  value: '1,204', change: '+8%',  color: 'text-violet-300'  },
]

const RECENT_ORDERS = [
  { name: 'Adaeze Okafor', item: 'Ankara Gown', status: 'In Progress', sc: 'text-amber-400'   },
  { name: 'Chidi Nwosu',   item: 'Agbada Suit', status: 'Ready',       sc: 'text-emerald-400' },
  { name: 'Ngozi Eze',     item: 'Aso-ebi Set', status: 'New',         sc: 'text-sky-400'     },
]

const SAMPLE_MEASUREMENTS = [
  { label: 'Neck', value: '16.5"' },
  { label: 'Chest', value: '42.0"' },
  { label: 'Shoulder', value: '19.0"' },
  { label: 'Shirt Length', value: '36.0"' },
  { label: 'Waist', value: '34.0"' },
  { label: 'Inseam', value: '31.5"' },
]

export function Hero() {
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'tracking'>('overview')

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        if (prev === 'overview') return 'measurements'
        if (prev === 'measurements') return 'tracking'
        return 'overview'
      })
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 65% 40%, rgba(217,123,43,0.2) 0%, transparent 70%)' }}
      />
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Copy ── */}
          <div className="animate-fade-in">
            {/* Atelier pill */}
            <div className="inline-flex items-center gap-2 bg-white/8 text-white/90 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/12 mb-6 tracking-wide backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#D97B2B] animate-pulse" />
              Built for Nigerian & African Bespoke Ateliers
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] text-white leading-[1.08] mb-6">
              Know what to make. Know what to do next.{' '}
              <span className="text-gradient-light italic">Never miss a fitting date.</span>
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-9 max-w-lg">
              Manage customers, measurements in inches, WhatsApp order tracking links, and team tasks — all in one modern atelier platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
              <Link href="/auth/sign-up">
                <button className="h-12 px-7 rounded-xl bg-brand-gold text-white text-sm font-bold hover:bg-[#c06d22] transition-all shadow-gold flex items-center justify-center gap-2">
                  Start Free Atelier
                  <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/how-it-works">
                <button className="h-12 px-7 rounded-xl bg-white/8 text-white text-sm font-semibold border border-white/12 hover:bg-white/14 transition-all flex items-center justify-center gap-2">
                  <Sparkles size={14} className="text-[#D97B2B]" />
                  See How It Works
                </button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {AVATAR_INITIALS.map((l, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0D1A33] flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ background: `hsl(${195 + i * 22}, 42%, 34%)` }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="text-brand-gold fill-brand-gold" />
                  ))}
                </div>
                <p className="text-white/70 text-xs font-medium">Over 500+ master tailors & couture designers</p>
              </div>
            </div>
          </div>

          {/* ── Interactive Dashboard Mockup ── */}
          <div
            className="relative hidden lg:block animate-slide-up"
            style={{ animationDelay: '0.18s' }}
          >
            <div className="absolute -inset-6 bg-brand-gold/10 rounded-3xl blur-3xl" />
            <div className="relative bg-white/6 backdrop-blur-md rounded-2xl border border-white/12 p-2 shadow-brand-lg">
              
              {/* Interactive Preview Tabs */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'overview'
                        ? 'bg-[#D97B2B] text-white shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    Atelier Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('measurements')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'measurements'
                        ? 'bg-[#D97B2B] text-white shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Ruler size={11} />
                    Garment Presets
                  </button>
                  <button
                    onClick={() => setActiveTab('tracking')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'tracking'
                        ? 'bg-[#D97B2B] text-white shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <MessageSquare size={11} />
                    Live Tracking
                  </button>
                </div>
                <span className="text-[10px] text-white/40 font-mono">LIVE PREVIEW</span>
              </div>

              <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-white/5">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-[#0b1222]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-white/7 rounded px-3 py-1 text-[10px] text-white/45 text-center font-mono">
                      {activeTab === 'overview' && 'app.tailorpal.com/dashboard/shop'}
                      {activeTab === 'measurements' && 'app.tailorpal.com/measurements/presets'}
                      {activeTab === 'tracking' && 'tailorpal.com/track/ORD-9042'}
                    </div>
                  </div>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="p-5 grid grid-cols-2 gap-3">
                      {DASHBOARD_STATS.map((s) => (
                        <div key={s.label} className="bg-white/5 rounded-xl p-3.5 border border-white/7">
                          <p className="text-white/50 text-[11px] mb-0.5 font-medium">{s.label}</p>
                          <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-emerald-400 text-[10px] mt-0.5 font-semibold">{s.change} this month</p>
                        </div>
                      ))}
                    </div>

                    <div className="mx-5 mb-4 rounded-xl bg-brand-gold/15 border border-brand-gold/30 p-3 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-brand-gold text-white grid place-items-center flex-shrink-0">
                        <Sparkles size={13} />
                      </span>
                      <div>
                        <p className="text-white text-[11px] font-bold">Today&apos;s Fitting Schedule</p>
                        <p className="text-white/60 text-[10px]">3 fittings booked · 2 Agbada cuts due by 4:00 PM</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <div className="bg-white/3 rounded-xl border border-white/7">
                        <div className="px-4 py-2 border-b border-white/7 flex justify-between items-center">
                          <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider">Active Commissions</p>
                          <span className="text-[10px] text-[#D97B2B] font-bold">₦ Currency</span>
                        </div>
                        {RECENT_ORDERS.map((o) => (
                          <div key={o.name} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-[#D97B2B]/20 text-[#D97B2B] border border-[#D97B2B]/30 flex items-center justify-center text-[9px] font-bold">
                                {o.name[0]}
                              </div>
                              <div>
                                <p className="text-white/85 text-[11px] font-semibold">{o.name}</p>
                                <p className="text-white/40 text-[10px]">{o.item}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold ${o.sc}`}>{o.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MEASUREMENTS (INCHES PRESET) */}
                {activeTab === 'measurements' && (
                  <div className="p-5 animate-in fade-in duration-300 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#D97B2B] uppercase tracking-wider block">Garment Preset</span>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Scissors size={13} className="text-[#D97B2B]" />
                          Senator / Kaftan Suit (Male)
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                        Inches (&ldquo;)
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {SAMPLE_MEASUREMENTS.map((m) => (
                        <div key={m.label} className="bg-white/5 border border-white/8 rounded-xl p-2.5">
                          <p className="text-white/40 text-[10px]">{m.label}</p>
                          <p className="text-sm font-bold text-white mt-0.5">{m.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[10px] font-bold">
                          📱
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white">Send Measurement to Client</p>
                          <p className="text-[10px] text-white/60">One-tap formatted WhatsApp message</p>
                        </div>
                      </div>
                      <button className="px-2.5 py-1 bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] font-bold rounded-lg transition-colors">
                        Share ₦0
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: LIVE TRACKING */}
                {activeTab === 'tracking' && (
                  <div className="p-5 animate-in fade-in duration-300 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-[#D97B2B] uppercase tracking-wider block">Live Order Portal</span>
                        <h4 className="text-sm font-bold text-white">Royal Agbada 3-Piece (#ORD-9042)</h4>
                        <p className="text-[10px] text-white/50">Client: Chief Babatunde Adeleke</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#D97B2B]">₦120,000</p>
                        <span className="text-[9px] text-emerald-400 font-semibold">Deposit: ₦80,000 paid</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[10px] font-semibold text-white/70">
                        <span>Production Stage</span>
                        <span className="text-[#D97B2B]">Sewing & Embroidery (60%)</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-[#D97B2B] to-amber-300 h-full w-[60%] rounded-full" />
                      </div>
                    </div>

                    {/* Stage Steps */}
                    <div className="grid grid-cols-4 gap-1 text-center pt-1">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-1.5">
                        <CheckCircle2 size={12} className="mx-auto text-emerald-400 mb-0.5" />
                        <span className="text-[9px] text-emerald-300 font-semibold block">Cut</span>
                      </div>
                      <div className="bg-[#D97B2B]/20 border border-[#D97B2B]/40 rounded-lg p-1.5">
                        <Clock size={12} className="mx-auto text-[#D97B2B] mb-0.5 animate-spin" />
                        <span className="text-[9px] text-white font-bold block">Sewing</span>
                      </div>
                      <div className="bg-white/5 border border-white/8 rounded-lg p-1.5 opacity-50">
                        <span className="text-[9px] text-white/60 block">Fitting</span>
                      </div>
                      <div className="bg-white/5 border border-white/8 rounded-lg p-1.5 opacity-50">
                        <span className="text-[9px] text-white/60 block">Ready</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="w-full py-2 bg-white/5 border border-white/10 rounded-xl text-center text-[10px] text-white/70">
                        Fitting scheduled: <strong className="text-white">Friday, 3:30 PM</strong> at Atelier
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

