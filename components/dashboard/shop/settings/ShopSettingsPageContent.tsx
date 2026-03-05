'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  LocationAutocomplete,
  type LocationSuggestion,
} from '@/components/location/LocationAutocomplete'
import { LocationHierarchyFields } from '@/components/location/LocationHierarchyFields'
import { uploadShopMedia } from '@/lib/utils/shop-media'
import {
  Settings,
  Store,
  MapPin,
  Image as ImageIcon,
  FileText,
  Save,
  BookOpen,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ShopForm = {
  name: string
  email: string
  phone: string
  city: string
  state: string
  country: string
  address: string
  description: string
  logoUrl: string
  bannerUrl: string
  latitude: number | null
  longitude: number | null
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-[2rem] border border-brand-border/60 shadow-sm overflow-visible">
      {/* Section header */}
      <div className="flex items-start gap-4 px-5 sm:px-7 pt-6 sm:pt-7 pb-4 sm:pb-5 border-b border-brand-border/50">
        <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-brand-gold" />
        </div>
        <div>
          <h2 className="font-display text-base text-brand-ink">{title}</h2>
          {description && (
            <p className="text-xs text-brand-stone mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-5 sm:px-7 py-5 sm:py-6">{children}</div>
    </div>
  )
}

// ─── Image upload card ────────────────────────────────────────────────────────

function ImageUploadCard({
  label,
  preview,
  uploading,
  disabled,
  aspectRatio = 'square',
  onChange,
}: {
  label: string
  preview: string
  uploading: boolean
  disabled: boolean
  aspectRatio?: 'square' | 'wide'
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">
        {label}
      </Label>
      <label
        className={cn(
          'relative flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-border overflow-hidden cursor-pointer group transition-colors hover:border-brand-gold/50',
          aspectRatio === 'square' ? 'h-32 w-32' : 'h-32 w-full',
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon size={18} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-brand-stone group-hover:text-brand-gold transition-colors">
            <ImageIcon size={20} />
            <span className="text-[10px] font-semibold">Upload</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 size={18} className="animate-spin text-brand-gold" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onChange}
          disabled={disabled}
        />
      </label>
      <p className="text-[10px] text-brand-stone">
        {uploading ? 'Uploading…' : 'PNG / JPG / WebP · max 5 MB'}
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ShopSettingsPageContent() {
  const params = useParams()
  const router = useRouter()
  const shopId = params.shopId as string
  const [supabase] = useState(() => createClient())

  const [form, setForm] = useState<ShopForm>({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    address: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    latitude: null,
    longitude: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)

  useEffect(() => {
    void loadShop()
  }, [shopId])

  // ─── Logic (all unchanged) ───────────────────────────────────────────────

  const loadShop = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('shops')
        .select(
          'name, email, phone, city, state, country, address, description, logo_url, banner_url, latitude, longitude',
        )
        .eq('id', shopId)
        .single()

      if (error || !data) throw error ?? new Error('Shop not found')

      setForm({
        name: data.name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        country: data.country ?? '',
        address: data.address ?? '',
        description: data.description ?? '',
        logoUrl: data.logo_url ?? '',
        bannerUrl: data.banner_url ?? '',
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load shop settings')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'logoUrl' | 'bannerUrl',
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    const setUploading = target === 'logoUrl' ? setLogoUploading : setBannerUploading
    const uploadFolder = target === 'logoUrl' ? 'logos' : 'banners'
    try {
      setUploading(true)
      const publicUrl = await uploadShopMedia(supabase, file, uploadFolder)
      setForm((prev) => ({ ...prev, [target]: publicUrl }))
      toast.success(`${target === 'logoUrl' ? 'Logo' : 'Banner'} uploaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const saveShopSettings = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('shops')
        .update({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || null,
          city: form.city || null,
          state: form.state || null,
          country: form.country || null,
          address: form.address || null,
          description: form.description || null,
          logo_url: form.logoUrl || null,
          banner_url: form.bannerUrl || null,
          latitude: form.latitude,
          longitude: form.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shopId)

      if (error) throw error
      toast.success('Shop settings updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setForm((prev) => ({
      ...prev,
      address: suggestion.displayName,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    }))
  }

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  const isBusy = saving || logoUploading || bannerUploading

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 py-6 sm:py-8 space-y-5">

        {/* ── Page title ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-[0.2em] mb-1">
              Dashboard
            </p>
            <h1 className="font-display text-2xl lg:text-3xl text-brand-ink flex items-center gap-2">
              <Settings size={22} className="text-brand-gold" />
              Shop Settings
            </h1>
            <p className="text-sm text-brand-stone mt-1">
              Update your shop profile, branding, and location
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/shop/${shopId}`)}
            className="text-brand-stone hover:text-brand-ink flex items-center gap-1.5 mt-0 sm:mt-1 self-start"
          >
            <ChevronLeft size={15} />
            Back
          </Button>
        </div>

        {/* ── Section 1: Basic info ──────────────────────────────────────── */}
        <SettingsSection
          icon={Store}
          title="Basic Information"
          description="Your shop name, contact details, and public-facing info"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Shop Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Atelier V"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="hello@yourshop.com"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="h-11"
              />
            </div>
          </div>
        </SettingsSection>

        {/* ── Section 2: Location ────────────────────────────────────────── */}
        <SettingsSection
          icon={MapPin}
          title="Location"
          description="Help customers find your physical shop"
        >
          <div className="space-y-4 relative z-20">
            <LocationHierarchyFields
              country={form.country}
              state={form.state}
              city={form.city}
              onCountryChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  country: value,
                  state: '',
                  city: '',
                  address: '',
                  latitude: null,
                  longitude: null,
                }))
              }
              onStateChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  state: value,
                  city: '',
                  address: '',
                  latitude: null,
                  longitude: null,
                }))
              }
              onCityChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  city: value,
                  address: '',
                  latitude: null,
                  longitude: null,
                }))
              }
            />
            <div className="space-y-1.5">
              <Label>Street Address</Label>
              <LocationAutocomplete
                value={form.address}
                country={form.country}
                state={form.state}
                city={form.city}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    address: value,
                    latitude: null,
                    longitude: null,
                  }))
                }
                onSelect={handleLocationSelect}
                placeholder="Type address and select suggestion"
              />
            </div>
          </div>
        </SettingsSection>

        {/* ── Section 3: Branding ────────────────────────────────────────── */}
        <SettingsSection
          icon={ImageIcon}
          title="Visual Identity"
          description="Logo and banner image shown on your marketplace profile"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            <ImageUploadCard
              label="Shop Logo"
              preview={form.logoUrl}
              uploading={logoUploading}
              disabled={isBusy}
              aspectRatio="square"
              onChange={(e) => handleImageUpload(e, 'logoUrl')}
            />
            <div className="sm:col-span-2">
              <ImageUploadCard
                label="Banner Image"
                preview={form.bannerUrl}
                uploading={bannerUploading}
                disabled={isBusy}
                aspectRatio="wide"
                onChange={(e) => handleImageUpload(e, 'bannerUrl')}
              />
            </div>
          </div>
        </SettingsSection>

        {/* ── Section 4: Description ─────────────────────────────────────── */}
        <SettingsSection
          icon={FileText}
          title="Shop Story"
          description="Tell customers what makes your shop unique"
        >
          <Textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe your aesthetic, specialties, and what customers can expect…"
            rows={5}
            className="resize-none"
          />
        </SettingsSection>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-8">
          <Button variant="outline" asChild className="rounded-xl">
            <Link href={`/dashboard/shop/${shopId}/catalog`} className="flex items-center gap-2">
              <BookOpen size={15} />
              Manage Catalog
            </Link>
          </Button>

          <Button
            onClick={saveShopSettings}
            disabled={isBusy}
            className="bg-brand-ink hover:bg-brand-charcoal text-white px-8 rounded-xl h-11 shadow-brand flex items-center gap-2"
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : (
              <><Save size={15} /> Save Changes</>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
