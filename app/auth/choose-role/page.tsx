'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { TailorPalLogo } from '@/components/logo'
import { AuthError } from '@/components/auth/authComponents'
import {
  Store,
  Users,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Check,
  BarChart3,
  Mic2,
  ClipboardList,
  Ruler,
  Search,
  Package,
  Heart,
  Loader2,
  Sparkles,
} from 'lucide-react'

type UserType = 'shop_owner' | 'staff' | 'customer'

const ROLES = [
  {
    id: 'shop_owner' as UserType,
    title: 'Shop Owner',
    tagline: 'Run your business',
    description:
      'Full control over your fashion business - customers, orders, team and analytics in one place.',
    badge: 'Most popular',
    Icon: Store,
    features: [
      { Icon: Users, text: 'Customer management' },
      { Icon: Mic2, text: 'Voice AI assistant' },
      { Icon: BarChart3, text: 'Business analytics' },
      { Icon: ClipboardList, text: 'Team management' },
    ],
    borderSelected: '#0D1A33',
    bgSelected: 'rgba(13,26,51,0.03)',
    iconActiveBg: '#0D1A33',
    checkBg: '#0D1A33',
    badgeBg: '#0D1A33',
  },
  {
    id: 'staff' as UserType,
    title: 'Staff Member',
    tagline: 'Assist daily ops',
    description:
      'Handle daily operations, serve customers and keep orders moving efficiently.',
    badge: undefined,
    Icon: Users,
    features: [
      { Icon: ClipboardList, text: 'View assigned orders' },
      { Icon: Ruler, text: 'Update measurements' },
      { Icon: Search, text: 'Customer lookup' },
      { Icon: Package, text: 'Daily task list' },
    ],
    borderSelected: '#D97B2B',
    bgSelected: 'rgba(217,123,43,0.03)',
    iconActiveBg: '#D97B2B',
    checkBg: '#D97B2B',
    badgeBg: '#D97B2B',
  },
  {
    id: 'customer' as UserType,
    title: 'Customer',
    tagline: 'Find your perfect fit',
    description:
      'Discover designers, place custom orders and track your garments from start to finish.',
    badge: undefined,
    Icon: ShoppingBag,
    features: [
      { Icon: Search, text: 'Browse marketplace' },
      { Icon: Package, text: 'Place custom orders' },
      { Icon: Ruler, text: 'Save measurements' },
      { Icon: Heart, text: 'Track order status' },
    ],
    borderSelected: '#7B9E6B',
    bgSelected: 'rgba(123,158,107,0.04)',
    iconActiveBg: '#7B9E6B',
    checkBg: '#7B9E6B',
    badgeBg: '#7B9E6B',
  },
]

