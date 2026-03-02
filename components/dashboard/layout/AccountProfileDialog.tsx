'use client'

import { X, Mail, User, Shield, Loader2 } from 'lucide-react'

function formatRoleLabel(role: string | null) {
  if (!role) return 'Not set'
  return role
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

interface AccountProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profileLoading: boolean
  profileSaving: boolean
  email: string
  firstName: string
  lastName: string
  userType: string | null
  onFirstNameChange: (v: string) => void
  onLastNameChange: (v: string) => void
  onSave: () => void
}

export function AccountProfileDialog({
  open,
  onOpenChange,
  profileLoading,
  profileSaving,
  email,
  firstName,
  lastName,
  userType,
  onFirstNameChange,
  onLastNameChange,
  onSave,
}: AccountProfileDialogProps) {
  if (!open) return null

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || email[0]?.toUpperCase() || 'U'

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={() => onOpenChange(false)}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl border border-brand-border shadow-brand-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-brand-border">
          <div>
            <h3 className="font-display text-xl text-brand-ink">Account Profile</h3>
            <p className="text-xs text-brand-stone mt-0.5">Update your display name and details</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-xl text-brand-stone hover:text-brand-ink hover:bg-brand-cream transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar row */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-brand-border">
          <div className="w-14 h-14 rounded-2xl bg-brand-ink text-white flex items-center justify-center font-display text-2xl flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-brand-ink text-sm">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'No name set'}
            </p>
            <p className="text-xs text-brand-stone mt-0.5">{email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">

          {/* Email (read-only) */}
          <div>
            <label className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.18em] block mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-stone" />
              <input
                value={email}
                disabled
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-brand-cream border border-brand-border text-sm text-brand-stone cursor-not-allowed"
              />
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.18em] block mb-1.5">
                First name
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-stone" />
                <input
                  value={firstName}
                  onChange={(e) => onFirstNameChange(e.target.value)}
                  placeholder="First name"
                  disabled={profileLoading}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-brand-border bg-white text-sm text-brand-ink placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/50 transition-all disabled:opacity-60"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.18em] block mb-1.5">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => onLastNameChange(e.target.value)}
                placeholder="Last name"
                disabled={profileLoading}
                className="w-full h-10 px-4 rounded-xl border border-brand-border bg-white text-sm text-brand-ink placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/25 focus:border-brand-gold/50 transition-all disabled:opacity-60"
              />
            </div>
          </div>

          {/* Role (read-only) */}
          <div>
            <label className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.18em] block mb-1.5">
              Current role
            </label>
            <div className="relative">
              <Shield size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-stone" />
              <input
                value={formatRoleLabel(userType)}
                disabled
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-brand-cream border border-brand-border text-sm text-brand-stone cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={() => onOpenChange(false)}
            disabled={profileSaving}
            className="flex-1 h-10 rounded-xl border border-brand-border text-brand-stone text-sm font-semibold hover:bg-brand-cream hover:text-brand-ink transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={profileLoading || profileSaving}
            className="flex-1 h-10 rounded-xl bg-brand-ink text-white text-sm font-bold hover:bg-brand-charcoal transition-all shadow-brand disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {profileSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}