import { ReactNode } from 'react'
import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'
import { ArrowLeft, Sparkles, Star } from 'lucide-react'

// ─── Shared luxury atelier decorative panel (right side) ─────────────────────
function AuthIllustrationPanel() {
  return (
    <div className="hidden lg:flex lg:w-[46%] xl:w-[45%] relative overflow-hidden bg-brand-ink flex-col">
      {/* Radial Gold & Atmosphere Gradients */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 75% 25%, rgba(217,123,43,0.3) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 80%, rgba(245,158,11,0.2) 0%, transparent 60%)',
        }}
      />

      {/* Subtle Atelier Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-10 xl:p-12 justify-between">
        {/* Logo */}
        <div>
          <TailorPalLogo variant="white" size="lg" href="/" />
        </div>

        {/* Hero copy */}
        <div className="my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold-light text-xs font-bold uppercase tracking-[0.2em] mb-5">
            <Sparkles size={12} />
            The Fashion Operating System
          </div>

          <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-display leading-[1.12] text-white mb-4">
            Your atelier,<br />
            <span className="text-brand-gold-light italic">crafted to perfection.</span>
          </h2>
          <p className="text-white/70 text-sm xl:text-base leading-relaxed max-w-sm mb-6">
            Standardized anatomical measurements in inches, garment presets, weekly production schedules, and live customer WhatsApp tracking.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              '✂️ Garment Presets',
              '📱 WhatsApp Tracking',
              '📏 Inches Anatomy',
              '⚡ Production Velocity',
              '₦ Naira Ready',
            ].map((f) => (
              <span
                key={f}
                className="text-xs text-white/90 bg-white/8 border border-white/12 px-3 py-1.5 rounded-full font-medium shadow-xs"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '500+', label: 'Active ateliers' },
              { value: '₦2.5M+', label: 'Monthly volume' },
              { value: '100%', label: 'Inches precision' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/6 border border-white/10 rounded-2xl p-3.5 backdrop-blur-xs"
              >
                <div className="text-lg xl:text-xl font-display text-white mb-0.5">
                  {s.value}
                </div>
                <div className="text-[11px] text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Client testimonial */}
        <div className="bg-white/6 border border-white/10 rounded-2xl p-4 xl:p-5 backdrop-blur-sm">
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-brand-gold fill-brand-gold" />
            ))}
          </div>
          <p className="text-white/85 text-xs xl:text-sm leading-relaxed mb-3 italic">
            &ldquo;TailorPal made our order workflow so smooth. Customers love getting their live tracking link right on WhatsApp.&rdquo;
          </p>
          <p className="text-[11px] text-white/50 font-medium">
            Kemi Adeyemi · Creative Director, Lekki Atelier
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-brand-cream">
      {/* ── Left: Form side ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 lg:px-10 py-5">
          <TailorPalLogo size="md" />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-stone hover:text-brand-ink transition-colors"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </header>

        {/* Form centred */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[430px] bg-white rounded-3xl border border-brand-border p-6 sm:p-9 shadow-xs">
            {children}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 text-center">
          <p className="text-xs text-brand-stone">
            © 2026 TailorPal · Built for fashion houses & tailors
          </p>
        </footer>
      </div>

      {/* ── Right: Illustration side ── */}
      <AuthIllustrationPanel />
    </div>
  )
}