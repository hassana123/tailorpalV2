'use client'

import { useState, useEffect } from 'react'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { usePWAInstall } from '@/components/pwa/PWAInstallPrompt'
import { Download, X, Sparkles } from 'lucide-react'

export function PWAWrapper() {
  const { isInstallable, install } = usePWAInstall()

  return (
    <>
      <PWAInstallPrompt />
      
      {/* Show install button for Android/desktop devices that support PWA install */}
      {isInstallable && (
        <InstallButton onInstall={install} />
      )}
    </>
  )
}

function InstallButton({ onInstall }: { onInstall: () => void }) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if dismissed before
    const wasDismissed = typeof window !== 'undefined' && localStorage.getItem('pwa-install-dismissed') === 'true'
    if (wasDismissed) return

    // Delay showing the button until user has been on the page for a bit
    const timer = setTimeout(() => setShow(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShow(false)
    setDismissed(true)
    try {
      localStorage.setItem('pwa-install-dismissed', 'true')
    } catch {
      // Ignore storage errors
    }
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-24 right-4 sm:bottom-8 sm:right-6 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-1.5 bg-[#0D1A33] border border-[#D97B2B]/40 rounded-full pl-3 pr-1.5 py-1.5 shadow-2xl backdrop-blur-md text-white group hover:border-[#D97B2B] transition-all">
        <button
          onClick={onInstall}
          className="flex items-center gap-2 text-xs font-semibold text-white/95 hover:text-white transition-colors"
          aria-label="Install TailorPal app"
        >
          <span className="w-6 h-6 rounded-full bg-[#D97B2B] flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <Download className="w-3.5 h-3.5" />
          </span>
          <span className="pr-1 flex items-center gap-1">
            Install App
            <Sparkles className="w-3 h-3 text-[#D97B2B]" />
          </span>
        </button>

        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Hide install button"
          title="Dismiss install prompt"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

