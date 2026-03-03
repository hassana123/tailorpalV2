'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SILENCE_TIMEOUT_MS } from '@/components/voice-assistant/constants'
import { SpeechRecognitionCtor, SpeechRecognitionInstance } from '@/components/voice-assistant/types'

interface UseVoiceRecognitionOptions {
  autoSend: boolean
  isSending: boolean
  onAutoSend: (text: string) => void
}

export function useVoiceRecognition({
  autoSend,
  isSending,
  onAutoSend,
}: UseVoiceRecognitionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')

  // Refs for managing recognition state
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const pendingTranscriptRef = useRef('')
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isActiveRef = useRef(false) // Tracks if we WANT to be listening
  const autoSendRef = useRef(autoSend)
  const isSendingRef = useRef(isSending)

  // Keep refs in sync with state
  useEffect(() => { autoSendRef.current = autoSend }, [autoSend])
  useEffect(() => { isSendingRef.current = isSending }, [isSending])

  // Clear silence timer helper
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  // Map browser recognition errors to user-friendly messages
  const mapRecognitionError = useCallback((error: string) => {
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      return 'Microphone permission is blocked. Please allow microphone access in your browser settings and try again.'
    }
    if (error === 'audio-capture') {
      return 'No microphone detected. Please connect a microphone and try again.'
    }
    if (error === 'network') {
      return 'Speech service network error. Please check your connection and retry.'
    }
    if (error === 'aborted') {
      return '' // Aborted is usually intentional, don't show error
    }
    return 'Could not start voice input. Please try again.'
  }, [])

  // Initialize recognition instance
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null

    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition

    if (!Ctor) {
      setSpeechSupported(false)
      return null
    }

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    // Handle recognition start
    recognition.onstart = () => {
      console.log('[Voice] Recognition started')
      setIsListening(true)
      setIsStarting(false)
      setVoiceError('')
      setInterimTranscript('')
    }

    // Handle recognition results
    recognition.onresult = (event) => {
      if (isSendingRef.current) return

      let interim = ''
      let finalText = ''

      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalText += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (finalText) {
        // Append final text to pending transcript
        pendingTranscriptRef.current = (pendingTranscriptRef.current + finalText).trim()
        setTranscript(pendingTranscriptRef.current)
        setInterimTranscript('')

        // Queue auto-send if enabled
        if (autoSendRef.current) {
          queueAutoSend()
        }
      } else {
        // Update interim transcript
        setInterimTranscript(interim)
      }
    }

    // Handle speech end (user stopped speaking)
    recognition.onspeechend = () => {
      console.log('[Voice] Speech ended')
      if (isSendingRef.current) return

      // If we have pending text and auto-send is on, queue it
      if (autoSendRef.current && pendingTranscriptRef.current.trim()) {
        queueAutoSend()
      }
    }

    // Handle recognition end (stopped for any reason)
    recognition.onend = () => {
      console.log('[Voice] Recognition ended')
      setIsListening(false)
      setIsStarting(false)
      setInterimTranscript('')

      // If we still want to be active and not sending, restart
      if (isActiveRef.current && !isSendingRef.current) {
        console.log('[Voice] Auto-restarting recognition...')
        // Small delay to let browser clean up
        setTimeout(() => {
          if (isActiveRef.current && !isSendingRef.current) {
            recognition.start()
          }
        }, 100)
      }
    }

    // Handle recognition errors
    recognition.onerror = (event) => {
      console.error('[Voice] Recognition error:', event.error)

      // Don't treat no-speech or aborted as errors
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return
      }

      setIsListening(false)
      setIsStarting(false)
      setInterimTranscript('')

      const errorMsg = mapRecognitionError(event.error)
      if (errorMsg) {
        setVoiceError(errorMsg)
      }

      // If we still want to be active, try to restart (unless permission denied)
      if (isActiveRef.current && !isSendingRef.current && event.error !== 'not-allowed') {
        setTimeout(() => {
          if (isActiveRef.current && !isSendingRef.current) {
            try {
              recognition.start()
            } catch (e) {
              console.error('[Voice] Failed to restart:', e)
            }
          }
        }, 300)
      }
    }

    return recognition
  }, [mapRecognitionError])

  // Queue auto-send after silence timeout
  const queueAutoSend = useCallback(() => {
    clearSilenceTimer()

    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null
      const text = pendingTranscriptRef.current.trim()

      if (!text || isSendingRef.current) return

      // Stop listening and send
      setInterimTranscript('')
      isActiveRef.current = false
      recognitionRef.current?.stop()
      setIsListening(false)
      setIsStarting(false)

      onAutoSend(text)
    }, SILENCE_TIMEOUT_MS)
  }, [clearSilenceTimer, onAutoSend])

  // Initialize recognition on mount
  useEffect(() => {
    const recognition = initRecognition()
    if (recognition) {
      recognitionRef.current = recognition
    }

    return () => {
      clearSilenceTimer()
      isActiveRef.current = false
      try {
        recognitionRef.current?.abort()
      } catch (e) {
        // Ignore abort errors
      }
      recognitionRef.current = null
    }
  }, [initRecognition, clearSilenceTimer])

  // Start listening - this is what gets called when user clicks the button
  const startListening = useCallback(() => {
    console.log('[Voice] Start listening requested')

    if (!recognitionRef.current) {
      // Try to re-initialize if recognition is null
      const newRecognition = initRecognition()
      if (newRecognition) {
        recognitionRef.current = newRecognition
      } else {
        setVoiceError('Speech recognition is not available')
        return
      }
    }

    // Don't start if already sending
    if (isSendingRef.current) {
      console.log('[Voice] Cannot start - currently sending')
      return
    }

    // Clear any existing timers
    clearSilenceTimer()

    // Reset state
    setVoiceError('')
    setIsStarting(true)
    pendingTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')

    // Mark as active (we want to be listening)
    isActiveRef.current = true

    // Start recognition with retry logic
    const tryStart = (retries: number) => {
      if (!recognitionRef.current) return

      try {
        recognitionRef.current.start()
        console.log('[Voice] Recognition started successfully')
      } catch (error) {
        console.error('[Voice] Failed to start:', error)

        // If already started, that's fine
        if (error instanceof Error && error.message.includes('already started')) {
          setIsStarting(false)
          setIsListening(true)
          return
        }

        // Retry if we have retries left
        if (retries > 0) {
          setTimeout(() => tryStart(retries - 1), 200)
        } else {
          setIsStarting(false)
          setVoiceError('Could not start microphone. Please try again.')
          isActiveRef.current = false
        }
      }
    }

    // Try to start with 3 retries
    tryStart(3)
  }, [initRecognition, clearSilenceTimer])

  // Stop listening - user manually stopped or auto-send triggered
  const stopListening = useCallback(() => {
    console.log('[Voice] Stop listening requested')

    isActiveRef.current = false
    clearSilenceTimer()

    try {
      recognitionRef.current?.stop()
    } catch (e) {
      // Ignore stop errors
    }

    setIsListening(false)
    setIsStarting(false)
    setInterimTranscript('')
  }, [clearSilenceTimer])

  // Pause listening (temporarily, for when sending)
  const pauseListening = useCallback(() => {
    console.log('[Voice] Pause listening')

    clearSilenceTimer()

    try {
      recognitionRef.current?.stop()
    } catch (e) {
      // Ignore
    }

    setInterimTranscript('')
    // Note: isActiveRef stays true, we want to resume after
  }, [clearSilenceTimer])

  // Resume listening after pause
  const resumeListening = useCallback(() => {
    console.log('[Voice] Resume listening')

    if (!recognitionRef.current || isSendingRef.current) return

    // Mark as active again
    isActiveRef.current = true

    // Reset transcript for new session
    pendingTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    setVoiceError('')

    // Try to start
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('[Voice] Failed to resume:', e)
      // If failed, try full restart
      setTimeout(() => startListening(), 100)
    }
  }, [startListening])

  return {
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
  }
}