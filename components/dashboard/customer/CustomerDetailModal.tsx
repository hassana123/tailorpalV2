'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import {
  extractMeasurementMaps,
  formatMeasurementLabel,
  sortMeasurementEntries,
} from '@/lib/utils/measurement-records'
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Ruler,
  Edit2,
  Plus,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { cleanPhoneForWhatsApp } from '@/lib/utils/format'

interface Customer {
  id: string
  shop_id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface Measurement {
  id: string
  customer_id: string
  created_at: string
  notes: string | null
  status: string
  standard_measurements?: Record<string, unknown> | null
  custom_measurements?: Record<string, unknown> | null
  [key: string]: unknown
}

interface CustomerDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer
  onEdit: () => void
  onAddMeasurements: () => void
}

export function CustomerDetailModal({
  open,
  onOpenChange,
  customer,
  onEdit,
  onAddMeasurements,
}: CustomerDetailModalProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [orders, setOrders] = useState<{ id: string; order_number: string; design_description: string | null; status: string; estimated_delivery_date: string | null; total_price: number | null }[]>([])
  const [payments, setPayments] = useState<{ id: string; order_id: string; amount: number; payment_method: string; paid_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllMeasurementValues, setShowAllMeasurementValues] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchMeasurements()
      void fetchOrders()
      void fetchPayments()
      setShowAllMeasurementValues(false)
    }
  }, [open, customer.id])

  const fetchMeasurements = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('customer_id', customer.id)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setMeasurements((data || []) as Measurement[])
    } catch (err) {
      console.error('Error fetching measurements:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('id, order_number, design_description, status, estimated_delivery_date, total_price').eq('customer_id', customer.id).order('created_at', { ascending: false })
    setOrders(data ?? [])
  }
  const fetchPayments = async () => {
    const { data: customerOrders } = await supabase.from('orders').select('id').eq('customer_id', customer.id)
    const ids = (customerOrders ?? []).map((order) => order.id)
    if (!ids.length) return setPayments([])
    const { data } = await supabase.from('order_payments').select('id,order_id,amount,payment_method,paid_at').in('order_id', ids).order('paid_at', { ascending: false })
    setPayments((data ?? []) as typeof payments)
  }

  const displayName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim()

  const getInitials = (firstName: string, lastName: string | null) => {
    return `${firstName[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={displayName}
      description="Customer details and measurement history"
      hideFooter
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Customer Info Card */}
        <div className="bg-brand-cream/30 rounded-xl p-4 border border-brand-border">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-ink flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">
                {getInitials(customer.first_name, customer.last_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-brand-ink">
                {displayName}
              </h3>
              <div className="mt-2 space-y-1 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2 text-brand-stone">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-brand-stone flex-wrap">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                    {cleanPhoneForWhatsApp(customer.phone) && (
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(customer.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={11} />
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
                {(customer.address || customer.city || customer.country) && (
                  <div className="flex items-center gap-2 text-brand-stone">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {[customer.address, customer.city, customer.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-brand-stone">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Customer since {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-brand-border">
              <p className="text-sm text-brand-stone">
                <span className="font-medium text-brand-ink">Notes:</span> {customer.notes}
              </p>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold text-brand-ink flex items-center gap-2 mb-3"><Calendar className="h-4 w-4 text-brand-gold" />Previous Orders ({orders.length})</h4>
          {orders.length === 0 ? <p className="text-sm text-brand-stone rounded-xl bg-brand-cream/30 border border-dashed border-brand-border p-4">No orders recorded for this customer yet.</p> : <div className="space-y-2">{orders.map((order) => <div key={order.id} className="rounded-xl border border-brand-border p-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-brand-ink">#{order.order_number} · {order.design_description || 'Custom garment'}</p><p className="text-xs text-brand-stone mt-1">{order.estimated_delivery_date ? `Due ${new Date(`${order.estimated_delivery_date}T00:00:00`).toLocaleDateString()}` : 'No due date'} · {order.status.replace('_',' ')}</p></div><span className="text-xs font-bold text-brand-ink">₦{Number(order.total_price || 0).toLocaleString()}</span></div>)}</div>}
        </div>

        <div>
          <h4 className="font-semibold text-brand-ink flex items-center gap-2 mb-3"><Calendar className="h-4 w-4 text-brand-gold" />Payment History ({payments.length})</h4>
          {payments.length === 0 ? <p className="text-sm text-brand-stone rounded-xl bg-brand-cream/30 border border-dashed border-brand-border p-4">No payments recorded yet.</p> : <div className="space-y-2">{payments.map((payment) => <div key={payment.id} className="rounded-xl border border-brand-border p-3 flex justify-between"><span className="text-xs text-brand-stone">{new Date(payment.paid_at).toLocaleDateString()} · {payment.payment_method}</span><span className="text-sm font-bold text-emerald-700">₦{Number(payment.amount).toLocaleString()}</span></div>)}</div>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {customer.phone && cleanPhoneForWhatsApp(customer.phone) && (
            <Button
              variant="outline"
              onClick={() => {
                const wa = cleanPhoneForWhatsApp(customer.phone)
                window.open(`https://wa.me/${wa}`, '_blank')
              }}
              className="flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <MessageSquare className="h-4 w-4 mr-2 text-emerald-600" />
              Chat on WhatsApp
            </Button>
          )}
          <Button variant="outline" onClick={onEdit} className="flex-1 sm:flex-none">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Customer
          </Button>
          <Button onClick={onAddMeasurements} className="flex-1 sm:flex-none bg-brand-ink hover:bg-brand-charcoal">
            <Plus className="h-4 w-4 mr-2" />
            Add Measurements
          </Button>
        </div>

        {/* Measurements History */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="font-semibold text-brand-ink flex items-center gap-2">
              <Ruler className="h-4 w-4 text-brand-gold" />
              Measurement History ({measurements.length})
            </h4>
            {measurements.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAllMeasurementValues((prev) => !prev)}
              >
                {showAllMeasurementValues ? 'Show Summary' : 'View All Measurements'}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-ink" />
            </div>
          ) : measurements.length === 0 ? (
            <div className="text-center py-8 bg-brand-cream/20 rounded-xl border border-dashed border-brand-border">
              <Ruler className="h-8 w-8 text-brand-stone mx-auto mb-2" />
              <p className="text-sm text-brand-stone">No measurements recorded yet.</p>
              <Button
                variant="link"
                onClick={onAddMeasurements}
                className="mt-2 text-brand-gold"
              >
                Add first measurement
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {measurements.map((measurement) => (
                <MeasurementCard
                  key={measurement.id}
                  measurement={measurement}
                  showAllValues={showAllMeasurementValues}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalForm>
  )
}

function MeasurementCard({
  measurement,
  showAllValues,
}: {
  measurement: Measurement
  showAllValues: boolean
}) {
  const entries = sortMeasurementEntries(Object.entries(extractMeasurementMaps(measurement).all))
  const visibleEntries = showAllValues ? entries : entries.slice(0, 6)

  return (
    <div className="bg-white rounded-xl border border-brand-border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-brand-stone">
          {new Date(measurement.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <Badge
          className={cn(
            measurement.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          )}
        >
          {measurement.status}
        </Badge>
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleEntries.map(([key, value]) => (
            <div key={key} className="bg-brand-cream/50 rounded-lg px-2 py-1.5">
              <span className="text-[10px] text-brand-stone uppercase block truncate">
                {formatMeasurementLabel(key)}
              </span>
              <span className="text-sm font-semibold text-brand-ink">{value} cm</span>
            </div>
          ))}
          {!showAllValues && entries.length > 6 && (
            <div className="bg-brand-cream/50 rounded-lg px-2 py-1.5 flex items-center justify-center">
              <span className="text-xs text-brand-stone">+{entries.length - 6} more</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-brand-stone">No measurement values recorded.</p>
      )}

      {measurement.notes && (
        <p className="text-xs text-brand-stone mt-2 pt-2 border-t border-brand-border">
          {measurement.notes}
        </p>
      )}
    </div>
  )
}
