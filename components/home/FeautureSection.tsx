import {
  Users,
  Mic2,
  Ruler,
  BarChart3,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react'

const FEATURES = [
  {
    Icon: Users,
    label: 'Customer Management',
    desc: 'Organise every customer profile, contact and order history in one elegant dashboard.',
  },
  {
    Icon: Mic2,
    label: 'Voice AI Assistant',
    desc: 'Add customers and record measurements hands-free — just speak naturally.',
  },
  {
    Icon: Ruler,
    label: 'Measurement Tracking',
    desc: 'Record and store precise measurements for perfectly fitting garments, every time.',
  },
  {
    Icon: BarChart3,
    label: 'Business Analytics',
    desc: 'Track sales, customer growth and performance with clean, real-time dashboards.',
  },
  {
    Icon: LayoutGrid,
    label: 'Order Management',
    desc: 'Create and track every order from intake to delivery, with status and notifications.',
  },
  {
    Icon: ShieldCheck,
    label: 'Secure & Reliable',
    desc: 'Enterprise-grade security by Supabase. Your data is encrypted, backed up, protected.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-4">
            Everything you need
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-brand-ink leading-[1.1] mb-5">
            Powerful tools for fashion professionals
          </h2>
          <p className="text-brand-stone text-base leading-relaxed">
            From customer management to AI-powered voice assistance — built for the modern fashion business.
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, label, desc }) => (
            <div
              key={label}
              className="group p-6 rounded-2xl border border-brand-border bg-brand-cream hover:bg-white hover:border-brand-gold/35 hover:shadow-card-hover transition-all duration-300 card-hover"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-ink text-white flex items-center justify-center mb-5 group-hover:bg-brand-gold transition-colors duration-300">
                <Icon size={18} />
              </div>
              <h3 className="font-sans font-bold text-brand-ink text-sm mb-2">{label}</h3>
              <p className="text-sm text-brand-stone leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}