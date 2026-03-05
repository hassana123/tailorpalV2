'use client'

import { ReactNode } from 'react'
import { FloatingVoiceAssistant } from '../voice-assistant/floating-voice-assistant'

interface FloatingAssistantProviderProps {
  children: ReactNode
  shopId: string
  addressingName?: string
  enabled?: boolean // Control whether the floating assistant is shown
}

export function FloatingAssistantProvider({
  children,
  shopId,
  addressingName,
  enabled = true,
}: FloatingAssistantProviderProps) {
  return (
    <>
      {children}
      {enabled && shopId && (
        <FloatingVoiceAssistant shopId={shopId} addressingName={addressingName} />
      )}
    </>
  )
}
