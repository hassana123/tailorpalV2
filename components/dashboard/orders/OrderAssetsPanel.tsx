'use client'

import { useEffect, useState } from 'react'
import {
  ImagePlus,
  Plus,
  Ruler,
  Trash2,
  ExternalLink,
  Scissors,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { uploadShopMedia } from '@/lib/utils/shop-media'

interface GarmentItem {
  id: string
  name: string
  quantity: number
  details: string | null
}

interface DesignReference {
  id: string
  image_url: string
  label: string | null
}

interface MeasurementRecord {
  id: string
  created_at: string
}
interface DesignNote { id: string; category: string; content: string; approval_status: 'pending' | 'approved' | 'rejected'; approved_at: string | null; created_at: string }
interface InventoryItem { id: string; name: string; unit: string; quantity_on_hand: number }
interface MaterialUsage { id: string; quantity: number; shop_inventory_items: { name: string; unit: string } | null }

const COMMON_GARMENT_PRESETS = [
  'Senator Top',
  'Senator Trousers',
  'Agbada 3-Piece',
  'Aso-Ebi Gown',
  'Two-Piece Kaftan',
  'Bespoke Suit Jacket',
]

export function OrderAssetsPanel({
  orderId,
  customerId,
}: {
  orderId: string
  customerId: string
}) {
  const db = createClient()
  const [garments, setGarments] = useState<GarmentItem[]>([])
  const [references, setReferences] = useState<DesignReference[]>([])
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [linked, setLinked] = useState<string[]>([])
  const [designNotes, setDesignNotes] = useState<DesignNote[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [materialUsage, setMaterialUsage] = useState<MaterialUsage[]>([])

  const [garmentName, setGarmentName] = useState('')
  const [garmentQty, setGarmentQty] = useState('1')
  const [refUrl, setRefUrl] = useState('')
  const [refLabel, setRefLabel] = useState('')
  const [isAddingGarment, setIsAddingGarment] = useState(false)
  const [isAddingRef, setIsAddingRef] = useState(false)
  const [isUploadingRef, setIsUploadingRef] = useState(false)
  const [designNote, setDesignNote] = useState('')
  const [designCategory, setDesignCategory] = useState('instruction')
  const [materialId, setMaterialId] = useState('')
  const [materialQuantity, setMaterialQuantity] = useState('1')

  const loadData = async () => {
    try {
      const [garmentRes, refRes, measureRes, linkRes, noteRes, inventoryRes, usageRes] = await Promise.all([
        db.from('order_garments').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
        db.from('order_design_references').select('*').eq('order_id', orderId).order('created_at', { ascending: true }),
        db.from('measurements').select('id,created_at').eq('customer_id', customerId).order('created_at', { ascending: false }),
        db.from('order_measurement_links').select('measurement_id').eq('order_id', orderId),
        db.from('order_design_notes').select('*').eq('order_id', orderId).order('created_at', { ascending: false }),
        db.from('shop_inventory_items').select('id,name,unit,quantity_on_hand').eq('is_active', true).order('name'),
        db.from('order_inventory_usage').select('id,quantity,shop_inventory_items(name,unit)').eq('order_id', orderId),
      ])

      setGarments(garmentRes.data ?? [])
      setReferences(refRes.data ?? [])
      setMeasurements(measureRes.data ?? [])
      setLinked((linkRes.data ?? []).map((x) => x.measurement_id))
      setDesignNotes((noteRes.data ?? []) as DesignNote[])
      setInventory((inventoryRes.data ?? []) as InventoryItem[])
      setMaterialUsage((usageRes.data ?? []) as unknown as MaterialUsage[])
    } catch {
      // Ignore initial query errors
    }
  }

  useEffect(() => {
    void loadData()
  }, [orderId, customerId])

  const handleAddGarment = async (nameToAdd?: string) => {
    const finalName = (nameToAdd || garmentName).trim()
    if (!finalName) {
      toast.error('Please enter a garment name')
      return
    }

    setIsAddingGarment(true)
    const { error } = await db.from('order_garments').insert({
      order_id: orderId,
      name: finalName,
      quantity: Number(garmentQty) || 1,
    })

    setIsAddingGarment(false)
    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(`Added ${finalName}`)
    setGarmentName('')
    setGarmentQty('1')
    void loadData()
  }

  const handleDeleteGarment = async (id: string, name: string) => {
    const { error } = await db.from('order_garments').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`Removed ${name}`)
    void loadData()
  }

  const handleAddReference = async () => {
    if (!refUrl.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    setIsAddingRef(true)
    const { error } = await db.from('order_design_references').insert({
      order_id: orderId,
      image_url: refUrl.trim(),
      label: refLabel.trim() || null,
    })

    setIsAddingRef(false)
    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Design reference added')
    setRefUrl('')
    setRefLabel('')
    void loadData()
  }

  const handleUploadReference = async (file: File | undefined) => {
    if (!file) return
    setIsUploadingRef(true)
    try {
      const imageUrl = await uploadShopMedia(db, file, 'orders')
      const { error } = await db.from('order_design_references').insert({
        order_id: orderId,
        image_url: imageUrl,
        label: file.name,
      })
      if (error) throw error
      toast.success('Order reference photo uploaded')
      void loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Image upload failed')
    } finally { setIsUploadingRef(false) }
  }

  const handleDeleteReference = async (id: string) => {
    const { error } = await db.from('order_design_references').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Reference removed')
    void loadData()
  }

  const addDesignNote = async () => {
    if (!designNote.trim()) { toast.error('Enter a design note'); return }
    const { error } = await db.from('order_design_notes').insert({ order_id: orderId, category: designCategory, content: designNote.trim() })
    if (error) { toast.error(error.message); return }
    setDesignNote(''); toast.success('Design instruction saved'); void loadData()
  }
  const setApproval = async (id: string, approval_status: 'approved' | 'rejected') => {
    const { error } = await db.from('order_design_notes').update({ approval_status, approved_at: approval_status === 'approved' ? new Date().toISOString() : null }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Design ${approval_status}`); void loadData()
  }
  const useMaterial = async () => {
    if (!materialId || !Number(materialQuantity)) { toast.error('Choose a material and quantity'); return }
    const { error } = await db.rpc('use_order_inventory', { p_order_id: orderId, p_item_id: materialId, p_quantity: Number(materialQuantity) })
    if (error) { toast.error(error.message); return }
    toast.success('Material attached and stock deducted'); setMaterialId(''); setMaterialQuantity('1'); void loadData()
  }

  const handleToggleMeasurement = async (measurementId: string) => {
    const isCurrentlyLinked = linked.includes(measurementId)
    const { error } = isCurrentlyLinked
      ? await db
          .from('order_measurement_links')
          .delete()
          .eq('order_id', orderId)
          .eq('measurement_id', measurementId)
      : await db
          .from('order_measurement_links')
          .insert({ order_id: orderId, measurement_id: measurementId })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(isCurrentlyLinked ? 'Measurement unlinked' : 'Measurement linked to order')
    void loadData()
  }

  return (
    <section className="space-y-5 border-t border-brand-border pt-5 min-w-0 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <div className="min-w-0">
          <h3 className="font-display font-semibold text-brand-ink text-base flex items-center gap-2">
            <Scissors size={15} className="text-brand-gold flex-shrink-0" />
            <span>Garments, Measurements & Design Brief</span>
          </h3>
          <p className="text-xs text-brand-stone mt-0.5">
            Attach individual garments, link body measurements, and upload design photos for your cutting table.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        
        {/* ── 1. GARMENT ITEMS ── */}
        <div className="rounded-2xl border border-brand-border bg-brand-cream/60 p-4 flex flex-col justify-between space-y-3 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2 min-w-0">
              <span className="text-xs font-bold text-brand-ink flex items-center gap-1.5 min-w-0">
                <span className="truncate">Garments in this Commission</span>
                <span className="px-1.5 py-0.2 bg-brand-ink text-white rounded-full text-[10px] flex-shrink-0">
                  {garments.length}
                </span>
              </span>
            </div>

            {/* Garment List */}
            {garments.length === 0 ? (
              <p className="text-xs text-brand-stone italic py-2">
                No specific garment pieces added yet.
              </p>
            ) : (
              <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1 min-w-0">
                {garments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-brand-border text-xs min-w-0 gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-md bg-brand-ink text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {item.quantity}×
                      </span>
                      <span className="font-semibold text-brand-ink truncate">{item.name}</span>
                    </div>
                    <button
                      onClick={() => void handleDeleteGarment(item.id, item.name)}
                      className="p-1 text-brand-stone hover:text-red-600 transition-colors flex-shrink-0"
                      title="Delete garment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preset quick chips */}
            <div className="flex gap-1.5 flex-wrap mb-3 min-w-0">
              {COMMON_GARMENT_PRESETS.slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => void handleAddGarment(preset)}
                  className="text-[10px] px-2 py-0.8 rounded-lg bg-white border border-brand-border hover:border-brand-gold text-brand-charcoal transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <Plus size={10} className="text-brand-gold" />
                  <span>{preset}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add Garment Form */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-brand-border/60 min-w-0">
            <input
              value={garmentName}
              onChange={(e) => setGarmentName(e.target.value)}
              placeholder="Custom piece (e.g. Bridesmaid Gown)"
              className="min-w-0 flex-1 h-9 border border-brand-border bg-white rounded-xl px-2.5 text-xs text-brand-ink placeholder:text-brand-stone/60 focus:outline-none focus:border-brand-gold"
            />
            <div className="flex items-center gap-2 min-w-0">
              <input
                value={garmentQty}
                onChange={(e) => setGarmentQty(e.target.value)}
                type="number"
                min="1"
                className="w-14 h-9 border border-brand-border bg-white rounded-xl px-2 text-xs text-center text-brand-ink focus:outline-none focus:border-brand-gold flex-shrink-0"
                title="Quantity"
              />
              <button
                onClick={() => void handleAddGarment()}
                disabled={isAddingGarment}
                className="flex-1 sm:flex-initial h-9 px-3 bg-brand-ink hover:bg-brand-charcoal text-white rounded-xl text-xs font-bold transition-all shadow-brand flex items-center justify-center gap-1 flex-shrink-0"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. LINKED MEASUREMENTS ── */}
        <div className="rounded-2xl border border-brand-border bg-brand-cream/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-ink flex items-center gap-1.5">
              <Ruler size={13} className="text-brand-gold" />
              <span>Linked Customer Measurements</span>
              <span className="px-1.5 py-0.2 bg-brand-ink text-white rounded-full text-[10px]">
                {linked.length}
              </span>
            </span>
          </div>

          {measurements.length === 0 ? (
            <div className="p-4 bg-white rounded-xl border border-brand-border text-center space-y-2">
              <p className="text-xs text-brand-stone">No measurements saved for this customer yet.</p>
              <p className="text-[11px] text-brand-gold font-semibold">
                Tip: Record customer measurements from the Measurements page.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {measurements.map((item) => {
                const isLinked = linked.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isLinked
                        ? 'bg-white border-brand-gold shadow-sm'
                        : 'bg-white/60 border-brand-border hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isLinked}
                        onChange={() => void handleToggleMeasurement(item.id)}
                        className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold accent-brand-gold"
                      />
                      <div>
                        <p className="font-semibold text-brand-ink">
                          Record from{' '}
                          {new Date(item.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] text-brand-stone">
                          {isLinked ? 'Active brief for this order' : 'Available in history'}
                        </p>
                      </div>
                    </div>
                    {isLinked && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-700 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> Linked
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── 3. DESIGN REFERENCE PHOTOS ── */}
      <div className="rounded-2xl border border-brand-border bg-brand-cream/60 p-4 space-y-3 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-0">
          <span className="text-xs font-bold text-brand-ink flex items-center gap-1.5 min-w-0">
            <ImagePlus size={13} className="text-brand-gold flex-shrink-0" />
            <span className="truncate">Design Reference Photos ({references.length})</span>
          </span>
          <span className="text-[11px] text-brand-stone truncate hidden sm:inline">Visual guide for your cutters & tailors</span>
        </div>

        {/* Thumbnail Grid */}
        {references.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 min-w-0">
            {references.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white border border-brand-border rounded-xl p-2 flex flex-col justify-between overflow-hidden shadow-xs hover:border-brand-gold transition-all min-w-0"
              >
                {/* Image preview */}
                <div className="w-full h-24 rounded-lg bg-brand-cream overflow-hidden relative mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.label || 'Design reference'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback icon if image fails to load
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>

                <div className="flex items-center justify-between min-w-0 gap-1">
                  <p className="text-[11px] font-semibold text-brand-ink truncate flex-1">
                    {item.label || 'Style photo'}
                  </p>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-brand-gold hover:text-brand-ink transition-colors"
                      title="View full image"
                    >
                      <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => void handleDeleteReference(item.id)}
                      className="p-1 text-brand-stone hover:text-red-600 transition-colors"
                      title="Delete reference"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Reference Form */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-brand-border/60 min-w-0">
          <label className="h-9 px-3 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-charcoal flex items-center justify-center cursor-pointer hover:border-brand-gold">
            {isUploadingRef ? 'Uploading…' : 'Upload photo'}
            <input type="file" accept="image/*" className="hidden" disabled={isUploadingRef} onChange={(event) => void handleUploadReference(event.target.files?.[0])} />
          </label>
          <input
            value={refUrl}
            onChange={(e) => setRefUrl(e.target.value)}
            placeholder="Paste image link: https://..."
            className="min-w-0 flex-1 h-9 border border-brand-border bg-white rounded-xl px-3 text-xs text-brand-ink placeholder:text-brand-stone/60 focus:outline-none focus:border-brand-gold"
          />
          <input
            value={refLabel}
            onChange={(e) => setRefLabel(e.target.value)}
            placeholder="Label (e.g. Neck Embroidery)"
            className="min-w-0 w-full sm:w-48 h-9 border border-brand-border bg-white rounded-xl px-3 text-xs text-brand-ink placeholder:text-brand-stone/60 focus:outline-none focus:border-brand-gold"
          />
          <button
            onClick={() => void handleAddReference()}
            disabled={isAddingRef}
            className="h-9 px-4 bg-brand-ink hover:bg-brand-charcoal text-white rounded-xl text-xs font-bold transition-all shadow-brand flex items-center justify-center gap-1.5 flex-shrink-0"
          >
            <Sparkles size={12} className="text-brand-gold" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-cream/60 p-4 space-y-3">
        <div><p className="text-xs font-bold text-brand-ink">Design instructions & approval history</p><p className="text-[11px] text-brand-stone">Record fabric, embroidery, colour, or other instructions. Every entry is retained as a design-history version.</p></div>
        <div className="flex flex-col sm:flex-row gap-2"><select value={designCategory} onChange={(event) => setDesignCategory(event.target.value)} className="h-9 rounded-xl border border-brand-border bg-white px-2 text-xs"><option value="fabric">Fabric</option><option value="embroidery">Embroidery</option><option value="colour_material">Colour / material</option><option value="instruction">Other instruction</option></select><input value={designNote} onChange={(event) => setDesignNote(event.target.value)} className="h-9 flex-1 rounded-xl border border-brand-border bg-white px-3 text-xs" placeholder="e.g. Gold beading only on the neckline"/><button onClick={() => void addDesignNote()} className="h-9 px-3 rounded-xl bg-brand-ink text-white text-xs font-bold">Save note</button></div>
        {designNotes.length > 0 && <div className="space-y-2">{designNotes.map((note) => <div key={note.id} className="rounded-xl bg-white border border-brand-border p-3 text-xs"><div className="flex justify-between gap-2"><span className="font-bold capitalize text-brand-ink">{note.category.replace('_', ' ')}</span><span className="text-brand-stone">{new Date(note.created_at).toLocaleDateString('en-GB')}</span></div><p className="mt-1 text-brand-charcoal">{note.content}</p><div className="mt-2 flex gap-2"><span className={`text-[10px] font-bold ${note.approval_status === 'approved' ? 'text-emerald-700' : note.approval_status === 'rejected' ? 'text-red-600' : 'text-amber-700'}`}>{note.approval_status}</span>{note.approval_status === 'pending' && <><button onClick={() => void setApproval(note.id, 'approved')} className="text-[10px] font-bold text-emerald-700">Approve</button><button onClick={() => void setApproval(note.id, 'rejected')} className="text-[10px] font-bold text-red-600">Reject</button></>}</div></div>)}</div>}
      </div>

      <div className="rounded-2xl border border-brand-border bg-brand-cream/60 p-4 space-y-3"><div><p className="text-xs font-bold text-brand-ink">Materials used for this order</p><p className="text-[11px] text-brand-stone">Attaching a material deducts it from workshop inventory.</p></div><div className="flex flex-col sm:flex-row gap-2"><select value={materialId} onChange={(event)=>setMaterialId(event.target.value)} className="h-9 flex-1 rounded-xl border border-brand-border bg-white px-2 text-xs"><option value="">Choose inventory material</option>{inventory.map(item=><option key={item.id} value={item.id}>{item.name} ({item.quantity_on_hand} {item.unit})</option>)}</select><input value={materialQuantity} onChange={(event)=>setMaterialQuantity(event.target.value)} type="number" min="0.01" className="h-9 w-24 rounded-xl border border-brand-border px-2 text-xs"/><button onClick={()=>void useMaterial()} className="h-9 px-3 rounded-xl bg-brand-ink text-white text-xs font-bold">Use material</button></div>{materialUsage.length>0&&<div className="text-xs text-brand-charcoal space-y-1">{materialUsage.map(use=><p key={use.id}>{use.shop_inventory_items?.name || 'Material'}: <b>{use.quantity} {use.shop_inventory_items?.unit || ''}</b></p>)}</div>}</div>
    </section>
  )
}
