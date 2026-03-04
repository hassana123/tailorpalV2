'use client'

import { ReactNode } from 'react'
import { FloatingVoiceAssistant } from '../voice-assistant/floating-voice-assistant'

interface FloatingAssistantProviderProps {
  children: ReactNode
  shopId: string
  enabled?: boolean // Control whether the floating assistant is shown
}

export function FloatingAssistantProvider({ children, shopId, enabled = true }: FloatingAssistantProviderProps) {
  return (
    <>
      {children}
      {enabled && shopId && <FloatingVoiceAssistant shopId={shopId} />}
    </>
  )
}