export default function ChooseRolePage() {
  const [selected, setSelected] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResolvingAuth, setIsResolvingAuth] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  useEffect(() => {
    if (!code) return

    let isMounted = true
    const exchangeCode = async () => {
      setIsResolvingAuth(true)

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        const message = exchangeError.message || 'Could not complete sign-in. Please try again.'
        setError(message)
        toast.error(message)
      } else {
        window.history.replaceState({}, '', '/auth/choose-role')
      }

      if (isMounted) {
        setIsResolvingAuth(false)
      }
    }

    void exchangeCode()
    return () => {
      isMounted = false
    }
  }, [code, supabase])

  const handleContinue = async () => {
    if (!selected) {
      const message = 'Please select a role to continue.'
      setError(message)
      toast.error(message)
      return
    }

    if (isResolvingAuth) {
      const message = 'Please wait while we finish signing you in.'
      setError(message)
      toast.error(message)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/auth/set-user-type', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ userType: selected }),
      })

      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to set user role')
      }

      toast.success('Role saved successfully.')

      if (selected === 'shop_owner') router.push('/dashboard/shop/setup')
      else if (selected === 'staff') router.push('/dashboard/staff/onboarding')
      else router.push('/dashboard/customer')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRole = ROLES.find((role) => role.id === selected)

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-border flex items-center justify-between px-6 sm:px-10 py-4">
        <TailorPalLogo size="md" />
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-brand-stone hover:text-brand-ink font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-16 lg:py-20">
        <div className="text-center mb-12 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-gold uppercase tracking-[0.22em] bg-brand-gold/8 border border-brand-gold/20 px-3.5 py-1.5 rounded-full mb-5">
            <Sparkles size={10} />
            Almost there - one last step
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] text-brand-ink leading-tight mb-4">
            How will you use TailorPal?
          </h1>
          <p className="text-brand-stone text-base leading-relaxed">
            Pick the role that fits you best. You can always change this later in your
            account settings.
          </p>
        </div>

        <div className="w-full max-w-5xl grid gap-5 sm:grid-cols-3 mb-8">
          {ROLES.map((role) => {
            const isSelected = selected === role.id

            return (
              <button
                key={role.id}
                onClick={() => {
                  setSelected(role.id)
                  setError(null)
                }}
                className="relative text-left rounded-2xl border-2 p-7 transition-all duration-200 focus:outline-none group"
                style={{
                  borderColor: isSelected ? role.borderSelected : '#E5E0D8',
                  backgroundColor: isSelected ? role.bgSelected : '#FFFFFF',
                  boxShadow: isSelected
                    ? '0 8px 30px rgba(0,0,0,0.08)'
                    : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                {role.badge && (
                  <span
                    className="absolute -top-3 left-6 text-[10px] font-bold px-3 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: role.badgeBg }}
                  >
                    {role.badge}
                  </span>
                )}

                <div
                  className="absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                  style={{
                    borderColor: isSelected ? role.checkBg : '#D4CFC8',
                    backgroundColor: isSelected ? role.checkBg : 'transparent',
                  }}
                >
                  {isSelected && <Check size={10} strokeWidth={3} className="text-white" />}
                </div>

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? role.iconActiveBg : '#F5F3F0',
                    color: isSelected ? '#FFFFFF' : '#8A8278',
                  }}
                >
                  <role.Icon size={22} />
                </div>

                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-stone mb-1.5">
                  {role.tagline}
                </p>
                <h3 className="font-sans font-bold text-lg text-brand-ink mb-2">{role.title}</h3>
                <p className="text-sm text-brand-stone leading-relaxed mb-6">{role.description}</p>

                <div
                  className="h-px mb-5"
                  style={{
                    backgroundColor: isSelected ? `${role.borderSelected}18` : '#EDE8E2',
                  }}
                />

                <ul className="space-y-2.5">
                  {role.features.map(({ Icon: FeatureIcon, text }) => (
                    <li key={text} className="flex items-center gap-2.5 text-xs text-brand-stone">
                      <FeatureIcon
                        size={12}
                        style={{ color: isSelected ? role.borderSelected : '#A09990' }}
                        className="flex-shrink-0"
                      />
                      {text}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {error && (
          <div className="w-full max-w-5xl mb-5">
            <AuthError message={error} />
          </div>
        )}

        <div className="w-full max-w-5xl flex gap-3">
          <Link href="/auth/login">
            <button className="h-12 px-5 rounded-xl border border-brand-border bg-white text-brand-stone text-sm font-semibold hover:text-brand-ink hover:border-brand-ink/25 hover:bg-brand-cream transition-all flex items-center gap-1.5">
              <ArrowLeft size={14} />
              Back
            </button>
          </Link>

          <button
            onClick={handleContinue}
            disabled={!selected || isLoading || isResolvingAuth}
            className="flex-1 h-12 rounded-xl bg-brand-ink text-white text-sm font-bold hover:bg-brand-charcoal transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-brand"
          >
            {isResolvingAuth ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Finalizing sign in...
              </>
            ) : isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Setting up your account...
              </>
            ) : selected ? (
              <>
                Continue as {selectedRole?.title}
                <ArrowRight size={14} />
              </>
            ) : (
              'Select a role to continue'
            )}
          </button>
        </div>

        <p className="mt-6 text-xs text-brand-stone text-center">
          Changed your mind?{' '}
          <Link href="/auth/sign-up" className="text-brand-gold font-semibold hover:underline">
            Create a different account
          </Link>
        </p>
      </main>

      <footer className="py-4 text-center border-t border-brand-border bg-white">
        <p className="text-xs text-brand-stone">
          (c) 2026 TailorPal -{' '}
          <Link href="#" className="hover:text-brand-ink transition-colors">
            Privacy
          </Link>{' '}
          -{' '}
          <Link href="#" className="hover:text-brand-ink transition-colors">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  )
}
