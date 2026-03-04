'use client'

import { useEffect, useState } from 'react'
//import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Tag,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface CatalogRequest {
  id: string
  shop_id: string
  requester_name: string
  requester_email: string | null
  requester_phone: string | null
  notes: string | null
  status: 'pending' | 'contacted' | 'converted' | 'cancelled'
  created_at: string
  updated_at: string
  owner_response_channel: 'email' | 'whatsapp' | 'none' | null
  owner_response_message: string | null
  owner_response_sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  linked_order_id: string | null
  shop: {
    name: string
    logo_url: string | null
  } | null
  catalog_item: {
    name: string
    price: number
    image_url: string | null
  } | null
  order: {
    id: string
    order_number: string
    status: string
    estimated_delivery_date: string | null
    total_price: number | null
  } | null
}

const STATUS_STYLES: Record<CatalogRequest['status'], { label: string; className: string; Icon: React.ElementType }> = {
  pending:    { label: 'Pending',    className: 'bg-amber-100 text-amber-700',   Icon: Clock        },
  contacted:  { label: 'Contacted',  className: 'bg-sky-100 text-sky-700',       Icon: Mail         },
  converted:  { label: 'Converted',  className: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-100 text-red-700',       Icon: XCircle      },
}

const ORDER_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-amber-100 text-amber-700'   },
  in_progress: { label: 'In Progress', className: 'bg-sky-100 text-sky-700'     },
  completed:   { label: 'Completed',   className: 'bg-emerald-100 text-emerald-700' },
  delivered:   { label: 'Delivered',   className: 'bg-green-100 text-green-700'  },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-100 text-red-700'      },
}

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-ink" />
      </div>
    )
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const contactedRequests = requests.filter((r) => r.status === 'contacted')
  const convertedRequests = requests.filter((r) => r.status === 'converted')

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display text-brand-ink flex items-center gap-2">
            <Package className="h-6 w-6 text-brand-gold" />
            My Requests
          </h1>
          <p className="text-sm text-brand-stone mt-1">
            Track your catalog order requests
          </p>
        </div>
        <Link
          href="/dashboard/customer/marketplace"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 bg-brand-ink hover:bg-brand-charcoal text-white text-sm font-medium rounded-xl shadow-brand transition-colors"
        >
          Browse Catalog
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Pending</p>
            <p className="font-display text-2xl text-brand-ink">{pendingRequests.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-100 text-sky-600">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Contacted</p>
            <p className="font-display text-2xl text-brand-ink">{contactedRequests.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Converted</p>
            <p className="font-display text-2xl text-brand-ink">{convertedRequests.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-gold/15 text-brand-gold">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Total</p>
            <p className="font-display text-2xl text-brand-ink">{requests.length}</p>
          </div>
        </div>
      </div>

      {/* Requests List */}
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
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestCard({ request }: { request: CatalogRequest }) {
  const statusStyle = STATUS_STYLES[request.status]
  //const OrderStatusIcon = request.status === 'converted' ? CheckCircle2 : Clock
  const orderStatusStyle = request.order ? ORDER_STATUS_STYLES[request.order.status] : null

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Shop & Item Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            {request.shop?.logo_url ? (
              <img
                src={request.shop.logo_url}
                alt={request.shop.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center">
                <Store size={18} className="text-brand-gold" />
              </div>
            )}
            <div>
              <p className="font-semibold text-brand-ink">{request.shop?.name ?? 'Unknown Shop'}</p>
              <p className="text-xs text-brand-stone">
                Requested on {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {request.catalog_item && (
            <div className="flex items-center gap-2 text-sm text-brand-stone">
              <Tag size={14} className="text-brand-gold" />
              <span>{request.catalog_item.name}</span>
              <span className="font-medium">${request.catalog_item.price.toFixed(2)}</span>
            </div>
          )}

          {request.notes && (
            <div className="text-sm text-brand-stone">
              <span className="font-medium">Your notes:</span> {request.notes}
            </div>
          )}
        </div>

        {/* Status & Order Info */}
        <div className="flex flex-col items-start lg:items-end gap-3">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full', statusStyle.className)}>
            <statusStyle.Icon size={11} />
            {statusStyle.label}
          </span>

          {/* Linked Order */}
          {request.order && (
            <div className="bg-brand-cream/40 rounded-xl border border-brand-border p-3 min-w-[200px]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-brand-stone uppercase tracking-wider">Order</span>
                {orderStatusStyle && (
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', orderStatusStyle.className)}>
                    {orderStatusStyle.label}
                  </span>
                )}
              </div>
              <p className="font-semibold text-brand-ink">#{request.order.order_number}</p>
              {request.order.estimated_delivery_date && (
                <div className="flex items-center gap-1.5 text-xs text-brand-stone mt-1">
                  <Calendar size={12} />
                  Due: {new Date(request.order.estimated_delivery_date).toLocaleDateString()}
                </div>
              )}
              {request.order.total_price && (
                <p className="text-sm font-medium text-brand-ink mt-1">
                  ${request.order.total_price.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Shop Response */}
          {request.owner_response_sent_at && (
            <div className="text-xs text-brand-stone">
              <p>Shop responded on {new Date(request.owner_response_sent_at).toLocaleString()}</p>
              {request.owner_response_channel !== 'none' && (
                <p className="flex items-center gap-1 mt-0.5">
                  {request.owner_response_channel === 'email' ? <Mail size={12} /> : <Phone size={12} />}
                  via {request.owner_response_channel}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
