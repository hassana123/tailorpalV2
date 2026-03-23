'use client'

import { useState, useEffect } from 'react'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { usePWAInstall } from '@/components/pwa/PWAInstallPrompt'
import { Download } from 'lucide-react'

export function PWAWrapper() {
  const { isInstallable, install } = usePWAInstall()

  return (
    <>
      <PWAInstallPrompt />
      
      {/* Show install button for Android devices that support PWA install */}
      {isInstallable && (
        <InstallButton onInstall={install} />
      )}
    </>
  )
}

function InstallButton({ onInstall }: { onInstall: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Delay showing the button until user has been on the page for a bit
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <button
      onClick={onInstall}
      className="fixed bottom-20 right-4 z-40 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors animate-in slide-in-from-bottom-4"
      aria-label="Install TailorPal app"
    >
      <Download className="w-6 h-6" />
    </button>
  )
}
