'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  LocationAutocomplete,
  type LocationSuggestion,
} from '@/components/location/LocationAutocomplete'
import { LocationHierarchyFields } from '@/components/location/LocationHierarchyFields'
import { uploadShopMedia } from '@/lib/utils/shop-media'

export default function ShopSetupPage() {
  const [supabase] = useState(() => createClient())
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const router = useRouter()

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      setFormData((prev) => ({ ...prev, [target]: publicUrl }))
      toast.success(`${target === 'logoUrl' ? 'Logo' : 'Banner'} uploaded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        logoUrl: formData.logoUrl.trim() || undefined,
        bannerUrl: formData.bannerUrl.trim() || undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
      }

      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || 'Failed to create shop')
      }

      const { shop } = (await response.json()) as { shop: { id: string } }
      toast.success('Shop created successfully')
      router.push(`/dashboard/shop/${shop.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      address: suggestion.address || suggestion.displayName,
      city: suggestion.city || prev.city,
      state: suggestion.state || prev.state,
      country: suggestion.country || prev.country,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 md:p-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Set up your shop</CardTitle>
            <CardDescription>
              Create your fashion shop profile to get started managing customers and orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">Shop Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="My Fashion Shop"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="shop@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <LocationHierarchyFields
                  country={formData.country}
                  state={formData.state}
                  city={formData.city}
                  onCountryChange={(value) =>
                    setFormData((prev) => ({
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
                    setFormData((prev) => ({
                      ...prev,
                      state: value,
                      city: '',
                      address: '',
                      latitude: null,
                      longitude: null,
                    }))
                  }
                  onCityChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: value,
                      address: '',
                      latitude: null,
                      longitude: null,
                    }))
                  }
                  required
                />

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <LocationAutocomplete
                    id="address"
                    value={formData.address}
                    country={formData.country}
                    state={formData.state}
                    city={formData.city}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: value,
                        latitude: null,
                        longitude: null,
                      }))
                    }
                    onSelect={handleLocationSelect}
                    placeholder="Type address and pick from suggestions"
                  />
                  <p className="text-xs text-muted-foreground">
                    Select from suggestions to auto-fill a clean address.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Shop Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell customers about your shop..."
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="logoUpload">Shop Logo</Label>
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Shop logo preview"
                      className="h-20 w-20 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                      No logo
                    </div>
                  )}
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageUpload(event, 'logoUrl')}
                    disabled={logoUploading || isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {logoUploading ? 'Uploading...' : 'PNG/JPG/WebP up to 5MB'}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bannerUpload">Banner Image</Label>
                  {formData.bannerUrl ? (
                    <img
                      src={formData.bannerUrl}
                      alt="Shop banner preview"
                      className="h-20 w-full rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-full rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                      No banner
                    </div>
                  )}
                  <Input
                    id="bannerUpload"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageUpload(event, 'bannerUrl')}
                    disabled={bannerUploading || isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bannerUploading ? 'Uploading...' : 'PNG/JPG/WebP up to 5MB'}
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={isLoading || logoUploading || bannerUploading} className="w-full">
                {isLoading ? 'Creating shop...' : 'Create Shop'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
