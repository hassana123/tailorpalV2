'use client'

import { useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ShopProfileContent } from '@/components/marketplace/ShopProfileContent'

export default function ShopProfilePage() {
  const params = useParams()
  const rawShopId = params.shopId
  const shopId = (Array.isArray(rawShopId) ? rawShopId[0] : rawShopId) ?? ''

  return (
    <div className="min-h-screen bg-brand-cream">
      <Navbar />
      <ShopProfileContent
        shopId={shopId}
        backHref="/marketplace"
        backLabel="Marketplace"
        loginReturnPath={`/marketplace/shop/${shopId}`}
      />
      <Footer />
    </div>
  )
}
