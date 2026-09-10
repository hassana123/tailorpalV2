'use client'

import { useState, useEffect } from 'react'
import { Download, X, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PWAInstallPromptProps {
  className?: string
}

export function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    
    if (isIOS && !isStandalone && !wasDismissed && !dismissed) {
      setShowPrompt(true)
    }
  }, [dismissed])

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div
      className={cn(
        'fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5',
        className
      )}
    >
      <div className="bg-[#0D1A33] border border-[#D97B2B]/35 rounded-3xl p-6 shadow-2xl text-white relative backdrop-blur-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#D97B2B]/20 border border-[#D97B2B]/30 rounded-2xl flex items-center justify-center text-[#D97B2B]">
            <Phone className="w-6 h-6" />
          </div>
          
          <div className="flex-1 pr-4">
            <span className="text-[10px] font-bold text-[#D97B2B] uppercase tracking-wider block mb-0.5">
              Atelier Mobile App
            </span>
            <h3 className="font-display font-semibold text-lg text-white mb-1">
              Add TailorPal to Home Screen
            </h3>
            <p className="text-white/70 text-xs leading-relaxed mb-4">
              Get full offline-ready access to client measurements, garment presets, and live order tracking right from your phone.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-4">
              <ol className="text-xs space-y-2 text-white/80">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-[#D97B2B] text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">1</span>
                  Tap the Safari <Download className="w-3.5 h-3.5 inline text-[#D97B2B]" /> share button
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-[#D97B2B] text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">2</span>
                  Scroll down & tap <strong className="text-white font-semibold">&ldquo;Add to Home Screen&rdquo;</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-[#D97B2B] text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">3</span>
                  Tap <strong className="text-white font-semibold">&ldquo;Add&rdquo;</strong> in top right corner
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 px-4 bg-[#D97B2B] hover:bg-[#c06d22] text-white font-bold text-xs rounded-xl transition-all shadow-gold"
              >
                Got it, thanks!
              </button>
              <button
                onClick={handleDismiss}
                className="py-2.5 px-3 text-white/60 hover:text-white text-xs font-medium rounded-xl hover:bg-white/5 transition-colors"
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to detect PWA installation capability
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    setIsInstalled(isStandalone)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    setDeferredPrompt(null)
    setIsInstallable(false)
    return outcome === 'accepted'
  }

  return { isInstallable, isInstalled, install }
}
