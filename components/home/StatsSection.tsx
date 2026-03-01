const STATS = [
  { value: '500+',  label: 'Fashion Professionals' },
  { value: '50K+',  label: 'Customers Managed'     },
  { value: '120K+', label: 'Orders Processed'       },
  { value: '99.9%', label: 'Uptime Guaranteed'      },
]

export function StatsSection() {
  return (
    <section className="py-20 bg-brand-cream">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl lg:text-5xl text-brand-ink mb-2">{s.value}</div>
              <div className="text-sm text-brand-stone font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}