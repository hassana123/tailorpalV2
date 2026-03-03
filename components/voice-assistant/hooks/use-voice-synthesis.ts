'use client'

import { useCallback, useState } from 'react'

export function useVoiceSynthesis(soundEnabled: boolean, onSpeechEnd?: () => void) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string) => {
    if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return false

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1
    utterance.volume = 1

    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find((voice) => {
      if (!voice.lang.startsWith('en')) return false
      return (
        voice.name.includes('Google') ||
        voice.name.includes('Natural') ||
        voice.name.includes('Samantha')
      )
    })
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      onSpeechEnd?.()
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      onSpeechEnd?.()
    }
    window.speechSynthesis.speak(utterance)
    return true
  }, [onSpeechEnd, soundEnabled])

  return {
    isSpeaking,
    speak,
  }
}
