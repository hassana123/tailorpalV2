export interface VoiceAssistantProps {
  shopId: string
}

export interface VoiceStandardMeasurementOption {
  key: string
  label: string
  category: string
}

export interface VoiceMeasurementPickerPrompt {
  type: 'measurement_standard_picker'
  measurements: VoiceStandardMeasurementOption[]
}

export type VoicePrompt = VoiceMeasurementPickerPrompt

export interface VoiceProcessResponse {
  reply?: string
  action?: string
  prompt?: VoicePrompt
  error?: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp: Date
}

export type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string; confidence: number }
  }>
}

export type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onspeechend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export type SpeechRecognitionCtor = new () => SpeechRecognitionInstance
