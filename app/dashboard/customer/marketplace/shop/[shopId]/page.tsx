'use client'

import { useParams } from 'next/navigation'
import { ShopProfileContent } from '@/components/marketplace/ShopProfileContent'

export default function CustomerMarketplaceShopDetailPage() {
  const params = useParams()
  const rawShopId = params.shopId
  const shopId = (Array.isArray(rawShopId) ? rawShopId[0] : rawShopId) ?? ''

  return (
    <ShopProfileContent
      shopId={shopId}
      backHref="/dashboard/customer/marketplace"
      backLabel="Customer marketplace"
      loginReturnPath={`/dashboard/customer/marketplace/shop/${shopId}`}
      compactTop
    />
  )
}
