'use client'

import { Bot, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssistantHeaderProps {
  autoSend: boolean
  continuousMode: boolean
  isListening: boolean
  isSending: boolean
  statusLabel: string
  onToggleAutoSend: () => void
  onToggleContinuousMode: () => void
  onClearHistory: () => void
}

export function AssistantHeader({
  autoSend,
  continuousMode,
  isListening,
  isSending,
  statusLabel,
  onToggleAutoSend,
  onToggleContinuousMode,
  onClearHistory,
}: AssistantHeaderProps) {
  return (
    <div className="flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border/50 bg-brand-cream/40 flex-shrink-0">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="relative flex items-center justify-center">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              isListening ? 'bg-red-100' : isSending ? 'bg-amber-100' : 'bg-brand-gold/10',
            )}
          >
            <Bot
              size={18}
              className={cn(
                'transition-colors',
                isListening ? 'text-red-500' : isSending ? 'text-amber-500' : 'text-brand-gold',
              )}
            />
          </div>
          {(isListening || isSending) && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-red-500 animate-pulse" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-base text-brand-ink">TailorPal Assistant</h3>
          <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{statusLabel}</p>
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
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleAutoSend}
            title={autoSend ? 'Auto-send on' : 'Auto-send off'}
            className={cn(
              'text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors',
              autoSend
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-brand-cream text-brand-stone border-brand-border',
            )}
          >
            Auto
          </button>
          <button
            onClick={onToggleContinuousMode}
            title={continuousMode ? 'Continuous on' : 'Continuous off'}
            className={cn(
              'text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors',
              continuousMode
                ? 'bg-sky-100 text-sky-700 border-sky-200'
                : 'bg-brand-cream text-brand-stone border-brand-border',
            )}
          >
            Loop
          </button>
        </div>
        <p className="text-[10px] text-brand-stone">
          Auto sends after 5s pause. Loop restarts mic after each reply. Voice replies stay on.
        </p>
      </div>

    </div>
  )
}
