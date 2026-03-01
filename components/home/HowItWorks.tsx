import Link from 'next/link'
import { ArrowRight, Mic2 } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    title: 'Create your account',
    body: 'Sign up free in under 2 minutes. No credit card needed.',
  },
  {
    n: '02',
    title: 'Set up your shop',
    body: 'Add your shop details, team members, and service catalogue.',
  },
  {
    n: '03',
    title: 'Add your customers',
    body: 'Import existing customers or add new ones — by voice or form.',
  },
  {
    n: '04',
    title: 'Start taking orders',
    body: 'Create orders, record measurements, and track every delivery.',
  },
]

const VOICE_DEMO = [
  { you: true,  text: '"Add customer Fatima, phone 0812345678"'        },
  { you: false, text: '✓ Customer "Fatima" created successfully'        },
  { you: true,  text: '"Record bust 36, waist 28 for Fatima"'          },
  { you: false, text: '✓ Measurements saved — Bust 36", Waist 28"'     },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Steps ── */}
          <div>
            <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-4">
              How it works
            </p>
            <h2 className="font-display text-4xl lg:text-5xl text-brand-ink leading-[1.1] mb-5">
              Up and running in minutes
            </h2>
            <p className="text-brand-stone text-base leading-relaxed mb-10">
              No lengthy onboarding. No complex setup. TailorPal gets out of your way so you can focus on your craft.
            </p>

            <div className="space-y-7">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-ink text-white flex items-center justify-center">
                    <span className="font-display text-xs tracking-tight">{s.n}</span>
                  </div>
                  <div className="pt-1.5">
                    <h4 className="font-sans font-bold text-brand-ink text-sm mb-1">{s.title}</h4>
                    <p className="text-sm text-brand-stone leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/auth/sign-up" className="inline-block mt-10">
              <button className="h-11 px-6 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-charcoal transition-all shadow-brand flex items-center gap-2">
                Get started free
                <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          {/* ── Voice AI card ── */}
          <div className="relative">
            <div className="absolute -inset-8 bg-brand-gold/6 rounded-3xl blur-3xl" />
            <div className="relative bg-white rounded-2xl border border-brand-border shadow-card p-7">
              <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-6">
                Voice AI — Live demo
              </p>

              {/* Mic */}
              <div className="flex justify-center mb-7">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-brand-ink flex items-center justify-center animate-pulse-glow">
                    <Mic2 size={22} className="text-white" />
                  </div>
                  {[1, 2].map((r) => (
                    <div
                      key={r}
                      className="absolute inset-0 rounded-full border border-brand-gold/25 animate-ping"
                      style={{ animationDelay: `${r * 0.55}s`, animationDuration: '2.6s' }}
                    />
                  ))}
                </div>
              </div>

              {/* Chat bubbles */}
              <div className="space-y-3">
                {VOICE_DEMO.map((m, i) => (
                  <div key={i} className={`flex ${m.you ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[82%] px-4 py-2.5 rounded-2xl ${
                        m.you
                          ? 'bg-brand-cream border border-brand-border text-brand-charcoal rounded-tl-sm'
                          : 'bg-brand-ink text-white rounded-tr-sm'
                      }`}
                    >
                      {m.you
                        ? <span className="font-mono text-[11px] text-brand-charcoal">{m.text}</span>
                        : <span className="text-xs font-semibold text-white">{m.text}</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}