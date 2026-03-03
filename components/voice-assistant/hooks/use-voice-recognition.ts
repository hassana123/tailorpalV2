'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SILENCE_TIMEOUT_MS } from '@/components/voice-assistant/constants'
import { SpeechRecognitionCtor, SpeechRecognitionInstance } from '@/components/voice-assistant/types'

interface UseVoiceRecognitionOptions {
  autoSend: boolean
  isSending: boolean
  onAutoSend: (text: string) => void
}

function tryStartRecognition(recognition: SpeechRecognitionInstance) {
  try {
    recognition.start()
  } catch {
    return false
  }
  return true
}

export function useVoiceRecognition({
  autoSend,
  isSending,
  onAutoSend,
}: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const pendingTranscriptRef = useRef('')
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isListeningRef = useRef(false)
  const autoSendRef = useRef(autoSend)
  const isSendingRef = useRef(isSending)

  useEffect(() => { autoSendRef.current = autoSend }, [autoSend])
  useEffect(() => { isSendingRef.current = isSending }, [isSending])

  const clearSilenceTimer = useCallback(() => {
    if (!silenceTimerRef.current) return
    clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
  }, [])

  const clearStartRetryTimer = useCallback(() => {
    if (!startRetryTimerRef.current) return
    clearTimeout(startRetryTimerRef.current)
    startRetryTimerRef.current = null
  }, [])

  const queueAutoSend = useCallback(() => {
    clearSilenceTimer()
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null
      const text = pendingTranscriptRef.current.trim()
      if (!text || isSendingRef.current) return
      setInterimTranscript('')
      setIsListening(false)
      isListeningRef.current = false
      recognitionRef.current?.stop()
      onAutoSend(text)
    }, SILENCE_TIMEOUT_MS)
  }, [clearSilenceTimer, onAutoSend])

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
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      setInterimTranscript('')
    }

    recognition.onresult = (event) => {
      if (isSendingRef.current) return

      let interim = ''
      let finalText = ''
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const chunk = event.results[index][0].transcript
        if (event.results[index].isFinal) finalText += `${chunk} `
        else interim += chunk
      }

      if (finalText) {
        pendingTranscriptRef.current = `${pendingTranscriptRef.current}${finalText}`.trim()
        setTranscript(pendingTranscriptRef.current)
        setInterimTranscript('')
        if (autoSendRef.current) queueAutoSend()
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onspeechend = () => {
      if (isSendingRef.current) return
      if (autoSendRef.current && pendingTranscriptRef.current.trim()) queueAutoSend()
    }

    recognition.onend = () => {
      isListeningRef.current = false
      setIsListening(false)
      setInterimTranscript('')
      clearStartRetryTimer()
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      isListeningRef.current = false
      setIsListening(false)
      setInterimTranscript('')
      console.error('Speech recognition error:', event.error)
    }

    recognitionRef.current = recognition
    return () => {
      clearSilenceTimer()
      clearStartRetryTimer()
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [clearSilenceTimer, clearStartRetryTimer, queueAutoSend])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isSendingRef.current) return
    if (isListeningRef.current) return
    clearSilenceTimer()
    clearStartRetryTimer()
    pendingTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    const started = tryStartRecognition(recognitionRef.current)
    if (!started) {
      startRetryTimerRef.current = setTimeout(() => {
        startRetryTimerRef.current = null
        if (!recognitionRef.current || isSendingRef.current || isListeningRef.current) return
        tryStartRecognition(recognitionRef.current)
      }, 220)
    }
  }, [clearSilenceTimer, clearStartRetryTimer])

  const stopListening = useCallback(() => {
    clearSilenceTimer()
    clearStartRetryTimer()
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimTranscript('')
  }, [clearSilenceTimer, clearStartRetryTimer])

  const pauseListening = useCallback(() => {
    clearSilenceTimer()
    clearStartRetryTimer()
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setInterimTranscript('')
  }, [clearSilenceTimer, clearStartRetryTimer])

  const resumeListening = useCallback(() => {
    if (!recognitionRef.current) return
    if (isSendingRef.current || isListeningRef.current) return
    clearStartRetryTimer()
    pendingTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    const started = tryStartRecognition(recognitionRef.current)
    if (!started) {
      startRetryTimerRef.current = setTimeout(() => {
        startRetryTimerRef.current = null
        if (!recognitionRef.current || isSendingRef.current || isListeningRef.current) return
        tryStartRecognition(recognitionRef.current)
      }, 220)
    }
  }, [clearStartRetryTimer])

  return {
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
  }
}
