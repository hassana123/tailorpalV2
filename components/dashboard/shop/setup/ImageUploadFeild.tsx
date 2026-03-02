// components/shop-setup/ImageUploadField.tsx
'use client'

import { useRef } from 'react'
import { Upload, ImageIcon, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ImageUploadFieldProps {
  label: string
  value?: string
  onUpload: (file: File) => void
  isUploading: boolean
  aspectRatio?: "square" | "video"
  description?: string
}

export function ImageUploadField({ label, value, onUpload, isUploading, aspectRatio = "square", description }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-brand-charcoal">{label}</Label>
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-brand-border bg-brand-cream/50 transition-all hover:border-brand-gold hover:bg-brand-cream",
          aspectRatio === "square" ? "h-32 w-32" : "h-40 w-full",
          isUploading && "opacity-70 cursor-not-allowed"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="h-full w-full object-cover animate-fade-in" />
            <div className="absolute inset-0 bg-brand-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white h-6 w-6" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-brand-gold" />
            ) : (
              <>
                <div className="p-2 rounded-full bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors">
                  <ImageIcon className="h-5 w-5 text-brand-gold" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-stone">Upload</span>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
      </div>
      {description && <p className="text-[11px] text-brand-stone italic">{description}</p>}
    </div>
  )
}