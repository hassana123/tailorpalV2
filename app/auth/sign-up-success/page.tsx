'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { TailorPalLogo } from '@/components/logo'
import { toast } from 'sonner'
import { Mail, ArrowLeft, RotateCcw, ExternalLink } from 'lucide-react'

export default function SignUpSuccessPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'
  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)

  useEffect(() => {
    toast.success('Verification email sent. Check your inbox.')
  }, [])

  const handleResend = async () => {
    setResending(true)
    // Simulate resend — wire up to your actual resend logic
    await new Promise((r) => setTimeout(r, 1200))
    setResending(false)
    setResent(true)
    toast.success('Email resent successfully.')
    setTimeout(() => setResent(false), 4000)
  }

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-brand-border bg-white">
        <TailorPalLogo size="md" />
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-brand-stone hover:text-brand-ink font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </header>

      {/* Centred card */}
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm text-center animate-fade-in">

          {/* Envelope icon */}
          <div className="flex justify-center mb-7">
            <div className="relative">
              {/* Outer pulse ring */}
              <div
                className="absolute inset-0 rounded-full bg-brand-gold/12 scale-[1.55] animate-ping"
                style={{ animationDuration: '2.8s' }}
              />
              {/* Soft halo */}
              <div className="absolute inset-0 rounded-full bg-brand-gold/10 scale-[1.3]" />
              {/* Icon circle */}
              <div className="relative w-20 h-20 rounded-full bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-center">
                <Mail size={34} className="text-brand-gold" strokeWidth={1.6} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display text-3xl text-brand-ink mb-3">
            Check Your Email
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-brand-stone leading-relaxed mb-8">
            We&apos;ve sent the confirmation link to{' '}
            <span className="font-semibold text-brand-charcoal">{email}</span>
          </p>

          {/* Primary CTA — open Gmail */}
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-brand-ink text-white text-sm font-bold hover:bg-brand-charcoal transition-all duration-200 shadow-brand mb-4"
          >
            Open Gmail App
            <ExternalLink size={13} />
          </a>

          {/* Resend link */}
          <p className="text-sm text-brand-stone mb-6">
            Didn&apos;t receive the email?{' '}
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="font-semibold text-brand-gold hover:underline transition-colors disabled:opacity-60 inline-flex items-center gap-1"
            >
              {resending ? (
                <>
                  <RotateCcw size={12} className="animate-spin" />
                  Sending…
                </>
              ) : resent ? (
                'Sent ✓'
              ) : (
                'Click to Resend'
              )}
            </button>
          </p>

          {/* Back to login */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-brand-stone hover:text-brand-ink font-medium transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Login
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-brand-border bg-white">
        <p className="text-xs text-brand-stone">
          © 2026 TailorPal ·{' '}
          <Link href="#" className="hover:text-brand-ink transition-colors">Privacy</Link>
          {' · '}
          <Link href="#" className="hover:text-brand-ink transition-colors">Terms</Link>
        </p>
      </footer>
    </div>
  )
}