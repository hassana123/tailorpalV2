'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantHeader } from '@/components/voice-assistant/assistant-header'
import { HELP_TEXT, MAX_MESSAGES } from '@/components/voice-assistant/constants'
import { useVoiceRecognition } from '@/components/voice-assistant/hooks/use-voice-recognition'
import { useVoiceSynthesis } from '@/components/voice-assistant/hooks/use-voice-synthesis'
import { InputPanel } from '@/components/voice-assistant/input-panel'
import { MessageList } from '@/components/voice-assistant/message-list'
import { MeasurementSelectionModal } from '@/components/voice-assistant/measurement-selection-modal'
import {
  ChatMessage,
  VoiceAssistantProps,
  VoiceMeasurementPickerPrompt,
  VoiceProcessResponse,
} from '@/components/voice-assistant/types'

const PICKER_SELECTION_COMMAND = '@select_standard_measurements'

export function VoiceAssistantShell({ shopId }: VoiceAssistantProps) {
  const [autoSend, setAutoSend] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showHelp, setShowHelp] = useState(false)
  const [measurementPrompt, setMeasurementPrompt] = useState<VoiceMeasurementPickerPrompt | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const isSendingRef = useRef(false)
  const resumeDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    isListening,
    isStarting,
    voiceError,
    speechSupported,
    transcript,
    interimTranscript,
    setTranscript,
    pendingTranscriptRef,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    clearSilenceTimer,
  } = useVoiceRecognition({
    autoSend,
    isSending,
    onAutoSend: useCallback((text: string) => {
      sendCommand(text)
    }, []),
  })

  // Wrap sendCommand in useCallback to stabilize reference
  const sendCommand = useCallback(async (rawCommand: string, options?: { displayText?: string; hideUserMessage?: boolean }) => {
    const text = rawCommand.trim()
    if (!text || isSendingRef.current) return

    clearSilenceTimer()
    pauseListening()
    let startedSpeech = false

    setIsSending(true)
    isSendingRef.current = true
    pendingTranscriptRef.current = ''
    setTranscript('')

    if (!options?.hideUserMessage) {
      setMessages((prev) => [
        ...prev.slice(-MAX_MESSAGES),
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: options?.displayText?.trim() || text,
          timestamp: new Date(),
        },
      ])
    }

    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, shopId }),
      })

      const payload = (await response.json()) as VoiceProcessResponse
      const reply = typeof payload?.reply === 'string'
        ? payload.reply
        : payload?.error ?? 'I could not process that command.'
      const prompt = payload?.prompt

      if (prompt?.type === 'measurement_standard_picker') {
        setMeasurementPrompt(prompt)
      } else {
        setMeasurementPrompt(null)
      }

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: reply, timestamp: new Date() }
      ])

      // Speak the response
      startedSpeech = speak(reply)
    } catch (error) {
      console.error('[Voice] Send error:', error)
      setMeasurementPrompt(null)
      const reply = 'Request failed. Please check your connection and try again.'
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: reply, timestamp: new Date() }
      ])
      startedSpeech = speak(reply)
    } finally {
      // If speech didn't start (or synthesis not available), resume immediately
      if (!startedSpeech) {
        finishResponseCycle(true)
      }
    }
  }, [clearSilenceTimer, pauseListening, pendingTranscriptRef, setTranscript, shopId])

  // Handle end of response cycle (after speech finishes or error)
  const finishResponseCycle = useCallback((shouldResume: boolean) => {
    setIsSending(false)
    isSendingRef.current = false

    if (shouldResume) {
      // Clear any existing resume timer
      if (resumeDelayRef.current) {
        clearTimeout(resumeDelayRef.current)
      }

      // Resume listening after a short delay
      resumeDelayRef.current = setTimeout(() => {
        resumeDelayRef.current = null
        resumeListening()
      }, 400)
    }
  }, [resumeListening])

  // Voice synthesis hook
  const { isSpeaking, speak } = useVoiceSynthesis(true, () => {
    finishResponseCycle(true)
  })

  // Keep isSendingRef in sync
  useEffect(() => {
    isSendingRef.current = isSending
  }, [isSending])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resumeDelayRef.current) {
        clearTimeout(resumeDelayRef.current)
        resumeDelayRef.current = null
      }
    }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, interimTranscript])

  // Clear conversation history
  const clearHistory = useCallback(() => {
    clearSilenceTimer()
    setMessages([])
    setMeasurementPrompt(null)
    setTranscript('')
    pendingTranscriptRef.current = ''
  }, [clearSilenceTimer, setTranscript, pendingTranscriptRef])

  const handleMeasurementSelectionSubmit = useCallback((selectedKeys: string[]) => {
    const labels = measurementPrompt?.measurements
      .filter((measurement) => selectedKeys.includes(measurement.key))
      .map((measurement) => measurement.label) ?? []
    setMeasurementPrompt(null)

    const internalCommand = `${PICKER_SELECTION_COMMAND} ${selectedKeys.join(', ')}`
    const displayText = labels.length
      ? `Selected measurements: ${labels.join(', ')}`
      : 'Selected measurements submitted'

    void sendCommand(internalCommand, { displayText })
  }, [measurementPrompt, sendCommand])

  // Compute display transcript (final + interim)
  const displayTranscript = interimTranscript
    ? `${transcript}${transcript ? ' ' : ''}${interimTranscript}`
    : transcript

  // Compute status label
  const statusLabel = isSpeaking
    ? 'Speaking...'
    : isStarting
    ? 'Starting microphone...'
    : isListening
    ? 'Listening — speak now'
    : isSending
    ? 'Processing...'
    : 'Ready — press Start Listening'

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] border border-brand-border/60 shadow-sm overflow-hidden">
      <AssistantHeader
        autoSend={autoSend}
        isListening={isListening}
        isSending={isSending}
        statusLabel={statusLabel}
        onToggleAutoSend={() => setAutoSend((value) => !value)}
        onClearHistory={clearHistory}
      />

      <MessageList
        displayTranscript={displayTranscript}
        helpText={HELP_TEXT}
        interimTranscript={interimTranscript}
        isListening={isListening}
        isSending={isSending}
        messages={messages}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        showHelp={showHelp}
        onToggleHelp={() => setShowHelp((value) => !value)}
      />

      <InputPanel
        autoSend={autoSend}
        isListening={isListening}
        isStarting={isStarting}
        isSending={isSending}
        isSpeaking={isSpeaking}
        speechSupported={speechSupported}
        transcript={transcript}
        voiceError={voiceError}
        onTranscriptChange={(value) => {
          setTranscript(value)
          pendingTranscriptRef.current = value
        }}
        onManualSend={() => {
          clearSilenceTimer()
          sendCommand(transcript)
        }}
        onStartListening={startListening}
        onStopListening={stopListening}
      />

      <MeasurementSelectionModal
        open={measurementPrompt?.type === 'measurement_standard_picker'}
        options={measurementPrompt?.measurements ?? []}
        onOpenChange={(open) => {
          if (!open) setMeasurementPrompt(null)
        }}
        onSubmit={handleMeasurementSelectionSubmit}
      />
    </div>
  )
}
