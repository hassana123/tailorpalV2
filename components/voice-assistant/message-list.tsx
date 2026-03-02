'use client'

import { Bot, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMessage } from '@/components/voice-assistant/types'

interface MessageListProps {
  displayTranscript: string
  helpText: string
  interimTranscript: string
  isListening: boolean
  isSending: boolean
  messages: ChatMessage[]
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  showHelp: boolean
  onToggleHelp: () => void
}

export function MessageList({
  displayTranscript,
  helpText,
  interimTranscript,
  isListening,
  isSending,
  messages,
  messagesContainerRef,
  messagesEndRef,
  showHelp,
  onToggleHelp,
}: MessageListProps) {
  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
      {messages.length === 0 && !displayTranscript && (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
            <Sparkles size={26} className="text-brand-gold" />
          </div>
          <div>
            <p className="font-display text-lg text-brand-ink">Hi! I am your shop assistant.</p>
            <p className="text-sm text-brand-stone mt-1">
              Press the mic and start with simple words like "add customer".
            </p>
          </div>
          <button
            onClick={onToggleHelp}
            className="inline-flex items-center gap-1.5 text-xs text-brand-gold font-semibold hover:underline"
          >
            {showHelp ? 'Hide' : 'Show'} quick command starters
            {showHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showHelp && (
            <div className="text-xs text-left bg-brand-cream/60 rounded-2xl border border-brand-border p-4 whitespace-pre-wrap leading-relaxed text-brand-charcoal max-w-md">
              {helpText}
            </div>
          )}
        </div>
      )}

      {messages.map((message) => (
        <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
          {message.role === 'assistant' && (
            <div className="w-7 h-7 rounded-xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <Bot size={13} className="text-brand-gold" />
            </div>
          )}
          <div
            className={cn(
              'max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
              message.role === 'user'
                ? 'bg-brand-ink text-white rounded-br-sm'
                : message.role === 'system'
                ? 'bg-brand-cream text-brand-stone text-xs italic rounded-bl-sm'
                : 'bg-brand-cream border border-brand-border text-brand-charcoal rounded-bl-sm',
            )}
          >
            <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
            <p className={cn('text-[10px] mt-1 text-right', message.role === 'user' ? 'text-white/50' : 'text-brand-stone')}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}

      {displayTranscript && (
        <div className="flex justify-end">
          <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-brand-gold/10 border border-brand-gold/30 text-sm text-brand-charcoal">
            <span className="italic">{displayTranscript}</span>
            {isListening && interimTranscript && (
              <span className="inline-block ml-1 animate-pulse text-brand-gold">...</span>
            )}
          </div>
        </div>
      )}

      {isSending && (
        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0 mr-2">
            <Bot size={13} className="text-brand-gold" />
          </div>
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-brand-cream border border-brand-border flex items-center gap-2">
            <Loader2 size={13} className="animate-spin text-brand-gold" />
            <span className="text-xs text-brand-stone">Thinking...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
