'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  LocationAutocomplete,
  type LocationSuggestion,
} from '@/components/location/LocationAutocomplete'
import { LocationHierarchyFields } from '@/components/location/LocationHierarchyFields'
import { uploadShopMedia } from '@/lib/utils/shop-media'

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

export default function ShopSettingsPage() {
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

      if (error || !data) {
        throw error ?? new Error('Shop not found')
      }

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
      address: suggestion.address || suggestion.displayName,
      city: suggestion.city || prev.city,
      state: suggestion.state || prev.state,
      country: suggestion.country || prev.country,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop Settings</CardTitle>
          <CardDescription>
            Update your shop profile, branding, and location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Shop Name"
              value={form.name}
              onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
            <Field
              label="Email"
              value={form.email}
              onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            />

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

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Address</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Shop Logo</label>
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Shop logo preview"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                  No logo
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event, 'logoUrl')}
                disabled={logoUploading || saving}
              />
              <p className="text-xs text-muted-foreground">
                {logoUploading ? 'Uploading...' : 'PNG/JPG/WebP up to 5MB'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Banner Image</label>
              {form.bannerUrl ? (
                <img
                  src={form.bannerUrl}
                  alt="Shop banner preview"
                  className="h-20 w-full rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-full rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                  No banner
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event, 'bannerUrl')}
                disabled={bannerUploading || saving}
              />
              <p className="text-xs text-muted-foreground">
                {bannerUploading ? 'Uploading...' : 'PNG/JPG/WebP up to 5MB'}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              className="mt-1"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveShopSettings} disabled={saving || logoUploading || bannerUploading}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/dashboard/shop/${shopId}/catalog`}>Manage Catalog</Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/shop/${shopId}`)}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input className="mt-1" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
