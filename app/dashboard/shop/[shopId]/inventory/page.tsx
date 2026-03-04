'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Boxes, PackagePlus, AlertCircle, Layers3, ArrowDownWideNarrow, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/dashboard/shared/DataTable'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'

type InventoryItem = {
  id: string
  name: string
  sku: string | null
  description: string | null
  unit: string
  quantity_on_hand: number
  reorder_level: number
  cost_price: number | null
  selling_price: number | null
  is_active: boolean
  created_at: string
}

type ItemDraft = {
  name: string
  sku: string
  description: string
  unit: string
  quantityOnHand: string
  reorderLevel: string
  costPrice: string
  sellingPrice: string
}

const EMPTY_DRAFT: ItemDraft = {
  name: '',
  sku: '',
  description: '',
  unit: 'pcs',
  quantityOnHand: '',
  reorderLevel: '',
  costPrice: '',
  sellingPrice: '',
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl text-brand-ink">{value}</p>
      </div>
    </div>
  )
}

function parseNumber(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toPayload(draft: ItemDraft) {
  return {
    name: draft.name.trim(),
    sku: draft.sku.trim() || undefined,
    description: draft.description.trim() || undefined,
    unit: draft.unit.trim() || undefined,
    quantityOnHand: parseNumber(draft.quantityOnHand),
    reorderLevel: parseNumber(draft.reorderLevel),
    costPrice: parseNumber(draft.costPrice),
    sellingPrice: parseNumber(draft.sellingPrice),
  }
}

function toDraft(item: InventoryItem): ItemDraft {
  return {
    name: item.name,
    sku: item.sku ?? '',
    description: item.description ?? '',
    unit: item.unit,
    quantityOnHand: String(item.quantity_on_hand),
    reorderLevel: String(item.reorder_level),
    costPrice: item.cost_price !== null ? String(item.cost_price) : '',
    sellingPrice: item.selling_price !== null ? String(item.selling_price) : '',
  }
}

export default function ShopInventoryPage() {
  const params = useParams()
  const shopId = params.shopId as string

  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [newItem, setNewItem] = useState<ItemDraft>(EMPTY_DRAFT)
  const [editItem, setEditItem] = useState<ItemDraft>(EMPTY_DRAFT)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const loadInventory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/shops/${shopId}/inventory`, { cache: 'no-store' })
      const payload = (await response.json()) as { items?: InventoryItem[]; error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load inventory')
      }

      setItems(payload.items ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInventory()
  }, [shopId])

  const handleAddItem = async () => {
    const payload = toPayload(newItem)
    if (!payload.name) {
      toast.error('Item name is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/shops/${shopId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responsePayload = (await response.json()) as { item?: InventoryItem; error?: string }
      if (!response.ok || !responsePayload.item) {
        throw new Error(responsePayload.error || 'Failed to create inventory item')
      }

      setItems((prev) => [responsePayload.item!, ...prev])
      setNewItem(EMPTY_DRAFT)
      setAddModalOpen(false)
      toast.success('Inventory item added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create inventory item')
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setEditItem(toDraft(item))
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedItem) return
    const payload = toPayload(editItem)
    if (!payload.name) {
      toast.error('Item name is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/shops/${shopId}/inventory/${selectedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const responsePayload = (await response.json()) as { item?: InventoryItem; error?: string }
      if (!response.ok || !responsePayload.item) {
        throw new Error(responsePayload.error || 'Failed to update inventory item')
      }

      setItems((prev) =>
        prev.map((item) => (item.id === responsePayload.item!.id ? responsePayload.item! : item)),
      )
      setEditModalOpen(false)
      setSelectedItem(null)
      toast.success('Inventory item updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update inventory item')
    } finally {
      setSaving(false)
    }
  }

  const toggleItemStatus = async (item: InventoryItem) => {
    try {
      const response = await fetch(`/api/shops/${shopId}/inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.is_active }),
      })
      const responsePayload = (await response.json()) as { item?: InventoryItem; error?: string }
      if (!response.ok || !responsePayload.item) {
        throw new Error(responsePayload.error || 'Failed to update status')
      }

      setItems((prev) =>
        prev.map((current) =>
          current.id === responsePayload.item!.id ? responsePayload.item! : current,
        ),
      )
      toast.success(`Item marked as ${item.is_active ? 'inactive' : 'active'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const deleteItem = async (item: InventoryItem) => {
    if (!confirm(`Delete ${item.name}?`)) return

    try {
      const response = await fetch(`/api/shops/${shopId}/inventory/${item.id}`, {
        method: 'DELETE',
      })
      const payload = (await response.json()) as { success?: boolean; error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete inventory item')
      }

      setItems((prev) => prev.filter((current) => current.id !== item.id))
      toast.success('Inventory item deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete inventory item')
    }
  }

  const stats = useMemo(() => {
    const activeItems = items.filter((item) => item.is_active)
    const totalQuantity = activeItems.reduce((sum, item) => sum + Number(item.quantity_on_hand || 0), 0)
    const lowStockItems = activeItems.filter(
      (item) => Number(item.quantity_on_hand || 0) <= Number(item.reorder_level || 0),
    )

    return {
      total: items.length,
      active: activeItems.length,
      lowStock: lowStockItems.length,
      quantity: totalQuantity,
    }
  }, [items])

  const columns = [
    {
      key: 'item',
      header: 'Item',
      sortable: true,
      accessor: (item: InventoryItem) => item.name.toLowerCase(),
      cell: (item: InventoryItem) => (
        <div>
          <p className="font-semibold text-brand-ink">{item.name}</p>
          <p className="text-xs text-brand-stone">
            SKU: {item.sku || 'N/A'} · Unit: {item.unit}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (item: InventoryItem) => {
        const low = item.quantity_on_hand <= item.reorder_level
        return (
          <div>
            <p className={`font-semibold ${low ? 'text-amber-700' : 'text-brand-ink'}`}>
              {item.quantity_on_hand} {item.unit}
            </p>
            <p className="text-xs text-brand-stone">Reorder at {item.reorder_level}</p>
          </div>
        )
      },
    },
    {
      key: 'pricing',
      header: 'Pricing',
      hiddenOnMobile: true,
      cell: (item: InventoryItem) => (
        <div className="text-xs text-brand-stone space-y-0.5">
          <p>Cost: {item.cost_price !== null ? `$${item.cost_price.toFixed(2)}` : 'N/A'}</p>
          <p>Sell: {item.selling_price !== null ? `$${item.selling_price.toFixed(2)}` : 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item: InventoryItem) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const actions = (item: InventoryItem) => [
    {
      label: 'Edit',
      onClick: () => openEditModal(item),
      variant: 'default' as const,
    },
    {
      label: item.is_active ? 'Deactivate' : 'Activate',
      onClick: () => void toggleItemStatus(item),
      variant: 'outline' as const,
    },
    {
      label: 'Delete',
      onClick: () => void deleteItem(item),
      variant: 'destructive' as const,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <Boxes className="h-6 w-6 text-brand-gold" />
            Inventory
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Track stock levels, costs, and reorder points for your shop.
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          className="bg-brand-ink hover:bg-brand-charcoal shadow-brand"
        >
          <PackagePlus className="h-4 w-4 mr-2" />
          Add Inventory Item
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Items" value={stats.total} icon={Layers3} color="bg-sky-100 text-sky-700" />
        <StatCard label="Active Items" value={stats.active} icon={Boxes} color="bg-emerald-100 text-emerald-700" />
        <StatCard label="Low Stock" value={stats.lowStock} icon={ArrowDownWideNarrow} color="bg-amber-100 text-amber-700" />
        <StatCard label="Units On Hand" value={stats.quantity} icon={DollarSign} color="bg-violet-100 text-violet-700" />
      </div>

      <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-brand-ink">All Inventory Items</h2>
          <p className="text-xs text-brand-stone mt-0.5">
            {items.length} item{items.length === 1 ? '' : 's'} in inventory
          </p>
        </div>

        <DataTable
          data={items}
          columns={columns}
          keyExtractor={(item) => item.id}
          searchKeys={['name', 'sku', 'unit']}
          emptyMessage="No inventory items yet. Add your first item to begin tracking stock."
          actions={actions}
        />
      </div>

      <ModalForm
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open)
          if (!open) setNewItem(EMPTY_DRAFT)
        }}
        title="Add Inventory Item"
        description="Enter stock details for this item."
        onSubmit={handleAddItem}
        isSubmitting={saving}
        submitLabel="Add Item"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                value={newItem.name}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g. Linen Fabric"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={newItem.sku}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, sku: event.target.value }))
                }
                placeholder="LIN-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity On Hand</Label>
              <Input
                type="number"
                min="0"
                value={newItem.quantityOnHand}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, quantityOnHand: event.target.value }))
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input
                type="number"
                min="0"
                value={newItem.reorderLevel}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, reorderLevel: event.target.value }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={newItem.unit}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, unit: event.target.value }))
                }
                placeholder="pcs"
              />
            </div>
            <div className="space-y-2">
              <Label>Cost Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newItem.costPrice}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, costPrice: event.target.value }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newItem.sellingPrice}
                onChange={(event) =>
                  setNewItem((prev) => ({ ...prev, sellingPrice: event.target.value }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={newItem.description}
              onChange={(event) =>
                setNewItem((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Optional notes about this inventory item."
            />
          </div>
        </div>
      </ModalForm>

      {selectedItem && (
        <ModalForm
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open)
            if (!open) setSelectedItem(null)
          }}
          title={`Edit ${selectedItem.name}`}
          description="Update this inventory item."
          onSubmit={handleSaveEdit}
          isSubmitting={saving}
          submitLabel="Save Changes"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={editItem.name}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={editItem.sku}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, sku: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity On Hand</Label>
                <Input
                  type="number"
                  min="0"
                  value={editItem.quantityOnHand}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, quantityOnHand: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  min="0"
                  value={editItem.reorderLevel}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, reorderLevel: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={editItem.unit}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, unit: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editItem.costPrice}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, costPrice: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editItem.sellingPrice}
                  onChange={(event) =>
                    setEditItem((prev) => ({ ...prev, sellingPrice: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editItem.description}
                onChange={(event) =>
                  setEditItem((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>
          </div>
        </ModalForm>
      )}
    </div>
  )
}
