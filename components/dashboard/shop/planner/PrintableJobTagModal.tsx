'use client'

import { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatNaira } from '@/lib/utils/format'
import { Printer, X, QrCode, Phone, Calendar } from 'lucide-react'

export interface PrintableJobTagOrder {
  id: string
  order_number: string
  design_description: string | null
  estimated_delivery_date: string | null
  fitting_date?: string | null
  total_price?: number | null
  deposit_amount?: number | null
  priority?: string | number | null
  customers: {
    first_name: string
    last_name: string | null
    phone?: string | null
  } | null
  order_garments?: { name: string; quantity: number }[] | null
}

interface PrintableJobTagModalProps {
  open: boolean
  onClose: () => void
  order: PrintableJobTagOrder | null
  shopName?: string
  shopId: string
}

export function PrintableJobTagModal({
  open,
  onClose,
  order,
  shopName = 'TailorPal Atelier',
  shopId,
}: PrintableJobTagModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!order) return null

  const clientName = [order.customers?.first_name, order.customers?.last_name]
    .filter(Boolean)
    .join(' ') || 'Bespoke Client'

  // Extract human short ID e.g. #042
  const shortNum = order.order_number.replace(/^[^\d]*/, '').slice(-3) || '001'
  const outfitTitle = order.design_description || order.order_garments?.[0]?.name || 'Bespoke Garment'
  const humanTag = `#${shortNum.padStart(3, '0')} — ${outfitTitle}`

  const balance =
    order.total_price !== null && order.total_price !== undefined
      ? Math.max(0, (order.total_price || 0) - (order.deposit_amount || 0))
      : 0

  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/shop/${shopId}/planner?orderId=${order.id}`
    : `https://tailorpal.app/dashboard/shop/${shopId}/planner?orderId=${order.id}`

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    qrTargetUrl
  )}&bgcolor=FFFFFF&color=0D1A33&margin=2`

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-xl max-h-[92vh] flex flex-col p-0 overflow-x-hidden overflow-y-auto bg-brand-cream/40 rounded-3xl border border-brand-border shadow-2xl">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden p-4 sm:p-5 bg-brand-ink text-white flex items-center justify-between border-b border-brand-border/20">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/10 text-brand-gold-light">
              <QrCode size={16} />
            </span>
            <div>
              <DialogTitle className="font-display text-base sm:text-lg text-white">
                Physical Workshop Job Tag
              </DialogTitle>
              <p className="text-[11px] text-white/70">
                Print & pin to the fabric roll or hang directly on the mannequin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="h-9 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-brand transition-all cursor-pointer"
            >
              <Printer size={13} />
              Print Tag
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Physical Slip Container */}
        <div className="p-5 sm:p-7 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-md bg-white border-2 border-brand-ink/90 rounded-2xl p-6 sm:p-8 shadow-sm print:border-2 print:border-black print:shadow-none print:m-0 print:p-6 print:w-full"
          >
            {/* Hanger Hole Cutout Guide */}
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-dashed border-brand-stone/60 flex items-center justify-center text-[9px] font-mono text-brand-stone print:border-black">
                ✂
              </div>
              <span className="text-[9px] font-bold text-brand-stone uppercase tracking-widest mt-1 print:text-black">
                Hanger Hole Cutout
              </span>
            </div>

            {/* Atelier Brand Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-brand-border print:border-black">
              <p className="text-[10px] font-bold tracking-[0.22em] text-brand-gold uppercase print:text-black">
                {shopName} · Atelier Floor Tag
              </p>
              <h2 className="font-display text-2xl sm:text-3xl text-brand-ink mt-1 print:text-black">
                {humanTag}
              </h2>
              <p className="font-mono text-xs text-brand-stone mt-0.5 print:text-black">
                ID: {order.order_number}
              </p>
            </div>

            {/* QR Code & Scan Instructions */}
            <div className="my-5 p-4 rounded-xl bg-brand-cream/30 border border-brand-border flex items-center gap-4 print:border print:border-black print:bg-white">
              <div className="w-24 h-24 bg-white p-1 rounded-lg border border-brand-border shrink-0 grid place-items-center print:border-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt={`QR tag for ${order.order_number}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-brand-ink uppercase tracking-wider print:text-black">
                  Floor Barcode / QR
                </p>
                <p className="text-[11px] text-brand-charcoal mt-1 leading-snug print:text-black">
                  Scan with any phone/tablet camera on the workshop floor to immediately advance the stage or view cutting specs.
                </p>
              </div>
            </div>

            {/* Client & Date Specs Grid */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-brand-border print:border-black text-xs">
              <div>
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider print:text-black">
                  Client Name
                </p>
                <p className="font-bold text-brand-ink mt-0.5 truncate print:text-black">
                  {clientName}
                </p>
                {order.customers?.phone && (
                  <p className="text-[11px] text-brand-stone flex items-center gap-1 mt-0.5 print:text-black font-mono">
                    <Phone size={10} /> {order.customers.phone}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider print:text-black">
                  Promised Delivery
                </p>
                <p className="font-bold text-brand-ink mt-0.5 flex items-center gap-1 print:text-black">
                  <Calendar size={11} className="text-brand-gold print:text-black" />
                  {order.estimated_delivery_date
                    ? new Date(`${order.estimated_delivery_date}T00:00:00`).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Unscheduled'}
                </p>
                {order.fitting_date && (
                  <p className="text-[10px] text-violet-700 font-medium mt-0.5 print:text-black">
                    Fitting: {new Date(`${order.fitting_date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
            </div>

            {/* Financial Status */}
            <div className="py-3 border-b border-brand-border print:border-black flex items-center justify-between text-xs">
              <div>
                <span className="text-brand-stone print:text-black">Total Price: </span>
                <strong className="text-brand-ink print:text-black">
                  {order.total_price ? formatNaira(order.total_price) : '₦0'}
                </strong>
              </div>
              <div>
                <span className="text-brand-stone print:text-black">Balance Due: </span>
                <strong className={`${balance > 0 ? 'text-amber-700' : 'text-emerald-700'} print:text-black`}>
                  {balance > 0 ? formatNaira(balance) : 'PAID IN FULL'}
                </strong>
              </div>
            </div>

            {/* 4 Physical Stage Checkboxes */}
            <div className="mt-4 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-ink mb-2 print:text-black">
                Shop Floor Progression Checkmarks
              </p>
              <div className="space-y-2">
                {[
                  { stage: '1. ✂️ Cutting & Sizing', desc: 'Fabric inspected, pattern drafted & cut' },
                  { stage: '2. 🪡 Sewing & Assembly', desc: 'Bodice, seams, lining & details stitched' },
                  { stage: '3. 👗 Client Fitting Session', desc: 'Fitted on client & adjustments pinned' },
                  { stage: '4. ✅ Ready for Pickup', desc: 'Final press, buttoning & garment bagged' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg border border-brand-border flex items-center justify-between print:border-black"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-brand-ink print:text-black">
                        {item.stage}
                      </p>
                      <p className="text-[10px] text-brand-stone truncate print:text-black">
                        {item.desc}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded border-2 border-brand-ink shrink-0 grid place-items-center print:border-black">
                      {/* Empty checkbox box for tailor's pen */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-5 pt-3 border-t-2 border-dashed border-brand-border text-center text-[10px] text-brand-stone print:border-black print:text-black">
              TailorPal Workshop Slip · Keep attached to garment until final handover.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
