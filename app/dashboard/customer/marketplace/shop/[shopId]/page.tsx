'use client'

import { useParams } from 'next/navigation'
import { ShopProfileContent } from '@/components/marketplace/ShopProfileContent'

export default function CustomerMarketplaceShopDetailPage() {
  const params = useParams()
  const shopId = params.shopId as string

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
