'use client'

import { ReactNode } from 'react'
import { FloatingVoiceAssistant } from '../voice-assistant/floating-voice-assistant'

interface FloatingAssistantProviderProps {
  children: ReactNode
  shopId: string
}

export function FloatingAssistantProvider({ children, shopId }: FloatingAssistantProviderProps) {
  return (
    <>
      {children}
      <FloatingVoiceAssistant shopId={shopId} />
    </>
  )
}