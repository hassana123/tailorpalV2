import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'
import { Heart } from 'lucide-react'

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { href: '/#features',     label: 'Features'     },
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/marketplace',   label: 'Marketplace'  },
      { href: '/auth/sign-up',  label: 'Get started'  },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '#', label: 'About'   },
      { href: '#', label: 'Blog'    },
      { href: '#', label: 'Contact' },
      { href: '#', label: 'Careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '#', label: 'Privacy Policy'  },
      { href: '#', label: 'Terms of Service'},
      { href: '#', label: 'Cookie Policy'   },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-brand-ink text-white/50 py-14">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <TailorPalLogo variant="white" size="md" href="/" />
            <p className="mt-4 text-sm text-white/38 leading-relaxed max-w-xs">
              The modern platform for fashion professionals across Africa and beyond.
            </p>
          </div>

          {/* Columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(({ href, label }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/42 hover:text-white transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/28">
            © 2026 TailorPal. All rights reserved.
          </p>
          <p className="text-xs text-white/28 flex items-center gap-1.5">
            Made with{' '}
            <Heart size={11} className="text-brand-gold fill-brand-gold" />
            {' '}for African fashion professionals
          </p>
        </div>
      </div>
    </footer>
  )
}