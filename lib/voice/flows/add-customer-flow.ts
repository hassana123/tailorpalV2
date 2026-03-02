import { createCustomer } from '@/lib/voice/db-write'
import { VoiceFlowContext } from '@/lib/voice/flow-context'
import { parseEmail, parseFullName, parsePhone, isNo, isSkip, isYes } from '@/lib/voice/parsers'
import { summarizeCustomerDraft } from '@/lib/voice/replies'
import { clearVoiceSession, getVoiceSession, setVoiceSession } from '@/lib/voice/session-store'
import { VoiceReply } from '@/lib/voice/types'

export function startAddCustomerFlow({ sessionKey }: VoiceFlowContext, message?: string): VoiceReply {
  const seededText = message
    ? message.replace(/^\s*(add|create|new)\s+customer\b/i, '').trim()
    : ''
  const name = seededText ? parseFullName(seededText) : null
  const phone = seededText ? parsePhone(seededText) : null
  const email = seededText ? parseEmail(seededText) : null

  const nextStep = name ? 'ask_phone' : 'ask_name'
  setVoiceSession(sessionKey, {
    flow: 'add_customer',
    step: nextStep,
    addCustomer: {
      firstName: name?.firstName,
      lastName: name?.lastName,
      phone,
      email,
    },
    expiresAt: 0,
  })

  if (!name) return { reply: 'Sure. What is the customer full name?' }
  return { reply: `Great. I got ${name.firstName} ${name.lastName}. What is the phone number? Say "skip" to leave it empty.` }
}

export async function continueAddCustomerFlow(context: VoiceFlowContext): Promise<VoiceReply> {
  const session = getVoiceSession(context.sessionKey)
  if (!session?.addCustomer) return startAddCustomerFlow(context)

  const draft = session.addCustomer
  const text = context.message.trim()

  if (session.step === 'ask_name') {
    const name = parseFullName(text)
    if (!name) return { reply: 'Please say both first and last name. Example: "Jane Doe".' }
    draft.firstName = name.firstName
    draft.lastName = name.lastName
    session.step = 'ask_phone'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Got it. What is the phone number? Say "skip" if unavailable.' }
  }

  if (session.step === 'ask_phone') {
    draft.phone = isSkip(text) ? null : parsePhone(text)
    if (!isSkip(text) && !draft.phone) return { reply: 'Please say a valid phone number, or say "skip".' }
    session.step = 'ask_email'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'What is the email address? Say "skip" if unavailable.' }
  }

  if (session.step === 'ask_email') {
    draft.email = isSkip(text) ? null : parseEmail(text)
    if (!isSkip(text) && !draft.email) return { reply: 'Please say a valid email address, or say "skip".' }
    session.step = 'ask_address'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'What is the address? Say "skip" to leave it empty.' }
  }

  if (session.step === 'ask_address') {
    draft.address = isSkip(text) ? null : text
    session.step = 'ask_city'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Which city? Say "skip" to leave it empty.' }
  }

  if (session.step === 'ask_city') {
    draft.city = isSkip(text) ? null : text
    session.step = 'ask_country'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Which country? Say "skip" to leave it empty.' }
  }

  if (session.step === 'ask_country') {
    draft.country = isSkip(text) ? null : text
    session.step = 'ask_notes'
    setVoiceSession(context.sessionKey, session)
    return { reply: 'Any extra notes? Say "skip" if none.' }
  }

  if (session.step === 'ask_notes') {
    draft.notes = isSkip(text) ? null : text
    session.step = 'confirm'
    setVoiceSession(context.sessionKey, session)
    return {
      reply: `Please confirm this new customer:\n${summarizeCustomerDraft(draft)}\n\nSay "yes" to save or "no" to cancel.`,
    }
  }

  if (session.step === 'confirm') {
    if (isNo(text)) {
      clearVoiceSession(context.sessionKey)
      return { reply: 'Customer creation cancelled.' }
    }
    if (!isYes(text)) return { reply: 'Please say "yes" to save or "no" to cancel.' }

    const created = await createCustomer(context.supabase, context.shopId, context.userId, draft)
    clearVoiceSession(context.sessionKey)
    return {
      reply: `Done. ${created.first_name} ${created.last_name} has been added successfully.`,
      action: 'add_customer',
    }
  }

  return { reply: 'Let us start again. What is the customer full name?' }
}
