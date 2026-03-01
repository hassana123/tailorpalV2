'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { uploadShopMedia } from '@/lib/utils/shop-media'

type CatalogItem = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_active: boolean
}

type NewCatalogItem = {
  name: string
  description: string
  price: string
  imageUrl: string
}

export default function ShopCatalogPage() {
  const params = useParams()
  const shopId = params.shopId as string
  const [supabase] = useState(() => createClient())

  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [newCatalogItem, setNewCatalogItem] = useState<NewCatalogItem>({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [catalogSaving, setCatalogSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    void loadCatalog()
  }, [shopId])

  const loadCatalog = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shops/${shopId}/catalog`)
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Failed to load catalog')
      }

      const payload = (await response.json()) as { items: CatalogItem[] }
      setCatalogItems(payload.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load catalog')
    } finally {
      setLoading(false)
    }
  }

  const handleCatalogImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImageUploading(true)
      const publicUrl = await uploadShopMedia(supabase, file, 'catalog')
      setNewCatalogItem((prev) => ({ ...prev, imageUrl: publicUrl }))
      toast.success('Catalog image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setImageUploading(false)
      event.target.value = ''
    }
  }

  const addCatalogItem = async () => {
    const parsedPrice = Number.parseFloat(newCatalogItem.price)
    if (!newCatalogItem.name.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Item name and valid price are required')
      return
    }

    try {
      setCatalogSaving(true)
      const response = await fetch(`/api/shops/${shopId}/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatalogItem.name.trim(),
          description: newCatalogItem.description || undefined,
          price: parsedPrice,
          imageUrl: newCatalogItem.imageUrl || undefined,
          isActive: true,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Failed to add catalog item')
      }

      const payload = (await response.json()) as { item: CatalogItem }
      setCatalogItems((prev) => [payload.item, ...prev])
      setNewCatalogItem({ name: '', description: '', price: '', imageUrl: '' })
      toast.success('Catalog item added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add catalog item')
    } finally {
      setCatalogSaving(false)
    }
  }

  const toggleCatalogItemActive = async (item: CatalogItem) => {
    try {
      const response = await fetch(`/api/shops/${shopId}/catalog/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.is_active }),
      })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Failed to update item status')
      }

      setCatalogItems((prev) =>
        prev.map((catalogItem) =>
          catalogItem.id === item.id
            ? { ...catalogItem, is_active: !item.is_active }
            : catalogItem,
        ),
      )
      toast.success(`Item marked as ${item.is_active ? 'inactive' : 'active'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update item status')
    }
  }

  const deleteCatalogItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shops/${shopId}/catalog/${itemId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Failed to delete item')
      }
      setCatalogItems((prev) => prev.filter((item) => item.id !== itemId))
      toast.success('Catalog item deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shop Catalog</CardTitle>
          <CardDescription>
            Add items customers can browse and order from your marketplace profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Item Name"
              value={newCatalogItem.name}
              onChange={(value) =>
                setNewCatalogItem((prev) => ({ ...prev, name: value }))
              }
            />
            <Field
              label="Price"
              value={newCatalogItem.price}
              onChange={(value) =>
                setNewCatalogItem((prev) => ({ ...prev, price: value }))
              }
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Image</label>
              {newCatalogItem.imageUrl ? (
                <img
                  src={newCatalogItem.imageUrl}
                  alt="Catalog preview"
                  className="h-20 w-20 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleCatalogImageUpload}
                disabled={imageUploading || catalogSaving}
              />
              <p className="text-xs text-muted-foreground">
                {imageUploading ? 'Uploading...' : 'PNG/JPG/WebP up to 5MB'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                className="mt-1"
                value={newCatalogItem.description}
                onChange={(event) =>
                  setNewCatalogItem((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={addCatalogItem} disabled={catalogSaving || imageUploading}>
              {catalogSaving ? 'Adding item...' : 'Add Item'}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/shop/${shopId}/settings`}>Back to Settings</Link>
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading catalog...</p>
          ) : catalogItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No catalog items yet.
            </p>
          ) : (
            <div className="space-y-3">
              {catalogItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => toggleCatalogItemActive(item)}
                    >
                      {item.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteCatalogItem(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
