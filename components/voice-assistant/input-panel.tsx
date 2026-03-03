'use client'

import { Loader2, Mic, MicOff, Send } from 'lucide-react'

interface InputPanelProps {
  isListening: boolean
  isSending: boolean
  isSpeaking: boolean
  speechSupported: boolean
  transcript: string
  continuousMode: boolean
  autoSend: boolean
  onTranscriptChange: (value: string) => void
  onManualSend: () => void
  onStartListening: () => void
  onStopListening: () => void
}

export function InputPanel({
  isListening,
  isSending,
  isSpeaking,
  speechSupported,
  transcript,
  continuousMode,
  autoSend,
  onTranscriptChange,
  onManualSend,
  onStartListening,
  onStopListening,
}: InputPanelProps) {
  return (
    <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-brand-border/50 bg-white space-y-3">
      {!speechSupported && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
          Speech input is not supported in this browser. You can still type commands below.
        </p>
      )}

      <div className="flex gap-2">
        <input
          className="flex-1 h-11 rounded-xl border border-brand-border bg-brand-cream/50 px-4 text-sm text-brand-ink placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
          placeholder="Type a command or use the mic..."
          value={transcript}
          onChange={(event) => onTranscriptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onManualSend()
            }
          }}
        />
        <button
          onClick={onManualSend}
          disabled={!transcript.trim() || isSending}
          className="w-11 h-11 rounded-xl bg-brand-ink text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-charcoal transition-colors flex-shrink-0"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {!isListening ? (
        <button
          onClick={onStartListening}
          disabled={!speechSupported || isSending}
          className="w-full h-11 rounded-xl bg-brand-gold text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm"
        >
          <Mic size={16} />
          {isSending ? 'Waiting for response...' : continuousMode ? 'Start Voice Session' : 'Tap to Speak'}
        </button>
      ) : (
        <button
          onClick={onStopListening}
          className="w-full h-11 rounded-xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
        >
          <MicOff size={16} />
          <span className="flex items-center gap-1.5">
            {isSpeaking ? 'Speaking...' : autoSend ? 'Listening - sends after 2.5s pause' : 'Listening - tap to stop'}
          </span>
        </button>
      )}

      <p className="text-[10px] text-brand-stone text-center leading-relaxed">
        Auto sends after 2.5s pause. Loop restarts listening after each reply. Say{' '}
        <strong className="text-brand-charcoal">"help"</strong> for quick guidance.
      </p>
    </div>
  )
}
