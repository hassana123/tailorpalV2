'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface CopyButtonProps {
  value: string
  label: string
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-charcoal transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  )
}
