'use client'

import React from 'react'

// ─── Google colour icon ──────────────────────────────────────────────────────
export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8269 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
    </svg>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Google OAuth button ──────────────────────────────────────────────────────
interface OAuthButtonProps {
  onClick: () => void
  isLoading?: boolean
  disabled?: boolean
  label: string
  loadingLabel?: string
}
export function GoogleOAuthButton({ onClick, isLoading, disabled, label, loadingLabel = 'Connecting…' }: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? <Spinner /> : <GoogleIcon />}
      {isLoading ? loadingLabel : label}
    </button>
  )
}

// ─── Or divider ──────────────────────────────────────────────────────────────
export function OrDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-100" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs text-gray-400 font-medium">{label}</span>
      </div>
    </div>
  )
}

// ─── Error alert ─────────────────────────────────────────────────────────────
export function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 mb-4">
      <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm text-red-700 font-medium">{message}</p>
    </div>
  )
}

// ─── Primary button ───────────────────────────────────────────────────────────
interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingLabel?: string
}
export function PrimaryButton({ isLoading, loadingLabel, children, className = '', ...props }: PrimaryBtnProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || isLoading}
      className={`w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold tracking-wide hover:from-violet-700 hover:to-purple-700 hover:shadow-lg hover:shadow-violet-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
    >
      {isLoading ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : children}
    </button>
  )
}

// ─── Ghost / outline button ───────────────────────────────────────────────────
export function GhostButton({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Trust badges row ─────────────────────────────────────────────────────────
export function TrustBadges() {
  return (
    <div className="mt-8 flex items-center justify-center gap-5">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        Encrypted
      </div>
      <div className="w-px h-3.5 bg-gray-200" />
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Privacy first
      </div>
      <div className="w-px h-3.5 bg-gray-200" />
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        GDPR ready
      </div>
    </div>
  )
}

// ─── Password eye-toggle button ───────────────────────────────────────────────
export function EyeToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      aria-label={visible ? 'Hide password' : 'Show password'}
    >
      {visible ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

// ─── Auth page header ─────────────────────────────────────────────────────────
export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[26px] font-bold text-gray-900 mb-1.5 tracking-tight">{title}</h1>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

// ─── Form field wrapper ───────────────────────────────────────────────────────
export function Field({ label, htmlFor, children, action }: { label: string; htmlFor: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">{label}</label>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Shared input class ───────────────────────────────────────────────────────
export const inputCls = 'h-11 w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all duration-200'