import { formatMeasurementLabel } from '@/lib/utils/measurement-records'
import { AddCustomerDraft, AddMeasurementDraft, CreateOrderDraft, UpdateOrderDraft } from '@/lib/voice/types'

export const VOICE_HELP_TEXT = `I can help with:
- "add customer" (guided step-by-step)
- "add measurement" or "record measurements"
- "create order"
- "update order status"
- "delete customer"
- "list customers"
- "find customer Jane"
- "list orders"
- "pending orders"
- "shop stats"
- "cancel" to stop current action`

export function summarizeCustomerDraft(draft: AddCustomerDraft) {
  return [
    `Name: ${draft.firstName} ${draft.lastName}`,
    `Phone: ${draft.phone ?? 'Not provided'}`,
    `Email: ${draft.email ?? 'Not provided'}`,
    `Address: ${draft.address ?? 'Not provided'}`,
    `City: ${draft.city ?? 'Not provided'}`,
    `Country: ${draft.country ?? 'Not provided'}`,
    `Notes: ${draft.notes ?? 'Not provided'}`,
  ].join('\n')
}

export function summarizeMeasurementDraft(draft: AddMeasurementDraft) {
  const entries = Object.entries({
    ...draft.standardMeasurements,
    ...draft.customMeasurements,
  })
  const lines = entries.length
    ? entries.map(([key, value]) => `- ${formatMeasurementLabel(key)}: ${value}cm`)
    : ['- No measurements captured']

  return [`Customer: ${draft.customerName ?? 'Unknown'}`, 'Measurements:', ...lines, `Notes: ${draft.notes ?? 'Not provided'}`].join('\n')
}

export function summarizeOrderDraft(draft: CreateOrderDraft) {
  return [
    `Customer: ${draft.customerName ?? 'Unknown'}`,
    `Design: ${draft.designDescription ?? 'Not provided'}`,
    `Fabric: ${draft.fabricDetails ?? 'Not provided'}`,
    `Delivery Date: ${draft.estimatedDeliveryDate ?? 'Not provided'}`,
    `Total Price: ${draft.totalPrice ?? 'Not provided'}`,
    `Notes: ${draft.notes ?? 'Not provided'}`,
  ].join('\n')
}

export function summarizeOrderUpdateDraft(draft: UpdateOrderDraft) {
  return [
    `Order: ${draft.orderNumber ?? 'Unknown'}`,
    `New Status: ${draft.status ?? 'Unknown'}`,
  ].join('\n')
}
