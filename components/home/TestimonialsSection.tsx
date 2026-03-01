import { Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    quote: "TailorPal transformed how I manage my boutique. The voice assistant alone saves me 2 hours every single day.",
    name: 'Fatima Al-Hassan',
    role: "Owner, Fatima's Couture",
    location: 'Lagos',
    initial: 'F',
  },
  {
    quote: "Finally, a platform built for African fashion professionals. Measurement tracking is incredibly accurate.",
    name: 'Kwame Asante',
    role: 'Head Designer, Kente Studio',
    location: 'Accra',
    initial: 'K',
  },
  {
    quote: "Managing 3 shops used to be a nightmare. TailorPal lets me delegate and see everything from one dashboard.",
    name: 'Amara Diallo',
    role: 'CEO, Amara Fashion House',
    location: 'Dakar',
    initial: 'A',
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <p className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] mb-4">
            Testimonials
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-brand-ink leading-[1.1]">
            Loved by fashion professionals
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-7 rounded-2xl border border-brand-border bg-brand-cream hover:bg-white hover:shadow-card-hover hover:border-brand-gold/30 transition-all duration-300 card-hover flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={12} className="text-brand-gold fill-brand-gold" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="font-display italic text-brand-charcoal text-sm leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-ink text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {t.initial}
                </div>
                <div>
                  <p className="text-brand-ink text-sm font-bold">{t.name}</p>
                  <p className="text-brand-stone text-xs">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}