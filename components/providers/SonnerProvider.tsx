'use client'

import { Toaster } from 'sonner'

export function SonnerProvider() {
  return (
    <Toaster
      closeButton
      richColors
      position="top-right"
      toastOptions={{
        duration: 4000,
      }}
    />
  )
}
