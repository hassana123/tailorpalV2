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
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0',
          maxWidthClasses[maxWidth]
        )}
      >
        <DialogHeader className="px-6 py-4 border-b border-brand-border sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-display text-brand-ink">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-brand-stone mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">{children}</div>

        {!hideFooter && onSubmit && (
          <div className="px-6 py-4 border-t border-brand-border flex flex-col-reverse sm:flex-row gap-2 sm:justify-end sticky bottom-0 bg-white z-10">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-brand-ink hover:bg-brand-charcoal"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}