'use client'

import { Loader2, Mic, MicOff, Send } from 'lucide-react'

interface InputPanelProps {
  isListening: boolean
  isStarting: boolean
  isSending: boolean
  isSpeaking: boolean
  speechSupported: boolean
  transcript: string
  autoSend: boolean
  voiceError: string
  onTranscriptChange: (value: string) => void
  onManualSend: () => void
  onStartListening: () => void
  onStopListening: () => void
}

export function InputPanel({
  isListening,
  isStarting,
  isSending,
  isSpeaking,
  speechSupported,
  transcript,
  autoSend,
  voiceError,
  onTranscriptChange,
  onManualSend,
  onStartListening,
  onStopListening,
}: InputPanelProps) {
  const isProcessing = isSending || isSpeaking

  return (
    <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-brand-border/50 bg-white space-y-3">
      {!speechSupported && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
          <span className="text-lg">:warning:</span>
          <div>
            <p className="font-semibold">Speech input not supported</p>
            <p className="text-amber-600">Your browser doesn&apos;t support voice recognition. Please use Chrome, Edge, or Safari.</p>
          </div>
        </div>
      )}

      {/* Text input area */}
      <div className="flex gap-2">
        <input
          className="flex-1 h-11 rounded-xl border border-brand-border bg-brand-cream/50 px-4 text-sm text-brand-ink placeholder:text-brand-stone focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold transition-all"
          placeholder={isListening ? "Listening... speak now" : "Type a command or click the mic..."}
          value={transcript}
          onChange={(event) => onTranscriptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onManualSend()
            }
          }}
          disabled={isListening}
        />
        <button
          onClick={onManualSend}
          disabled={!transcript.trim() || isSending}
          className="w-11 h-11 rounded-xl bg-brand-ink text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand-charcoal transition-colors flex-shrink-0"
        >
          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {/* Main voice button */}
      {!isListening ? (
        <button
          onClick={onStartListening}
          disabled={!speechSupported || isProcessing}
          className="w-full h-12 rounded-xl bg-brand-gold text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {isStarting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Initializing microphone...</span>
            </>
          ) : isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>{isSpeaking ? 'Speaking...' : 'Processing...'}</span>
            </>
          ) : (
            <>
              <Mic size={18} />
              <span>Start Listening</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={onStopListening}
          className="w-full h-12 rounded-xl bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-600 active:scale-[0.98] transition-all shadow-sm animate-pulse"
        >
          <MicOff size={18} />
          <span className="flex items-center gap-1.5">
            {isStarting ? 'Starting...' : 'Listening'}
            <span className="w-2 h-2 bg-white rounded-full animate-ping" />
          </span>
        </button>
      )}

      {/* Error display */}
      {voiceError && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
          <span className="text-lg">:microphone:</span>
          <div>
            <p className="font-semibold">Microphone Error</p>
            <p className="text-red-600">{voiceError}</p>
          </div>
        </div>
      )}

      {/* Status hint */}
      <p className="text-[10px] text-brand-stone text-center leading-relaxed">
        {isListening ? (
          <>
            <span className="text-brand-gold font-semibold">● Listening</span>
            {autoSend && (
              <> — Auto-sends after 2.5s of silence. Click button to stop manually.</>
            )}
          </>
        ) : (
          <>
            Click <strong className="text-brand-charcoal">Start Listening</strong> and speak naturally.
            {autoSend && <> Pauses for 2.5 seconds will auto-send.</>}
            {' '}Say <strong className="text-brand-charcoal">&quot;help&quot;</strong> for commands.
          </>
        )}
      </p>
    </div>
  )
}