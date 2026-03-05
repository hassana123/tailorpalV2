'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Package } from 'lucide-react'
import Link from 'next/link'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { MyRequestsHeader } from '@/components/dashboard/customer/requests/MyRequestsHeader'
import { RequestsStatsGrid } from '@/components/dashboard/customer/requests/RequestsStatsGrid'
import { RequestCard } from '@/components/dashboard/customer/requests/RequestCard'
import type { CatalogRequest } from './types'

export default function MyRequestsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<CatalogRequest[]>([])

  useEffect(() => {
    void loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customer/catalog-requests')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load requests')
      }

      setRequests(data.requests ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      <MyRequestsHeader />
      <RequestsStatsGrid requests={requests} />

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-8 text-center">
          <Package className="h-12 w-12 text-brand-stone/40 mx-auto mb-4" />
          <h3 className="text-lg font-display text-brand-ink mb-2">No requests yet</h3>
          <p className="text-sm text-brand-stone mb-4">
            Browse the marketplace and request items from catalogs to see them here.
          </p>
          <Link
            href="/dashboard/customer/marketplace"
            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-brand-ink hover:bg-brand-charcoal text-white text-sm font-medium rounded-xl shadow-brand transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => <RequestCard key={request.id} request={request} />)}
        </div>
      )}
    </div>
  )
}
