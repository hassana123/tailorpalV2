'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { uploadShopMedia } from '@/lib/utils/shop-media'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import {
  Plus,
  BookOpen,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Tag,
  Loader2,
  ArrowLeft,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

// ─── Catalog Item Card ────────────────────────────────────────────────────────

function CatalogItemCard({
  item,
  onView,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: CatalogItem
  onView: (item: CatalogItem) => void
  onEdit: (item: CatalogItem) => void
  onToggle: (item: CatalogItem) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <div className="relative h-44 bg-brand-cream/60 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ImageIcon size={32} className="text-brand-border" />
        )}
        {/* Status badge */}
        <span
          className={cn(
            'absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full',
            item.is_active
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-600',
          )}
        >
          {item.is_active ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-brand-ink text-sm leading-snug">{item.name}</p>
          <p className="text-sm font-bold text-brand-gold whitespace-nowrap">
            ${item.price.toFixed(2)}
          </p>
        </div>
        {item.description && (
          <p className="text-xs text-brand-stone leading-relaxed line-clamp-2 mt-1">
            {item.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-brand-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onView(item)}
          >
            <Eye size={12} className="mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onEdit(item)}
          >
            <Pencil size={12} className="mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onToggle(item)}
          >
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ShopCatalogPageContent() {
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
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null)
  const [editCatalogItem, setEditCatalogItem] = useState<NewCatalogItem>({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
  })

  useEffect(() => {
    void loadCatalog()
  }, [shopId])

  // ─── Logic (unchanged) ──────────────────────────────────────────────────

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
      setAddModalOpen(false)
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
    if (!confirm('Delete this catalog item?')) return
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

  const openViewModal = (item: CatalogItem) => {
    setSelectedCatalogItem(item)
    setViewModalOpen(true)
  }

  const openEditModal = (item: CatalogItem) => {
    setSelectedCatalogItem(item)
    setEditCatalogItem({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      imageUrl: item.image_url || '',
    })
    setEditModalOpen(true)
  }

  const saveEditedCatalogItem = async () => {
    if (!selectedCatalogItem) return

    const parsedPrice = Number.parseFloat(editCatalogItem.price)
    if (!editCatalogItem.name.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Item name and valid price are required')
      return
    }

    try {
      setCatalogSaving(true)
      const response = await fetch(`/api/shops/${shopId}/catalog/${selectedCatalogItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCatalogItem.name.trim(),
          description: editCatalogItem.description || null,
          price: parsedPrice,
          imageUrl: editCatalogItem.imageUrl || null,
        }),
      })
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        throw new Error(payload.error || 'Failed to update catalog item')
      }
      const payload = (await response.json()) as { item: CatalogItem }
      setCatalogItems((prev) => prev.map((item) => (item.id === payload.item.id ? payload.item : item)))
      setEditModalOpen(false)
      toast.success('Catalog item updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update catalog item')
    } finally {
      setCatalogSaving(false)
    }
  }

  // ─── Derived stats ──────────────────────────────────────────────────────

  const activeCount = catalogItems.filter((i) => i.is_active).length
  const inactiveCount = catalogItems.filter((i) => !i.is_active).length

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-gold" />
            Shop Catalog
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Manage items customers can browse and order from your marketplace profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/shop/${shopId}/settings`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <StatCard label="Total Items"   value={catalogItems.length} icon={LayoutGrid}   color="bg-sky-100 text-sky-600"       />
        <StatCard label="Active"        value={activeCount}         icon={CheckCircle2} color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Inactive"      value={inactiveCount}       icon={XCircle}      color="bg-red-100 text-red-500"        />
      </div>

      {/* Items grid */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 ">
        <div className="mb-5">
          <h2 className="font-display text-lg text-brand-ink">All Items</h2>
          <p className="text-xs text-brand-stone mt-0.5">{catalogItems.length} catalog item{catalogItems.length !== 1 ? 's' : ''}</p>
        </div>

        {catalogItems.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-brand-border bg-brand-cream/30">
            <Tag size={36} className="text-brand-border mx-auto mb-4" />
            <h3 className="font-display text-xl text-brand-ink mb-2">No catalog items yet</h3>
            <p className="text-brand-stone text-sm mb-5">
              Add items so customers can browse and place orders from your shop.
            </p>
            <Button
              onClick={() => setAddModalOpen(true)}
              className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first item
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogItems.map((item) => (
              <CatalogItemCard
                key={item.id}
                item={item}
                onView={openViewModal}
                onEdit={openEditModal}
                onToggle={toggleCatalogItemActive}
                onDelete={deleteCatalogItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <ModalForm
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open)
          if (!open) setNewCatalogItem({ name: '', description: '', price: '', imageUrl: '' })
        }}
        title="Add Catalog Item"
        description="Fill in the details below to add a new item to your shop catalog."
        onSubmit={addCatalogItem}
        isSubmitting={catalogSaving}
        submitLabel="Add Item"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                placeholder="e.g. Kaftan Dress"
                value={newCatalogItem.name}
                onChange={(e) => setNewCatalogItem((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newCatalogItem.price}
                onChange={(e) => setNewCatalogItem((prev) => ({ ...prev, price: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the item, fabric, style, available sizes…"
              rows={3}
              value={newCatalogItem.description}
              onChange={(e) => setNewCatalogItem((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Item Image</Label>
            <div className="flex items-center gap-4">
              {newCatalogItem.imageUrl ? (
                <img
                  src={newCatalogItem.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover border border-brand-border flex-shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl border border-dashed border-brand-border flex items-center justify-center flex-shrink-0 bg-brand-cream/50">
                  <ImageIcon size={20} className="text-brand-stone" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCatalogImageUpload}
                  disabled={imageUploading || catalogSaving}
                  className="cursor-pointer"
                />
                <p className="text-xs text-brand-stone mt-1.5">
                  {imageUploading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Uploading…
                    </span>
                  ) : (
                    'PNG / JPG / WebP up to 5 MB'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalForm>

      {selectedCatalogItem && (
        <ModalForm
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          title={selectedCatalogItem.name}
          description="Catalog item details"
          hideFooter
          maxWidth="md"
        >
          <div className="space-y-4">
            {selectedCatalogItem.image_url ? (
              <img
                src={selectedCatalogItem.image_url}
                alt={selectedCatalogItem.name}
                className="w-full h-52 rounded-xl object-cover border border-brand-border"
              />
            ) : (
              <div className="h-52 rounded-xl border border-dashed border-brand-border bg-brand-cream/40 flex items-center justify-center">
                <ImageIcon className="text-brand-stone" />
              </div>
            )}
            <div className="space-y-2 text-sm text-brand-stone">
              <p>
                <span className="font-semibold text-brand-ink">Price:</span> ${selectedCatalogItem.price.toFixed(2)}
              </p>
              <p>
                <span className="font-semibold text-brand-ink">Status:</span>{' '}
                {selectedCatalogItem.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            {selectedCatalogItem.description && (
              <p className="text-sm text-brand-charcoal leading-relaxed">
                {selectedCatalogItem.description}
              </p>
            )}
          </div>
        </ModalForm>
      )}

      {selectedCatalogItem && (
        <ModalForm
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title={`Edit ${selectedCatalogItem.name}`}
          description="Update catalog item details"
          onSubmit={saveEditedCatalogItem}
          isSubmitting={catalogSaving}
          submitLabel="Save Changes"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={editCatalogItem.name}
                  onChange={(e) => setEditCatalogItem((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Price *</Label>
                <Input
                  type="number"
                  value={editCatalogItem.price}
                  onChange={(e) => setEditCatalogItem((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editCatalogItem.description}
                onChange={(e) => setEditCatalogItem((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={editCatalogItem.imageUrl}
                onChange={(e) => setEditCatalogItem((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
        </ModalForm>
      )}

    </div>
  )
}
