import Link from 'next/link'
import { ArrowRight, Search, Star } from 'lucide-react'

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

export function Hero() {
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
            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 bg-white/8 text-white/70 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/10 mb-7 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sage animate-pulse" />
              Trusted by 500+ fashion professionals
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] text-white leading-[1.08] mb-6">
              The smarter way to run your{' '}
              <span className="text-gradient-light italic">fashion business</span>
            </h1>

            <p className="text-lg text-white/60 leading-relaxed mb-9 max-w-lg">
              Manage customers, measurements, orders and your whole team — all in one place. Built for designers and tailors across Africa.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
              <Link href="/auth/sign-up">
                <button className="h-12 px-7 rounded-xl bg-brand-gold text-white text-sm font-bold hover:bg-[#c06d22] transition-all shadow-gold flex items-center gap-2">
                  Start for free
                  <ArrowRight size={14} />
                </button>
              </Link>
              <Link href="/marketplace">
                <button className="h-12 px-7 rounded-xl bg-white/8 text-white text-sm font-semibold border border-white/12 hover:bg-white/14 transition-all flex items-center gap-2">
                  <Search size={14} />
                  Browse marketplace
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
                <p className="text-white/50 text-xs font-medium">Loved by 500+ professionals</p>
              </div>
            </div>
          </div>

          {/* ── Dashboard mockup ── */}
          <div
            className="relative hidden lg:block animate-slide-up"
            style={{ animationDelay: '0.18s' }}
          >
            <div className="absolute -inset-6 bg-brand-gold/8 rounded-3xl blur-3xl" />
            <div className="relative bg-white/6 backdrop-blur-sm rounded-2xl border border-white/10 p-1.5 shadow-brand-lg">
              <div className="bg-[#0f172a] rounded-xl overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/55" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/55" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/55" />
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-white/7 rounded px-3 py-1 text-[10px] text-white/35 text-center font-mono">
                      app.tailorpal.com/dashboard
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="p-5 grid grid-cols-2 gap-3">
                  {DASHBOARD_STATS.map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/7">
                      <p className="text-white/42 text-[11px] mb-1 font-medium">{s.label}</p>
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-emerald-400 text-[10px] mt-1 font-semibold">{s.change} this month</p>
                    </div>
                  ))}
                </div>

                {/* Orders table */}
                <div className="px-5 pb-5">
                  <div className="bg-white/3 rounded-xl border border-white/7">
                    <div className="px-4 py-2.5 border-b border-white/7">
                      <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">Recent Orders</p>
                    </div>
                    {RECENT_ORDERS.map((o) => (
                      <div key={o.name} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-orange-800 flex items-center justify-center text-white text-[9px] font-bold">
                            {o.name[0]}
                          </div>
                          <div>
                            <p className="text-white/78 text-[11px] font-semibold">{o.name}</p>
                            <p className="text-white/35 text-[10px]">{o.item}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-semibold ${o.sc}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}