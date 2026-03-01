'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VoiceAssistantProps {
  shopId: string
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  timestamp: Date
}

type SpeechRecognitionInstance = {
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

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string; confidence: number }
  }>
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

// ─── Constants ────────────────────────────────────────────────────────────────

const SILENCE_TIMEOUT_MS = 2200 // auto-send after 2.2 s of silence
const MAX_MESSAGES = 50

const HELP_TEXT = `🎙️ Voice Commands:
• "Add customer [name] phone [number]"
• "Record measurements for [name] chest [x] waist [y] hip [z]"
• "Create order for [name] for [description] due [YYYY-MM-DD]"
• "Show shop statistics"
• "List customers"
• "Find customer [name]"
• "Update order [number] status to [status]"
• "Help" — show this list`

// ─── Component ────────────────────────────────────────────────────────────────

export function VoiceAssistant({ shopId }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [speechSupported, setSpeechSupported] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [autoSend, setAutoSend] = useState(true)
  const [continuousMode, setContinuousMode] = useState(true)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const isListeningRef = useRef(false)
  const isSendingRef = useRef(false)
  const pendingTranscriptRef = useRef('')
  // Refs for settings so the recognition effect never needs to re-run
  const autoSendRef = useRef(autoSend)
  const continuousModeRef = useRef(continuousMode)

  // Keep refs in sync
  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isSendingRef.current = isSending
  }, [isSending])

  useEffect(() => {
    autoSendRef.current = autoSend
  }, [autoSend])

  useEffect(() => {
    continuousModeRef.current = continuousMode
  }, [continuousMode])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimTranscript])

  // Build recognition instance
  useEffect(() => {
    if (typeof window === 'undefined') return

    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition

    if (!Ctor) {
      setSpeechSupported(false)
      return
    }

    const recognition = new Ctor()
    recognition.continuous = true       // keep listening
    recognition.interimResults = true   // show live transcript
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setInterimTranscript('')
    }

    recognition.onresult = (event) => {
      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += chunk + ' '
        } else {
          interim += chunk
        }
      }

      if (finalText) {
        pendingTranscriptRef.current = (pendingTranscriptRef.current + finalText).trim()
        setTranscript(pendingTranscriptRef.current)
        setInterimTranscript('')

        // Reset silence timer on new final speech
        if (autoSendRef.current) {
          clearSilenceTimer()
          startSilenceTimer()
        }
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onspeechend = () => {
      // Speech paused — start silence countdown
      if (autoSendRef.current && pendingTranscriptRef.current.trim()) {
        startSilenceTimer()
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')

      // In continuous mode, restart unless we're sending or user stopped manually
      if (continuousModeRef.current && isListeningRef.current && !isSendingRef.current) {
        try {
          recognition.start()
        } catch {
          // ignore "already started" errors
        }
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      clearSilenceTimer()
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
    // autoSend and continuousMode are accessed via refs (autoSendRef / continuousModeRef)
    // so this effect only needs to run once on mount.
  }, [])

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const startSilenceTimer = () => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      const text = pendingTranscriptRef.current.trim()
      if (text && !isSendingRef.current) {
        sendCommand(text)
      }
    }, SILENCE_TIMEOUT_MS)
  }

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    pendingTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    isListeningRef.current = true
    try {
      recognitionRef.current.start()
    } catch {
      // already started
    }
  }, [])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 1
      utterance.volume = 1
      // Prefer a natural-sounding voice
      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')),
      )
      if (preferred) utterance.voice = preferred

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        // Resume listening after assistant speaks (in continuous mode)
        if (continuousModeRef.current && isListeningRef.current) {
          try {
            recognitionRef.current?.start()
          } catch {
            // already running
          }
        }
      }
      utterance.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(utterance)
    },
    [soundEnabled],
  )

  const sendCommand = useCallback(
    async (command: string) => {
      const text = command.trim()
      if (!text || isSendingRef.current) return

      // Handle local "help" command
      if (text.toLowerCase() === 'help') {
        const helpMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: HELP_TEXT,
          timestamp: new Date(),
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'user', text, timestamp: new Date() },
          helpMsg,
        ])
        speak("Here are the available voice commands.")
        pendingTranscriptRef.current = ''
        setTranscript('')
        return
      }

      setIsSending(true)
      isSendingRef.current = true
      pendingTranscriptRef.current = ''
      setTranscript('')

      setMessages((prev) => [
        ...prev.slice(-MAX_MESSAGES),
        { id: crypto.randomUUID(), role: 'user', text, timestamp: new Date() },
      ])

      // Pause recognition while sending so we don't pick up TTS
      if (isListeningRef.current) {
        recognitionRef.current?.stop()
      }

      try {
        const response = await fetch('/api/voice/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, shopId }),
        })

        const payload = await response.json()
        const reply =
          typeof payload?.reply === 'string'
            ? payload.reply
            : payload?.error ?? 'I could not process that command.'

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', text: reply, timestamp: new Date() },
        ])

        speak(reply)
      } catch {
        const errMsg = 'Request failed. Please check your connection and try again.'
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', text: errMsg, timestamp: new Date() },
        ])
        speak(errMsg)
      } finally {
        setIsSending(false)
        isSendingRef.current = false
      }
    },
    [shopId, speak],
  )

  const handleManualSend = () => {
    const text = transcript.trim()
    if (text) {
      clearSilenceTimer()
      sendCommand(text)
    }
  }

  const clearHistory = () => {
    setMessages([])
    setTranscript('')
    setInterimTranscript('')
    pendingTranscriptRef.current = ''
  }

  const displayTranscript = interimTranscript
    ? `${transcript}${transcript ? ' ' : ''}${interimTranscript}`
    : transcript

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse shadow-lg shadow-red-300'
                  : isSending
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-300'
              }`}
            />
            <div>
              <h3 className="text-base font-semibold">TailorPal Voice Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {isListening
                  ? isSpeaking
                    ? 'Speaking…'
                    : 'Listening…'
                  : isSending
                    ? 'Processing…'
                    : 'Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              title={soundEnabled ? 'Mute voice' : 'Unmute voice'}
              onClick={() => setSoundEnabled((p) => !p)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Clear conversation"
              onClick={clearHistory}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mode toggles */}
        <div className="flex items-center gap-4 px-5 py-2 border-b bg-muted/20 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="rounded"
            />
            Continuous listening
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSend}
              onChange={(e) => setAutoSend(e.target.checked)}
              className="rounded"
            />
            Auto-send after pause
          </label>
        </div>

        {/* Messages */}
        <div className="px-4 py-3 space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto">
          {messages.length === 0 && !displayTranscript && (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Hi! I&apos;m your shop assistant.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Press the mic button and tell me what to do.
                </p>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-xs"
                onClick={() => setShowHelp((p) => !p)}
              >
                {showHelp ? 'Hide' : 'Show'} available commands
                {showHelp ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
              {showHelp && (
                <pre className="text-xs text-left bg-muted rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                  {HELP_TEXT}
                </pre>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : message.role === 'system'
                      ? 'bg-muted text-muted-foreground text-xs italic'
                      : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Live transcript bubble */}
          {displayTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary/20 text-sm text-primary border border-primary/30">
                <span className="italic">{displayTranscript}</span>
                {isListening && (
                  <span className="inline-block ml-1 animate-pulse">▋</span>
                )}
              </div>
            </div>
          )}

          {isSending && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-muted text-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground text-xs">Thinking…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 border-t space-y-3">
          {!speechSupported && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-3 py-2">
              Speech input is not supported in this browser. You can still type commands below.
            </p>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Type a command or use the mic…"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value)
                pendingTranscriptRef.current = e.target.value
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleManualSend()
                }
              }}
            />
            <Button
              onClick={handleManualSend}
              disabled={!transcript.trim() || isSending}
              size="sm"
              className="rounded-xl px-3"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            {!isListening ? (
              <Button
                onClick={startListening}
                disabled={!speechSupported || isSending}
                className="flex-1 rounded-xl gap-2"
                variant="default"
              >
                <Mic className="h-4 w-4" />
                {continuousMode ? 'Start Voice Session' : 'Tap to Speak'}
              </Button>
            ) : (
              <Button
                onClick={stopListening}
                variant="destructive"
                className="flex-1 rounded-xl gap-2 animate-pulse"
              >
                <MicOff className="h-4 w-4" />
                {isSpeaking ? 'Speaking…' : autoSend ? 'Listening (auto-send on)' : 'Listening — tap to stop'}
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Say <strong>&quot;help&quot;</strong> to see all available commands
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
