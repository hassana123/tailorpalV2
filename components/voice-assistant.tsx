'use client'

import { VoiceAssistantShell } from '@/components/voice-assistant/voice-assistant'
import { VoiceAssistantProps } from '@/components/voice-assistant/types'

export function VoiceAssistant(props: VoiceAssistantProps) {
  return <VoiceAssistantShell {...props} />
}
