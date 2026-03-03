'use client'

import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/auth/errors'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  GoogleOAuthButton, OrDivider, AuthError, PrimaryButton,
  EyeToggle, AuthHeader, Field, inputCls,
} from '../../../components/auth/authComponents'

// ─── Password strength indicator ─────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const config = [
    { color: 'bg-red-400',     text: 'Weak',   textColor: 'text-red-500' },
    { color: 'bg-orange-400',  text: 'Fair',   textColor: 'text-orange-500' },
    { color: 'bg-blue-400',    text: 'Good',   textColor: 'text-blue-500' },
    { color: 'bg-emerald-500', text: 'Strong', textColor: 'text-emerald-600' },
  ][score - 1] ?? null

  if (!password || !config) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? config.color : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold ${config.textColor}`}>{config.text} password</p>
    </div>
  )
}

export default function SignUpPage() {
  const [email, setEmail]                       = useState('')
  const [password, setPassword]                 = useState('')
  const [repeatPassword, setRepeatPassword]     = useState('')
  const [error, setError]                       = useState<string | null>(null)
  const [isLoading, setIsLoading]               = useState(false)
  const [isGoogleLoading, setGoogleLoading]     = useState(false)
  const [showPassword, setShowPassword]         = useState(false)
  const [showRepeat, setShowRepeat]             = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('inviteCode')?.trim().toUpperCase() || ''

  const passwordsMatch = repeatPassword.length > 0 && password === repeatPassword

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== repeatPassword) {
      const message = 'Passwords do not match'
      setError(message)
      toast.error(message)
      return
    }
    if (password.length < 8) {
      const message = 'Password must be at least 8 characters'
      setError(message)
      toast.error(message)
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    try {
      const redirectUrl = new URL('/auth/callback', window.location.origin)

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl.toString(),
        },
      })
      if (error) throw error
      toast.success('Account created. Check your email to continue.')
      router.push('/auth/sign-up-success')
    } catch (err: unknown) {
      const message = getAuthErrorMessage(err, 'Unable to create account. Please try again.')
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)
    const nextTarget = inviteCode
      ? `/auth/choose-role?inviteCode=${encodeURIComponent(inviteCode)}`
      : '/auth/choose-role'
    const next = encodeURIComponent(nextTarget)
    const origin = encodeURIComponent(window.location.origin)
    window.location.assign(`/api/auth/google?mode=signup&next=${next}&origin=${origin}`)
  }

  const busy = isLoading || isGoogleLoading

  return (
    <div className="animate-fade-in">
      <AuthHeader
        title="Create your account"
        subtitle="Start managing your fashion business for free"
      />

      <GoogleOAuthButton
        onClick={handleGoogleSignUp}
        isLoading={isGoogleLoading}
        disabled={busy}
        label="Sign up with Google"
      />

      <OrDivider label="or sign up with email" />

      {error && <AuthError message={error} />}

      {inviteCode && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Staff invite detected. After sign-up: choose <strong>Staff</strong> role, then use code{' '}
          <strong>{inviteCode}</strong> on the onboarding page.
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
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

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className={`${inputCls} pr-11`}
            />
            <EyeToggle visible={showPassword} onToggle={() => setShowPassword((p) => !p)} />
          </div>
          <PasswordStrength password={password} />
        </Field>

        <Field label="Confirm password" htmlFor="repeat-password">
          <div className="relative">
            <input
              id="repeat-password"
              type={showRepeat ? 'text' : 'password'}
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder="Repeat your password"
              className={`${inputCls} pr-16 ${
                repeatPassword
                  ? passwordsMatch
                    ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100'
                    : 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : ''
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {repeatPassword && (
                <span className={passwordsMatch ? 'text-emerald-500' : 'text-red-400'}>
                  {passwordsMatch ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  )}
                </span>
              )}
              <EyeToggle visible={showRepeat} onToggle={() => setShowRepeat((p) => !p)} />
            </div>
          </div>
        </Field>

        <div className="pt-1">
          <PrimaryButton type="submit" isLoading={isLoading} disabled={busy} loadingLabel="Creating account…">
            Create free account
          </PrimaryButton>
        </div>

        <p className="text-xs text-center text-gray-400">
          By signing up, you agree to our{' '}
          <Link href="#" className="text-violet-600 hover:underline font-semibold">Terms of Service</Link>
          {' '}and{' '}
          <Link href="#" className="text-violet-600 hover:underline font-semibold">Privacy Policy</Link>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-bold text-violet-600 hover:text-violet-800 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
