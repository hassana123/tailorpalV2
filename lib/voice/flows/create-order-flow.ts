import { listCustomers } from '@/lib/voice/db-read'
import { createOrder } from '@/lib/voice/db-write'
import { formatCustomerList, pickCustomerFromMessage } from '@/lib/voice/customer-match'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import { isNo, isSkip, isYes, parseIsoDate, parseNumber } from '@/lib/voice/parsers'
import { summarizeOrderDraft } from '@/lib/voice/replies'
import { clearVoiceSession, getVoiceSession, setVoiceSession } from '@/lib/voice/session-store'
import { VoiceReply } from '@/lib/voice/types'

export async function startCreateOrderFlow(
  context: VoiceFlowContext,
  message?: string,
): Promise<VoiceReply> {
  const customers = await listCustomers(context.supabase, context.shopId, 20)
  if (!customers.length) {
    return { reply: 'No customers available. Add a customer first before creating an order.' }
  }

  const seededText = message
    ? message
        .replace(/^\s*(create|new)\s+order\b/i, '')
        .replace(/^\s*for\b/i, '')
        .trim()
    : ''
  const selected = seededText ? pickCustomerFromMessage(customers, seededText) : null
  setVoiceSession(context.sessionKey, {
    flow: 'create_order',
    step: selected ? 'ask_description' : 'ask_customer',
    createOrder: {
      customerId: selected?.id,
      customerName: selected ? `${selected.first_name} ${selected.last_name}` : undefined,
    },
    expiresAt: 0,
  })

  if (!selected) {
    return {
      reply: `Which customer is this order for?\n${formatCustomerList(customers)}\n\nSay the customer name.`,
    }
  }

  return { reply: `Okay. What design should I put for ${selected.first_name} ${selected.last_name}?` }
}

export async function continueCreateOrderFlow(context: VoiceFlowContext): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.createOrder) return startCreateOrderFlow(context)

  const draft = session.createOrder
  const text = context.message.trim()

  if (session.step === 'ask_customer') {
    const customers = await listCustomers(context.supabase, context.shopId, 20)
    const selected = pickCustomerFromMessage(customers, text)
    if (!selected) return { reply: `Customer not found. Please choose from:\n${formatCustomerList(customers)}` }

    draft.customerId = selected.id
    draft.customerName = `${selected.first_name} ${selected.last_name}`
    session.step = 'ask_description'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'What is the design description for this order?' }
  }

  if (session.step === 'ask_description') {
    if (!text) return { reply: 'Please provide a short design description.' }
    draft.designDescription = text
    session.step = 'ask_optional_details_choice'
    setVoiceSession(context.sessionKey, session)
    return {
      reply:
        'Do you want to add optional order details like delivery date, total price, or notes? Say "yes" or "no".',
    }
  }

  if (session.step === 'ask_optional_details_choice') {
    if (isNo(text) || isSkip(text)) {
      session.step = 'confirm'
      setVoiceSession(context.sessionKey, session)
      return {
        reply: `Please confirm this order:\n${summarizeOrderDraft(draft)}\n\nSay "yes" to create it or "no" to cancel.`,
      }
    }

    if (!isYes(text)) {
      return {
        reply:
          'Please say "yes" to add optional details, or "no" to continue with only required fields.',
      }
    }

    session.step = 'ask_due_date'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Delivery date in YYYY-MM-DD format? Say "skip" if not set.' }
  }

  if (session.step === 'ask_due_date') {
    if (isSkip(text)) {
      draft.estimatedDeliveryDate = null
    } else {
      const dueDate = parseIsoDate(text)
      if (!dueDate) return { reply: 'Please provide date as YYYY-MM-DD, or say "skip".' }
      draft.estimatedDeliveryDate = dueDate
    }
    session.step = 'ask_total_price'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Total price? Say a number, or say "skip".' }
  }

  if (session.step === 'ask_total_price') {
    if (isSkip(text)) {
      draft.totalPrice = null
    } else {
      const total = parseNumber(text)
      if (total === null || total < 0) return { reply: 'Please provide a valid price, or say "skip".' }
      draft.totalPrice = total
    }
    session.step = 'ask_notes'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Any notes for this order? Say "skip" if none.' }
  }

  if (session.step === 'ask_notes') {
    draft.notes = isSkip(text) ? null : text
    session.step = 'confirm'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: `Please confirm this order:\n${summarizeOrderDraft(draft)}\n\nSay "yes" to create it or "no" to cancel.`,
    }
  }

  if (session.step === 'confirm') {
    if (isNo(text)) {
      clearVoiceSession(context.sessionKey)
      return { reply: 'Order creation cancelled.' }
    }
    if (!isYes(text)) return { reply: 'Please say "yes" to create it or "no" to cancel.' }

    const orderNumber = await createOrder(context.supabase, context.shopId, context.userId, draft)
    clearVoiceSession(context.sessionKey)
    return { reply: `Done. Order ${orderNumber} has been created.`, action: 'create_order' }
  }

  return { reply: 'Let us restart order creation.' }
}
