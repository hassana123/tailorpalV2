import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const PERKS = ['No credit card required', 'Free plan available', 'Setup in 2 minutes']

export function FinalCTA() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-22"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(217,123,43,0.24) 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.032]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-6">
          Get started today
        </p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.07] mb-6">
          Ready to transform your{' '}
          <span className="text-gradient-light italic">fashion business?</span>
        </h2>
        <p className="text-white/55 text-lg mb-10 leading-relaxed">
          Join TailorPal today. No credit card required. Free plan available for small shops.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/auth/sign-up">
            <button className="h-12 px-8 rounded-xl bg-brand-gold text-white text-sm font-bold hover:bg-[#c06d22] transition-all shadow-gold flex items-center gap-2">
              Create your shop today
              <ArrowRight size={14} />
            </button>
          </Link>
          <Link href="/auth/login">
            <button className="h-12 px-8 rounded-xl bg-white/8 text-white text-sm font-semibold border border-white/12 hover:bg-white/14 transition-all">
              Sign in to your account
            </button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-5 flex-wrap">
          {PERKS.map((p) => (
            <div key={p} className="flex items-center gap-1.5 text-white/42 text-xs">
              <CheckCircle2 size={12} className="text-brand-gold/70" />
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}