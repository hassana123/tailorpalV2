'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type ShopOption = { id: string; name: string }

export function ShopSwitcher({ shopId, ownerId, shopName }: { shopId: string; ownerId: string; shopName: string }) {
  const [shops, setShops] = useState<ShopOption[]>([])
  const router = useRouter()

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await createClient().from('shops')
        .select('id,name').eq('owner_id', ownerId).order('created_at', { ascending: true })
      if (!active) return
      if (error) { toast.error('Could not load your shops'); return }
      setShops(data ?? [])
      if (data?.some(shop => shop.id === shopId)) {
        try { localStorage.setItem(`tailorpal:selected-shop:${ownerId}`, shopId) } catch { /* Storage may be disabled. */ }
      }
    }
    void load()
    return () => { active = false }
  }, [ownerId, shopId])

  if (shops.length < 2) {
    return <h2 className="truncate text-sm font-bold text-brand-ink lg:text-base">{shopName || 'Shop Dashboard'}</h2>
  }

  return (
    <select
      aria-label="Switch shop"
      value={shopId}
      onChange={event => {
        const nextShop = event.target.value
        if (!shops.some(shop => shop.id === nextShop)) return
        try { localStorage.setItem(`tailorpal:selected-shop:${ownerId}`, nextShop) } catch { /* Navigation still works. */ }
        router.push(`/dashboard/shop/${nextShop}`)
      }}
      className="h-9 max-w-[160px] lg:max-w-[240px] rounded-xl border border-brand-border bg-brand-cream px-2 text-xs font-semibold text-brand-ink"
    >
      {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
    </select>
  )
}
