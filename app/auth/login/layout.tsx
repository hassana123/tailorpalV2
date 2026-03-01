import { ReactNode } from 'react'
import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'

// ─── Shared decorative panel (right side) ──────────────────────────────────
function AuthIllustrationPanel() {
  return (
    <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] relative overflow-hidden bg-[#0f1117] flex-col">
      {/* Radial gradient atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,_#7c3aed33_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_80%,_#a855f733_0%,_transparent_60%)]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-10">
        {/* Logo */}
        <TailorPalLogo variant="white" size="lg" href="/" />

        {/* Hero copy */}
        <div className="flex-1 flex flex-col justify-center">
          {/* <div className="mb-5">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-purple-300 border border-purple-800 bg-purple-950/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Trusted by 500+ fashion pros
            </span>
          </div> */}

          <h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight text-white mb-5">
            Your fashion<br />business,{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              elevated.
            </span>
          </h2>
          <p className="text-purple-200/80 text-base leading-relaxed max-w-xs">
            Manage customers, measurements, orders, and your whole team — beautifully.
          </p>

          {/* Feature pills */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {['🎤 Voice AI', '📏 Measurements', '👥 Team Mgmt', '📊 Analytics'].map((f) => (
              <span
                key={f}
                className="text-xs text-purple-200 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-medium"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Shops active' },
              { value: '98%', label: 'Uptime SLA' },
              { value: '4.9★', label: 'Avg rating' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <div className="text-xl font-bold text-white mb-0.5">{s.value}</div>
                <div className="text-xs text-purple-300/70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial
        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <p className="text-white/90 text-sm leading-relaxed mb-4 italic">
            &ldquo;TailorPal transformed how I manage my boutique. The voice assistant alone saves me 2 hours every day!&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
              F
            </div>
            <div>
              <div className="text-white text-sm font-semibold">Fatima Al-Hassan</div>
              <div className="text-purple-300/60 text-xs">Owner · Fatima&apos;s Couture, Lagos</div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Montserrat font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        :root { --font-sans: 'Montserrat', sans-serif; }
        body { font-family: 'Montserrat', sans-serif; }
      `}</style>

      <div className="min-h-screen flex">
        {/* ── Left: Form side ── */}
        <div className="flex-1 flex flex-col bg-white min-h-screen">
          {/* Top bar */}
          <header className="flex items-center justify-between px-6 lg:px-10 py-5 border-b border-gray-100">
            <div className="lg:hidden">
              <TailorPalLogo size="md" />
            </div>
            <div className="hidden lg:block" /> {/* spacer */}
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>
          </header>

          {/* Form centred */}
          <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-[420px]">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="px-6 py-4 text-center border-t border-gray-50">
            <p className="text-xs text-gray-400">
              © 2026 TailorPal · {' '}
              <Link href="#" className="hover:text-gray-600 transition-colors">Privacy</Link>
              {' · '}
              <Link href="#" className="hover:text-gray-600 transition-colors">Terms</Link>
            </p>
          </footer>
        </div>

        {/* ── Right: Illustration side ── */}
        <AuthIllustrationPanel />
      </div>
    </>
  )
}