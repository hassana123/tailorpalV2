'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantHeader } from '@/components/voice-assistant/assistant-header'
import { HELP_TEXT, MAX_MESSAGES } from '@/components/voice-assistant/constants'
import { useVoiceRecognition } from '@/components/voice-assistant/hooks/use-voice-recognition'
import { useVoiceSynthesis } from '@/components/voice-assistant/hooks/use-voice-synthesis'
import { InputPanel } from '@/components/voice-assistant/input-panel'
import { MessageList } from '@/components/voice-assistant/message-list'
import { ChatMessage, VoiceAssistantProps } from '@/components/voice-assistant/types'

export function VoiceAssistantShell({ shopId }: VoiceAssistantProps) {
  const [autoSend, setAutoSend] = useState(true)
  const [continuousMode, setContinuousMode] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showHelp, setShowHelp] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const isSendingRef = useRef(false)

  const {
    isListening,
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
    continuousMode,
    isSending,
    onAutoSend: (text) => sendCommand(text),
  })

  const { isSpeaking, speak } = useVoiceSynthesis(soundEnabled, resumeListening)

  useEffect(() => {
    isSendingRef.current = isSending
  }, [isSending])

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, interimTranscript])

  const sendCommand = useCallback(async (rawCommand: string) => {
    const text = rawCommand.trim()
    if (!text || isSendingRef.current) return

    setIsSending(true)
    isSendingRef.current = true
    pendingTranscriptRef.current = ''
    setTranscript('')
    setMessages((prev) => [...prev.slice(-MAX_MESSAGES), { id: crypto.randomUUID(), role: 'user', text, timestamp: new Date() }])

    if (isListening) pauseListening()

    try {
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, shopId }),
      })
      const payload = await response.json()
      const reply = typeof payload?.reply === 'string' ? payload.reply : payload?.error ?? 'I could not process that command.'
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: reply, timestamp: new Date() }])
      speak(reply)
    } catch {
      const reply = 'Request failed. Please check your connection and try again.'
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: reply, timestamp: new Date() }])
      speak(reply)
    } finally {
      setIsSending(false)
      isSendingRef.current = false
      if (continuousMode) resumeListening()
    }
  }, [continuousMode, isListening, pauseListening, pendingTranscriptRef, resumeListening, setTranscript, shopId, speak])

  const clearHistory = () => {
    clearSilenceTimer()
    setMessages([])
    setTranscript('')
    pendingTranscriptRef.current = ''
  }

  const displayTranscript = interimTranscript
    ? `${transcript}${transcript ? ' ' : ''}${interimTranscript}`
    : transcript

  const statusLabel = isSpeaking
    ? 'Speaking...'
    : isListening
    ? 'Listening...'
    : isSending
    ? 'Processing...'
    : 'Ready'

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] border border-brand-border/60 shadow-sm overflow-hidden">
      <AssistantHeader
        autoSend={autoSend}
        continuousMode={continuousMode}
        isListening={isListening}
        isSending={isSending}
        soundEnabled={soundEnabled}
        statusLabel={statusLabel}
        onToggleAutoSend={() => setAutoSend((value) => !value)}
        onToggleContinuousMode={() => setContinuousMode((value) => !value)}
        onToggleSound={() => setSoundEnabled((value) => !value)}
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
        continuousMode={continuousMode}
        isListening={isListening}
        isSending={isSending}
        isSpeaking={isSpeaking}
        speechSupported={speechSupported}
        transcript={transcript}
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
    </div>
  )
}
