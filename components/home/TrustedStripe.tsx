const SHOPS = ["Lagos Threads", "Kente Studio", "Fatima's Couture", "Abuja Couture", "Dakar Style"]

export function TrustedStrip() {
  return (
    <div className="bg-white border-y border-brand-border py-9">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <p className="text-center text-[10px] font-bold text-brand-stone uppercase tracking-[0.22em] mb-7">
          Trusted by fashion professionals across Africa
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-14">
          {SHOPS.map((name) => (
            <span
              key={name}
              className="font-display text-sm text-brand-charcoal/35 tracking-tight hover:text-brand-charcoal/55 transition-colors duration-300"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}