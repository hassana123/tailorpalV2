'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface ModalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit?: () => void
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  hideFooter?: boolean
}

export function ModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  maxWidth = 'md',
  hideFooter = false,
}: ModalFormProps) {
  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-xl md:max-w-2xl',
    xl: 'sm:max-w-2xl md:max-w-3xl',
    '2xl': 'sm:max-w-3xl md:max-w-4xl',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton={true}
        className={cn(
          'w-[calc(100vw-1.5rem)] sm:w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl bg-white border border-brand-border shadow-2xl',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Fixed Header with Title, Description and Top-Right Cancel Button */}
        <DialogHeader className="px-5 sm:px-6 py-4 border-b border-brand-border bg-white flex-shrink-0 relative pr-14 text-left">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base sm:text-lg font-display text-brand-ink truncate">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-xs sm:text-sm text-brand-stone mt-0.5 line-clamp-2">
                {description}
              </DialogDescription>
            )}
          </div>

          {/* Small Cancel Icon Button at Top Right */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-20 h-8 w-8 rounded-full flex items-center justify-center text-brand-stone hover:text-brand-ink hover:bg-brand-cream border border-brand-border/60 hover:border-brand-ink/20 transition-all focus:outline-none focus:ring-2 focus:ring-brand-gold cursor-pointer"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Scrollable Content Body: ONLY vertical overflow, NEVER horizontal */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5 w-full min-w-0 max-w-full">
          {children}
        </div>

        {/* Fixed Footer */}
        {!hideFooter && onSubmit && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-brand-border bg-brand-cream/30 flex-shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 text-xs rounded-xl"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-9 text-xs bg-brand-ink hover:bg-brand-charcoal text-white rounded-xl shadow-xs"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}