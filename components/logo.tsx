import Link from 'next/link'

interface LogoProps {
  variant?: 'dark' | 'white' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizes = {
  sm: { mark: 22, text: 'text-sm',  gap: 'gap-2' },
  md: { mark: 28, text: 'text-base', gap: 'gap-2.5' },
  lg: { mark: 34, text: 'text-xl',  gap: 'gap-3' },
}

// The mark: a stylised needle passing through a circular thread loop
// — simple, iconic, fashion-relevant
function TailorMark({ size, variant }: { size: number; variant: 'dark' | 'white' | 'gold' }) {
  const ink   = variant === 'white' ? '#FFFFFF' : '#0D1A33'
  const gold  = variant === 'gold'  ? '#0D1A33' : '#D97B2B'
  const bg    = variant === 'white' ? 'rgba(255,255,255,0.12)' : 'rgba(13,26,51,0.07)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background circle — very subtle */}
      <circle cx="18" cy="18" r="17" fill={bg} />

      {/* Outer thread ring */}
      <circle cx="18" cy="18" r="11" stroke={ink} strokeWidth="1.4" strokeDasharray="3.5 2.5" opacity="0.35" />

      {/* Needle — diagonal, thin, elegant */}
      <line x1="9" y1="9" x2="27" y2="27" stroke={ink} strokeWidth="1.8" strokeLinecap="round" />

      {/* Needle eye — small ellipse near top of needle */}
      <ellipse cx="11.5" cy="11.5" rx="2.2" ry="1.4" transform="rotate(-45 11.5 11.5)" stroke={ink} strokeWidth="1.3" />

      {/* Thread — curves gracefully off the needle */}
      <path
        d="M11.5 11.5 Q 6 20 14 28 Q 20 33 26.5 27"
        stroke={gold}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* Thread tail dot */}
      <circle cx="26.5" cy="27" r="1.4" fill={gold} />
    </svg>
  )
}

export function TailorPalLogo({ variant = 'dark', size = 'md', href, className = '' }: LogoProps) {
  const { mark, text, gap } = sizes[size]

  const textColor = {
    dark:  'text-brand-ink',
    white: 'text-white',
    gold:  'text-brand-gold',
  }[variant]

  const tagColor = {
    dark:  'text-brand-stone',
    white: 'text-white/55',
    gold:  'text-brand-gold/70',
  }[variant]

  const content = (
    <span className={`inline-flex items-center ${gap} ${className} select-none`}>
      <TailorMark size={mark} variant={variant} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-normal tracking-tight ${text} ${textColor}`}
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          TailorPal
        </span>
        {size === 'lg' && (
          <span
            className={`text-[9px] font-body font-semibold tracking-[0.18em] uppercase mt-0.5 ${tagColor}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Fashion Studio
          </span>
        )}
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-85 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}