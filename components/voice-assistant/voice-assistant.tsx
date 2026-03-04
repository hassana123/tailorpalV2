'use client'

import { VoiceAssistantShell } from "./voice-assistant-shell"
import { VoiceAssistantProps } from '@/components/voice-assistant/types'

export function VoiceAssistant(props: VoiceAssistantProps) {
  return <VoiceAssistantShell {...props} />
}