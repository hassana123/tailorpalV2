import { updateOrderStatus } from '@/lib/voice/db-write'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import { isNo, isYes, parseOrderNumber, parseOrderStatus } from '@/lib/voice/parsers'
import { summarizeOrderUpdateDraft } from '@/lib/voice/replies'
import { clearVoiceSession, getVoiceSession, setVoiceSession } from '@/lib/voice/session-store'
import { VoiceReply } from '@/lib/voice/types'

export function startUpdateOrderStatusFlow(
  { sessionKey }: VoiceFlowContext,
  message?: string,
): VoiceReply {
  const orderNumber = message ? parseOrderNumber(message) : null
  const status = message ? parseOrderStatus(message) : null

  const step = !orderNumber ? 'ask_order_number' : !status ? 'ask_status' : 'confirm'
  setVoiceSession(sessionKey, {
    flow: 'update_order_status',
    step,
    updateOrder: { orderNumber: orderNumber ?? undefined, status: status ?? undefined },
    expiresAt: 0,
  })

  if (step === 'ask_order_number') return { reply: 'Please tell me the order number, for example ORD-123456789.' }
  if (step === 'ask_status') return { reply: 'What status should I set? pending, in progress, completed, delivered, or cancelled.' }
  return {
    reply: `Please confirm this order update:\n${summarizeOrderUpdateDraft({
      orderNumber: orderNumber ?? undefined,
      status: status ?? undefined,
    })}\n\nSay "yes" to proceed or "no" to cancel.`,
  }
}

export async function continueUpdateOrderStatusFlow(
  context: VoiceFlowContext,
): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.updateOrder) return startUpdateOrderStatusFlow(context)

  const draft = session.updateOrder
  const text = context.message.trim()

  if (session.step === 'ask_order_number') {
    const orderNumber = parseOrderNumber(text)
    if (!orderNumber) return { reply: 'I need a valid order number like ORD-123456.' }
    draft.orderNumber = orderNumber
    session.step = draft.status ? 'confirm' : 'ask_status'
    setVoiceSession(context.sessionKey, session)
    if (session.step === 'ask_status') {
      return { reply: 'Now tell me the status: pending, in progress, completed, delivered, or cancelled.' }
    }
  }

  if (session.step === 'ask_status') {
    const status = parseOrderStatus(text)
    if (!status) return { reply: 'Please say one of: pending, in progress, completed, delivered, cancelled.' }
    draft.status = status
    session.step = 'confirm'
    setVoiceSession(context.sessionKey, session)
  }

  if (session.step === 'confirm') {
    if (isNo(text)) {
      clearVoiceSession(context.sessionKey)
      return { reply: 'Order update cancelled.' }
    }
    if (!isYes(text)) {
      return {
        reply: `Please confirm this order update:\n${summarizeOrderUpdateDraft(draft)}\n\nSay "yes" to proceed or "no" to cancel.`,
      }
    }

    const updated = await updateOrderStatus(context.supabase, context.shopId, draft)
    clearVoiceSession(context.sessionKey)
    if (!updated) return { reply: `I could not find order ${draft.orderNumber}.`, action: 'update_order_status' }
    return {
      reply: `Done. Order ${updated.order_number} is now "${updated.status}".`,
      action: 'update_order_status',
    }
  }

  return { reply: 'Let us restart order status update.' }
}
