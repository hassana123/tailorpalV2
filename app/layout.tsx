import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SonnerProvider } from '@/components/providers/SonnerProvider'
import { Suspense } from 'react'
import ClientBoundary from './ClientBoundary'
import LoadingSpinner from '@/components/LoadingSpinner'
export const metadata: Metadata = {
  title: 'TailorPal — Fashion Shop Management & Marketplace',
  description:
    'The modern platform for fashion designers and tailors to manage their shops, customers, measurements, and orders — powered by AI.',
  keywords: 'tailoring, fashion, shop management, measurements, orders, AI assistant',
  openGraph: {
    title: 'TailorPal — Fashion Shop Management & Marketplace',
    description: 'Manage your fashion business with AI assistance',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        ── Font strategy ────────────────────────────────────────────────
        DM Serif Display  → editorial display headlines (Google Fonts)
        Plus Jakarta Sans → clean, geometric body text (Google Fonts)

        These are loaded via @import in globals.css so no npm package needed.
        If you prefer next/font (recommended for performance), you can do:

          import { DM_Serif_Display, Plus_Jakarta_Sans } from 'next/font/google'
          const serif  = DM_Serif_Display({ weight: ['400'], subsets: ['latin'], variable: '--font-display' })
          const sans   = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['300','400','500','600','700','800'], variable: '--font-sans' })

        Then add className={`${serif.variable} ${sans.variable}`} to <body>.
        For now the @import in globals.css works perfectly fine.
        ────────────────────────────────────────────────────────────────
      */}
     <body className="font-sans bg-background text-foreground antialiased">
  <Suspense fallback={<LoadingSpinner />}>
    <ClientBoundary>{children}</ClientBoundary>
  </Suspense>
  <SonnerProvider />
</body>
    </html>
  )
}
