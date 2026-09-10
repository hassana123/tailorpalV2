import { cleanPhoneForWhatsApp, formatNaira } from './format'

export interface WhatsAppMessagePayload {
  customerName: string
  customerPhone?: string | null
  shopName?: string
  orderNumber?: string
  garmentDescription?: string
  fittingDate?: string | null
  deliveryDate?: string | null
  totalPrice?: number | null
  depositAmount?: number | null
  trackingUrl?: string
}

/**
 * Generate a direct WhatsApp click-to-chat URL
 */
export function createWhatsAppUrl(phone: string | null | undefined, text: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone)
  const encodedText = encodeURIComponent(text)
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

/**
 * Order Confirmation & Deposit Receipt message
 */
export function getOrderConfirmationMessage({
  customerName,
  shopName = 'Our Atelier',
  orderNumber,
  garmentDescription,
  fittingDate,
  deliveryDate,
  totalPrice,
  depositAmount,
  trackingUrl,
}: WhatsAppMessagePayload): string {
  const balance =
    totalPrice !== null && totalPrice !== undefined && depositAmount !== null && depositAmount !== undefined
      ? Math.max(0, totalPrice - depositAmount)
      : null

  let msg = `✨ *Hello ${customerName}!*\n\n`
  msg += `Thank you for choosing *${shopName}*. Your bespoke order has been confirmed!\n\n`
  if (orderNumber) msg += `📋 *Order Number:* #${orderNumber}\n`
  if (garmentDescription) msg += `👗 *Garment / Style:* ${garmentDescription}\n`
  if (totalPrice) msg += `💰 *Total Price:* ${formatNaira(totalPrice)}\n`
  if (depositAmount !== null && depositAmount !== undefined && depositAmount > 0) {
    msg += `💳 *Deposit Paid:* ${formatNaira(depositAmount)}\n`
  }
  if (balance !== null && balance > 0) {
    msg += `⏳ *Balance Due:* ${formatNaira(balance)}\n`
  }
  if (fittingDate) msg += `📏 *Fitting Session:* ${new Date(fittingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}\n`
  if (deliveryDate) msg += `🚚 *Estimated Delivery:* ${new Date(deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}\n`

  if (trackingUrl) {
    msg += `\n🔍 *Track your order live here:*\n${trackingUrl}\n`
  }

  msg += `\nFeel free to reply here if you have any questions. We are crafting your piece with love!`
  return msg
}

/**
 * Fitting Reminder Message
 */
export function getFittingReminderMessage({
  customerName,
  shopName = 'Our Atelier',
  orderNumber,
  garmentDescription,
  fittingDate,
}: WhatsAppMessagePayload): string {
  const formattedDate = fittingDate
    ? new Date(fittingDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'soon'

  let msg = `👋 *Hello ${customerName}!*\n\n`
  msg += `This is a friendly reminder from *${shopName}* regarding your fitting session for *${garmentDescription || 'your bespoke outfit'}* (#${orderNumber || 'Order'}).\n\n`
  msg += `📅 *Scheduled Fitting Date:* ${formattedDate}\n\n`
  msg += `Please let us know what time works best for you to come in, or if you need to adjust your appointment. We look forward to seeing you!`
  return msg
}

/**
 * Ready for Pickup / Delivery Message
 */
export function getReadyForPickupMessage({
  customerName,
  shopName = 'Our Atelier',
  orderNumber,
  garmentDescription,
  totalPrice,
  depositAmount,
}: WhatsAppMessagePayload): string {
  const balance =
    totalPrice !== null && totalPrice !== undefined && depositAmount !== null && depositAmount !== undefined
      ? Math.max(0, totalPrice - depositAmount)
      : null

  let msg = `🎉 *Great News, ${customerName}!*\n\n`
  msg += `Your bespoke outfit (*${garmentDescription || 'Order #' + orderNumber}*) is completely finished, pressed, and ready for you at *${shopName}*!\n\n`
  if (balance !== null && balance > 0) {
    msg += `💰 *Remaining Balance Due on Collection:* ${formatNaira(balance)}\n\n`
  }
  msg += `You can visit our shop during open hours to collect your piece. We can't wait for you to wear it!`
  return msg
}

/**
 * Measurement Summary Message for Client
 */
export function getMeasurementsSummaryMessage(
  customerName: string,
  shopName: string,
  measurements: Record<string, string | number>,
  notes?: string | null
): string {
  let msg = `📏 *Tailoring Measurements for ${customerName}*\n`
  msg += `Recorded with care at *${shopName || 'TailorPal'}*\n\n`

  Object.entries(measurements).forEach(([key, val]) => {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      msg += `• *${cleanKey}:* ${val} inches\n`
    }
  })

  if (notes) {
    msg += `\n📝 *Notes:* ${notes}\n`
  }

  msg += `\nStored safely on TailorPal. Reply to this message if you ever need any adjustments!`
  return msg
}
