'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TailorPalLogo } from '@/components/logo'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/#features',      label: 'Features'      },
  { href: '/#how-it-works',  label: 'How it works'  },
  { href: '/#testimonials',  label: 'Testimonials'  },
  { href: '/marketplace',    label: 'Marketplace'   },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled]     = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // On non-home pages, always show opaque nav
  const opaque = !isHome || scrolled

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        opaque
          ? 'bg-brand-ink/95 backdrop-blur-xl border-b border-white/8 shadow-brand'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <TailorPalLogo variant="white" size="md" href="/" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-white/90 hover:text-white font-medium transition-colors duration-200"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/auth/login">
              <button className="h-8.5 px-4 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/8 transition-all duration-200">
                Sign in
              </button>
            </Link>
            <Link href="/auth/sign-up">
              <button className="h-8.5 px-4 py-2 rounded-lg bg-brand-gold text-white text-sm font-semibold hover:bg-[#c06d22] transition-all duration-200 shadow-gold">
                Get started free
              </button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/8 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-ink border-t border-white/8 px-5 py-5 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block py-2.5 text-sm font-medium text-white/65 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="pt-4 space-y-2 border-t border-white/8 mt-3">
            <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
              <button className="w-full h-10 rounded-xl border border-white/15 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                Sign in
              </button>
            </Link>
            <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)}>
              <button className="w-full h-10 rounded-xl bg-brand-gold text-white text-sm font-semibold hover:bg-[#c06d22] transition-all">
                Get started free
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}