'use client'

import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'
import { useEffect } from 'react'
import { toast } from 'sonner'

const STEPS = [
  { n: '1', text: 'Open the email from TailorPal',              done: true  },
  { n: '2', text: 'Click the confirmation link',                done: false },
  { n: '3', text: 'Choose your role (owner, staff, customer)',  done: false },
  { n: '4', text: 'Start managing your fashion business!',      done: false },
]

export default function SignUpSuccessPage() {
  useEffect(() => {
    toast.success('Verification email sent. Check your inbox.')
  }, [])

  return (
    <div className="animate-fade-in text-center">
      {/* Mobile logo */}
      <div className="lg:hidden mb-8 flex justify-center">
        <TailorPalLogo size="lg" />
      </div>

      {/* Envelope illustration */}
      <div className="flex justify-center mb-7">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-violet-200 scale-125" />
          {/* Pulsing ping */}
          <div className="absolute inset-0 rounded-full bg-violet-100 scale-125 animate-ping opacity-30" style={{ animationDuration: '2.5s' }} />
          {/* Icon circle */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-200">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 6L2 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-[26px] font-bold text-gray-900 mb-2 tracking-tight">
        Check your inbox
      </h1>
      <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed mb-7">
        We&apos;ve sent a confirmation link to your email. Click it to activate your account and get started.
      </p>

      {/* Steps */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-5 text-left">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">What&apos;s next?</p>
        <div className="space-y-3.5">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                s.done
                  ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {s.done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.n}
              </div>
              <span className={`text-sm ${s.done ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                {s.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Spam tip */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-100 mb-7 text-left">
        <span className="text-amber-500 text-base flex-shrink-0">💡</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Tip:</strong> Can&apos;t find the email? Check your spam or promotions folder. It usually arrives within 60 seconds.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="space-y-3">
        <Link href="/auth/login" className="block">
          <button className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold tracking-wide hover:from-violet-700 hover:to-purple-700 hover:shadow-lg hover:shadow-violet-200 transition-all duration-200">
            Go to Sign In
          </button>
        </Link>
        <Link href="/" className="block">
          <button className="w-full h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all duration-200">
            Back to Home
          </button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Having trouble?{' '}
        <Link href="#" className="text-violet-600 hover:underline font-semibold">
          Contact support
        </Link>
      </p>
    </div>
  )
}
