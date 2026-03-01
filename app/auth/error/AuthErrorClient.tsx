'use client'

import Link from 'next/link'
import { TailorPalLogo } from '@/components/logo'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export default function AuthErrorClient() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')

  useEffect(() => {
    toast.error('Authentication failed. Please try again.')
  }, [])

  return (
    <div className="animate-fade-in text-center">
      {/* Mobile logo */}
      <div className="lg:hidden mb-8 flex justify-center">
        <TailorPalLogo size="lg" />
      </div>

      {/* Error icon */}
      <div className="flex justify-center mb-7">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-100 scale-125 animate-ping opacity-20" style={{ animationDuration: '3s' }} />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-xl shadow-red-100">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-[26px] font-bold text-gray-900 mb-2 tracking-tight">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed mb-7">
        We encountered an issue processing your authentication request. Please try again.
      </p>

      {/* Error detail */}
      {errorCode && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-left">
          <p className="text-xs text-red-500 font-semibold uppercase tracking-wider mb-1">Error code</p>
          <p className="text-sm text-red-700 font-mono">{errorCode}</p>
        </div>
      )}

      {/* What to do */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-7 text-left">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">What you can do</p>
        <ul className="space-y-2.5">
          {[
            'Try signing in again from the login page',
            'Use a different sign-in method (email or Google)',
            'Clear your browser cookies and retry',
            'Contact support if the problem persists',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2.5 text-sm text-gray-600">
              <svg className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link href="/auth/login" className="block">
          <button className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold tracking-wide hover:from-violet-700 hover:to-purple-700 hover:shadow-lg hover:shadow-violet-200 transition-all duration-200">
            Back to Sign In
          </button>
        </Link>
        <Link href="/" className="block">
          <button className="w-full h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all duration-200">
            Go to Homepage
          </button>
        </Link>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Need help?{' '}
        <Link href="#" className="text-violet-600 hover:underline font-semibold">
          Contact support
        </Link>
      </p>
    </div>
  )
}
