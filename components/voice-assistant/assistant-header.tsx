'use client'

import { Bot, Trash2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssistantHeaderProps {
  autoSend: boolean
  isListening: boolean
  isSending: boolean
  statusLabel: string
  onToggleAutoSend: () => void
  onClearHistory: () => void
}

export function AssistantHeader({
  autoSend,
  isListening,
  isSending,
  statusLabel,
  onToggleAutoSend,
  onClearHistory,
}: AssistantHeaderProps) {
  return (
    <div className="flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border/50 bg-brand-cream/40 flex-shrink-0">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
              isListening ? 'bg-red-100 scale-110' : isSending ? 'bg-amber-100' : 'bg-brand-gold/10',
            )}
          >
            {isListening ? (
              <Mic size={18} className="text-red-500 animate-pulse" />
            ) : (
              <Bot
                size={18}
                className={cn(
                  'transition-colors',
                  isSending ? 'text-amber-500' : 'text-brand-gold',
                )}
              />
            )}
          </div>
          {isListening && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-ping" />
          )}
          {isListening && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base text-brand-ink">TailorPal Assistant</h3>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-wider transition-colors",
            isListening ? 'text-red-500' : isSending ? 'text-amber-500' : 'text-brand-stone'
          )}>
            {statusLabel}
          </p>
        </div>

        <button
          onClick={onClearHistory}
          title="Clear conversation"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-stone hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleAutoSend}
          title={autoSend ? 'Auto-send is ON (2.5s pause)' : 'Auto-send is OFF (manual only)'}
          className={cn(
            'text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all',
            autoSend
              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
              : 'bg-brand-cream text-brand-stone border-brand-border',
          )}
        >
          Auto: {autoSend ? 'ON' : 'OFF'}
        </button>
        <p className="text-[10px] text-brand-stone">
          {autoSend
            ? 'Sends after 2.5s silence. Loop mode always on.'
            : 'Tap Send or Stop to submit. Loop mode always on.'}
        </p>
      </div>
    </div>
  )
}