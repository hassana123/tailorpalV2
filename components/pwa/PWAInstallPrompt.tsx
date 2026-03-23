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
        'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4',
        className
      )}
    >
      <div className="bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl p-6 shadow-2xl text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              Install TailorPal App
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Add TailorPal to your home screen for the best experience. It will appear like a native app!
            </p>

            <div className="bg-white/10 rounded-xl p-4 mb-3">
              <ol className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Tap the <Download className="w-4 h-4" /> share button
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Scroll down and tap "Add to Home Screen"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  Tap "Add" to install
                </li>
              </ol>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 bg-white text-purple-700 font-medium rounded-xl hover:bg-white/90 transition-colors"
            >
              Got it, thanks!
            </button>
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
