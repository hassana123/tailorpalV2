import { listCustomers } from '@/lib/voice/db-read'
import { deleteCustomerById } from '@/lib/voice/db-write'
import { formatCustomerList, pickCustomerFromMessage } from '@/lib/voice/customer-match'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import { isNo, isYes } from '@/lib/voice/parsers'
import { clearVoiceSession, getVoiceSession, setVoiceSession } from '@/lib/voice/session-store'
import { VoiceReply } from '@/lib/voice/types'

export async function startDeleteCustomerFlow(
  context: VoiceFlowContext,
  message?: string,
): Promise<VoiceReply> {
  const customers = await listCustomers(context.supabase, context.shopId, 20)
  if (!customers.length) return { reply: 'There are no customers to delete.' }

  const seededText = message
    ? message.replace(/^\s*(delete|remove)\s+customer\b/i, '').trim()
    : ''
  const selected = seededText ? pickCustomerFromMessage(customers, seededText) : null
  setVoiceSession(context.sessionKey, {
    flow: 'delete_customer',
    step: selected ? 'confirm' : 'ask_customer',
    deleteCustomer: {
      customerId: selected?.id,
      customerName: selected ? `${selected.first_name} ${selected.last_name}` : undefined,
    },
    expiresAt: 0,
  })

  if (!selected) {
    return {
      reply: `Which customer should I delete?\n${formatCustomerList(customers)}\n\nSay the customer name.`,
    }
  }

  return { reply: `Please confirm deletion of ${selected.first_name} ${selected.last_name}. Say "yes" to delete or "no" to cancel.` }
}

export async function continueDeleteCustomerFlow(context: VoiceFlowContext): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.deleteCustomer) return startDeleteCustomerFlow(context)

  const draft = session.deleteCustomer
  const text = context.message.trim()

  if (session.step === 'ask_customer') {
    const customers = await listCustomers(context.supabase, context.shopId, 20)
    const selected = pickCustomerFromMessage(customers, text)
    if (!selected) return { reply: `I could not match that customer. Please choose from:\n${formatCustomerList(customers)}` }

    draft.customerId = selected.id
    draft.customerName = `${selected.first_name} ${selected.last_name}`
    session.step = 'confirm'
    setVoiceSession(context.sessionKey, session)
    return { reply: `Please confirm deletion of ${draft.customerName}. Say "yes" to delete or "no" to cancel.` }
  }

  if (session.step === 'confirm') {
    if (isNo(text)) {
      clearVoiceSession(context.sessionKey)
      return { reply: 'Customer deletion cancelled.' }
    }
    if (!isYes(text)) return { reply: 'Please say "yes" to delete or "no" to cancel.' }

    await deleteCustomerById(context.supabase, draft.customerId!)
    clearVoiceSession(context.sessionKey)
    return { reply: `Done. ${draft.customerName} has been deleted.`, action: 'delete_customer' }
  }

  return { reply: 'Let us restart customer deletion.' }
}
