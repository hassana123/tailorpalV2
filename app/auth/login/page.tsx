'use client'

import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/auth/errors'
import { requiresRoleSelection } from '@/lib/auth/role'
import { getSafeNextPath } from '@/lib/utils/app-url'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  GoogleOAuthButton, OrDivider, AuthError, PrimaryButton,
  TrustBadges, EyeToggle, AuthHeader, Field, inputCls,
} from '../../../components/auth/authComponents'

export default function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [isLoading, setIsLoading]       = useState(false)
  const [isGoogleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get('next')
  const nextPath = rawNext ? getSafeNextPath(rawNext, '/marketplace') : null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, created_at, updated_at')
        .eq('id', user?.id)
        .single()
      if (requiresRoleSelection(profile)) {
        toast.success('Signed in. Please select your role.')
        router.push('/auth/choose-role')
      } else if (nextPath) {
        toast.success('Welcome back.')
        router.push(nextPath)
      } else if (profile?.user_type === 'shop_owner') {
        toast.success('Welcome back.')
        router.push('/dashboard/shop')
      } else if (profile?.user_type === 'staff') {
        toast.success('Welcome back.')
        router.push('/dashboard/staff')
      } else {
        toast.success('Welcome back.')
        router.push('/dashboard/customer')
      }
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err, 'Invalid email or password. Please try again.')
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'login', ...(nextPath ? { next: nextPath } : {}) }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; url?: string }
        | null

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || 'Failed to sign in with Google')
      }

      window.location.assign(payload.url)
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err, 'Failed to sign in with Google')
      setError(message)
      toast.error(message)
      setGoogleLoading(false)
    }
  }

  const busy = isLoading || isGoogleLoading

  return (
    <div className="animate-fade-in">
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to your TailorPal account to continue"
      />

      <GoogleOAuthButton
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
        disabled={busy}
        label="Continue with Google"
      />

      <OrDivider />

      {error && <AuthError message={error} />}

      <form onSubmit={handleLogin} className="space-y-4">
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          action={
            <Link href="#" className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${inputCls} pr-11`}
            />
            <EyeToggle visible={showPassword} onToggle={() => setShowPassword((p) => !p)} />
          </div>
        </Field>

        <div className="pt-1">
          <PrimaryButton type="submit" isLoading={isLoading} disabled={busy} loadingLabel="Signing in…">
            Sign in
          </PrimaryButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/sign-up" className="font-bold text-violet-600 hover:text-violet-800 transition-colors">
          Create one free
        </Link>
      </p>

      <TrustBadges />
    </div>
  )
}
