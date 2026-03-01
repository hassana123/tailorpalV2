'use client'

import { Loader2 } from 'lucide-react'

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-3">
        {/* Icon spinner */}
        <Loader2 className="w-12 h-12 text-brand-gold animate-spin" />

        {/* Optional text */}
        <p className="text-sm text-foreground/70 font-medium">Loading, please wait…</p>
      </div>
    </div>
  )
}